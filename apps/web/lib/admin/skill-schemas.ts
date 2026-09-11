import { z } from "zod";
import { skillCodeSchema, subjectSchema } from "@/lib/mastery/schemas";

/** PATCH /api/admin/skills/:code — FR-CORE-03: edit name/description/prerequisites, hide. */
export const patchSkillSchema = z
  .object({
    nameVi: z.string().trim().min(2).max(160).optional(),
    nameEn: z.string().trim().min(2).max(160).optional(),
    description: z.string().trim().min(20).max(2000).optional(),
    expectedWeek: z.number().int().min(1).max(35).nullable().optional(),
    prerequisites: z.array(skillCodeSchema).max(20).optional(),
    /** false = hidden/retired. A skill with evidence is never deleted (FR-CORE-03 AC). */
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Không có gì để cập nhật");

export const importSkillsSchema = z.object({
  /** "json" = one skill-map file, "csv" = header row + one skill per line. */
  format: z.enum(["json", "csv"]),
  /** Raw file text as pasted or uploaded. */
  text: z.string().min(2).max(4_000_000),
  /** Subject for CSV files that have no subject column. */
  subject: subjectSchema.optional(),
  dryRun: z.boolean().default(true),
});

export type ImportSkillsInput = z.infer<typeof importSkillsSchema>;

const CSV_REQUIRED = ["code", "strand", "nameVi", "nameEn", "description"] as const;

/** Splits one CSV line, honouring "quoted, fields" and "" escapes. */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      out.push(field);
      field = "";
    } else field += ch;
  }
  out.push(field);
  return out.map((f) => f.trim());
}

export interface CsvSkillMapResult {
  subject: string;
  skills: Record<string, unknown>[];
}

/**
 * CSV → the same shape as a content/skill-map/*.json file, so the phase-1 validator checks both
 * formats. Columns: code, strand, nameVi, nameEn, description (required) and optionally subject,
 * standardRef, gradeLevel, order, expectedWeek, lessonRef, prerequisites, relatedSkillCodes,
 * confusableWith, exerciseTypes, difficultyMin, difficultyMax. List columns are space or
 * semicolon separated.
 */
export function csvToSkillMap(text: string, fallbackSubject?: string): CsvSkillMapResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) throw new Error("CSV cần dòng tiêu đề và ít nhất một dòng kỹ năng");
  const header = splitCsvLine(lines[0]!);
  for (const col of CSV_REQUIRED) {
    if (!header.includes(col)) throw new Error(`CSV thiếu cột "${col}"`);
  }
  const list = (v: string | undefined) =>
    (v ?? "")
      .split(/[;\s]+/)
      .map((x) => x.trim())
      .filter((x) => x.length > 0);

  const skills: Record<string, unknown>[] = [];
  let subject = fallbackSubject ?? "";
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]!);
    const get = (name: string) => {
      const idx = header.indexOf(name);
      return idx >= 0 ? cells[idx] : undefined;
    };
    const code = get("code") ?? "";
    const rowSubject = get("subject") || fallbackSubject || code.split(".")[0] || "";
    if (!subject) subject = rowSubject;
    if (rowSubject !== subject) {
      throw new Error(`CSV chứa nhiều môn (${subject} và ${rowSubject}) — nạp từng môn một`);
    }
    const week = get("expectedWeek");
    const dMin = get("difficultyMin");
    const dMax = get("difficultyMax");
    const lessonRef = list(get("lessonRef"));
    skills.push({
      code,
      strand: get("strand"),
      nameVi: get("nameVi"),
      nameEn: get("nameEn"),
      description: get("description"),
      ...(get("standardRef") ? { standardRef: get("standardRef") } : {}),
      gradeLevel: get("gradeLevel") || "1",
      ...(get("order") ? { order: Number(get("order")) } : {}),
      expectedWeek: week ? Number(week) : null,
      ...(lessonRef.length ? { lessonRef } : {}),
      prerequisites: list(get("prerequisites")),
      relatedSkillCodes: list(get("relatedSkillCodes")),
      confusableWith: list(get("confusableWith")),
      exerciseTypes: list(get("exerciseTypes")).length ? list(get("exerciseTypes")) : ["MCQ"],
      difficultyRange: [dMin ? Number(dMin) : 1, dMax ? Number(dMax) : 5],
    });
  }
  return { subject, skills };
}
