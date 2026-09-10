import { z } from "zod";

/**
 * Inbox item kinds (docs/13 §2). The app only enqueues; Claude Code processes in batches.
 * Result schemas (IntakeExtraction, GradeResult, WeeklyReport, ExerciseSpec) arrive in phase 2.
 */
export const INBOX_KINDS = [
  "PHOTO_INTAKE",
  "DIARY_HARD",
  "WRITE_PHOTO_GRADE",
  "SPEAK_GRADE",
  "WEEKLY_REPORT",
] as const;
export type InboxKind = (typeof INBOX_KINDS)[number];

export const INBOX_STATUSES = ["PENDING", "PULLED", "DONE", "FAILED"] as const;
export type InboxStatus = (typeof INBOX_STATUSES)[number];

/** Minimal envelope written to inbox/<date>/<id>/context.json by `inbox:pull`. */
export const inboxContextSchema = z.object({
  id: z.string(),
  kind: z.enum(INBOX_KINDS),
  studentNickname: z.string().nullable(),
  createdAt: z.string(),
  payload: z.record(z.string(), z.unknown()),
});
export type InboxContext = z.infer<typeof inboxContextSchema>;
