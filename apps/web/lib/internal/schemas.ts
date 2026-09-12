import { z } from "zod";

/**
 * The shape of what Claude chat sends (docs/13 §7.1).
 *
 * It is the `IntakeExtraction` of `packages/inbox/src/schemas.ts` — the same contract the queue uses,
 * because the same page read through the phone and read through `inbox:pull` has to mean the same
 * thing. Restated in Zod here so the route can answer a missing field with the exact path, which is
 * the half of "báo rõ chỗ sai" that belongs to the shape rather than to the codes.
 */

const SUBJECTS = ["ESL", "ENL", "EMATH", "ESCI", "VIET", "VMATH"] as const;
const DOC_TYPES = [
  "WORKBOOK",
  "TEST",
  "WORKSHEET",
  "TEACHER_NOTE",
  "CLASS_DIARY",
  "NAVIO_REPORT",
  "KIDSAZ_REPORT",
  "OTHER",
] as const;
const OUTCOMES = ["CORRECT", "PARTIAL", "INCORRECT", "BLANK", "UNGRADED"] as const;

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ngày phải là YYYY-MM-DD");

/** `thy` | `thanh` — the home name. Never a full name, never a birth date (NFR-06). */
export const studentKey = z
  .string()
  .trim()
  .min(2)
  .max(20)
  .regex(/^[\p{L}\p{N}_-]+$/u, "chỉ dùng tên gọi ở nhà, ví dụ thy hoặc thanh");

export const chatIntakeItemSchema = z.object({
  index: z.number().int().min(0),
  questionText: z.string().max(600).default(""),
  studentAnswer: z.string().max(600).nullish(),
  expectedAnswer: z.string().max(600).nullish(),
  outcome: z.enum(OUTCOMES).default("UNGRADED"),
  /** Leave it out and the server works it out from where the blanks fall (docs/07 §2.2). */
  blankReason: z.enum(["NOT_FINISHED", "DOES_NOT_KNOW"]).nullish(),
  errorCode: z.string().max(48).nullish(),
  skillCodes: z.array(z.string().max(64)).max(4).default([]),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).nullish(),
  fileIndex: z.number().int().min(0).default(0),
  /** "I could not tell — let a grown-up look" (docs/13 §7.3). Held, never dropped. */
  needsParent: z.boolean().default(false),
});

export const chatIntakeSchema = z.object({
  kind: z.literal("PHOTO_INTAKE"),
  /** Which child, by home name. */
  student: studentKey,
  /** The school day of the work; defaults to today in Vietnam. */
  date: isoDate.nullish(),
  /** From `GET /api/internal/context` — without it the batch is held (docs/13 §7.4). */
  contextId: z.string().max(40).nullish(),
  /** `photoId`s from `POST /api/internal/intake/photo`, in the order they were taken. */
  photoIds: z.array(z.string().max(40)).max(12).default([]),
  docType: z.enum(DOC_TYPES).default("OTHER"),
  subject: z.enum(SUBJECTS).nullish(),
  detectedStudent: z.string().max(60).nullish(),
  summary: z.string().max(600).default(""),
  teacherComment: z.string().max(1200).nullish(),
  confidence: z.number().min(0).max(1).default(0.5),
  items: z.array(chatIntakeItemSchema).max(80).default([]),
  /** The same request over the whole page. */
  needsParent: z.boolean().default(false),
  externals: z
    .array(
      z.object({
        platform: z.enum(["NAVIO", "KIDSAZ"]),
        metric: z.string().min(2).max(40),
        value: z.string().min(1).max(40),
        valueNum: z.number().nullish(),
      }),
    )
    .max(12)
    .default([]),
});
export type ChatIntakeBody = z.infer<typeof chatIntakeSchema>;

export const chatDiarySchema = z.object({
  className: z.string().trim().min(1).max(20).default("1B3"),
  date: isoDate.nullish(),
  /** The Edi Parent post, pasted whole. */
  text: z.string().trim().min(10).max(8000),
});
export type ChatDiaryBody = z.infer<typeof chatDiarySchema>;

export const chatPhotoFieldsSchema = z.object({
  student: studentKey.nullish(),
  date: isoDate.nullish(),
});
