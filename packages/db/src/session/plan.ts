import {
  type ActiveError,
  type PlannerInput,
  planSession,
  type SessionPlan,
  type SkillSnapshot,
  type Slot,
  type Subject,
} from "@mtct/core";
import type { Prisma, PrismaClient } from "../../generated/client";

type Db = PrismaClient;

/**
 * Building a day's session: the snapshot the planner needs, and a real exercise for every slot
 * it asks for (docs/04 §4 steps 6–7).
 *
 * The planner itself is pure and lives in packages/core; this is the half that touches the
 * database. Nothing here calls an AI: an exercise is chosen with a query over the bank phase 2
 * imported (ADR-9, ADR-10).
 */

const DAY_MS = 24 * 60 * 60 * 1000;
/** An exercise a child met in the last week does not come back (docs/04 §4 step 6). */
const REPEAT_WINDOW_DAYS = 7;
/** How far back a class lesson still counts as "what we did in class" (docs/11 §4). */
const LESSON_WINDOW_DAYS = 3;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Everything the planner needs about one child, as of `date`. */
export async function plannerSnapshot(
  db: Db,
  studentId: string,
  date: Date,
): Promise<PlannerInput> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { id: true, settings: true, className: true },
  });
  const settings = (student?.settings ?? {}) as { dailyMinutes?: number; difficultyBias?: number };

  const [masteryRows, skills, errorStats, tracks, recentAttempts] = await Promise.all([
    db.skillMastery.findMany({
      where: { studentId },
      include: { skill: { select: { code: true, subject: true, expectedWeek: true } } },
    }),
    db.skill.findMany({
      where: { isActive: true, exerciseSkills: { some: { exercise: { status: "PUBLISHED" } } } },
      select: {
        id: true,
        code: true,
        subject: true,
        expectedWeek: true,
        confusableWith: true,
        prerequisites: { select: { prerequisite: { select: { code: true } } } },
      },
    }),
    db.errorStat.findMany({ where: { studentId, count7d: { gt: 0 } } }),
    db.remediationTrack.findMany({
      where: { studentId, status: "ACTIVE" },
      include: { skill: { select: { code: true } } },
      orderBy: { lastStepAt: "asc" },
    }),
    db.attempt.findMany({
      where: {
        session: { studentId },
        createdAt: { gte: new Date(date.getTime() - REPEAT_WINDOW_DAYS * DAY_MS) },
      },
      select: { exerciseId: true },
    }),
  ]);

  // What the class did in the last three days comes first in the focus half (docs/11 §4).
  const diaries = await db.classDiary.findMany({
    where: {
      className: student?.className ?? "1B3",
      date: { gte: new Date(date.getTime() - LESSON_WINDOW_DAYS * DAY_MS), lte: date },
    },
    select: { lessons: { select: { skillCodes: true } } },
    orderBy: { date: "desc" },
  });
  const lessonSkills = [...new Set(diaries.flatMap((d) => d.lessons.flatMap((l) => l.skillCodes)))];

  // Three wrong in a row at the end of yesterday's session: today is 20% shorter (docs/06 §1.8c).
  const previous = await db.session.findFirst({
    where: { studentId, status: "COMPLETED", date: { lt: startOfDay(date) } },
    orderBy: { date: "desc" },
    select: { summary: true },
  });
  const tiredYesterday =
    (previous?.summary as { tiredAtEnd?: boolean } | null)?.tiredAtEnd === true;

  const masteryByCode = new Map(masteryRows.map((m) => [m.skill.code, m]));
  const today = startOfDay(date);

  const snapshots: SkillSnapshot[] = skills.map((s) => {
    const m = masteryByCode.get(s.code);
    const nextReviewAt = m?.nextReviewAt ?? null;
    return {
      code: s.code,
      subject: s.subject as Subject,
      mastery: m?.mastery ?? 0,
      status: (m?.status ?? "NOT_STARTED") as SkillSnapshot["status"],
      confidence: m?.confidence ?? 0,
      nextReviewAt,
      overdueDays: nextReviewAt
        ? Math.floor((today.getTime() - startOfDay(nextReviewAt).getTime()) / DAY_MS)
        : -1,
      trend14d: m?.trend14d ?? 0,
      evidenceCount: m?.evidenceCount ?? 0,
      prerequisites: s.prerequisites.map((p) => p.prerequisite.code),
      confusableWith: s.confusableWith ?? [],
      expectedWeek: s.expectedWeek ?? null,
    };
  });

  const codes = await db.errorCode.findMany({
    where: { code: { in: errorStats.map((e) => e.errorCode) } },
    select: { code: true, remediationSkills: true },
  });
  const remediationByCode = new Map(codes.map((c) => [c.code, c.remediationSkills]));
  const activeErrors: ActiveError[] = errorStats.map((e) => ({
    code: e.errorCode,
    count7d: e.count7d,
    remediationSkills: remediationByCode.get(e.errorCode) ?? [],
  }));

  return {
    date,
    dailyMinutes: Math.round((settings.dailyMinutes ?? 15) * (tiredYesterday ? 0.8 : 1)),
    difficultyBias: settings.difficultyBias ?? 0,
    skills: snapshots,
    lessonSkills,
    activeErrors,
    tracks: tracks.map((t) => ({
      skillCode: t.skill.code,
      errorCode: t.errorCode,
      rung: t.rung,
      status: t.status as "ACTIVE",
      lastStepAt: t.lastStepAt,
    })),
    recentExerciseIds: [...new Set(recentAttempts.map((a) => a.exerciseId))],
  };
}

export interface PickedSlot extends Slot {
  exerciseId: string | null;
  stableId?: string;
  /** Why the picker could not fill it, when it could not. */
  missing?: string;
}

/**
 * One published exercise per slot: right skill, difficulty within one step, not seen this week,
 * never flagged BAD, and — when the ladder asks for it — aimed at the error being drilled.
 * Falls back step by step rather than leaving a hole in the session.
 */
export async function pickExercises(
  db: Db,
  slots: Slot[],
  opts: { recentExerciseIds?: string[]; theme?: "NEUTRAL" | "ROBOT" | "GARDEN" } = {},
): Promise<PickedSlot[]> {
  const avoid = new Set(opts.recentExerciseIds ?? []);
  const out: PickedSlot[] = [];

  for (const slot of slots) {
    const base: Prisma.ExerciseWhereInput = {
      status: "PUBLISHED",
      qualityFlag: { not: "BAD" },
      skills: { some: { skill: { code: slot.skillCode } } },
    };
    const tries: Prisma.ExerciseWhereInput[] = [];
    const near = { gte: Math.max(1, slot.difficulty - 1), lte: Math.min(5, slot.difficulty + 1) };
    // The child's own world first, a neutral picture next; a wrong-world picture is still better
    // than an empty station (docs/10 §7 item 2).
    const inWorld: Prisma.ExerciseWhereInput = opts.theme
      ? { ...base, assetTheme: { in: [opts.theme, "NEUTRAL"] } }
      : base;

    if (slot.prefer?.targetsError)
      tries.push({ ...inWorld, targetsError: slot.prefer.targetsError, difficulty: near });
    if (slot.prefer?.scaffold === "model")
      tries.push({ ...inWorld, spec: { path: ["scaffold"], equals: "model" }, difficulty: near });
    if (slot.prefer?.types?.length)
      tries.push({ ...inWorld, type: { in: slot.prefer.types as never }, difficulty: near });
    tries.push({ ...inWorld, difficulty: near });
    tries.push({ ...base, difficulty: near });
    tries.push(base); // any difficulty rather than no exercise at all

    let chosen: { id: string; stableId: string } | null = null;
    for (const where of tries) {
      const rows = await db.exercise.findMany({
        where: { ...where, id: { notIn: [...avoid] } },
        select: { id: true, stableId: true, usageCount: true },
        orderBy: [{ usageCount: "asc" }, { difficulty: "asc" }],
        take: 8,
      });
      const pick = rows[Math.floor(Math.random() * Math.min(rows.length, 4))] ?? rows[0];
      if (pick) {
        chosen = { id: pick.id, stableId: pick.stableId };
        break;
      }
    }

    if (chosen) avoid.add(chosen.id);
    out.push({
      ...slot,
      exerciseId: chosen?.id ?? null,
      stableId: chosen?.stableId,
      missing: chosen
        ? undefined
        : `không còn bài cho ${slot.skillCode} (độ khó ${slot.difficulty})`,
    });
  }
  return out;
}

export interface PlannedSession {
  sessionId: string;
  slots: PickedSlot[];
  plan: SessionPlan;
  created: boolean;
}

/**
 * Today's Daily Quest for one child. Idempotent: a session already planned for today is returned
 * as it is, so opening the app twice does not shuffle the exercises under the child's feet.
 */
export async function planDailyQuest(
  db: Db,
  studentId: string,
  date = new Date(),
  opts: { force?: boolean } = {},
): Promise<PlannedSession> {
  const day = startOfDay(date);
  const existing = await db.session.findFirst({
    where: { studentId, kind: "DAILY_QUEST", date: day },
    orderBy: { createdAt: "desc" },
  });
  if (existing && !opts.force) {
    const slots = (existing.slots ?? []) as unknown as PickedSlot[];
    return {
      sessionId: existing.id,
      slots,
      plan: {
        slots,
        remediating: ((existing.generationLog as { remediating?: [] })?.remediating ?? []) as never,
        log: ((existing.generationLog as { log?: string[] })?.log ?? []) as string[],
      },
      created: false,
    };
  }

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { mascot: true },
  });
  const input = await plannerSnapshot(db, studentId, date);
  const plan = planSession(input);
  const picked = await pickExercises(db, plan.slots, {
    recentExerciseIds: input.recentExerciseIds,
    theme: student?.mascot === "OWL" ? "GARDEN" : "ROBOT",
  });

  const session = await db.session.create({
    data: {
      studentId,
      kind: "DAILY_QUEST",
      date: day,
      status: "PLANNED",
      slots: picked as unknown as Prisma.InputJsonValue,
      generationLog: {
        log: plan.log,
        remediating: plan.remediating,
        missing: picked.filter((p) => p.missing).map((p) => p.missing),
        plannedAt: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    },
  });

  return { sessionId: session.id, slots: picked, plan, created: true };
}
