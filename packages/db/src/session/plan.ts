import {
  type ActiveError,
  type PlannerInput,
  planSession,
  type SessionPlan,
  type SkillSnapshot,
  type Slot,
  type Subject,
  vnDayDate,
} from "@mtct/core";
import type { Prisma, PrismaClient } from "../../generated/client";
import { PLANNER_MIX_SETTING } from "../ops/apply";
import { activePlanSkills } from "../parent/plans";
import { assessmentState, planAssessment } from "./assess";

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
    where: { studentId, status: "COMPLETED", date: { lt: vnDayDate(date) } },
    orderBy: { date: "desc" },
    select: { summary: true },
  });
  const tiredYesterday =
    (previous?.summary as { tiredAtEnd?: boolean } | null)?.tiredAtEnd === true;

  const masteryByCode = new Map(masteryRows.map((m) => [m.skill.code, m]));
  const today = vnDayDate(date);

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
        ? Math.floor((today.getTime() - vnDayDate(nextReviewAt).getTime()) / DAY_MS)
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

  // What the class has today, in timetable order (docs/05 §2, FR-PAR-06). Editing the timetable
  // on P12 has to change tomorrow's session — that is what makes the screen worth having.
  const todaySubjects = await subjectsOnTimetable(db, student?.className ?? "1B3", date);

  // A plan a parent approved (FR-PAR-03) plus any focus hint Claude Code left with a batch of
  // results (docs/13 §3, the debt phase 4 recorded). Neither overrides what the class did today.
  const plan = await activePlanSkills(db, studentId, date);
  const hint = await db.planHint.findFirst({
    where: { studentId, validFrom: { lte: date }, validTo: { gte: date } },
    orderBy: { createdAt: "desc" },
    select: { focusSkills: true, avoidSkills: true },
  });
  const hintSkills = Array.isArray(hint?.focusSkills)
    ? (hint.focusSkills as { code?: string }[])
        .map((f) => f?.code)
        .filter((c): c is string => Boolean(c))
    : [];
  const avoid = new Set(hint?.avoidSkills ?? []);

  // The focus/review split, when an ops request has moved it off the 50/30 of docs/04 §4
  // (docs/14 §4 setPlannerWeight). The planner clamps review to MIN_REVIEW_SHARE itself, so a
  // stale or hand-edited Setting row cannot take the review rhythm below 30%.
  const mixRow = await db.setting.findUnique({ where: { key: PLANNER_MIX_SETTING } });
  const mix = (mixRow?.value ?? null) as { focus?: number; review?: number } | null;

  return {
    date,
    dailyMinutes: Math.round((settings.dailyMinutes ?? 15) * (tiredYesterday ? 0.8 : 1)),
    difficultyBias: settings.difficultyBias ?? 0,
    mix: mix ?? undefined,
    skills: avoid.size > 0 ? snapshots.filter((s) => !avoid.has(s.code)) : snapshots,
    lessonSkills,
    planSkills: [...new Set([...(plan?.skillCodes ?? []), ...hintSkills])],
    todaySubjects,
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

/**
 * The core subjects on the class timetable for `date`, the one with most periods first
 * (docs/05 §2).
 *
 * Weekends have no timetable, so the evening falls back to whatever the rest of the planner wants.
 * If no timetable has come into force yet — the school year was re-dated backwards, say — the
 * earliest one for the class is used rather than none: a planner that silently forgets the
 * timetable is worse than one reading a copy that starts a fortnight late.
 */
export async function subjectsOnTimetable(
  db: Db,
  className: string,
  date: Date,
): Promise<Subject[]> {
  const weekday = date.getDay();
  if (weekday === 0 || weekday === 6) return [];

  const timetable =
    (await db.timetable.findFirst({
      where: { className, validFrom: { lte: date } },
      orderBy: { validFrom: "desc" },
      select: { id: true },
    })) ??
    (await db.timetable.findFirst({
      where: { className },
      orderBy: { validFrom: "asc" },
      select: { id: true },
    }));
  if (!timetable) return [];

  const slots = await db.timetableSlot.findMany({
    where: { timetableId: timetable.id, weekday, subject: { not: null } },
    select: { subject: true },
  });
  const periods = new Map<Subject, number>();
  for (const slot of slots)
    if (slot.subject) periods.set(slot.subject, (periods.get(slot.subject) ?? 0) + 1);
  return [...periods.entries()].sort((a, b) => b[1] - a[1]).map(([subject]) => subject);
}

export interface PickedSlot extends Slot {
  exerciseId: string | null;
  stableId?: string;
  /**
   * A vocabulary station (pha 11): this slot is played as a game over the words of its skill
   * instead of as one question. Which words is decided when the child opens it, not now.
   */
  vocab?: { game: string };
  /** Why the picker could not fill it, when it could not. */
  missing?: string;
  /** Set on a `homework` slot: the teacher's task, done in the app (FR-LRN-07). */
  homework?: {
    id: string;
    taskType: string;
    text: string;
    repeatCount: number | null;
    pages: number[];
    submitTo: string | null;
    subject: string | null;
  };
}

/**
 * "Bài cô giao" goes at the head of the road (FR-LRN-07, docs/11 §6.2).
 *
 * Only the tasks the child can actually do on the screen become stations — reading a lesson N
 * times, recording the video for the teacher. A paper worksheet stays a tick-box for a parent:
 * putting it on the map would give a six-year-old a station they cannot finish.
 */
async function homeworkSlots(db: Db, studentId: string, date: Date): Promise<PickedSlot[]> {
  const since = new Date(vnDayDate(date).getTime() - 2 * DAY_MS);
  const rows = await db.homework.findMany({
    where: {
      studentId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      taskType: { in: ["READ_ALOUD", "VIDEO_SUBMIT"] },
      diary: { date: { gte: since } },
    },
    orderBy: [{ optional: "asc" }, { createdAt: "asc" }],
    take: 3,
  });
  return rows.map((h, i) => ({
    order: i + 1,
    kind: "homework" as const,
    skillCode: h.skillCodes[0] ?? "",
    subject: (h.subject ?? "VIET") as Slot["subject"],
    difficulty: 2,
    reason: h.optional ? "cô khuyến khích" : "bài cô giao hôm nay",
    exerciseId: null,
    homework: {
      id: h.id,
      taskType: h.taskType,
      text: h.text,
      repeatCount: h.repeatCount,
      pages: h.pages,
      submitTo: h.submitTo,
      subject: h.subject,
    },
  }));
}

/**
 * One published exercise per slot: right skill, difficulty within one step, not seen this week,
 * never flagged BAD, and — when the ladder asks for it — aimed at the error being drilled.
 * Falls back step by step rather than leaving a hole in the session.
 */
/** The six games of Bến Cảng Từ, in the order they are handed out (docs/08 pha 11). */
const VOCAB_GAMES = [
  "listen-touch",
  "match-pairs",
  "market",
  "what-vanished",
  "build-word",
  "say-it",
] as const;
/** At most two vocabulary stations an evening: they are longer than one question. */
export const MAX_VOCAB_STATIONS = 2;

/**
 * Turns vocabulary slots into games (pha 11).
 *
 * 31 ESL.VOC skills carry 754 exercises and 40% of them are multiple choice, so an evening of
 * "vocabulary" was mostly answering questions *about* words. A station that plays with the words
 * instead — hears them, says them, matches them — is what actually makes them stick, and it is the
 * only thing that writes `WordProgress`.
 *
 * Which game: whichever of the six the child has met least recently for that skill, so the same
 * skill is not always the same game. Slots with no words in the dictionary stay ordinary
 * exercises.
 */
export async function vocabStations(
  db: Db,
  studentId: string,
  slots: PickedSlot[],
): Promise<PickedSlot[]> {
  const candidates = slots.filter((s) => s.skillCode.startsWith("ESL.VOC."));
  if (candidates.length === 0) return slots;

  const withWords = await db.word.groupBy({
    by: ["skillId"],
    where: {
      isActive: true,
      skill: { code: { in: candidates.map((s) => s.skillCode) }, isActive: true },
    },
    _count: { _all: true },
  });
  if (withWords.length === 0) return slots;
  const skills = await db.skill.findMany({
    where: { id: { in: withWords.map((w) => w.skillId) } },
    select: { id: true, code: true },
  });
  const haveWords = new Set(skills.map((s) => s.code));

  // What the child played last, per skill, so the game changes from evening to evening.
  const recent = await db.wordProgress.findMany({
    where: { studentId, word: { skill: { code: { in: [...haveWords] } } } },
    orderBy: { lastSeenAt: "desc" },
    take: 40,
    select: { lastGame: true, word: { select: { skill: { select: { code: true } } } } },
  });
  const lastGameOf = new Map<string, string>();
  for (const r of recent) {
    const code = r.word.skill.code;
    if (r.lastGame && !lastGameOf.has(code)) lastGameOf.set(code, r.lastGame);
  }

  let made = 0;
  return slots.map((slot) => {
    if (made >= MAX_VOCAB_STATIONS || !haveWords.has(slot.skillCode)) return slot;
    made++;
    const last = lastGameOf.get(slot.skillCode);
    const at = last ? VOCAB_GAMES.indexOf(last as (typeof VOCAB_GAMES)[number]) : -1;
    const game = VOCAB_GAMES[(at + 1) % VOCAB_GAMES.length] as string;
    return { ...slot, exerciseId: null, stableId: undefined, missing: undefined, vocab: { game } };
  });
}

export async function pickExercises(
  db: Db,
  slots: Slot[],
  opts: { recentExerciseIds?: string[]; theme?: "NEUTRAL" | "ROBOT" | "GARDEN" } = {},
): Promise<PickedSlot[]> {
  const avoid = new Set(opts.recentExerciseIds ?? []);
  /** The same exercise twice in one session is never acceptable, however empty the bank is. */
  const usedToday = new Set<string>();
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
    // Twice over: first refusing anything the child met this week, then — rather than leave the
    // station empty — allowing an exercise to come round again. A bank of 30 for one skill runs
    // out after a fortnight of practice; a child should still get a question.
    for (const skipSeen of [true, false]) {
      for (const where of tries) {
        const rows = await db.exercise.findMany({
          where: {
            ...where,
            id: skipSeen ? { notIn: [...avoid] } : { notIn: [...usedToday] },
          },
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
      if (chosen) break;
    }

    if (chosen) {
      avoid.add(chosen.id);
      usedToday.add(chosen.id);
    }
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
  opts: { force?: boolean; skipAssessment?: boolean } = {},
): Promise<PlannedSession> {
  const day = vnDayDate(date);

  // A session already planned for today wins over everything below, diagnostics included: a child
  // halfway through an evening must not have the ground move, and `pnpm plan:run` having already
  // built the day must not be undone by the next request that comes in.
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

  // The first three evenings of a child who has never used this are diagnostics (docs/04 §10).
  // They are returned from here rather than from a screen of their own, so nothing new appears to
  // the child: she taps the same button and gets the same map. A child told she is being assessed
  // answers differently, and usually worse.
  const assessment = opts.skipAssessment
    ? { nextRound: null }
    : await assessmentState(db as PrismaClient, studentId);
  if (assessment.nextRound !== null) {
    const built = await planAssessment(db as PrismaClient, studentId, date, {
      round: assessment.nextRound,
      force: opts.force,
    });
    return {
      sessionId: built.sessionId,
      slots: built.slots,
      plan: { slots: built.slots, remediating: [], log: built.log },
      created: built.created,
    };
  }

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { mascot: true },
  });
  // What the teacher set comes first, then the app's own practice — the order a family works in.
  // The planner is told how many of these there will be so "half the session belongs to the
  // approved plan" counts the whole session and not just the half the planner builds.
  const homework = await homeworkSlots(db, studentId, date);
  const input = await plannerSnapshot(db, studentId, date);
  const plan = planSession({ ...input, extraSlots: homework.length });
  const practice = await pickExercises(db, plan.slots, {
    recentExerciseIds: input.recentExerciseIds,
    theme: student?.mascot === "OWL" ? "GARDEN" : "ROBOT",
  });

  const picked: PickedSlot[] = [
    ...homework,
    ...(await vocabStations(db, studentId, practice)).map((slot, i) => ({
      ...slot,
      order: homework.length + i + 1,
    })),
  ];

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
