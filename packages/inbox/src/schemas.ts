import { z } from "zod";

/**
 * The AI queue contract (docs/13). The app never calls an LLM: it enqueues `InboxItem`s, Claude
 * Code reads `inbox/<date>/<id>/context.json` in batches and writes `result.json`, and
 * `inbox:push` loads the results back for a parent to approve.
 *
 * These schemas are the whole contract, so they must stay general enough that the optional v2
 * worker of docs/13 §6 could fill the same files — nothing here assumes a human on the other side.
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

export const SUBJECTS = ["ESL", "ENL", "EMATH", "ESCI", "VIET", "VMATH"] as const;
export const DOC_TYPES = [
  "WORKBOOK",
  "TEST",
  "WORKSHEET",
  "TEACHER_NOTE",
  "CLASS_DIARY",
  "NAVIO_REPORT",
  "KIDSAZ_REPORT",
  "OTHER",
] as const;
export const OUTCOMES = ["CORRECT", "PARTIAL", "INCORRECT", "BLANK", "UNGRADED"] as const;

const skillCode = z.string().regex(/^[A-Z]+\.[A-Z]+\.[A-Z0-9_]+$/);
const errorCode = z.string().regex(/^[a-z][a-z0-9_]{2,40}$/);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// ---------------------------------------------------------------------------------------------
// context.json — what `inbox:pull` hands over
// ---------------------------------------------------------------------------------------------

/** A skill the reader may pick, found with the phase-1 full-text `searchSkills` (ADR-12). */
export const skillCandidateSchema = z.object({
  code: skillCode,
  nameVi: z.string(),
  subject: z.enum(SUBJECTS),
  description: z.string().optional(),
  /** Why it is a candidate: which query matched. */
  matchedOn: z.string().optional(),
});

export const inboxContextSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(INBOX_KINDS),
  createdAt: z.string(),
  /** Nickname only — never the full name or the birth date (docs/00, NFR-06). */
  student: z
    .object({
      nickname: z.string(),
      grade: z.number().int().optional(),
      className: z.string().optional(),
      worldTheme: z.string().optional(),
    })
    .nullable(),
  subjectHint: z.enum(SUBJECTS).nullable().optional(),
  dateHint: isoDate.nullable().optional(),
  /** Files copied next to context.json (relative names). */
  files: z.array(z.string()).default([]),
  /** Free text the app already has: pasted diary, transcript, prompt of the exercise... */
  text: z.string().nullable().optional(),
  /** Candidate skills from searchSkills — the reader picks from these instead of guessing. */
  skillCandidates: z.array(skillCandidateSchema).default([]),
  /** Skills the class is on this week (docs/13 §2). */
  currentSkills: z.array(skillCandidateSchema).default([]),
  /** The full error taxonomy: the reader may only use these codes. */
  errorCodes: z.array(z.object({ code: errorCode, nameVi: z.string() })).default([]),
  /** Up to 10 (wrong, corrected) skill labels a parent has fixed before — few-shot for the reader. */
  parentCorrections: z
    .array(z.object({ question: z.string(), from: z.array(z.string()), to: z.array(z.string()) }))
    .default([]),
  /** Everything else the app stored on the item. */
  payload: z.record(z.string(), z.unknown()).default({}),
  /** What the reader must produce, in one sentence. */
  expects: z.string(),
});
export type InboxContext = z.infer<typeof inboxContextSchema>;

// ---------------------------------------------------------------------------------------------
// result.json — what Claude Code writes back
// ---------------------------------------------------------------------------------------------

/** One question read off a photo (docs/07 §2, docs/03 IntakeItem). */
export const intakeItemSchema = z.object({
  index: z.number().int().min(0),
  questionText: z.string().default(""),
  studentAnswer: z.string().nullable().default(null),
  expectedAnswer: z.string().nullable().default(null),
  outcome: z.enum(OUTCOMES).default("UNGRADED"),
  errorCode: errorCode.nullable().default(null),
  skillCodes: z.array(skillCode).default([]),
  /** [x, y, w, h] in 0..1 of the source image, so the parent sees what was read. */
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).nullable().default(null),
  fileIndex: z.number().int().min(0).default(0),
});

export const intakeExtractionSchema = z.object({
  kind: z.literal("PHOTO_INTAKE"),
  docType: z.enum(DOC_TYPES).default("OTHER"),
  subject: z.enum(SUBJECTS).nullable().default(null),
  /** Nickname read off the page, if any — used to confirm the photo belongs to this child. */
  detectedStudent: z.string().nullable().default(null),
  summary: z.string().default(""),
  teacherComment: z.string().nullable().default(null),
  confidence: z.number().min(0).max(1).default(0.5),
  items: z.array(intakeItemSchema).default([]),
});
export type IntakeExtraction = z.infer<typeof intakeExtractionSchema>;

/** Grading of an open answer: a photo of handwriting, or a spoken answer (docs/13 §1). */
export const gradeResultSchema = z.object({
  kind: z.enum(["WRITE_PHOTO_GRADE", "SPEAK_GRADE"]),
  score: z.number().min(0).max(1),
  outcome: z.enum(["CORRECT", "PARTIAL", "INCORRECT", "BLANK"]),
  errorCodes: z.array(errorCode).default([]),
  skillCodes: z.array(skillCode).default([]),
  /** Shown to the child: friendly, short, never the word "sai" (docs/06 §1). */
  feedbackVi: z.string().trim().min(3).max(200),
  /** For the parent only: what to look at, what to practise tonight. */
  parentNoteVi: z.string().trim().optional(),
  transcript: z.string().optional(),
  /** READ_ALOUD: which target words were read correctly. */
  words: z.array(z.object({ word: z.string(), ok: z.boolean() })).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
});
export type GradeResult = z.infer<typeof gradeResultSchema>;

/** One class-diary post the pattern reader could not handle (docs/11 §3, docs/13 §4). */
export const diaryParseSchema = z.object({
  kind: z.literal("DIARY_HARD"),
  className: z.string().default(""),
  date: isoDate,
  lessons: z
    .array(
      z.object({
        subjectLabel: z.string(),
        subject: z.enum(SUBJECTS).nullable().default(null),
        lessonRefText: z.string(),
        lessonUnitCode: z.string().nullable().default(null),
        pages: z.array(z.number().int()).default([]),
        skillCodes: z.array(skillCode).default([]),
      }),
    )
    .default([]),
  homeworks: z
    .array(
      z.object({
        text: z.string(),
        subject: z.enum(SUBJECTS).nullable().default(null),
        taskType: z
          .enum([
            "READ_ALOUD",
            "WRITE",
            "WORKSHEET",
            "VIDEO_SUBMIT",
            "ONLINE_APP",
            "BRING_ITEM",
            "OTHER",
          ])
          .default("OTHER"),
        repeatCount: z.number().int().nullable().default(null),
        pages: z.array(z.number().int()).default([]),
        skillCodes: z.array(skillCode).default([]),
        optional: z.boolean().default(false),
      }),
    )
    .default([]),
  reminders: z
    .array(
      z.object({
        kind: z.enum(["UNIFORM", "BRING", "EVENT", "SCHEDULE", "OTHER"]).default("OTHER"),
        text: z.string(),
        forDate: isoDate.nullable().default(null),
      }),
    )
    .default([]),
  confidence: z.number().min(0).max(1).default(0.5),
});
export type DiaryParse = z.infer<typeof diaryParseSchema>;

export const weeklyReportSchema = z.object({
  kind: z.literal("WEEKLY_REPORT"),
  periodStart: isoDate,
  periodEnd: isoDate,
  /** The report a parent reads, in Vietnamese. */
  contentMd: z.string().trim().min(20),
  highlights: z.array(z.string().trim().min(3)).default([]),
  /** "3 dieu can chu y" (docs/04 §11.5): what, how often, what to do for five minutes tonight. */
  attentionPoints: z
    .array(
      z.object({
        title: z.string(),
        errorCode: errorCode.nullable().default(null),
        skillCode: skillCode.nullable().default(null),
        count: z.number().int().min(0).default(0),
        suggestion: z.string(),
      }),
    )
    .default([]),
});
export type WeeklyReport = z.infer<typeof weeklyReportSchema>;

/** Focus left for the planner (docs/13 §3). Optional, written next to any result. */
export const planHintSchema = z.object({
  studentNickname: z.string(),
  validDays: z.number().int().min(1).max(14).default(3),
  focusSkills: z.array(z.object({ code: skillCode, weight: z.number().min(0).max(1) })).default([]),
  focusErrors: z.array(errorCode).default([]),
  avoidSkills: z.array(skillCode).default([]),
  /** Why — the parent reads this. */
  note: z.string().trim().min(3),
});
export type PlanHint = z.infer<typeof planHintSchema>;

/** Any result.json. The `kind` discriminates, and it must match the item it answers. */
export const inboxResultSchema = z.discriminatedUnion("kind", [
  intakeExtractionSchema,
  gradeResultSchema.extend({ kind: z.literal("WRITE_PHOTO_GRADE") }),
  gradeResultSchema.extend({ kind: z.literal("SPEAK_GRADE") }),
  diaryParseSchema,
  weeklyReportSchema,
]);
export type InboxResult = z.infer<typeof inboxResultSchema>;

export function parseInboxResult(json: unknown): InboxResult {
  const result = inboxResultSchema.safeParse(json);
  if (!result.success) throw new Error(z.prettifyError(result.error));
  return result.data;
}

export function parseInboxContext(json: unknown): InboxContext {
  const result = inboxContextSchema.safeParse(json);
  if (!result.success) throw new Error(z.prettifyError(result.error));
  return result.data;
}

export function parsePlanHint(json: unknown): PlanHint {
  const result = planHintSchema.safeParse(json);
  if (!result.success) throw new Error(z.prettifyError(result.error));
  return result.data;
}

/** One sentence telling the reader what this item needs — written into context.json. */
export const EXPECTS: Record<InboxKind, string> = {
  PHOTO_INTAKE:
    "Đọc ảnh bài vở, viết result.json theo IntakeExtraction: từng câu, con trả lời gì, đúng/chưa đúng/bỏ trống, mã lỗi và mã kỹ năng lấy từ skillCandidates.",
  DIARY_HARD:
    "Đọc phần dặn dò của nhật ký lớp, viết result.json theo DiaryParse: bài đã học, bài cô giao, lời nhắc.",
  WRITE_PHOTO_GRADE:
    "Chấm ảnh bài viết tay, viết result.json theo GradeResult: điểm 0-1, mã lỗi, một câu khen/động viên cho bé (không dùng chữ 'sai').",
  SPEAK_GRADE:
    "Chấm bài đọc to/nói, viết result.json theo GradeResult: từng tiếng đọc đúng chưa, mã lỗi, một câu động viên cho bé.",
  WEEKLY_REPORT:
    "Đọc số liệu tuần, viết result.json theo WeeklyReport: báo cáo tiếng Việt cho ba mẹ và 3 điều cần chú ý.",
};
