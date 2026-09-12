/**
 * Mastery model types (docs/04 sec. 3). Pure data: no Prisma types here; the db layer maps rows.
 */
export type MasteryStatus = "NOT_STARTED" | "LEARNING" | "NEEDS_PRACTICE" | "SOLID" | "MASTERED";

export type EvidenceSource =
  | "EXERCISE"
  | "INTAKE_PHOTO"
  | "INTAKE_TEACHER_NOTE"
  | "HOMEWORK"
  | "EXTERNAL_REPORT"
  | "PARENT_NOTE"
  | "PARENT_OVERRIDE"
  | "VOICE_TUTOR"
  | "CHAT_INTAKE";

export type EvidenceOutcome = "CORRECT" | "PARTIAL" | "INCORRECT" | "OBSERVED";

export interface MasteryState {
  /** 0-100 */
  mastery: number;
  /** 0-1 */
  confidence: number;
  evidenceCount: number;
  lastEvidenceAt: Date | null;
  /** mastery now minus mastery 14 days ago (docs/04 sec. 3.3: trend14d <= -8 => NEEDS_PRACTICE) */
  trend14d: number;
  status: MasteryStatus;
  nextReviewAt: Date | null;
  /** Current spaced-repetition interval in days (0 = not scheduled) */
  intervalDays: number;
  easeFactor: number;
  /**
   * Distinct calendar days (YYYY-MM-DD, Asia/Ho_Chi_Minh) that had a CORRECT evidence.
   * MASTERED needs >= 3 (docs/04 sec. 3.3). The db layer loads these from Evidence.
   */
  correctDayKeys: string[];
}

export interface MasteryEvidence {
  source: EvidenceSource;
  /** 0-1 (PARENT_OVERRIDE: the mastery to set, as 0-1) */
  score: number;
  /** 1-5, default 3 */
  difficulty?: number;
  hintsUsed?: number;
  tries?: number;
  outcome?: EvidenceOutcome;
  observedAt: Date;
  /**
   * 0-1, default 1: scales the weight of the source for this one piece of evidence.
   * docs/07 §2.2 uses it for blanks — a page the child ran out of time on (0.3) says much less
   * than a question they tried and got wrong.
   */
  weightFactor?: number;
}

export interface MasteryUpdateResult {
  state: MasteryState;
  /** Weight used for this source */
  weight: number;
  /** Learning step actually applied (0 for PARENT_OVERRIDE) */
  k: number;
  /** Score after hint/tries penalties */
  effectiveScore: number;
  isCorrect: boolean;
}
