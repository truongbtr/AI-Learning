import type { EvidenceSource } from "./types";

/** docs/04 sec. 3.1 */
export const K_BASE = 18;
export const HINT_PENALTY = 0.6;
export const TRIES_PENALTY = 0.7;
export const CONFIDENCE_STEP = 0.08;
export const OVERRIDE_CONFIDENCE = 0.9;

/**
 * Source weights (docs/04 sec. 3.1). HOMEWORK is in the Evidence enum but has no weight in the
 * doc; it is treated like a photographed workbook page (0.8) - see ADR-13.
 */
export const SOURCE_WEIGHT: Record<EvidenceSource, number> = {
  EXERCISE: 1.0,
  INTAKE_PHOTO: 0.8,
  INTAKE_TEACHER_NOTE: 0.9,
  HOMEWORK: 0.8,
  EXTERNAL_REPORT: 0.7,
  PARENT_NOTE: 0.5,
  VOICE_TUTOR: 0.3,
  // A photo read by Claude chat on the phone (docs/13 §7.3). The same page, read by the same kind
  // of reader as INTAKE_PHOTO, so it carries the same weight (0.8). What differs is that it lands
  // without waiting for a parent — and that is answered by the undo button, not by discounting it.
  CHAT_INTAKE: 0.8,
  PARENT_OVERRIDE: 1.0, // not used as a step; the value is set directly
};

/** docs/04 sec. 3.2 */
export const DECAY_AFTER_DAYS = 21;
export const DECAY_CONFIDENCE_PER_DAY = 0.01;
export const DECAY_CONFIDENCE_MIN = 0.2;
export const DECAY_MASTERY_PER_DAY = 0.3;
export const DECAY_MASTERY_FLOOR = 60;

/** docs/04 sec. 3.3 */
export const SOLID_MASTERY = 60;
export const MASTERED_MASTERY = 85;
export const SOLID_CONFIDENCE = 0.4;
export const MASTERED_CONFIDENCE = 0.6;
export const MASTERED_CORRECT_DAYS = 3;
export const NEEDS_PRACTICE_TREND = -8;

/** docs/04 sec. 3.4 - review ladder (days) */
export const REVIEW_INTERVALS = [2, 4, 8, 16, 30] as const;
export const REVIEW_RESET_DAYS = 2;

/** Score at or above which an evidence counts as "correct" when no outcome is given */
export const CORRECT_SCORE_THRESHOLD = 0.8;

export const DAY_MS = 86_400_000;
