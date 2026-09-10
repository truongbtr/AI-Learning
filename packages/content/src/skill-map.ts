import { z } from "zod";
import { SUBJECTS } from "./timetable";

/** The 9 exercise types of docs/04 sec. 5. */
export const EXERCISE_TYPES = [
  "MCQ",
  "LISTEN_CHOOSE",
  "DRAG_DROP",
  "READ_ALOUD",
  "COUNT_TAP",
  "WRITE_PHOTO",
  "SPEAK_ANSWER",
  "TRACE",
  "MINI_STORY",
] as const;

export const GRADE_LEVELS = ["K", "1", "2"] as const;

/** Strand codes per subject (docs/05 sec. 1). */
export const STRANDS: Record<(typeof SUBJECTS)[number], readonly string[]> = {
  ESL: ["VOC", "PH", "LIS", "SPK", "GR"],
  ENL: ["RF", "RL", "RI", "W", "SL", "L"],
  EMATH: ["OA", "NBT", "MD", "G", "MP"],
  ESCI: ["PS", "LS", "ES", "INQ", "VOC"],
  VIET: ["HV", "DOC", "VIET", "NN", "TV"],
  VMATH: ["SO", "HH", "DL", "GT"],
};

export const MAX_WEEK = 35;
export const MIN_SKILLS_PER_SUBJECT = 35;
export const MIN_SKILLS_TOTAL = 250;

const skillCode = z
  .string()
  .regex(/^[A-Z]+\.[A-Z]+\.[A-Z0-9_]+$/, "code must look like MON.MACH.TEN");
const lessonCode = z.string().regex(/^[A-Z0-9-]+$/, "lessonRef must be a LessonUnit code");

export const skillDefSchema = z.object({
  code: skillCode,
  strand: z.string().min(1),
  nameVi: z.string().trim().min(2),
  nameEn: z.string().trim().min(2),
  description: z.string().trim().min(20),
  standardRef: z.string().trim().min(1).nullable().optional(),
  gradeLevel: z.enum(GRADE_LEVELS).default("1"),
  order: z.number().int().min(0).optional(),
  expectedWeek: z.number().int().min(1).max(MAX_WEEK).nullable().optional(),
  /** LessonUnit code(s) this skill is taught in (docs/09). */
  lessonRef: z.union([lessonCode, z.array(lessonCode)]).optional(),
  prerequisites: z.array(skillCode).default([]),
  relatedSkillCodes: z.array(skillCode).default([]),
  /** Skills a 6-year-old mixes up with this one (b/d, s/x, have/has ...). */
  confusableWith: z.array(skillCode).default([]),
  exerciseTypes: z.array(z.enum(EXERCISE_TYPES)).min(1),
  difficultyRange: z
    .tuple([z.number().int().min(1).max(5), z.number().int().min(1).max(5)])
    .default([1, 5]),
});

export const skillMapFileSchema = z.object({
  $schema: z.string().optional(),
  subject: z.enum(SUBJECTS),
  /** Vietnamese label per strand code, for the admin tree. */
  strands: z.record(z.string(), z.string()),
  source: z.string().optional(),
  skills: z.array(skillDefSchema).min(1),
});

export type SkillDef = z.infer<typeof skillDefSchema>;
export type SkillMapFile = z.infer<typeof skillMapFileSchema>;

export function parseSkillMap(json: unknown): SkillMapFile {
  const result = skillMapFileSchema.safeParse(json);
  if (!result.success) throw new Error(`Invalid skill map: ${z.prettifyError(result.error)}`);
  return result.data;
}

export function lessonRefsOf(skill: Pick<SkillDef, "lessonRef">): string[] {
  if (!skill.lessonRef) return [];
  return Array.isArray(skill.lessonRef) ? skill.lessonRef : [skill.lessonRef];
}

export interface ValidationIssue {
  level: "error" | "warn";
  file: string;
  code?: string;
  message: string;
}

export interface SkillMapValidation {
  issues: ValidationIssue[];
  errors: ValidationIssue[];
  bySubject: Record<string, number>;
  total: number;
}

/** Strands whose skills are read aloud (docs/05 sec. 6: READ_ALOUD is mandatory). */
const READ_ALOUD_STRANDS = new Set(["VIET.HV", "VIET.DOC", "ESL.PH", "ENL.RF"]);
/** Strands that are writing skills (docs/05 sec. 6: WRITE_PHOTO or TRACE). */
const WRITING_STRANDS = new Set(["VIET.VIET", "ENL.W"]);

/**
 * Cross-file checks (docs/05 sec. 6, docs/08 phase 1 item 1): unique codes, code prefix matches
 * subject/strand, prerequisites/related/confusable exist, no prerequisite cycles, >= 35 per
 * subject, lessonRef points to a known LessonUnit, expectedWeek in 1..35, description has
 * "Vi du:" and "Loi thuong gap:", exercise types fit the strand.
 */
export function validateSkillMaps(
  files: { name: string; map: SkillMapFile }[],
  knownLessonCodes: ReadonlySet<string> | null,
): SkillMapValidation {
  const issues: ValidationIssue[] = [];
  const err = (file: string, message: string, code?: string) =>
    issues.push({ level: "error", file, message, code });
  const warn = (file: string, message: string, code?: string) =>
    issues.push({ level: "warn", file, message, code });

  const all = new Map<string, { file: string; skill: SkillDef; subject: string }>();
  const bySubject: Record<string, number> = {};

  for (const { name, map } of files) {
    const strandCodes = new Set(Object.keys(map.strands));
    const allowedStrands = STRANDS[map.subject];
    for (const s of strandCodes) {
      if (!allowedStrands.includes(s))
        err(name, `strand "${s}" is not one of ${allowedStrands.join(", ")} for ${map.subject}`);
    }
    for (const skill of map.skills) {
      const [subj, strand] = skill.code.split(".");
      if (subj !== map.subject) err(name, `code subject "${subj}" != file subject`, skill.code);
      if (strand !== skill.strand)
        err(name, `code strand "${strand}" != strand "${skill.strand}"`, skill.code);
      if (!strandCodes.has(skill.strand))
        err(name, `strand "${skill.strand}" missing in strands map`, skill.code);
      if (all.has(skill.code))
        err(name, `duplicate code (also in ${all.get(skill.code)?.file})`, skill.code);
      if (!all.has(skill.code)) all.set(skill.code, { file: name, skill, subject: map.subject });
      bySubject[map.subject] = (bySubject[map.subject] ?? 0) + 1;

      if (!/Ví dụ\s*:/u.test(skill.description))
        err(name, 'description must contain "Ví dụ:"', skill.code);
      if (!/Lỗi thường gặp\s*:/u.test(skill.description))
        err(name, 'description must contain "Lỗi thường gặp:"', skill.code);
      const [lo, hi] = skill.difficultyRange;
      if (lo > hi) err(name, "difficultyRange min > max", skill.code);

      const key = `${map.subject}.${skill.strand}`;
      if (READ_ALOUD_STRANDS.has(key) && !skill.exerciseTypes.includes("READ_ALOUD"))
        err(name, `${key} skills must include READ_ALOUD`, skill.code);
      if (
        WRITING_STRANDS.has(key) &&
        !skill.exerciseTypes.some((t) => t === "WRITE_PHOTO" || t === "TRACE")
      )
        err(name, `${key} skills must include WRITE_PHOTO or TRACE`, skill.code);

      if (skill.prerequisites.includes(skill.code))
        err(name, "skill lists itself as prerequisite", skill.code);
      if (skill.expectedWeek != null && (skill.expectedWeek < 1 || skill.expectedWeek > MAX_WEEK))
        err(name, `expectedWeek ${skill.expectedWeek} outside 1..${MAX_WEEK}`, skill.code);
    }
  }

  // references
  for (const { file, skill } of all.values()) {
    for (const p of skill.prerequisites)
      if (!all.has(p)) err(file, `prerequisite "${p}" does not exist`, skill.code);
    for (const r of skill.relatedSkillCodes)
      if (!all.has(r)) err(file, `relatedSkillCode "${r}" does not exist`, skill.code);
    for (const c of skill.confusableWith)
      if (!all.has(c)) err(file, `confusableWith "${c}" does not exist`, skill.code);
    if (knownLessonCodes) {
      for (const ref of lessonRefsOf(skill))
        if (!knownLessonCodes.has(ref))
          err(file, `lessonRef "${ref}" is not a known LessonUnit`, skill.code);
    }
  }

  // cycles (DFS over prerequisite edges)
  const color = new Map<string, 0 | 1 | 2>();
  const stack: string[] = [];
  const visit = (code: string): void => {
    const c = color.get(code) ?? 0;
    if (c === 1) {
      const cycle = [...stack.slice(stack.indexOf(code)), code].join(" -> ");
      err(all.get(code)?.file ?? "?", `prerequisite cycle: ${cycle}`, code);
      return;
    }
    if (c === 2) return;
    color.set(code, 1);
    stack.push(code);
    for (const p of all.get(code)?.skill.prerequisites ?? []) if (all.has(p)) visit(p);
    stack.pop();
    color.set(code, 2);
  };
  for (const code of all.keys()) visit(code);

  // counts
  for (const { name, map } of files) {
    const n = bySubject[map.subject] ?? 0;
    if (n < MIN_SKILLS_PER_SUBJECT)
      err(name, `${map.subject} has ${n} skills, need >= ${MIN_SKILLS_PER_SUBJECT}`);
  }
  const total = all.size;
  if (total < MIN_SKILLS_TOTAL)
    warn("(all)", `total ${total} skills, target >= ${MIN_SKILLS_TOTAL}`);

  return { issues, errors: issues.filter((i) => i.level === "error"), bySubject, total };
}

/** Topological order (prerequisites first) — used by the seed and the admin tree. */
export function topoOrder(skills: SkillDef[]): SkillDef[] {
  const byCode = new Map(skills.map((s) => [s.code, s]));
  const out: SkillDef[] = [];
  const done = new Set<string>();
  const visit = (s: SkillDef) => {
    if (done.has(s.code)) return;
    done.add(s.code);
    for (const p of s.prerequisites) {
      const dep = byCode.get(p);
      if (dep) visit(dep);
    }
    out.push(s);
  };
  for (const s of skills) visit(s);
  return out;
}
