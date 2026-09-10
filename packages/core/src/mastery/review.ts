import { DAY_MS, REVIEW_INTERVALS, REVIEW_RESET_DAYS } from "./constants";
import type { MasteryState } from "./types";

/**
 * docs/04 sec. 3.4 - reduced SM-2: once a skill is SOLID or better, a correct review moves the
 * interval along 2 -> 4 -> 8 -> 16 -> 30 days; a failed review resets it to 2 days.
 * Skills that have never reached SOLID are not scheduled (interval 0).
 */
export function reviewIntervalAfter(input: {
  previousInterval: number;
  wasSolid: boolean;
  nowSolid: boolean;
  correct: boolean;
}): number {
  const { previousInterval, wasSolid, nowSolid, correct } = input;
  if (!wasSolid && !nowSolid) return 0;
  if (!correct) return REVIEW_RESET_DAYS;
  if (!nowSolid) return REVIEW_RESET_DAYS; // dropped below SOLID on a weak "correct" evidence
  const idx = REVIEW_INTERVALS.indexOf(previousInterval as (typeof REVIEW_INTERVALS)[number]);
  if (idx < 0) return REVIEW_INTERVALS[0];
  return REVIEW_INTERVALS[Math.min(idx + 1, REVIEW_INTERVALS.length - 1)] ?? REVIEW_INTERVALS[0];
}

/** nextReviewAt = lastEvidenceAt + intervalDays (null when not scheduled). */
export function nextReviewAt(
  state: Pick<MasteryState, "intervalDays" | "lastEvidenceAt">,
): Date | null {
  if (state.intervalDays <= 0 || !state.lastEvidenceAt) return null;
  return new Date(state.lastEvidenceAt.getTime() + state.intervalDays * DAY_MS);
}

export function isReviewDue(state: Pick<MasteryState, "nextReviewAt">, now: Date): boolean {
  return state.nextReviewAt !== null && state.nextReviewAt.getTime() <= now.getTime();
}
