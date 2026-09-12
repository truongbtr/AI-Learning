import {
  ASSESSMENT_SLOTS,
  ASSESSMENT_WEIGHT,
  type AssessmentStep,
  type AssessSkill,
  nextStep,
  openingSteps,
  type Slot,
  type Subject,
  vnDayDate,
} from "@mtct/core";
import type { Prisma, PrismaClient } from "../../generated/client";
import { type PickedSlot, pickExercises } from "./plan";

/**
 * The diagnostic sessions of `docs/04` §10, which did not exist before phase 8.
 *
 * Both children start the real fortnight with a database that knows nothing about them (the dev
 * data was cleared — see `maintenance/reset-learning.ts`), so the first thing the planner needs is
 * somewhere to stand. Three evenings of questions give it that.
 *
 * From the child's side nothing new appears: this *is* the Daily Quest on those evenings. She taps
 * the same button, the map looks the same, and she is never told she is being assessed — a
 * six-year-old who knows it is a test answers differently, and usually worse.
 *
 * The walk itself is in `@mtct/core/planner/assess`, pure and tested. This part is the database:
 * loading the skills, picking exercises, and rewriting the next station after each answer.
 */

/** How many assessment sessions a new child gets before ordinary planning takes over. */
export const ASSESSMENT_ROUNDS_TOTAL = 3;

export interface AssessmentState {
  /** 0, 1 or 2 — which of the three evenings is next; null when assessment is finished. */
  nextRound: number | null;
  done: number;
  /** Why, in Vietnamese, for the log and the CLI. */
  why: string;
}

/**
 * Whether this child still needs a diagnostic.
 *
 * "New" is not "the account was created today": a child could be added, do nothing for a week, and
 * still know nothing about her. The test is evidence — a child with no evidence at all has never
 * answered a question here, whatever the calendar says.
 */
export async function assessmentState(
  db: PrismaClient,
  studentId: string,
): Promise<AssessmentState> {
  const [done, evidence] = await Promise.all([
    db.session.count({ where: { studentId, kind: "ASSESSMENT" } }),
    db.evidence.count({ where: { studentId } }),
  ]);
  if (done >= ASSESSMENT_ROUNDS_TOTAL)
    return { nextRound: null, done, why: `đã chẩn đoán đủ ${done} phiên` };
  // Evidence from photographs of last term's exercise books counts: a parent who uploaded a stack
  // of schoolwork has already answered the question the diagnostic asks.
  if (done === 0 && evidence >= 30)
    return {
      nextRound: null,
      done,
      why: `đã có ${evidence} bằng chứng (ảnh bài vở) — không cần chẩn đoán`,
    };
  return { nextRound: done, done, why: `phiên chẩn đoán ${done + 1}/${ASSESSMENT_ROUNDS_TOTAL}` };
}

/** Skills with a count of how many published exercises stand behind each. */
export async function loadAssessSkills(db: PrismaClient): Promise<AssessSkill[]> {
  const skills = await db.skill.findMany({
    where: { isActive: true },
    select: {
      code: true,
      subject: true,
      strand: true,
      order: true,
      expectedWeek: true,
      prerequisites: { select: { prerequisite: { select: { code: true } } } },
      _count: { select: { exerciseSkills: { where: { exercise: { status: "PUBLISHED" } } } } },
    },
  });
  return skills.map((s) => ({
    code: s.code,
    subject: s.subject as Subject,
    strand: s.strand,
    order: s.order,
    expectedWeek: s.expectedWeek,
    prerequisites: s.prerequisites.map((p) => p.prerequisite.code),
    exerciseCount: s._count.exerciseSkills,
  }));
}

/** Which school week the class is in, so the walk starts where the curriculum says it should. */
async function schoolWeekOf(db: PrismaClient, date: Date): Promise<number> {
  const row = await db.schoolWeek.findFirst({
    where: { dateFrom: { lte: date }, dateTo: { gte: date } },
    select: { weekNo: true },
  });
  if (row) return row.weekNo;
  // Outside the school year (a holiday, or a date before week 1): count from week 1's start, so a
  // diagnostic run in August still aims at roughly the right place in the curriculum.
  const first = await db.schoolWeek.findFirst({
    orderBy: { weekNo: "asc" },
    select: { dateFrom: true },
  });
  if (!first) return 1;
  const weeks = Math.floor((date.getTime() - first.dateFrom.getTime()) / (7 * 86_400_000));
  return Math.max(1, weeks + 1);
}

const stepToSlot = (step: AssessmentStep, order: number): Slot => ({
  order,
  kind: "focus",
  skillCode: step.skillCode,
  subject: step.subject,
  difficulty: step.difficulty,
  reason: step.reason,
});

export interface PlannedAssessment {
  sessionId: string;
  round: number;
  slots: PickedSlot[];
  log: string[];
  created: boolean;
}

/**
 * Builds one diagnostic evening. Idempotent for a given day: run twice and the same session comes
 * back, because a child halfway through must not have the ground move.
 */
export async function planAssessment(
  db: PrismaClient,
  studentId: string,
  date = new Date(),
  opts: { round?: number; force?: boolean } = {},
): Promise<PlannedAssessment> {
  const day = vnDayDate(date);
  const existing = await db.session.findFirst({
    where: { studentId, kind: "ASSESSMENT", date: day },
    orderBy: { createdAt: "desc" },
  });
  if (existing && !opts.force) {
    const log = ((existing.generationLog as { log?: string[] })?.log ?? []) as string[];
    return {
      sessionId: existing.id,
      round: ((existing.generationLog as { round?: number })?.round ?? 0) as number,
      slots: (existing.slots ?? []) as unknown as PickedSlot[],
      log,
      created: false,
    };
  }

  const state = await assessmentState(db, studentId);
  const round = opts.round ?? state.nextRound ?? 0;
  const [skills, week, student] = await Promise.all([
    loadAssessSkills(db),
    schoolWeekOf(db, date),
    db.student.findUnique({ where: { id: studentId }, select: { mascot: true, nickname: true } }),
  ]);

  const steps = openingSteps(skills, round, week, ASSESSMENT_SLOTS);
  if (steps.length === 0)
    throw new Error(
      `Ngân hàng chưa có bài nào cho các môn của phiên chẩn đoán ${round + 1} — chạy pnpm content:stats`,
    );

  const picked = await pickExercises(
    db,
    steps.map((s, i) => stepToSlot(s, i + 1)),
    { theme: student?.mascot === "OWL" ? "GARDEN" : "ROBOT" },
  );

  const log = [
    `phiên chẩn đoán ${round + 1}/${ASSESSMENT_ROUNDS_TOTAL} (docs/04 §10) — tuần học ${week}`,
    `môn: ${[...new Set(steps.map((s) => s.subject))].join(", ")}`,
    `${picked.filter((p) => p.exerciseId).length}/${picked.length} trạm có bài`,
    "mỗi câu trả lời sẽ đổi trạm kế tiếp: đúng → lên, chưa chắc → về tiên quyết",
  ];

  const session = await db.session.create({
    data: {
      studentId,
      kind: "ASSESSMENT",
      date: day,
      status: "PLANNED",
      slots: picked as unknown as Prisma.InputJsonValue,
      generationLog: {
        log,
        round,
        schoolWeek: week,
        adaptive: true,
        plannedAt: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    },
  });

  return { sessionId: session.id, round, slots: picked, log, created: true };
}

/**
 * After one answer, choose the next station (docs/04 §10).
 *
 * Called from `submitAttempt` for `ASSESSMENT` sessions only, and only for stations the child has
 * not reached yet — the one she is standing on never changes under her feet. If the strand runs
 * out, or the bank has nothing at the skill the walk wants, the station that was already planned
 * stays: a diagnostic that stalls is worse than one that asks a slightly less useful question.
 */
export async function adaptAssessment(
  db: PrismaClient,
  sessionId: string,
  answeredOrder: number,
  correct: boolean,
): Promise<{ changed: boolean; to?: string; reason?: string }> {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { id: true, kind: true, slots: true, generationLog: true },
  });
  if (!session || session.kind !== "ASSESSMENT") return { changed: false };

  const slots = (session.slots ?? []) as unknown as PickedSlot[];
  const answered = slots.find((s) => s.order === answeredOrder);
  const target = slots.find((s) => s.order === answeredOrder + 1);
  if (!answered || !target) return { changed: false };

  const skills = await loadAssessSkills(db);
  const current = skills.find((s) => s.code === answered.skillCode);
  if (!current) return { changed: false };

  const asked = new Set(slots.filter((s) => s.order <= answeredOrder).map((s) => s.skillCode));
  const step = nextStep({
    skills,
    current,
    correct,
    difficulty: answered.difficulty,
    asked,
  });
  if (!step || step.skillCode === target.skillCode) return { changed: false };

  const [repicked] = await pickExercises(db, [stepToSlot(step, target.order)], {
    recentExerciseIds: slots.map((s) => s.exerciseId).filter((id): id is string => Boolean(id)),
  });
  // No exercise at the skill the walk wanted: keep the station that was already there.
  if (!repicked?.exerciseId) return { changed: false };

  const updated = slots.map((s) => (s.order === target.order ? repicked : s));
  const log = ((session.generationLog as { log?: string[] })?.log ?? []) as string[];
  await db.session.update({
    where: { id: session.id },
    data: {
      slots: updated as unknown as Prisma.InputJsonValue,
      generationLog: {
        ...(session.generationLog as object),
        log: [
          ...log,
          `câu ${answeredOrder} ${correct ? "đúng" : "chưa chắc"} → câu ${target.order}: ${step.reason}`,
        ],
      } as Prisma.InputJsonValue,
    },
  });
  return { changed: true, to: step.skillCode, reason: step.reason };
}

/** Diagnostic evidence counts a little less than ordinary practice (docs/04 §10). */
export const assessmentWeightFactor = (kind: string): number =>
  kind === "ASSESSMENT" ? ASSESSMENT_WEIGHT : 1;
