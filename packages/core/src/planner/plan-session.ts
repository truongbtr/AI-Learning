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

/** docs/04 §4 step 3: the mix of whatever is left after the warm-up, the ladder and the closer. */
export const MIX_FOCUS = 0.5;
export const MIX_REVIEW = 0.3;

/**
 * The review share nothing is allowed to go below — not an approved weekly plan (see `PLAN_SHARE`),
 * and not an operations request either (docs/14 §4, `setPlannerWeight`).
 *
 * docs/04 §4 puts review at 30% of the practice half and the owner reaffirmed it on 12/09/2026.
 * The reason it lives here as a clamp rather than in the caller is that review pays off in
 * November, when nobody is watching: whoever turns it down will not see what it cost for weeks, so
 * the floor has to be enforced where the plan is actually built.
 */
export const MIN_REVIEW_SHARE = 0.3;

/** The mix actually used: whatever was asked for, with review never under `MIN_REVIEW_SHARE`. */
export function plannerMix(mix?: { focus?: number; review?: number }): {
  focus: number;
  review: number;
} {
  const review = Math.min(0.8, Math.max(MIN_REVIEW_SHARE, mix?.review ?? MIX_REVIEW));
  const focus = Math.min(1 - review, Math.max(0, mix?.focus ?? MIX_FOCUS));
  return { focus, review };
}

/**
 * How much of the evening an approved plan is guaranteed (docs/08 pha 5, tiêu chí 3).
 *
 * This was a half, and reaching a half meant spending review slots — ADR-18 §1 said so and said
 * the review share could fall below the 30% of `docs/04` §4 as a result. The owner reversed that
 * on 12/09/2026, before the fortnight of real use: review *is* the spaced repetition, and spaced
 * repetition is what decides whether the child still knows this in two months. So the guarantee
 * came down to 40%, which is payable out of filler and new slots alone.
 */
export const PLAN_SHARE = 0.4;

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
 * How much today's timetable pulls a subject forward (docs/05 §2: "buổi tối thứ 2 ưu tiên
 * ESL/VIET; thứ 3: VMATH/ESCI…", FR-PAR-06).
 *
 * Position matters: the first subject on the list is the one the class spent most of the day on,
 * so it comes first in the evening too. Anything not on today's timetable is neither promoted nor
 * punished — it simply has no timetable reason to be here.
 */
export function timetableRank(subject: Subject, todaySubjects?: Subject[]): number {
  if (!todaySubjects || todaySubjects.length === 0) return 0;
  const index = todaySubjects.indexOf(subject);
  return index < 0 ? 0 : todaySubjects.length - index;
}

/**
 * Spreads the slots so no more than two in a row share a subject, at least three exercise types
 * appear, the first is a warm-up and the last is a sure thing (docs/04 §4 step 4).
 *
 * `todaySubjects` decides which subject *opens* the road after the warm-up: the class had it this
 * morning, so it is what the evening is about (docs/05 §2, FR-PAR-06). The alternation rule still
 * wins over it, because eight of anything in a row loses a six-year-old.
 */
export function orderSlots(slots: Slot[], todaySubjects?: Subject[]): Slot[] {
  const warm = slots.filter((s) => s.kind === "warmup");
  const finish = slots.filter((s) => s.kind === "finish");
  const middle = slots.filter((s) => s.kind !== "warmup" && s.kind !== "finish");

  const out: Slot[] = [];
  const pool = [...middle];
  let lastSubject: Subject | null = null;
  let run = 0;
  while (pool.length > 0) {
    // prefer a different subject once two of the same have been in a row
    const eligible = pool
      .map((slot, index) => ({ slot, index }))
      .filter(({ slot }) => (run >= 2 ? slot.subject !== lastSubject : true));
    const choices = eligible.length > 0 ? eligible : [{ slot: pool[0] as Slot, index: 0 }];
    // Homework the teacher set leads whatever the timetable says; then today's subjects.
    const best = choices.reduce((a, b) => {
      const score = (s: Slot) =>
        (s.kind === "homework" ? 1000 : 0) + timetableRank(s.subject, todaySubjects);
      return score(b.slot) > score(a.slot) ? b : a;
    });
    pool.splice(best.index, 1);
    run = best.slot.subject === lastSubject ? run + 1 : 1;
    lastSubject = best.slot.subject;
    out.push(best.slot);
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
  const mix = plannerMix(input.mix);
  const want = {
    focus: Math.round(left * mix.focus),
    review: Math.round(left * mix.review),
    new: 0,
  };
  want.new = Math.max(0, left - want.focus - want.review);
  // The number of review slots an approved plan may never take back. See `PLAN_SHARE`.
  const reviewFloor = want.review;

  // focus: today's lesson first, then the approved plan, then the weak ones — and within all of
  // that, a subject the class had today comes before one it did not (docs/05 §2, FR-PAR-06).
  const focusPool = input.skills
    .filter((s) => !used.has(s.code))
    .filter(
      (s) =>
        lessonSkills.has(s.code) ||
        s.inLessonToday ||
        planSkills.has(s.code) ||
        isWeak(s, errorCountFor(s)),
    )
    .sort((a, b) => {
      const rank = (s: SkillSnapshot) =>
        (s.inLessonToday || lessonSkills.has(s.code) ? 0 : 1) + (planSkills.has(s.code) ? 0 : 1);
      const d = rank(a) - rank(b);
      if (d !== 0) return d;
      const t =
        timetableRank(b.subject, input.todaySubjects) -
        timetableRank(a.subject, input.todaySubjects);
      return t !== 0 ? t : byWeakest(a, b);
    });

  for (const skill of focusPool) {
    if (slots.length >= 1 + want.focus + ladderUsed) break;
    const onTimetable = timetableRank(skill.subject, input.todaySubjects) > 0;
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
      reason: `trọng tâm: ${why}${onTimetable ? " · hôm nay có tiết môn này" : ""}`,
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
  // round twice — the picker gives it a different exercise. Today's subjects go first, so an
  // evening after a maths-heavy day is a maths-heavy evening.
  const filler = [...input.skills].sort(
    (a, b) =>
      timetableRank(b.subject, input.todaySubjects) -
        timetableRank(a.subject, input.todaySubjects) || b.mastery - a.mastery,
  );
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

  // ── 3b. an approved plan has to own the evening ───────────────────────────────────────────
  //
  // docs/08 pha 5, tiêu chí 3: approve a plan and at least `PLAN_SHARE` of tomorrow's session
  // belongs to it. The 50/30/20 split alone does not guarantee that — a week of overdue reviews
  // can crowd a plan out of its own fortnight, and a parent who approved something and then
  // watched nothing change would never approve another one.
  //
  // Padding is taken from the slots that exist to fill space, in the order they are least missed:
  // filler first, then a new skill, then a review **down to `reviewFloor` and no further**.
  // Homework, the warm-up, the closer, the ladder and anything the class did today are never
  // displaced — those outrank a plan by design, and so, since 12/09/2026, does the 30% of review
  // that `docs/04` §4 asks for. A plan that cannot reach its share out of what is left simply
  // reaches less; the log says so.
  if (planSkills.size > 0) {
    // Half of what the child will actually be handed, homework included. The teacher's stations
    // are prepended after this and are never displaced (FR-LRN-07), so the plan has to make up
    // the difference out of the practice half.
    const target = Math.ceil((n + (input.extraSlots ?? 0)) * PLAN_SHARE);
    const isPlan = (s: Slot) => planSkills.has(s.skillCode);
    // Cycled, not consumed: a plan of four skills still fills six slots, and the picker gives a
    // different exercise each time. A plan with fewer skills is a narrower fortnight, not a
    // quieter one.
    const usable = [...planSkills].filter((code) => skillsByCode.has(code));
    const unused = usable.filter((code) => !used.has(code));
    let cycle = 0;
    const nextPlanSkill = (): string | null => {
      if (unused.length > 0) return unused.shift() as string;
      if (usable.length === 0) return null;
      return usable[cycle++ % usable.length] as string;
    };
    const displaceable = (s: Slot) =>
      !isPlan(s) &&
      s.kind !== "warmup" &&
      s.kind !== "finish" &&
      s.kind !== "homework" &&
      s.kind !== "remediation" &&
      !lessonSkills.has(s.skillCode) &&
      !skillsByCode.get(s.skillCode)?.inLessonToday;
    /** Lower = missed less. Space-filling padding goes first, then a new skill, then a review. */
    const cost = (s: Slot) =>
      s.reason.startsWith("luyện thêm") ? 0 : s.kind === "new" ? 1 : s.kind === "review" ? 2 : 3;

    let planned = slots.filter(isPlan).length;
    let reviews = slots.filter((s) => s.kind === "review").length;
    const swappable = slots
      .map((slot, index) => ({ slot, index }))
      .filter(({ slot }) => displaceable(slot))
      .sort((a, b) => cost(a.slot) - cost(b.slot));

    for (const { slot, index } of swappable) {
      if (planned >= target) break;
      // The 30% of review `docs/04` §4 asks for is not the plan's to spend.
      if (slot.kind === "review" && reviews <= reviewFloor) continue;
      const code = nextPlanSkill();
      if (!code) break;
      const skill = skillsByCode.get(code) as SkillSnapshot;
      slots[index] = {
        ...(slots[index] as Slot),
        kind: "focus",
        skillCode: skill.code,
        subject: skill.subject,
        difficulty: difficultyFor(skill.mastery, bias),
        reason: "trọng tâm: kế hoạch tuần ba mẹ đã duyệt",
      };
      if (slot.kind === "review") reviews--;
      used.add(code);
      planned++;
    }
    log.push(
      `kế hoạch tuần đã duyệt: ${planSkills.size} kỹ năng, chiếm ${planned}/${slots.length} bài` +
        (planned < target ? ` (dưới ${Math.round(PLAN_SHARE * 100)}% vì giữ nhịp ôn)` : ""),
    );
    log.push(`giữ ${reviews}/${slots.length} bài ôn (sàn ${reviewFloor})`);
  }

  const ordered = orderSlots(slots, input.todaySubjects).slice(0, n);
  if (input.todaySubjects?.length)
    log.push(
      `hôm nay lớp có: ${input.todaySubjects.join(", ")} → ưu tiên ${input.todaySubjects[0]}`,
    );
  log.push(`tổng ${ordered.length} bài · ${remediating.length} kỹ năng đang rèn`);
  return { slots: ordered, remediating, log };
}

/** The codes with enough recent misses to be worth drilling (docs/04 §11.3). */
export function activeErrorCodes(errors: ActiveError[]): string[] {
  return errors.filter((e) => e.count7d >= ACTIVE_ERROR_COUNT_7D).map((e) => e.code);
}
