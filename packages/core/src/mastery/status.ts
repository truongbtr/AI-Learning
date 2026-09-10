import {
  MASTERED_CONFIDENCE,
  MASTERED_CORRECT_DAYS,
  MASTERED_MASTERY,
  NEEDS_PRACTICE_TREND,
  SOLID_CONFIDENCE,
  SOLID_MASTERY,
} from "./constants";
import type { MasteryState, MasteryStatus } from "./types";

/**
 * Status table docs/04 sec. 3.3, evaluated top-down:
 *  NOT_STARTED     evidenceCount = 0
 *  MASTERED        m >= 85, c >= 0.6, >= 3 correct evidences on 3 distinct days
 *  NEEDS_PRACTICE  (m < 60 and c >= 0.4) or trend14d <= -8
 *  SOLID           m >= 60 and c >= 0.4 (also m >= 85 while the MASTERED extras are not met yet)
 *  LEARNING        otherwise (has evidence, m < 60 or c < 0.4)
 */
export function statusOf(
  state: Pick<
    MasteryState,
    "mastery" | "confidence" | "evidenceCount" | "trend14d" | "correctDayKeys"
  >,
): MasteryStatus {
  const { mastery: m, confidence: c, evidenceCount, trend14d } = state;
  if (evidenceCount <= 0) return "NOT_STARTED";
  if (
    m >= MASTERED_MASTERY &&
    c >= MASTERED_CONFIDENCE &&
    state.correctDayKeys.length >= MASTERED_CORRECT_DAYS
  ) {
    return "MASTERED";
  }
  if ((m < SOLID_MASTERY && c >= SOLID_CONFIDENCE) || trend14d <= NEEDS_PRACTICE_TREND) {
    return "NEEDS_PRACTICE";
  }
  if (m >= SOLID_MASTERY && c >= SOLID_CONFIDENCE) return "SOLID";
  return "LEARNING";
}

export function isAtLeastSolid(status: MasteryStatus): boolean {
  return status === "SOLID" || status === "MASTERED";
}

/** docs/04 sec. 3.5 - weak-skill definition shared by planner and dashboard. */
export function isWeakSkill(
  state: Pick<MasteryState, "status" | "evidenceCount" | "mastery">,
  sameErrorCount14d = 0,
): boolean {
  if (state.status === "NEEDS_PRACTICE") return true;
  if (state.status === "LEARNING" && state.evidenceCount >= 3 && state.mastery < 50) return true;
  return sameErrorCount14d >= 2;
}
