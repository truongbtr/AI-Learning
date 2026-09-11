import type { ExerciseDef, ExercisePack, Phase3Type } from "./exercise";
import { PHASE3_TYPES } from "./exercise";
import type { SkillDef } from "./skill-map";

/**
 * Cross-file checks for the exercise bank (docs/10 sec. 6 rubric + docs/08 pha 2 "tieu chi xong").
 * The Zod schema in exercise.ts checks one exercise at a time; this checks a pack as a whole and
 * the pack against the skill map, the lesson units and the error taxonomy.
 */
export const MIN_EXERCISES_PER_SKILL = 35;
export const TARGET_EXERCISES_PER_SKILL = 40;
export const MIN_MODEL_SCAFFOLDS = 6;
export const MIN_TARGETED_ERROR = 6;
export const MIN_PHASE3_TYPES_PER_SKILL = 4;

/** Subjects where a wrong multiple-choice option MUST carry a diagnosis (docs/04 sec. 11.2). */
const DIAGNOSTIC_SUBJECTS = new Set(["VMATH", "EMATH"]);
const DIAGNOSTIC_STRANDS = new Set(["HV"]);

export interface PackIssue {
  file: string;
  id?: string;
  level: "error" | "warn";
  message: string;
}

export interface ValidationContext {
  skills: Map<string, SkillDef & { subject: string }>;
  lessonCodes: ReadonlySet<string>;
  errorCodes: ReadonlySet<string>;
  /** Labels in content/art/objects/manifest.json; null when the manifest does not exist yet. */
  assetLabels: ReadonlySet<string> | null;
}

/**
 * What the child actually sees and does, normalised — two exercises that produce the same string
 * are the same question even if a word of the instruction differs (rubric 8).
 */
function normalisePrompt(ex: ExerciseDef): string {
  const parts = [ex.type, ex.prompt.text.trim().toLowerCase().replace(/\s+/g, " ")];
  if (ex.prompt.image) parts.push(`img:${ex.prompt.image.value}`);
  if (ex.choices)
    parts.push(ex.choices.map((c) => `${c.text ?? c.image?.value ?? c.audio ?? ""}`).join(","));
  if (ex.readTarget) parts.push(`read:${ex.readTarget.text}`);
  // What the child hears is part of the question even though it is never printed.
  if (ex.listenTarget) parts.push(`hear:${ex.listenTarget.text}`);
  if (ex.countTarget)
    parts.push(`count:${ex.countTarget.objects.value}x${ex.countTarget.correctCount}`);
  if (ex.dragItems)
    parts.push(`drag:${ex.dragItems.map((d) => d.text ?? d.image?.value).join(",")}`);
  if (ex.dropZones) parts.push(`zones:${ex.dropZones.map((z) => z.label ?? z.id).join(",")}`);
  if (ex.traceTarget) parts.push(`trace:${ex.traceTarget.glyph}`);
  if (ex.rubric) parts.push(`rubric:${ex.rubric.sampleAnswers.join("|")}`);
  return parts.join("|");
}

function needsDiagnosis(pack: ExercisePack, skill: SkillDef | undefined): boolean {
  if (DIAGNOSTIC_SUBJECTS.has(pack.subject)) return true;
  return skill != null && DIAGNOSTIC_STRANDS.has(skill.strand);
}

/** Checks one pack. `file` is only used to label the issues. */
export function validatePack(
  pack: ExercisePack,
  file: string,
  ctx: ValidationContext,
): PackIssue[] {
  const issues: PackIssue[] = [];
  const err = (message: string, id?: string) => issues.push({ file, id, level: "error", message });
  const warn = (message: string, id?: string) => issues.push({ file, id, level: "warn", message });

  const skill = ctx.skills.get(pack.skillCode);
  if (!skill) {
    err(`skill "${pack.skillCode}" does not exist in content/skill-map/`);
    return issues;
  }
  if (skill.subject !== pack.subject)
    err(`pack subject ${pack.subject} but skill ${pack.skillCode} is ${skill.subject}`);
  for (const ref of pack.lessonRefs)
    if (!ctx.lessonCodes.has(ref)) err(`lessonRef "${ref}" is not a known LessonUnit`);

  const declaredTypes = new Set<string>(skill.exerciseTypes);
  const seenPrompts = new Map<string, string>();
  const typeCount = new Map<string, number>();
  const difficulties = new Set<number>();
  let models = 0;
  let targeted = 0;

  for (const ex of pack.exercises) {
    if (ex.skillCodes[0] !== pack.skillCode)
      err(`skillCodes[0] must be the pack skill (${pack.skillCode})`, ex.id);
    for (const code of ex.skillCodes)
      if (!ctx.skills.has(code)) err(`skill "${code}" does not exist`, ex.id);

    if (!declaredTypes.has(ex.type))
      err(
        `type ${ex.type} is not declared in the skill map for ${pack.skillCode} (${[...declaredTypes].join("/")})`,
        ex.id,
      );
    if (ex.difficulty < skill.difficultyRange[0] || ex.difficulty > skill.difficultyRange[1])
      warn(
        `difficulty ${ex.difficulty} is outside the skill range ${skill.difficultyRange.join("-")}`,
        ex.id,
      );

    if (ex.meta.lessonUnitCode && !ctx.lessonCodes.has(ex.meta.lessonUnitCode))
      err(`meta.lessonUnitCode "${ex.meta.lessonUnitCode}" is not a known LessonUnit`, ex.id);

    if (ex.targetsError && !ctx.errorCodes.has(ex.targetsError))
      err(`targetsError "${ex.targetsError}" is not in content/error-taxonomy.json`, ex.id);
    for (const c of ex.choices ?? [])
      if (c.errorTag && !ctx.errorCodes.has(c.errorTag))
        err(`choice ${c.id} errorTag "${c.errorTag}" is not in the taxonomy`, ex.id);

    // Rubric 11: the distractors of a maths / phonics question must be diagnostic.
    if ((ex.type === "MCQ" || ex.type === "LISTEN_CHOOSE") && needsDiagnosis(pack, skill)) {
      const tagged = (ex.choices ?? []).filter((c) => c.id !== ex.answerKey && c.errorTag);
      if (tagged.length === 0)
        err("at least one wrong choice must carry an errorTag (docs/04 §11.2)", ex.id);
    }

    // Rubric 10: every asset image must exist in the object library.
    if (ctx.assetLabels) {
      const refs = [
        ex.prompt.image,
        ex.countTarget?.objects,
        ...(ex.choices ?? []).map((c) => c.image),
        ...(ex.dragItems ?? []).map((d) => d.image),
        ...(ex.dropZones ?? []).map((d) => d.image),
      ];
      for (const ref of refs)
        if (ref?.kind === "asset" && !ctx.assetLabels.has(ref.value))
          err(`image asset "${ref.value}" is not in content/art/objects/manifest.json`, ex.id);
    }

    // Rubric 8: no two exercises may be the same question with the same options.
    const key = normalisePrompt(ex);
    const twin = seenPrompts.get(key);
    if (twin) err(`duplicates ${twin} (same prompt and options)`, ex.id);
    else seenPrompts.set(key, ex.id);

    typeCount.set(ex.type, (typeCount.get(ex.type) ?? 0) + 1);
    difficulties.add(ex.difficulty);
    if (ex.scaffold === "model") models++;
    if (ex.targetsError) targeted++;
  }

  // Coverage of the pack as a whole.
  if (pack.exercises.length < MIN_EXERCISES_PER_SKILL)
    err(`only ${pack.exercises.length} exercises, need >= ${MIN_EXERCISES_PER_SKILL}`);
  else if (pack.exercises.length < TARGET_EXERCISES_PER_SKILL)
    warn(`${pack.exercises.length} exercises, the target is ${TARGET_EXERCISES_PER_SKILL}`);

  for (let d = 1; d <= 5; d++)
    if (!difficulties.has(d)) err(`no exercise at difficulty ${d} (all five levels are required)`);

  const missingTypes = PHASE3_TYPES.filter(
    (t: Phase3Type) => declaredTypes.has(t) && !typeCount.has(t),
  );
  if (missingTypes.length > 0)
    err(`missing phase-3 exercise types declared by the skill: ${missingTypes.join(", ")}`);
  const phase3Present = PHASE3_TYPES.filter((t) => typeCount.has(t)).length;
  if (phase3Present < MIN_PHASE3_TYPES_PER_SKILL)
    err(
      `only ${phase3Present} of the six phase-3 types are used, need >= ${MIN_PHASE3_TYPES_PER_SKILL}`,
    );

  if (models < MIN_MODEL_SCAFFOLDS)
    err(`only ${models} exercises with scaffold "model", need >= ${MIN_MODEL_SCAFFOLDS}`);
  if (targeted < MIN_TARGETED_ERROR)
    err(`only ${targeted} exercises with targetsError, need >= ${MIN_TARGETED_ERROR}`);

  return issues;
}

export interface BankStats {
  skills: number;
  exercises: number;
  byType: Record<string, number>;
  byDifficulty: Record<string, number>;
  bySubject: Record<string, number>;
  withErrorTag: number;
  withScaffoldModel: number;
  withTheme: Record<string, number>;
}

export function bankStats(packs: ExercisePack[]): BankStats {
  const stats: BankStats = {
    skills: packs.length,
    exercises: 0,
    byType: {},
    byDifficulty: {},
    bySubject: {},
    withErrorTag: 0,
    withScaffoldModel: 0,
    withTheme: {},
  };
  for (const pack of packs) {
    for (const ex of pack.exercises) {
      stats.exercises++;
      stats.byType[ex.type] = (stats.byType[ex.type] ?? 0) + 1;
      stats.byDifficulty[ex.difficulty] = (stats.byDifficulty[ex.difficulty] ?? 0) + 1;
      stats.bySubject[pack.subject] = (stats.bySubject[pack.subject] ?? 0) + 1;
      stats.withTheme[ex.assetTheme] = (stats.withTheme[ex.assetTheme] ?? 0) + 1;
      if ((ex.choices ?? []).some((c) => c.errorTag)) stats.withErrorTag++;
      if (ex.scaffold === "model") stats.withScaffoldModel++;
    }
  }
  return stats;
}

/** Duplicate stable ids across packs would silently overwrite each other on import. */
export function findDuplicateIds(packs: { file: string; pack: ExercisePack }[]): PackIssue[] {
  const seen = new Map<string, string>();
  const issues: PackIssue[] = [];
  for (const { file, pack } of packs)
    for (const ex of pack.exercises) {
      const first = seen.get(ex.id);
      if (first)
        issues.push({
          file,
          id: ex.id,
          level: "error",
          message: `duplicate exercise id (already used in ${first})`,
        });
      else seen.set(ex.id, file);
    }
  return issues;
}
