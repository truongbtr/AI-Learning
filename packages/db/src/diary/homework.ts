import type { PrismaClient } from "../../generated/client";
import { commitEvidence } from "../mastery/service";
import { awardStars } from "../session/grade";

/**
 * "Bài cô giao" — the teacher's homework, inside the child's world (FR-LRN-07, docs/11 §6.2).
 *
 * The station stands at the head of the quest map and is what a family actually has to do tonight;
 * the app's own practice comes after it. Three shapes of task:
 *  - read it N times: the child reads, the counter goes 1/5 → 5/5, each round is a star;
 *  - record a video: saved as a file for a parent to upload to Teams — the app never submits;
 *  - anything off-screen (a paper worksheet, bring a ruler): a checklist a parent ticks.
 */

type Db = PrismaClient;

/** The task types the child can actually do inside the app. */
export const IN_APP_TASKS = ["READ_ALOUD", "VIDEO_SUBMIT"] as const;

export interface HomeworkToday {
  id: string;
  subject: string | null;
  taskType: string;
  text: string;
  repeatCount: number | null;
  progress: number;
  status: string;
  optional: boolean;
  pages: number[];
  skillCodes: string[];
  submitTo: string | null;
  artifactKey: string | null;
  dueDate: string | null;
  /** True when the child does it in the app rather than a parent ticking it off. */
  inApp: boolean;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * What the teacher set for this child and is still open. Yesterday's homework counts until it is
 * done — a family that had a busy evening should find it waiting, not gone.
 */
export async function homeworkForToday(
  db: Db,
  studentId: string,
  at = new Date(),
  opts: { days?: number } = {},
): Promise<HomeworkToday[]> {
  const since = new Date(startOfDay(at).getTime() - (opts.days ?? 2) * 86_400_000);
  const rows = await db.homework.findMany({
    where: {
      studentId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      diary: { date: { gte: since } },
    },
    orderBy: [{ optional: "asc" }, { createdAt: "asc" }],
    include: { diary: { select: { date: true } } },
  });
  return rows.map((h) => ({
    id: h.id,
    subject: h.subject,
    taskType: h.taskType,
    text: h.text,
    repeatCount: h.repeatCount,
    progress: h.progress,
    status: h.status,
    optional: h.optional,
    pages: h.pages,
    skillCodes: h.skillCodes,
    submitTo: h.submitTo,
    artifactKey: h.artifactKey,
    dueDate: h.dueDate?.toISOString() ?? null,
    inApp: (IN_APP_TASKS as readonly string[]).includes(h.taskType),
  }));
}

export interface HomeworkProgressResult {
  id: string;
  progress: number;
  target: number;
  status: string;
  starsAwarded: number;
  done: boolean;
}

/**
 * One more round of reading done (FR-LRN-07). Idempotent per round: a round already counted does
 * not hand out a second star, so a reconnect mid-reading costs nothing and gains nothing.
 */
export async function markHomeworkRound(
  db: Db,
  input: { homeworkId: string; studentId: string; round?: number; at?: Date },
): Promise<HomeworkProgressResult> {
  const at = input.at ?? new Date();
  const homework = await db.homework.findFirst({
    where: { id: input.homeworkId, studentId: input.studentId },
  });
  if (!homework) throw new Error("Không tìm thấy bài cô giao");
  const target = homework.repeatCount ?? 1;
  const round = Math.min(target, input.round ?? homework.progress + 1);
  const progress = Math.max(homework.progress, round);
  const done = progress >= target;

  const stars = await awardStars(db, input.studentId, 1, "homework_round", {
    type: "Homework",
    id: `${homework.id}:${round}`,
  });

  await db.homework.update({
    where: { id: homework.id },
    data: {
      progress,
      status: done ? "DONE" : "IN_PROGRESS",
      doneAt: done ? (homework.doneAt ?? at) : null,
    },
  });

  if (done) await recordHomeworkEvidence(db, homework.id, input.studentId, at);
  return {
    id: homework.id,
    progress,
    target,
    status: done ? "DONE" : "IN_PROGRESS",
    starsAwarded: stars,
    done,
  };
}

/** A parent ticked off something that happens away from the screen. */
export async function setHomeworkStatus(
  db: Db,
  input: {
    homeworkId: string;
    studentId: string;
    status: "PENDING" | "IN_PROGRESS" | "DONE" | "SKIPPED";
    at?: Date;
  },
): Promise<{ id: string; status: string }> {
  const at = input.at ?? new Date();
  const homework = await db.homework.findFirst({
    where: { id: input.homeworkId, studentId: input.studentId },
  });
  if (!homework) throw new Error("Không tìm thấy bài cô giao");
  await db.homework.update({
    where: { id: homework.id },
    data: {
      status: input.status,
      doneAt: input.status === "DONE" ? (homework.doneAt ?? at) : null,
      progress: input.status === "DONE" ? (homework.repeatCount ?? 1) : homework.progress,
    },
  });
  if (input.status === "DONE") await recordHomeworkEvidence(db, homework.id, input.studentId, at);
  return { id: homework.id, status: input.status };
}

/** The video the child recorded, kept as a file for a parent to upload (docs/11 §6.2). */
export async function attachHomeworkArtifact(
  db: Db,
  input: { homeworkId: string; studentId: string; artifactKey: string },
): Promise<void> {
  const homework = await db.homework.findFirst({
    where: { id: input.homeworkId, studentId: input.studentId },
    select: { id: true },
  });
  if (!homework) throw new Error("Không tìm thấy bài cô giao");
  await db.homework.update({
    where: { id: homework.id },
    data: { artifactKey: input.artifactKey, status: "IN_PROGRESS" },
  });
}

/**
 * Homework done is evidence, at the weight docs/04 §3.1 gives `HOMEWORK` (0.8) — lower than an
 * exercise the app marked, because nobody watched the whole of it. Written once per task.
 */
async function recordHomeworkEvidence(
  db: Db,
  homeworkId: string,
  studentId: string,
  at: Date,
): Promise<void> {
  const homework = await db.homework.findUnique({ where: { id: homeworkId } });
  if (!homework || homework.skillCodes.length === 0) return;
  const already = await db.evidence.findFirst({
    where: { studentId, source: "HOMEWORK", note: { contains: homeworkId } },
    select: { id: true },
  });
  if (already) return;
  for (const code of homework.skillCodes) {
    const skill = await db.skill.findUnique({ where: { code }, select: { id: true } });
    if (!skill) continue;
    await commitEvidence(db, {
      studentId,
      skillId: skill.id,
      source: "HOMEWORK",
      outcome: "OBSERVED",
      score: 0.8,
      note: `Bài cô giao: ${homework.text.slice(0, 120)} [${homeworkId}]`,
      observedAt: at,
    });
  }
}
