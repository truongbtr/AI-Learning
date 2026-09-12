/**
 * What the planner needs to know, and what it produces (docs/04 §4).
 *
 * Pure data on both sides: the database layer loads the snapshot, the planner decides what to
 * practise and in which order, and the database layer then finds a real exercise for each slot.
 * Keeping the decision out of SQL is what makes it testable — and the tests are the only way to
 * be sure a child is not handed eight subtraction questions in a row on a bad day.
 */
import type { MasteryStatus } from "../mastery/types";

export type Subject = "ESL" | "ENL" | "EMATH" | "ESCI" | "VIET" | "VMATH";

export type SlotKind =
  | "warmup"
  | "focus"
  | "review"
  | "new"
  | "remediation"
  | "homework"
  | "finish";

export interface SkillSnapshot {
  code: string;
  subject: Subject;
  mastery: number;
  status: MasteryStatus;
  confidence: number;
  /** Due for review on or before today (docs/04 §3.4). */
  nextReviewAt: Date | null;
  /** Days overdue; the most overdue is reviewed first. */
  overdueDays: number;
  trend14d: number;
  evidenceCount: number;
  /** From the skill map, for rung 4 and rung 5 of the ladder. */
  prerequisites: string[];
  confusableWith: string[];
  /** Set when the class is on this skill right now (diary or expectedWeek). */
  inLessonToday?: boolean;
  expectedWeek?: number | null;
}

export interface ActiveError {
  code: string;
  count7d: number;
  /** Skills the taxonomy says to drill for this code. */
  remediationSkills: string[];
}

export interface TrackSnapshot {
  skillCode: string;
  errorCode: string | null;
  rung: number;
  status: "ACTIVE" | "PASSED" | "NEEDS_PARENT";
  lastStepAt: Date | null;
}

export interface PlannerInput {
  date: Date;
  /** docs/03 Student.settings */
  dailyMinutes: number;
  /** −1 … +1: a child who likes it harder, or needs it gentler. */
  difficultyBias?: number;
  skills: SkillSnapshot[];
  activeErrors?: ActiveError[];
  tracks?: TrackSnapshot[];
  /** Skill codes the approved weekly plan asks for (phase 5). */
  planSkills?: string[];
  /** Skill codes of the lessons the class had in the last three days (phase 4). */
  lessonSkills?: string[];
  /** Exercise ids this child has already seen in the last seven days. */
  recentExerciseIds?: string[];
  /** Subjects on today's timetable, most important first. */
  todaySubjects?: Subject[];
  /**
   * Focus / review shares for the practice half, when something has changed them from the 50/30
   * of docs/04 §4 (an ops request, docs/14 §4). Review is clamped to `MIN_REVIEW_SHARE`.
   */
  mix?: { focus?: number; review?: number };
  /**
   * Stations the database layer will put in front of this plan — the teacher's homework
   * (FR-LRN-07). The planner never builds them, but it has to count them: "half the session"
   * means half of what the child is handed, and homework is never displaced to make room.
   */
  extraSlots?: number;
}

export interface Slot {
  order: number;
  kind: SlotKind;
  skillCode: string;
  subject: Subject;
  /** 1–5, already adjusted for mastery, bias and the ladder. */
  difficulty: number;
  /** Shown to the parent: why this exercise is here (docs/04 §4 step 7). */
  reason: string;
  /** Preferences the exercise picker should honour if it can. */
  prefer?: {
    types?: string[];
    scaffold?: "model";
    targetsError?: string;
    maxChoices?: number;
    noHints?: boolean;
  };
  /** The error code this slot is drilling, when it comes from the ladder. */
  errorCode?: string;
  /** The ladder rung this slot belongs to. */
  rung?: number;
}

export interface SessionPlan {
  slots: Slot[];
  /** Skills under the ladder in this session, with the rung each is on. */
  remediating: { skillCode: string; errorCode: string | null; rung: number }[];
  /** A sentence per decision, for the parent dashboard and for debugging. */
  log: string[];
}
