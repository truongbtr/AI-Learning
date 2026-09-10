import {
  DAY_MS,
  DECAY_AFTER_DAYS,
  DECAY_CONFIDENCE_MIN,
  DECAY_CONFIDENCE_PER_DAY,
  DECAY_MASTERY_FLOOR,
  DECAY_MASTERY_PER_DAY,
} from "./constants";
import { statusOf } from "./status";
import type { MasteryState } from "./types";

export function daysSince(from: Date, now: Date): number {
  return (now.getTime() - from.getTime()) / DAY_MS;
}

/**
 * docs/04 sec. 3.2 - nightly decay. After 21 days without evidence, each day:
 *   confidence -= 0.01 (min 0.2); mastery -= 0.3 while mastery > 60 (floor 60).
 * `days` = how many daily steps to apply (the nightly job passes the days since its last run;
 * tests pass N). Pure; returns the same object when nothing applies.
 */
export function applyDecay(state: MasteryState, now: Date, days = 1): MasteryState {
  if (!state.lastEvidenceAt || state.evidenceCount === 0 || days <= 0) return state;
  if (daysSince(state.lastEvidenceAt, now) <= DECAY_AFTER_DAYS) return state;

  const confidence = Math.max(
    DECAY_CONFIDENCE_MIN,
    round3(state.confidence - DECAY_CONFIDENCE_PER_DAY * days),
  );
  const mastery =
    state.mastery > DECAY_MASTERY_FLOOR
      ? Math.max(DECAY_MASTERY_FLOOR, round3(state.mastery - DECAY_MASTERY_PER_DAY * days))
      : state.mastery;
  if (confidence === state.confidence && mastery === state.mastery) return state;

  const draft = { ...state, confidence, mastery };
  return { ...draft, status: statusOf(draft) };
}

/** Whole days elapsed between two job runs (first run = 1 day). */
export function decayDaysBetween(previousRun: Date | null, now: Date): number {
  if (!previousRun) return 1;
  return Math.max(0, Math.floor(daysSince(previousRun, now)));
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
