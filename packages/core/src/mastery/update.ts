import {
  CONFIDENCE_STEP,
  CORRECT_SCORE_THRESHOLD,
  HINT_PENALTY,
  K_BASE,
  OVERRIDE_CONFIDENCE,
  SOURCE_WEIGHT,
  TRIES_PENALTY,
} from "./constants";
import { nextReviewAt, reviewIntervalAfter } from "./review";
import { isAtLeastSolid, statusOf } from "./status";
import type { MasteryEvidence, MasteryState, MasteryUpdateResult } from "./types";

export const VN_TZ = "Asia/Ho_Chi_Minh";

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: VN_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** YYYY-MM-DD in Vietnam time: "3 different days" (docs/04 sec. 3.3) means calendar days at home. */
export function dayKey(date: Date): string {
  return dayFormatter.format(date);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** A fresh state for a (student, skill) pair with no evidence yet. */
export function emptyMasteryState(): MasteryState {
  return {
    mastery: 0,
    confidence: 0,
    evidenceCount: 0,
    lastEvidenceAt: null,
    trend14d: 0,
    status: "NOT_STARTED",
    nextReviewAt: null,
    intervalDays: 0,
    easeFactor: 2.5,
    correctDayKeys: [],
  };
}

export function isCorrectEvidence(evidence: Pick<MasteryEvidence, "score" | "outcome">): boolean {
  if (evidence.outcome) return evidence.outcome === "CORRECT";
  return evidence.score >= CORRECT_SCORE_THRESHOLD;
}

/** Learning step k = k_base * w * (1 + 0.15 * (d - 3)) - docs/04 sec. 3.1 */
export function learningStep(weight: number, difficulty: number): number {
  return K_BASE * weight * (1 + 0.15 * (difficulty - 3));
}

/** Score after hint and retry penalties - docs/04 sec. 3.1 */
export function effectiveScore(evidence: Pick<MasteryEvidence, "score" | "hintsUsed" | "tries">) {
  let s = clamp(evidence.score, 0, 1);
  if ((evidence.hintsUsed ?? 0) > 0) s *= HINT_PENALTY;
  const tries = evidence.tries ?? 1;
  if (tries > 1) s *= TRIES_PENALTY ** (tries - 1);
  return s;
}

/**
 * docs/04 sec. 3.1 - Bayesian-lite update. Pure: returns a new state, never mutates.
 *
 *   m_new = m + (s*100 - m) * (k/100) * (1.4 - c*0.6)
 *   c_new = min(1, c + 0.08 * w)
 *
 * QC example: m=50, c=0.5, EXERCISE correct d=3 -> 59.9; incorrect -> 40.1.
 * PARENT_OVERRIDE sets mastery = score*100 and confidence = 0.9.
 */
export function updateMastery(state: MasteryState, evidence: MasteryEvidence): MasteryUpdateResult {
  const weight = SOURCE_WEIGHT[evidence.source] * clamp(evidence.weightFactor ?? 1, 0, 1);
  const difficulty = clamp(Math.round(evidence.difficulty ?? 3), 1, 5);
  // A parent override is not a "correct evidence" for the 3-distinct-days rule (docs/04 sec. 3.3).
  const correct = evidence.source !== "PARENT_OVERRIDE" && isCorrectEvidence(evidence);
  const wasSolid = isAtLeastSolid(state.status);

  let mastery: number;
  let confidence: number;
  let k = 0;
  let s = effectiveScore(evidence);

  if (evidence.source === "PARENT_OVERRIDE") {
    s = clamp(evidence.score, 0, 1);
    mastery = s * 100;
    confidence = OVERRIDE_CONFIDENCE;
  } else {
    k = learningStep(weight, difficulty);
    const target = s * 100;
    mastery = clamp(
      state.mastery + (target - state.mastery) * (k / 100) * (1.4 - state.confidence * 0.6),
      0,
      100,
    );
    confidence = Math.min(1, state.confidence + CONFIDENCE_STEP * weight);
  }

  const key = dayKey(evidence.observedAt);
  const correctDayKeys =
    correct && !state.correctDayKeys.includes(key)
      ? [...state.correctDayKeys, key].slice(-30)
      : [...state.correctDayKeys];

  const draft: MasteryState = {
    ...state,
    mastery,
    confidence,
    evidenceCount: state.evidenceCount + 1,
    lastEvidenceAt: evidence.observedAt,
    correctDayKeys,
  };
  const status = statusOf(draft);
  const intervalDays = reviewIntervalAfter({
    previousInterval: state.intervalDays,
    wasSolid,
    nowSolid: isAtLeastSolid(status),
    correct,
  });
  const next: MasteryState = {
    ...draft,
    status,
    intervalDays,
    nextReviewAt: nextReviewAt({ intervalDays, lastEvidenceAt: evidence.observedAt }),
  };
  return { state: next, weight, k, effectiveScore: s, isCorrect: correct };
}
