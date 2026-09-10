import { z } from "zod";
import { MAX_WEEK } from "./skill-map";
import { SUBJECTS } from "./timetable";

/**
 * Skeleton lesson units per textbook (docs/09 sec. 5 phase 1, docs/03 sec. 4 item 5b):
 * one `*.units.json` file per Material lists every unit with code, title, pages, weeks and skills.
 * Phase 2 fills objectives/vocabulary/contentText from the per-lesson files of docs/10 sec. 4.1.
 */
export const MATERIAL_KINDS = [
  "TEXTBOOK",
  "CURRICULUM",
  "WORKSHEET",
  "WEEKLY_NOTICE",
  "OTHER",
] as const;
export const UNIT_KINDS = ["LESSON", "REVIEW", "ASSESSMENT", "INTRO"] as const;

const unitCode = z.string().regex(/^[A-Z0-9-]+$/);
const skillCode = z.string().regex(/^[A-Z]+\.[A-Z]+\.[A-Z0-9_]+$/);

export const lessonUnitDefSchema = z
  .object({
    code: unitCode,
    title: z.string().trim().min(2),
    kind: z.enum(UNIT_KINDS).default("LESSON"),
    /** Textbook page numbers (student book), not PDF pages. */
    pageFrom: z.number().int().min(1).nullable().optional(),
    pageTo: z.number().int().min(1).nullable().optional(),
    periods: z.number().int().min(1).optional(),
    weekFrom: z.number().int().min(1).max(MAX_WEEK).nullable().optional(),
    weekTo: z.number().int().min(1).max(MAX_WEEK).nullable().optional(),
    /** Topic/chapter label (chu de) for grouping in the UI. */
    topic: z.string().trim().optional(),
    skills: z
      .array(z.object({ code: skillCode, weight: z.number().min(0).max(1).default(1) }))
      .default([]),
    note: z.string().optional(),
  })
  .refine((u) => u.pageTo == null || u.pageFrom == null || u.pageTo >= u.pageFrom, {
    message: "pageTo < pageFrom",
  })
  .refine((u) => u.weekTo == null || u.weekFrom == null || u.weekTo >= u.weekFrom, {
    message: "weekTo < weekFrom",
  });

export const lessonUnitsFileSchema = z.object({
  $schema: z.string().optional(),
  material: z.object({
    title: z.string().trim().min(2),
    subject: z.enum(SUBJECTS),
    kind: z.enum(MATERIAL_KINDS).default("TEXTBOOK"),
    term: z.number().int().min(1).max(2).nullable().optional(),
    /** File name inside "sach giao khoa/" (not committed). */
    file: z.string().optional(),
    pageCount: z.number().int().min(1).optional(),
    publisher: z.string().optional(),
  }),
  source: z.string().optional(),
  units: z.array(lessonUnitDefSchema).min(1),
});

export type LessonUnitDef = z.infer<typeof lessonUnitDefSchema>;
export type LessonUnitsFile = z.infer<typeof lessonUnitsFileSchema>;

export function parseLessonUnits(json: unknown): LessonUnitsFile {
  const result = lessonUnitsFileSchema.safeParse(json);
  if (!result.success) throw new Error(`Invalid lesson units: ${z.prettifyError(result.error)}`);
  return result.data;
}

export interface UnitIssue {
  file: string;
  code?: string;
  message: string;
}

/** Unique codes across files; every referenced skill exists (when a skill set is given). */
export function validateLessonUnits(
  files: { name: string; units: LessonUnitsFile }[],
  knownSkillCodes: ReadonlySet<string> | null,
): UnitIssue[] {
  const issues: UnitIssue[] = [];
  const seen = new Map<string, string>();
  for (const { name, units } of files) {
    for (const u of units.units) {
      if (seen.has(u.code))
        issues.push({
          file: name,
          code: u.code,
          message: `duplicate unit code (also in ${seen.get(u.code)})`,
        });
      seen.set(u.code, name);
      if (knownSkillCodes)
        for (const s of u.skills)
          if (!knownSkillCodes.has(s.code))
            issues.push({ file: name, code: u.code, message: `skill "${s.code}" does not exist` });
    }
  }
  return issues;
}
