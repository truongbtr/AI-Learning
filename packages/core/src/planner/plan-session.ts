/**
 * The planner (docs/04 §4, steps 1–7) with the remediation ladder of §11.4 wired into it.
 *
 * It answers one question: what should this child do in the next fifteen minutes, and why. It
 * never calls anything — no AI (ADR-10), no database — so the same input always gives the same
 * plan and the reasoning can be read in a test rather than guessed at from a log.
 *
 * The shape of a session, in order:
 *   1 warm-up   something already solid, so the first answer is a yes
 *   … focus     what the class did this week, and what is weak, including the ladder
 *   … review    what is due back (spaced repetition)
 *   … new       the next thing, only when its prerequisite holds
 *   1 finish    something certain, so the session ends on a win
 */
import {
  ACTIVE_ERROR_COUNT_7D,
  MAX_ACTIVE_TRACKS,
  MAX_REMEDIATION_PER_SESSION,
  rungInfo,
} from "../remediation/ladder";
import type { ActiveError, PlannerInput, SessionPlan, SkillSnapshot, Slot, Subject } from "./types";

/** docs/04 §4 step 1: about 1.3 minutes per exercise, never fewer than 8, never more than 15. */
export const MIN_SLOTS = 8;
export const MAX_SLOTS = 15;
export const MINUTES_PER_EXERCISE = 1.3;

export function slotCount(dailyMinutes: number): number {
  const n = Math.round(dailyMinutes / MINUTES_PER_EXERCISE);
  return Math.max(MIN_SLOTS, Math.min(MAX_SLOTS, n));
}

/** docs/04 §4 step 5: difficulty follows mastery, nudged by how this child likes it. */
export function difficultyFor(mastery: number, bias = 0, delta = 0): number {
  const base = 1 + (4 * Math.max(0, Math.min(100, mastery))) / 100;
  return Math.max(1, Math.min(5, Math.round(base + bias + delta)));
}

/** docs/04 §3.5: what counts as weak. */
export function isWeak(skill: SkillSnapshot, errorCount7d = 0): boolean {
  if (skill.status === "NEEDS_PRACTICE") return true;
  if (skill.status === "LEARNING" && skill.evidenceCount >= 3 && skill.mastery < 50) return true;
  return errorCount7d >= ACTIVE_ERROR_COUNT_7D;
}

/** In a session, two wrong answers in a row means the next one comes down a step (§4 step 5). */
export function adaptDifficulty(current: number, lastTwoWrong: boolean): number {
  return lastTwoWrong ? Math.max(1, current - 1) : current;
}

const byMostOverdue = (a: SkillSnapshot, b: SkillSnapshot) => b.overdueDays - a.overdueDays;
const byWeakest = (a: SkillSnapshot, b: SkillSnapshot) => a.mastery - b.mastery;

/**
 * Spreads the slots so no more than two in a row share a subject, at least three exercise types
 * appear, the first is a warm-up and the last is a sure thing (docs/04 §4 step 4).
 */
export function orderSlots(slots: Slot[]): Slot[] {
  const warm = slots.filter((s) => s.kind === "warmup");
  const finish = slots.filter((s) => s.kind === "finish");
  const middle = slots.filter((s) => s.kind !== "warmup" && s.kind !== "finish");

  const out: Slot[] = [];
  const pool = [...middle];
  let lastSubject: Subject | null = null;
  let run = 0;
  while (pool.length > 0) {
    // prefer a different subject once two of the same have been in a row
    let index = pool.findIndex((s) => (run >= 2 ? s.subject !== lastSubject : true));
    if (index < 0) index = 0;
    const [next] = pool.splice(index, 1);
    if (!next) break;
    run = next.subject === lastSubject ? run + 1 : 1;
    lastSubject = next.subject;
    out.push(next);
  }
  return [...warm, ...out, ...finish].map((s, i) => ({ ...s, order: i + 1 }));
}

/**
 * Builds the plan. The picker (in packages/db) then finds one real exercise per slot; anything it
 * cannot fill it reports, and `content:stats` shows the gap (docs/04 §4 step 6).
 */
export function planSession(input: PlannerInput): SessionPlan {
  const log: string[] = [];
  const bias = input.difficultyBias ?? 0;
  const n = slotCount(input.dailyMinutes);
  const errorsByCode = new Map((input.activeErrors ?? []).map((e) => [e.code, e]));
  const skillsByCode = new Map(input.skills.map((s) => [s.code, s]));
  const lessonSkills = new Set(input.lessonSkills ?? []);
  const planSkills = new Set(input.planSkills ?? []);
  log.push(`${input.dailyMinutes} phút → ${n} bài`);

  const errorCountFor = (skill: SkillSnapshot) => {
    let most = 0;
    for (const e of errorsByCode.values())
      if (e.remediationSkills.includes(skill.code)) most = Math.max(most, e.count7d);
    return most;
  };

  const used = new Set<string>();
  const slots: Slot[] = [];
  const take = (slot: Omit<Slot, "order">) => {
    slots.push({ ...slot, order: slots.length + 1 });
    used.add(slot.skillCode);
  };

  // ── 1. warm-up: something this child is good at ───────────────────────────────────────────
  const solid = input.skills
    .filter((s) => s.status === "SOLID" || s.status === "MASTERED")
    .sort((a, b) => b.mastery - a.mastery);
  const warm = solid[0] ?? [...input.skills].sort((a, b) => b.mastery - a.mastery)[0];
  if (warm) {
    take({
      kind: "warmup",
      skillCode: warm.code,
      subject: warm.subject,
      difficulty: Math.max(1, difficultyFor(warm.mastery, bias) - 1),
      reason: "khởi động: bài con đã vững",
    });
    log.push(`khởi động: ${warm.code}`);
  }

  // ── 2. the ladder first: a child with an active mistake gets it drilled today ─────────────
  const tracks = (input.tracks ?? [])
    .filter((t) => t.status === "ACTIVE")
    .slice(0, MAX_ACTIVE_TRACKS);
  const remediating: SessionPlan["remediating"] = [];
  const ladderBudget = Math.min(
    MAX_REMEDIATION_PER_SESSION * Math.max(1, tracks.length),
    Math.floor(n * 0.4),
  );
  let ladderUsed = 0;

  tracks.forEach((track, trackIndex) => {
    const skill = skillsByCode.get(track.skillCode);
    if (!skill) return;
    const info = rungInfo(track.rung);
    // The budget is shared out, so a second skill under the ladder still gets its turn.
    const tracksLeft = tracks.length - trackIndex;
    const perTrack = Math.max(
      1,
      Math.min(
        MAX_REMEDIATION_PER_SESSION,
        info.planner.independentCount ?? MAX_REMEDIATION_PER_SESSION,
        Math.floor((ladderBudget - ladderUsed) / tracksLeft),
      ),
    );

    // rung 4 sends the child back to the prerequisite instead of the skill itself
    const target =
      info.planner.usePrerequisite && skill.prerequisites[0]
        ? (skillsByCode.get(skill.prerequisites[0]) ?? skill)
        : skill;

    for (let i = 0; i < perTrack; i++) {
      take({
        kind: "remediation",
        skillCode: target.code,
        subject: target.subject,
        difficulty: difficultyFor(target.mastery, bias, info.planner.difficultyDelta ?? 0),
        reason: `rèn bậc ${track.rung}: ${info.labelVi}${track.errorCode ? ` (lỗi ${track.errorCode})` : ""}`,
        errorCode: track.errorCode ?? undefined,
        rung: track.rung,
        prefer: {
          types: info.planner.preferTypes,
          scaffold: info.planner.scaffold,
          targetsError: info.planner.targetsError ? (track.errorCode ?? undefined) : undefined,
          maxChoices: info.planner.maxChoices,
          noHints: info.planner.noHints,
        },
      });
      ladderUsed++;
    }
    remediating.push({ skillCode: skill.code, errorCode: track.errorCode, rung: track.rung });
    log.push(`thang rèn: ${skill.code} bậc ${track.rung} × ${perTrack}`);
  });

  // ── 3. the rest, split 50 / 30 / 20 (docs/04 §4 step 3) ───────────────────────────────────
  const left = Math.max(0, n - slots.length - 1); // one is kept for the finish
  const want = {
    focus: Math.round(left * 0.5),
    review: Math.round(left * 0.3),
    new: 0,
  };
  want.new = Math.max(0, left - want.focus - want.review);

  // focus: today's lesson first, then the approved plan, then the weak ones
  const focusPool = input.skills
    .filter((s) => !used.has(s.code))
    .sort((a, b) => {
      const rank = (s: SkillSnapshot) =>
        (s.inLessonToday || lessonSkills.has(s.code) ? 0 : 1) + (planSkills.has(s.code) ? 0 : 1);
      const d = rank(a) - rank(b);
      return d !== 0 ? d : byWeakest(a, b);
    })
    .filter(
      (s) =>
        lessonSkills.has(s.code) ||
        s.inLessonToday ||
        planSkills.has(s.code) ||
        isWeak(s, errorCountFor(s)),
    );

  for (const skill of focusPool) {
    if (slots.length >= 1 + want.focus + ladderUsed) break;
    const why =
      lessonSkills.has(skill.code) || skill.inLessonToday
        ? "bài lớp học hôm nay"
        : planSkills.has(skill.code)
          ? "kế hoạch tuần ba mẹ đã duyệt"
          : `đang yếu (${Math.round(skill.mastery)}/100)`;
    take({
      kind: "focus",
      skillCode: skill.code,
      subject: skill.subject,
      difficulty: difficultyFor(skill.mastery, bias),
      reason: `trọng tâm: ${why}`,
    });
  }

  // review: the most overdue first
  const reviewPool = input.skills
    .filter((s) => !used.has(s.code) && s.nextReviewAt != null && s.overdueDays >= 0)
    .sort(byMostOverdue);
  let reviewed = 0;
  for (const skill of reviewPool) {
    if (reviewed >= want.review) break;
    take({
      kind: "review",
      skillCode: skill.code,
      subject: skill.subject,
      difficulty: difficultyFor(skill.mastery, bias),
      reason:
        skill.overdueDays > 0 ? `ôn quá hạn ${skill.overdueDays} ngày` : "ôn đúng lịch hôm nay",
    });
    reviewed++;
  }

  // new: never before the prerequisite is at least 60 (docs/04 §2)
  const newPool = input.skills
    .filter((s) => !used.has(s.code) && (s.status === "NOT_STARTED" || s.evidenceCount === 0))
    .filter((s) =>
      s.prerequisites.every((p) => {
        const prereq = skillsByCode.get(p);
        return !prereq || prereq.mastery >= 60;
      }),
    )
    .sort((a, b) => (a.expectedWeek ?? 99) - (b.expectedWeek ?? 99));
  let fresh = 0;
  for (const skill of newPool) {
    if (fresh >= want.new) break;
    take({
      kind: "new",
      skillCode: skill.code,
      subject: skill.subject,
      difficulty: 1,
      reason: "bài mới: tiên quyết đã vững",
    });
    fresh++;
  }

  // Anything still missing: fill from the strongest skills, which keeps the session the right
  // length without ever handing the child something they are not ready for. A skill may come
  // round twice — the picker gives it a different exercise.
  const filler = [...input.skills].sort((a, b) => b.mastery - a.mastery);
  for (let i = 0; filler.length > 0 && slots.length < n - 1; i++) {
    const skill = filler[i % filler.length] as SkillSnapshot;
    take({
      kind: "focus",
      skillCode: skill.code,
      subject: skill.subject,
      difficulty: difficultyFor(skill.mastery, bias),
      reason: "luyện thêm cho đủ phiên",
    });
  }

  // ── 4. finish on something certain ────────────────────────────────────────────────────────
  const closer = solid[1] ?? solid[0] ?? filler[0];
  if (closer)
    take({
      kind: "finish",
      skillCode: closer.code,
      subject: closer.subject,
      difficulty: Math.max(1, difficultyFor(closer.mastery, bias) - 1),
      reason: "kết thúc vui: bài chắc chắn làm được",
    });

  const ordered = orderSlots(slots).slice(0, n);
  log.push(`tổng ${ordered.length} bài · ${remediating.length} kỹ năng đang rèn`);
  return { slots: ordered, remediating, log };
}

/** The codes with enough recent misses to be worth drilling (docs/04 §11.3). */
export function activeErrorCodes(errors: ActiveError[]): string[] {
  return errors.filter((e) => e.count7d >= ACTIVE_ERROR_COUNT_7D).map((e) => e.code);
}
