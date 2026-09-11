import { z } from "zod";
import { MAX_WEEK } from "./skill-map";
import { SUBJECTS } from "./timetable";

/**
 * Lesson file — content/lessons/<subject>/<code>.json (docs/10 sec. 4.1).
 *
 * One file per textbook lesson: what the book teaches, in the book's own words, with the pages it
 * came from. The skeleton units of phase 1 (`*.units.json`) say a lesson *exists*; this file fills
 * it in. Both feed the same `LessonUnit` row, matched by `code`.
 */
const unitCode = z.string().regex(/^[A-Z0-9-]+$/, "code must look like KNTT-T1-B10");
const skillCode = z
  .string()
  .regex(/^[A-Z]+\.[A-Z]+\.[A-Z0-9_]+$/, "code must look like MON.MACH.TEN");

export const lessonBookSchema = z.object({
  name: z.string().trim().min(2),
  /** File name inside "sach giao khoa/" (not committed to git). */
  file: z.string().trim().min(3),
  /** Student-book page numbers, not PDF pages (PDF page = book page + 1, docs/09 sec. 1). */
  pageFrom: z.number().int().min(1),
  pageTo: z.number().int().min(1).optional(),
});

export const sampleTaskSchema = z.object({
  text: z.string().trim().min(3),
  answer: z.string().trim().optional(),
  /** How the book presents it: "tranh", "so", "cau hoi"... */
  type: z.string().trim().optional(),
});

export const lessonFileSchema = z
  .object({
    $schema: z.string().optional(),
    code: unitCode,
    subject: z.enum(SUBJECTS),
    title: z.string().trim().min(3),
    book: lessonBookSchema,
    periods: z.number().int().min(1).optional(),
    weekFrom: z.number().int().min(1).max(MAX_WEEK).optional(),
    weekTo: z.number().int().min(1).max(MAX_WEEK).optional(),
    objectives: z.array(z.string().trim().min(5)).default([]),
    vocabulary: z.array(z.string().trim().min(1)).default([]),
    concepts: z.array(z.string().trim().min(2)).default([]),
    sampleTasks: z.array(sampleTaskSchema).default([]),
    /** Answers printed in the book, used when writing exercises and when grading. */
    answerKeyNotes: z.string().trim().optional(),
    contentText: z.string().trim().optional(),
    skills: z
      .array(z.object({ code: skillCode, weight: z.number().min(0).max(1).default(1) }))
      .min(1),
    source: z
      .object({
        extractedBy: z.string().trim().default("claude-code"),
        at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        /** true only when a human (or Claude Code reading the scan) checked it against the book. */
        verified: z.boolean().default(false),
      })
      .optional(),
  })
  .refine((l) => l.weekTo == null || l.weekFrom == null || l.weekTo >= l.weekFrom, {
    message: "weekTo < weekFrom",
  })
  .refine((l) => l.book.pageTo == null || l.book.pageTo >= l.book.pageFrom, {
    message: "book.pageTo < book.pageFrom",
  });

export type LessonFile = z.infer<typeof lessonFileSchema>;

export function parseLesson(json: unknown): LessonFile {
  const result = lessonFileSchema.safeParse(json);
  if (!result.success) throw new Error(`Invalid lesson: ${z.prettifyError(result.error)}`);
  return result.data;
}
