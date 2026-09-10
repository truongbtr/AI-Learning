import { z } from "zod";
import { SUBJECTS } from "./timetable";

/**
 * Standard error codes (docs/04 sec. 11.1). Every `errorCode` / `targetsError` / `choices[].errorTag`
 * in the system must be one of these; the evidence API rejects unknown codes (400).
 */
export const ERROR_SUBJECTS = [...SUBJECTS, "ALL"] as const;
export const ERROR_GROUPS = [
  "viet_am_chu",
  "viet_dau_thanh",
  "viet_doc",
  "viet_viet",
  "toan_dem_so",
  "toan_phep_tinh",
  "toan_so_sanh",
  "anh_ngu_phap",
  "anh_am_chu",
  "chung_hanh_vi",
] as const;

const errorCode = z.string().regex(/^[a-z][a-z0-9_]{2,40}$/, "error codes are snake_case");
const skillCode = z.string().regex(/^[A-Z]+\.[A-Z]+\.[A-Z0-9_]+$/);

export const errorCodeDefSchema = z.object({
  code: errorCode,
  subject: z.enum(ERROR_SUBJECTS),
  group: z.enum(ERROR_GROUPS),
  nameVi: z.string().trim().min(2),
  /** What the child does */
  description: z.string().trim().min(10),
  /** How the system detects it (distractor tag, STT, photo review ...) */
  detection: z.string().trim().min(5),
  /** Kind of remediation exercise (docs/04 sec. 11.4) */
  remediation: z.string().trim().min(5),
  remediationSkills: z.array(skillCode).default([]),
  /** Related textbook lessons (LessonUnit codes) */
  lessonRefs: z.array(z.string()).default([]),
  /** Behavioural codes are not knowledge errors and do not open a remediation track */
  behavioural: z.boolean().default(false),
});

export const errorTaxonomyFileSchema = z.object({
  $schema: z.string().optional(),
  source: z.string().optional(),
  codes: z.array(errorCodeDefSchema).min(1),
});

export type ErrorCodeDef = z.infer<typeof errorCodeDefSchema>;
export type ErrorTaxonomyFile = z.infer<typeof errorTaxonomyFileSchema>;

export function parseErrorTaxonomy(json: unknown): ErrorTaxonomyFile {
  const result = errorTaxonomyFileSchema.safeParse(json);
  if (!result.success) throw new Error(`Invalid error taxonomy: ${z.prettifyError(result.error)}`);
  return result.data;
}

export const MIN_ERROR_CODES = 35;

export function validateErrorTaxonomy(
  file: ErrorTaxonomyFile,
  knownSkillCodes: ReadonlySet<string> | null,
): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  for (const c of file.codes) {
    if (seen.has(c.code)) issues.push(`${c.code}: duplicate code`);
    seen.add(c.code);
    if (knownSkillCodes)
      for (const s of c.remediationSkills)
        if (!knownSkillCodes.has(s))
          issues.push(`${c.code}: remediationSkill "${s}" does not exist`);
    if (!c.behavioural && c.remediationSkills.length === 0)
      issues.push(`${c.code}: knowledge errors need at least one remediationSkill`);
  }
  if (file.codes.length < MIN_ERROR_CODES)
    issues.push(`only ${file.codes.length} codes, need >= ${MIN_ERROR_CODES}`);
  return issues;
}
