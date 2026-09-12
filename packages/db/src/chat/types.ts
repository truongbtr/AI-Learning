/**
 * What Claude chat sends in (docs/13 §7) — the same shape as `IntakeExtraction` in `@mtct/inbox`,
 * restated here because `@mtct/db` cannot depend on the package that depends on it.
 *
 * `packages/inbox/src/chat-contract.test.ts` fails to compile if the two ever drift apart, which is
 * the only guarantee worth having: the phone and the queue must describe a page the same way, or a
 * result written one evening through chat and the next through `inbox:push` would mean two things.
 */

export const CHAT_OUTCOMES = ["CORRECT", "PARTIAL", "INCORRECT", "BLANK", "UNGRADED"] as const;
export type ChatOutcome = (typeof CHAT_OUTCOMES)[number];

export interface ChatIntakeItem {
  index: number;
  questionText?: string;
  studentAnswer?: string | null;
  expectedAnswer?: string | null;
  outcome?: ChatOutcome;
  blankReason?: "NOT_FINISHED" | "DOES_NOT_KNOW" | null;
  errorCode?: string | null;
  skillCodes?: string[];
  bbox?: [number, number, number, number] | null;
  fileIndex?: number;
  /**
   * The reader asking for a human on this question (docs/13 §7.3). The skill the owner runs on the
   * phone is told to set it whenever it cannot tell a blank from a mistake, or cannot find a skill
   * code it is allowed to use — so honouring it is what keeps that instruction true.
   */
  needsParent?: boolean;
}

export interface ChatExternalProgress {
  platform: "NAVIO" | "KIDSAZ";
  metric: string;
  value: string;
  valueNum?: number | null;
}

export interface ChatIntakeInput {
  kind: "PHOTO_INTAKE";
  docType?:
    | "WORKBOOK"
    | "TEST"
    | "WORKSHEET"
    | "TEACHER_NOTE"
    | "CLASS_DIARY"
    | "NAVIO_REPORT"
    | "KIDSAZ_REPORT"
    | "OTHER";
  subject?: "ESL" | "ENL" | "EMATH" | "ESCI" | "VIET" | "VMATH" | null;
  detectedStudent?: string | null;
  summary?: string;
  teacherComment?: string | null;
  confidence?: number;
  items?: ChatIntakeItem[];
  externals?: ChatExternalProgress[];
  /** The same request over the whole page. */
  needsParent?: boolean;
}

/** The single threshold of docs/13 §7.3: below this, nothing is applied without a grown-up. */
export const CHAT_CONFIDENCE_FLOOR = 0.6;

/** A context older than this was assembled before the class had moved on (docs/13 §7.4). */
export const CHAT_CONTEXT_MAX_AGE_DAYS = 2;
