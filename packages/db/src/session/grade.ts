import {
  type AnswerBundle,
  type AttemptResponse,
  dragNotFinished,
  feedbackForTry,
  MAX_TRIES,
  type MarkableType,
  type MarkResult,
  markAttempt,
  nextApplicableRung,
  SESSION_TARGET_ACCURACY,
  vnDayDate,
} from "@mtct/core";
import type { Prisma, PrismaClient } from "../../generated/client";
import { grantSessionRewards, rememberForTomorrow, type SessionRewards } from "../kid/rewards";
import { commitEvidence } from "../mastery/service";
import { wordsForStation } from "../vocab/service";
import { adaptAssessment, assessmentWeightFactor } from "./assess";
import type { PickedSlot } from "./plan";

/**
 * Running a session: what the child's device is allowed to see, what comes back, and what one
 * answer changes (docs/04 §6–§7, docs/06 §1.6).
 *
 * Two rules shape this file:
 * - the answer key never leaves the server until the child has finished the attempt (ADR-14), so
 *   marking happens here and the renderer is only told "yes" or "let us look again";
 * - the same submit may arrive twice (a tunnel, a lift, a tired thumb). Every entry point is
 *   idempotent, so a lost network costs the child nothing.
 */

type Db = PrismaClient;

/**
 * docs/06 §1.5: the reward is immediate and never taken away.
 *
 * Since ADR-16 stars measure effort, not accuracy: one for every station the child actually works
 * through, right or not yet right. The two children are not equally far along, and a star that
 * tracked correctness would have made the star pocket a scoreboard between them. Where their real
 * level shows is the parent's skill map, not the pocket.
 */
export const STARS = {
  /** Any station the child worked through — right, nearly right, or answered after the reveal. */
  exercise: 1,
  /** Getting to the end of the quest. */
  session: 3,
  /** The 30-second movement break (docs/06 §1.8c item 3). */
  movementBreak: 1,
} as const;

/** Said when the answer is right. Rotated so the mascot does not repeat itself all session. */
const CHEER_LINES = [
  "Tuyệt vời!",
  "Chuẩn luôn!",
  "Giỏi quá đi!",
  "Đúng rồi đó!",
  "Hay lắm!",
  "Xuất sắc!",
];

const PENDING_LINE = "Mình cất bài này để ba mẹ xem cùng nhé!";

/**
 * Said when a basket is still waiting for a card. Not a verdict, so it carries no "chưa đúng" and
 * no "thử lại" — the child has not answered yet, they are still doing it.
 */
const NUDGE_LINES = [
  "Còn thẻ ở khay kìa, con kéo nốt vào giỏ nhé!",
  "Giỏ này còn chỗ cho một thẻ nữa đó!",
  "Mình kéo thêm thẻ nữa rồi bấm Xong nha!",
];

/** Where on the road the child is offered a choice (docs/06 §1.8b item 2). */
const CHOICE_STATIONS = [2, 6];

function rotate(lines: readonly string[], seed: number): string {
  return lines[Math.abs(seed) % lines.length] as string;
}

// ---------------------------------------------------------------------------
// What the child's device receives
// ---------------------------------------------------------------------------

export interface KidItem {
  order: number;
  exerciseId: string;
  stableId: string;
  type: MarkableType;
  language: "vi" | "en";
  subject: string;
  difficulty: number;
  skillCode: string;
  /** Why the planner put this station here — `warmup`, `focus`, `review`, … */
  kind: string;
  /** A station where the child picks one of two exercises (docs/06 §1.8b item 2). */
  choice?: boolean;
  /** `Exercise.spec` — already stripped of the answer key at import time. */
  spec: unknown;
  /** Filled in for a slot the planner could not find an exercise for. */
  missing?: string;
  /**
   * The teacher's own homework, standing at the head of the road (FR-LRN-07). It has no exercise
   * and no answer key: the child reads a page of the textbook, or records a video for the teacher.
   */
  homework?: {
    id: string;
    taskType: string;
    text: string;
    repeatCount: number | null;
    progress: number;
    pages: number[];
    submitTo: string | null;
    optional: boolean;
    done: boolean;
  };
  /**
   * A vocabulary station (pha 11): a short game over the words that are due tonight instead of a
   * question about one word. It has no exercise and no answer key — every meeting is reported to
   * `POST /api/kid/vocab` as it happens (ADR-22).
   */
  vocab?: {
    game: string;
    /** The child already played this station today — a vocabulary game has no Attempt row. */
    done?: boolean;
    words: {
      wordId: string;
      stableId: string;
      en: string;
      vi: string;
      picture: unknown;
      phraseEn: string;
      phraseVi: string;
      skillCode: string;
      box: number;
      isNew: boolean;
    }[];
  };
}

export interface KidAttemptState {
  order: number;
  tries: number;
  correct: boolean | null;
  done: boolean;
}

export interface KidSession {
  id: string;
  studentId: string;
  kind: string;
  date: string;
  status: string;
  /**
   * When the child sat down (ISO, null before they start). The city anchors its game day to this,
   * so the sky is the same on every screen and after a reload, and the evening opens in morning
   * light rather than at whatever hour the wall clock says (pha 11).
   */
  startedAt: string | null;
  items: KidItem[];
  attempts: KidAttemptState[];
  /** Where to carry on: the first item with no finished attempt. */
  nextOrder: number | null;
  starsEarned: number;
  starsTotal: number;
  /** The child's world, so the screens know which mascot and background to draw. */
  theme: "robot" | "garden";
  /** `{ten}` / `{vat}` / `{ban}`, substituted when the exercise is shown (docs/10 §7). */
  vars: { ten: string; vat: string; ban: string };
}

/**
 * A thing from the child's own world for `{vat}`: what they said they like, else something from
 * the world they play in. Never a brand, never another child's name.
 */
export function kidVars(student: {
  nickname: string;
  interests: string[];
  mascot: string;
}): KidSession["vars"] {
  const garden = student.mascot === "OWL";
  const fallback = garden
    ? ["bông hoa", "ngôi sao", "quả táo"]
    : ["bánh răng", "tên lửa", "viên pin"];
  const pool = student.interests.length > 0 ? student.interests : fallback;
  return {
    ten: student.nickname,
    vat: pool[Math.floor(Math.random() * pool.length)] ?? fallback[0]!,
    ban: garden ? "bạn Cú" : "bạn Rô",
  };
}

/**
 * The session as the kid app sees it. Never selects `Exercise.answerKey` or `explanation`: what is
 * not loaded cannot leak into a response by accident.
 */
export async function sessionForKid(
  db: Db,
  sessionId: string,
  opts: { studentId?: string } = {},
): Promise<KidSession | null> {
  const session = await db.session.findFirst({
    where: { id: sessionId, ...(opts.studentId ? { studentId: opts.studentId } : {}) },
    include: {
      attempts: {
        select: { order: true, tries: true, isCorrect: true, gradedAt: true, response: true },
      },
      student: { select: { nickname: true, interests: true, mascot: true } },
    },
  });
  if (!session) return null;

  const slots = (session.slots ?? []) as unknown as PickedSlot[];
  const ids = slots.map((s) => s.exerciseId).filter((id): id is string => Boolean(id));
  const exercises = await db.exercise.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      stableId: true,
      type: true,
      language: true,
      subject: true,
      difficulty: true,
      spec: true,
    },
  });
  const byId = new Map(exercises.map((e) => [e.id, e]));

  const homeworkIds = slots.map((s) => s.homework?.id).filter((id): id is string => Boolean(id));
  const homeworkRows = homeworkIds.length
    ? await db.homework.findMany({ where: { id: { in: homeworkIds } } })
    : [];
  const homeworkById = new Map(homeworkRows.map((h) => [h.id, h]));

  const items: KidItem[] = [];
  for (const slot of slots) {
    if (slot.kind === "homework" && slot.homework) {
      const row = homeworkById.get(slot.homework.id);
      if (!row) continue; // the diary was re-pasted and this task is gone
      items.push({
        order: slot.order,
        exerciseId: "",
        stableId: `homework-${row.id}`,
        type: (row.taskType === "READ_ALOUD" ? "READ_ALOUD" : "WRITE_PHOTO") as MarkableType,
        language: row.subject === "VIET" || row.subject === null ? "vi" : "en",
        subject: row.subject ?? "VIET",
        difficulty: 2,
        skillCode: row.skillCodes[0] ?? "",
        kind: "homework",
        spec: null,
        homework: {
          id: row.id,
          taskType: row.taskType,
          text: row.text,
          repeatCount: row.repeatCount,
          progress: row.progress,
          pages: row.pages,
          submitTo: row.submitTo,
          optional: row.optional,
          done: row.status === "DONE" || row.status === "SKIPPED",
        },
      });
      continue;
    }
    // A vocabulary station (pha 11): the words are chosen now rather than when the evening was
    // planned, so a child who plays at nine o'clock gets what is due at nine o'clock.
    if (slot.vocab) {
      const words = await wordsForStation(db, session.studentId, {
        skillCodes: [slot.skillCode],
        count: 6,
      });
      if (words.length === 0) continue; // no words for this skill yet: quietly skip the station
      // A vocabulary game writes no Attempt row, so "already played" is read from the words
      // themselves: three of this skill's words met today is a round played.
      const playedToday = await db.wordProgress.count({
        where: {
          studentId: session.studentId,
          lastSeenAt: { gte: vnDayDate(new Date()) },
          word: { skill: { code: slot.skillCode } },
        },
      });
      items.push({
        order: slot.order,
        exerciseId: "",
        stableId: `vocab-${slot.vocab.game}-${slot.order}`,
        type: "MCQ" as MarkableType,
        language: "en",
        subject: "ESL",
        difficulty: 2,
        skillCode: slot.skillCode,
        kind: "vocab",
        spec: null,
        vocab: { game: slot.vocab.game, words, done: playedToday >= 3 },
      });
      continue;
    }

    const ex = slot.exerciseId ? byId.get(slot.exerciseId) : undefined;
    if (!ex) continue; // a hole in the plan is simply not shown to the child
    items.push({
      order: slot.order,
      exerciseId: ex.id,
      stableId: ex.stableId,
      type: ex.type as MarkableType,
      language: ex.language as "vi" | "en",
      subject: ex.subject,
      difficulty: ex.difficulty,
      skillCode: slot.skillCode,
      kind: slot.kind,
      spec: ex.spec,
    });
  }
  items.sort((a, b) => a.order - b.order);
  // Two stations along the road let the child choose between two exercises for the same skill.
  for (const index of CHOICE_STATIONS) {
    const item = items[index];
    if (item && item.kind !== "warmup" && item.kind !== "finish" && item.kind !== "homework")
      item.choice = true;
  }

  const attempts: KidAttemptState[] = session.attempts.map((a) => ({
    order: a.order,
    tries: a.tries,
    correct: a.isCorrect,
    done: a.gradedAt !== null || (a.response as StoredResponse | null)?.final === true,
  }));
  const doneOrders = new Set(attempts.filter((a) => a.done).map((a) => a.order));
  // Homework is finished in its own table, not by an Attempt row.
  for (const item of items) if (item.homework?.done || item.vocab?.done) doneOrders.add(item.order);
  const nextOrder = items.find((i) => !doneOrders.has(i.order))?.order ?? null;

  return {
    id: session.id,
    studentId: session.studentId,
    kind: session.kind,
    date: session.date.toISOString().slice(0, 10),
    status: session.status,
    startedAt: session.startedAt?.toISOString() ?? null,
    items,
    attempts,
    nextOrder,
    starsEarned: session.starsEarned,
    starsTotal: await starBalance(db, session.studentId),
    theme: session.student.mascot === "OWL" ? "garden" : "robot",
    vars: kidVars(session.student),
  };
}

/**
 * The two exercises a choice station offers (docs/06 §1.8b item 2): the one the planner picked and
 * one more for the same skill. Same skill, different context — the choice is real but the learning
 * is the same either way.
 */
export async function choiceAt(
  db: Db,
  sessionId: string,
  order: number,
): Promise<{ items: KidItem[] }> {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { slots: true, studentId: true },
  });
  const slots = (session?.slots ?? []) as unknown as PickedSlot[];
  const slot = slots.find((s) => s.order === order);
  if (!slot?.exerciseId) return { items: [] };

  const seen = await db.attempt.findMany({
    where: { session: { studentId: session?.studentId } },
    select: { exerciseId: true },
    take: 200,
    orderBy: { createdAt: "desc" },
  });
  const select = {
    id: true,
    stableId: true,
    type: true,
    language: true,
    subject: true,
    difficulty: true,
    spec: true,
  } as const;

  const [current, alternative] = await Promise.all([
    db.exercise.findUnique({ where: { id: slot.exerciseId }, select }),
    db.exercise.findFirst({
      where: {
        status: "PUBLISHED",
        qualityFlag: { not: "BAD" },
        skills: { some: { skill: { code: slot.skillCode } } },
        id: { notIn: [slot.exerciseId, ...seen.map((a) => a.exerciseId)] },
        difficulty: {
          gte: Math.max(1, slot.difficulty - 1),
          lte: Math.min(5, slot.difficulty + 1),
        },
      },
      select,
      orderBy: { usageCount: "asc" },
    }),
  ]);

  const toItem = (ex: NonNullable<typeof current>): KidItem => ({
    order,
    exerciseId: ex.id,
    stableId: ex.stableId,
    type: ex.type as MarkableType,
    language: ex.language as "vi" | "en",
    subject: ex.subject,
    difficulty: ex.difficulty,
    skillCode: slot.skillCode,
    kind: slot.kind,
    spec: ex.spec,
  });

  return { items: [current, alternative].filter(Boolean).map((ex) => toItem(ex as never)) };
}

/**
 * The child picked one: the slot now points at that exercise. Refused once the station has been
 * answered, and refused for anything that is not one of the two that were offered.
 */
export async function chooseAt(
  db: Db,
  sessionId: string,
  order: number,
  exerciseId: string,
): Promise<boolean> {
  const attempt = await db.attempt.findUnique({
    where: { sessionId_order: { sessionId, order } },
    select: { id: true },
  });
  if (attempt) return false;
  const offered = await choiceAt(db, sessionId, order);
  if (!offered.items.some((i) => i.exerciseId === exerciseId)) return false;

  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { slots: true },
  });
  const slots = (session?.slots ?? []) as unknown as PickedSlot[];
  const next = slots.map((s) => (s.order === order ? { ...s, exerciseId } : s));
  await db.session.update({
    where: { id: sessionId },
    data: { slots: next as unknown as Prisma.InputJsonValue },
  });
  return true;
}

/** Marks the session started the first time the child opens it; calling it again changes nothing. */
export async function startSession(db: Db, sessionId: string): Promise<void> {
  await db.session.updateMany({
    where: { id: sessionId, status: "PLANNED" },
    data: { status: "IN_PROGRESS", startedAt: new Date() },
  });
}

// ---------------------------------------------------------------------------
// Stars
// ---------------------------------------------------------------------------

export async function starBalance(db: Db, studentId: string): Promise<number> {
  const sum = await db.starLedger.aggregate({ where: { studentId }, _sum: { delta: true } });
  return sum._sum.delta ?? 0;
}

/**
 * Adds stars once per (reason, refType, refId). A resubmitted attempt cannot mint a second star,
 * and a child never loses one: `delta` is always positive here.
 */
export async function awardStars(
  db: Db,
  studentId: string,
  delta: number,
  reason: string,
  ref: { type: string; id: string },
): Promise<number> {
  if (delta <= 0) return 0;
  const already = await db.starLedger.findFirst({
    where: { studentId, reason, refType: ref.type, refId: ref.id },
    select: { id: true },
  });
  if (already) return 0;
  await db.starLedger.create({
    data: { studentId, delta, reason, refType: ref.type, refId: ref.id },
  });
  return delta;
}

// ---------------------------------------------------------------------------
// One answer
// ---------------------------------------------------------------------------

export interface SubmitAttemptInput {
  sessionId: string;
  order: number;
  response: AttemptResponse;
  timeMs?: number;
  hintsUsed?: number;
  /** Anything stable per submit; a repeat with the same token is not graded twice. */
  token?: string;
  /** Checked against the session's owner before anything is written. */
  studentId?: string;
}

export interface AttemptFeedback {
  order: number;
  correct: boolean;
  /** The attempt is over — move to the next station. */
  final: boolean;
  /**
   * `nudge` is not a verdict: the child pressed "Xong!" with baskets still waiting for cards.
   * Nothing is written, the try does not count, and the exercise stays open.
   */
  stage: "correct" | "retry" | "hint" | "reveal" | "pending" | "nudge";
  /** The mascot's line. Warm, short, and never the word "sai" (docs/06 §1.5). */
  line: string;
  hint?: string;
  /** Only after the third try: the answer, to be shown and read aloud (docs/04 §6). */
  reveal?: { value: unknown; explanation: string };
  /** Cards that should float home. */
  wrongItems?: string[];
  tries: number;
  starsAwarded: number;
  starsTotal: number;
  /** Word-by-word result of a reading, when there was one. */
  read?: MarkResult["readAloud"];
}

export class SessionError extends Error {
  constructor(
    public code: "SESSION_NOT_FOUND" | "SLOT_NOT_FOUND" | "EXERCISE_NOT_FOUND",
    message: string,
  ) {
    super(message);
  }
}

interface StoredResponse {
  last: AttemptResponse;
  token?: string;
  history: AttemptResponse[];
  /** The attempt is over. Kept in the row so a resumed session knows where to carry on. */
  final: boolean;
}

/**
 * Grades one answer, stores the attempt, and — once the attempt is over — turns it into evidence
 * for every skill the exercise carries (docs/04 §3.1). The diagnosis stored on the evidence comes
 * from `choices[].errorTag` / `dragItems[].errorTag`, which is what makes the ladder able to drill
 * the actual mistake tomorrow.
 */
export async function submitAttempt(db: Db, input: SubmitAttemptInput): Promise<AttemptFeedback> {
  const session = await db.session.findFirst({
    where: { id: input.sessionId, ...(input.studentId ? { studentId: input.studentId } : {}) },
    select: { id: true, studentId: true, slots: true, status: true, kind: true },
  });
  if (!session) throw new SessionError("SESSION_NOT_FOUND", "Không tìm thấy phiên học");

  const slots = (session.slots ?? []) as unknown as PickedSlot[];
  const slot = slots.find((s) => s.order === input.order);
  if (!slot?.exerciseId) throw new SessionError("SLOT_NOT_FOUND", "Không có bài ở vị trí này");

  const exercise = await db.exercise.findUnique({
    where: { id: slot.exerciseId },
    select: {
      id: true,
      type: true,
      language: true,
      difficulty: true,
      answerKey: true,
      explanation: true,
      spec: true,
      skills: { select: { weight: true, skill: { select: { id: true, code: true } } } },
    },
  });
  if (!exercise) throw new SessionError("EXERCISE_NOT_FOUND", "Không tìm thấy bài");

  const existing = await db.attempt.findUnique({
    where: { sessionId_order: { sessionId: session.id, order: input.order } },
  });
  const stored = (existing?.response ?? null) as StoredResponse | null;

  // Already finished, or the very same submit arriving twice: answer from what is stored, and
  // write nothing. Marking is pure, so the child sees exactly the same screen as the first time.
  const finishedAlready =
    existing !== null && (existing.gradedAt !== null || stored?.final === true);
  const sameToken = Boolean(input.token) && stored?.token === input.token;
  if (finishedAlready || sameToken) {
    const replayTries = existing?.tries ?? 1;
    const replay = markAttempt(
      exercise.type as MarkableType,
      bundleFor(exercise),
      stored?.last ?? input.response,
      { lang: exercise.language as "vi" | "en" },
    );
    const replayHints = hintsOf(exercise.spec);
    const replayLadder = feedbackForTry(replayTries, replayHints, input.order);
    return buildFeedback({
      order: input.order,
      mark: replay,
      tries: replayTries,
      hints: replayHints,
      explanation: exercise.explanation ?? "",
      answerValue: answerBundleOf(exercise.answerKey).value,
      starsAwarded: 0,
      starsTotal: await starBalance(db, session.studentId),
      final: finishedAlready || replay.correct || replay.pending,
      ladderLine: replayLadder.line,
      hintIndex: replayLadder.hintIndex,
      stage: replay.pending
        ? "pending"
        : replay.correct
          ? "correct"
          : finishedAlready
            ? "reveal"
            : replayLadder.stage,
    });
  }

  // Half-finished is not wrong: baskets still waiting, no distractor dropped in one. Say so and
  // write nothing — no attempt, no try, no error code on the child's evidence (docs/04 §7).
  if (
    exercise.type === "DRAG_DROP" &&
    dragNotFinished(bundleFor(exercise), input.response) &&
    !input.response.skipped
  ) {
    return {
      order: input.order,
      correct: false,
      final: false,
      stage: "nudge",
      line: rotate(NUDGE_LINES, input.order + (existing?.tries ?? 0)),
      tries: existing?.tries ?? 0,
      starsAwarded: 0,
      starsTotal: await starBalance(db, session.studentId),
    };
  }

  const tries = (existing?.tries ?? 0) + 1;
  const mark = markAttempt(exercise.type as MarkableType, bundleFor(exercise), input.response, {
    lang: exercise.language as "vi" | "en",
  });
  const hints = hintsOf(exercise.spec);
  const ladder = feedbackForTry(tries, hints, input.order);
  const final = mark.correct || mark.pending || ladder.done;

  const response: StoredResponse = {
    last: input.response,
    token: input.token,
    history: [...(stored?.history ?? []), input.response].slice(-MAX_TRIES),
    final,
  };
  const gradedBy = final && !mark.pending ? "LOCAL" : "PENDING";
  const attempt = await db.attempt.upsert({
    where: { sessionId_order: { sessionId: session.id, order: input.order } },
    create: {
      sessionId: session.id,
      exerciseId: exercise.id,
      order: input.order,
      response: response as unknown as Prisma.InputJsonValue,
      isCorrect: final && !mark.pending ? mark.correct : null,
      score: final && !mark.pending ? mark.score : null,
      hintsUsed: input.hintsUsed ?? (ladder.hintIndex !== null ? ladder.hintIndex + 1 : 0),
      tries,
      timeMs: input.timeMs ?? 0,
      gradedBy,
      gradedAt: final && !mark.pending ? new Date() : null,
    },
    update: {
      response: response as unknown as Prisma.InputJsonValue,
      isCorrect: final && !mark.pending ? mark.correct : null,
      score: final && !mark.pending ? mark.score : null,
      hintsUsed: Math.max(
        existing?.hintsUsed ?? 0,
        input.hintsUsed ?? (ladder.hintIndex !== null ? ladder.hintIndex + 1 : 0),
      ),
      tries,
      timeMs: (existing?.timeMs ?? 0) + (input.timeMs ?? 0),
      gradedBy,
      gradedAt: final && !mark.pending ? new Date() : null,
    },
  });

  let starsAwarded = 0;
  if (final && !mark.pending) {
    await db.exercise.update({
      where: { id: exercise.id },
      data: { usageCount: { increment: 1 } },
    });
    for (const link of exercise.skills) {
      await commitEvidence(db, {
        studentId: session.studentId,
        skillId: link.skill.id,
        source: "EXERCISE",
        outcome: mark.outcome === "OBSERVED" ? "PARTIAL" : mark.outcome,
        score: mark.score,
        difficulty: exercise.difficulty,
        hintsUsed: attempt.hintsUsed,
        tries,
        errorCode: mark.errorCode,
        attemptId: attempt.id,
        note: slot.reason,
        // A diagnostic answer says a little less than an ordinary one: the child has met neither
        // the format nor, often, the skill (docs/04 §10).
        weightFactor: assessmentWeightFactor(session.kind),
      });
    }
    // And the diagnostic moves: right → up the strand, wrong → back to the prerequisite. Only the
    // station the child has not reached yet is rewritten (docs/04 §10).
    if (session.kind === "ASSESSMENT") {
      await adaptAssessment(db, session.id, input.order, mark.correct);
    }
  } else if (mark.pending && (input.response.photoKey || input.response.heard)) {
    // Only real work goes to the queue: a skipped station has nothing for anyone to grade.
    await queueForGrading(db, session.studentId, attempt.id, exercise.id, input.response);
  }

  // One star for the work, whatever the answer turned out to be (ADR-16). A photo taken and a
  // reading recorded count as work done; tapping "later" is a decision, and earns nothing.
  if (final && !input.response.skipped) {
    starsAwarded = await awardStars(db, session.studentId, STARS.exercise, "exercise", {
      type: "Attempt",
      id: attempt.id,
    });
    if (starsAwarded > 0) {
      await db.session.update({
        where: { id: session.id },
        data: { starsEarned: { increment: starsAwarded }, status: "IN_PROGRESS" },
      });
    }
  }

  return buildFeedback({
    order: input.order,
    mark,
    tries,
    hints,
    explanation: exercise.explanation ?? "",
    answerValue: answerBundleOf(exercise.answerKey).value,
    starsAwarded,
    starsTotal: await starBalance(db, session.studentId),
    final,
    ladderLine: ladder.line,
    hintIndex: ladder.hintIndex,
    stage: mark.pending ? "pending" : mark.correct ? "correct" : ladder.stage,
  });
}

/** `Exercise.answerKey` comes back as loose JSON; the shape is guaranteed by `content:import`. */
function answerBundleOf(json: unknown): AnswerBundle {
  return (json ?? { value: null }) as AnswerBundle;
}

/** The key plus the cards the child actually sees (DRAG_DROP distractors are only in the spec). */
function bundleFor(exercise: { answerKey: unknown; spec: unknown }): AnswerBundle {
  const bundle = answerBundleOf(exercise.answerKey);
  const items = (exercise.spec as { dragItems?: { id?: unknown }[] } | null)?.dragItems;
  if (!Array.isArray(items)) return bundle;
  const cards = items.map((i) => i?.id).filter((id): id is string => typeof id === "string");
  return cards.length > 0 ? { ...bundle, cards } : bundle;
}

function hintsOf(spec: unknown): string[] {
  const hints = (spec as { hints?: unknown } | null)?.hints;
  return Array.isArray(hints) ? hints.filter((h): h is string => typeof h === "string") : [];
}

function buildFeedback(args: {
  order: number;
  mark: MarkResult;
  tries: number;
  hints: string[];
  explanation: string;
  answerValue: unknown;
  starsAwarded: number;
  starsTotal: number;
  final: boolean;
  ladderLine?: string;
  hintIndex?: number | null;
  stage?: AttemptFeedback["stage"];
}): AttemptFeedback {
  const { mark } = args;
  const stage: AttemptFeedback["stage"] =
    args.stage ?? (mark.pending ? "pending" : mark.correct ? "correct" : "reveal");
  const line =
    stage === "correct"
      ? rotate(CHEER_LINES, args.order + args.tries)
      : stage === "pending"
        ? PENDING_LINE
        : (args.ladderLine ?? "Để mình chỉ cho con nhé!");
  const feedback: AttemptFeedback = {
    order: args.order,
    correct: mark.correct,
    final: args.final,
    stage,
    line,
    tries: args.tries,
    starsAwarded: args.starsAwarded,
    starsTotal: args.starsTotal,
  };
  if (stage === "hint" && args.hintIndex != null) feedback.hint = args.hints[args.hintIndex];
  if (stage === "reveal")
    feedback.reveal = { value: args.answerValue, explanation: args.explanation };
  if (mark.wrongItems?.length) feedback.wrongItems = mark.wrongItems;
  if (mark.readAloud) feedback.read = mark.readAloud;
  return feedback;
}

/** A photo or a reading the server will not guess at goes to the offline queue (docs/13). */
async function queueForGrading(
  db: Db,
  studentId: string,
  attemptId: string,
  exerciseId: string,
  response: AttemptResponse,
): Promise<void> {
  const already = await db.inboxItem.findFirst({
    where: { studentId, payload: { path: ["attemptId"], equals: attemptId } },
    select: { id: true },
  });
  if (already) return;
  const files = response.photoKey ? [{ key: response.photoKey }] : [];
  await db.inboxItem.create({
    data: {
      kind: response.photoKey ? "WRITE_PHOTO_GRADE" : "SPEAK_GRADE",
      studentId,
      payload: {
        attemptId,
        exerciseId,
        files,
        text: response.heard ?? null,
      } as Prisma.InputJsonValue,
    },
  });
}

// ---------------------------------------------------------------------------
// The end of a session
// ---------------------------------------------------------------------------

export interface SessionSummary {
  sessionId: string;
  answered: number;
  total: number;
  correct: number;
  accuracy: number;
  starsEarned: number;
  starsTotal: number;
  /** Per skill, for the parent view and the mascot's closing line. */
  bySkill: { skillCode: string; answered: number; correct: number }[];
  /** Three wrong in a row at the end: tomorrow's session is shortened (docs/06 §1.8b item 4). */
  tiredAtEnd: boolean;
  streak: { current: number; longest: number };
  /** Tracks that moved a rung, for the parent dashboard. */
  ladderMoves: {
    skillCode: string;
    errorCode: string | null;
    from: number;
    to: number;
    status: string;
  }[];
  /** The egg, the week's picture, new badges and any certificate (docs/06 §1.8c). */
  rewards?: SessionRewards;
  /** Two warm lines for the celebration screen. */
  mascotLines?: string[];
}

/**
 * Closes the session: the day's stars, the streak, what happened per skill, and a step on every
 * remediation ladder the session was drilling. Idempotent — a session already closed is summarised
 * again from its attempts, not re-rewarded.
 */
export async function finishSession(
  db: Db,
  sessionId: string,
  opts: { studentId?: string; at?: Date } = {},
): Promise<SessionSummary> {
  const at = opts.at ?? new Date();
  const session = await db.session.findFirst({
    where: { id: sessionId, ...(opts.studentId ? { studentId: opts.studentId } : {}) },
    include: { attempts: { orderBy: { order: "asc" } } },
  });
  if (!session) throw new SessionError("SESSION_NOT_FOUND", "Không tìm thấy phiên học");

  const slots = (session.slots ?? []) as unknown as PickedSlot[];
  const bySkillMap = new Map<string, { answered: number; correct: number }>();
  const orderToSkill = new Map(slots.map((s) => [s.order, s.skillCode]));
  let correct = 0;
  for (const a of session.attempts) {
    const code = orderToSkill.get(a.order) ?? "?";
    const row = bySkillMap.get(code) ?? { answered: 0, correct: 0 };
    row.answered++;
    if (a.isCorrect) {
      row.correct++;
      correct++;
    }
    bySkillMap.set(code, row);
  }
  const answered = session.attempts.length;
  const total = slots.filter((s) => s.exerciseId).length;
  const last3 = session.attempts.slice(-3);
  const tiredAtEnd = last3.length === 3 && last3.every((a) => a.isCorrect === false);

  const ladderMoves = await advanceTracks(db, session.studentId, slots, session.attempts, at);
  const bonus =
    session.status === "COMPLETED"
      ? 0
      : await awardStars(db, session.studentId, STARS.session, "session", {
          type: "Session",
          id: session.id,
        });
  const streak = await bumpStreak(db, session.studentId, session.date);

  const summary: SessionSummary = {
    sessionId: session.id,
    answered,
    total,
    correct,
    accuracy: answered > 0 ? correct / answered : 0,
    starsEarned: session.starsEarned + bonus,
    starsTotal: await starBalance(db, session.studentId),
    bySkill: [...bySkillMap].map(([skillCode, v]) => ({ skillCode, ...v })),
    tiredAtEnd,
    streak,
    ladderMoves,
  };

  await db.session.update({
    where: { id: session.id },
    data: {
      status: "COMPLETED",
      finishedAt: session.finishedAt ?? at,
      durationSec:
        session.durationSec ||
        Math.max(
          0,
          Math.round((session.startedAt ? at.getTime() - session.startedAt.getTime() : 0) / 1000),
        ),
      starsEarned: summary.starsEarned,
      summary: summary as unknown as Prisma.InputJsonValue,
    },
  });

  // Only now is the day counted as learnt, so the egg, the picture and the badges are granted
  // after the session is closed — and from the rows, so a second call grants nothing twice.
  summary.rewards = await grantSessionRewards(db, session.studentId, at);
  summary.mascotLines = await closingLines(db, summary);
  await rememberForTomorrow(db, session.studentId, at);
  await db.session.update({
    where: { id: session.id },
    data: { summary: summary as unknown as Prisma.InputJsonValue },
  });
  return summary;
}

/**
 * The two lines the mascot says on the celebration screen (docs/06 §1.2 K5). Always about
 * something the child actually did, never a score and never a comparison.
 */
async function closingLines(db: Db, summary: SessionSummary): Promise<string[]> {
  const best = [...summary.bySkill].sort((a, b) => b.correct - a.correct)[0];
  const skill = best
    ? await db.skill.findUnique({ where: { code: best.skillCode }, select: { nameVi: true } })
    : null;
  const first =
    skill && best && best.correct > 0
      ? `Hôm nay con làm rất giỏi phần ${skill.nameVi}!`
      : "Hôm nay con đã cố gắng hết mình, mình thấy hết đó!";
  const second =
    summary.streak.current >= 2
      ? `Con đã học ${summary.streak.current} ngày rồi đấy, giỏi quá!`
      : "Mai mình lại gặp nhau nhé!";
  return [first, second];
}

/** docs/04 §11.4: a rung is passed when the child gets 70% of its exercises right in one session. */
async function advanceTracks(
  db: Db,
  studentId: string,
  slots: PickedSlot[],
  attempts: { order: number; isCorrect: boolean | null }[],
  at: Date,
): Promise<SessionSummary["ladderMoves"]> {
  const drilled = slots.filter((s) => s.kind === "remediation");
  if (drilled.length === 0) return [];
  const correctByOrder = new Map(attempts.map((a) => [a.order, a.isCorrect === true]));
  const moves: SessionSummary["ladderMoves"] = [];

  const tracks = await db.remediationTrack.findMany({
    where: { studentId, status: "ACTIVE" },
    include: { skill: { select: { id: true, code: true, confusableWith: true } } },
  });

  for (const track of tracks) {
    const mine = drilled.filter((s) => s.skillCode === track.skill.code);
    const done = mine.filter((s) => correctByOrder.has(s.order));
    if (done.length === 0) continue;
    const right = done.filter((s) => correctByOrder.get(s.order)).length;
    const passed = right / done.length >= SESSION_TARGET_ACCURACY;

    const prereq = await db.skillPrerequisite.findFirst({
      where: { skillId: track.skill.id },
      select: { prerequisiteId: true },
    });
    const prereqMastery = prereq
      ? ((
          await db.skillMastery.findUnique({
            where: { studentId_skillId: { studentId, skillId: prereq.prerequisiteId } },
            select: { mastery: true },
          })
        )?.mastery ?? 0)
      : null;

    const next = nextApplicableRung(
      { rung: track.rung, status: "ACTIVE" },
      passed ? "PASSED" : "FAILED",
      {
        prerequisiteMastery: prereqMastery,
        hasContrastPair: (track.skill.confusableWith ?? []).length > 0,
      },
    );
    if (next.rung === track.rung && next.status === track.status) continue;
    await db.remediationTrack.update({
      where: { id: track.id },
      data: { rung: next.rung, status: next.status, lastStepAt: at },
    });
    moves.push({
      skillCode: track.skill.code,
      errorCode: track.errorCode,
      from: track.rung,
      to: next.rung,
      status: next.status,
    });
  }
  return moves;
}

/**
 * The flame counts days learnt and never goes out (ADR-16).
 *
 * A day off pauses it — the number stays exactly where it was and the next day of learning adds
 * one. Nothing a six-year-old earned by turning up is taken back because the family had a weekend.
 */
async function bumpStreak(
  db: Db,
  studentId: string,
  date: Date,
): Promise<{ current: number; longest: number }> {
  const today = vnDayDate(date);
  const row = await db.streak.findUnique({ where: { studentId } });
  const last = row?.lastActiveDate ? vnDayDate(row.lastActiveDate) : null;
  if (last && last.getTime() >= today.getTime()) {
    return { current: row?.current ?? 1, longest: row?.longest ?? 1 };
  }
  const current = (row?.current ?? 0) + 1;
  const longest = Math.max(current, row?.longest ?? 0);
  await db.streak.upsert({
    where: { studentId },
    create: { studentId, current, longest, lastActiveDate: today },
    update: { current, longest, lastActiveDate: today },
  });
  return { current, longest };
}
