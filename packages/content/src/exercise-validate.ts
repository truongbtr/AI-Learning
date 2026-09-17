import { explainErrorTagMismatch } from "./error-semantics";
import type { ExerciseDef, ExercisePack, Phase3Type } from "./exercise";
import { PHASE3_TYPES } from "./exercise";
import { type EmojiLibrary, emojiKey, emojiParts } from "./load";
import { lessonRefsOf, type SkillDef } from "./skill-map";
import { checkPrintedVietnamese, lessonReachOf, taughtUpTo } from "./tieng-viet-progression";

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
/** One instruction may not cover more than this share of a type — see `checkPromptVariety`. */
export const PROMPT_REPEAT_WARN_RATIO = 0.25;
export const MIN_PROMPT_VARIANTS = 6;
export const MIN_HINT_VARIANTS = 4;
/** Below this many exercises a type/language group is too small to judge for variety. */
const VARIETY_SAMPLE_FLOOR = 10;

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
  /** Pictures in content/art/emoji/; null before `pnpm art:emoji` has ever run. */
  emoji?: EmojiLibrary | null;
}

/**
 * What the child actually sees and does, normalised — two exercises that produce the same string
 * are the same question even if a word of the instruction differs (rubric 8).
 */
function normalisePrompt(ex: ExerciseDef): string {
  // a model is told apart by its data, not by the key its author gave it
  const pic = (i: ExerciseDef["prompt"]["image"]) =>
    i ? (i.model ? JSON.stringify(i.model) : i.value) : undefined;
  const parts = [ex.type, ex.prompt.text.trim().toLowerCase().replace(/\s+/g, " ")];
  if (ex.prompt.image) parts.push(`img:${pic(ex.prompt.image)}`);
  if (ex.choices)
    parts.push(ex.choices.map((c) => `${c.text ?? pic(c.image) ?? c.audio ?? ""}`).join(","));
  if (ex.readTarget) parts.push(`read:${ex.readTarget.text}`);
  // What the child hears is part of the question even though it is never printed.
  if (ex.listenTarget) parts.push(`hear:${ex.listenTarget.text}`);
  if (ex.countTarget)
    parts.push(`count:${ex.countTarget.objects.value}x${ex.countTarget.correctCount}`);
  if (ex.dragItems) parts.push(`drag:${ex.dragItems.map((d) => d.text ?? pic(d.image)).join(",")}`);
  if (ex.dropZones)
    parts.push(
      `zones:${ex.dropZones.map((z) => `${z.label ?? z.id}${pic(z.image) ?? ""}`).join(",")}`,
    );
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

  const lessonReach = pack.subject === "VIET" ? lessonReachOf(lessonRefsOf(skill)) : null;
  const taught = lessonReach == null ? null : taughtUpTo(lessonReach);
  /** The Vietnamese a child has to decode to answer; instructions and audio are exempt. */
  const printedVietnameseIssues = (ex: ExerciseDef, _skill: SkillDef) => {
    if (taught == null || ex.language !== "vi") return [];
    const out = [];
    for (const c of ex.choices ?? [])
      if (c.text) out.push(...checkPrintedVietnamese(`choice ${c.id}`, c.text, taught));
    for (const d of ex.dragItems ?? [])
      if (d.text) out.push(...checkPrintedVietnamese(`drag item ${d.id}`, d.text, taught));
    if (ex.readTarget)
      out.push(...checkPrintedVietnamese("readTarget", ex.readTarget.text, taught));
    return out;
  };

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

    // Drag cards carry a diagnosis too (ADR-15): why a child might put *this* card in the wrong
    // place. It belongs on a card the answer key does not use, or on one of the cards of a
    // matching task, where the mistake is swapping them.
    if (ex.type === "DRAG_DROP") {
      const placed = new Set(
        Object.values((ex.answerKey ?? {}) as Record<string, string[]>).flat(),
      );
      const zones = (ex.dropZones ?? []).length;
      for (const d of ex.dragItems ?? []) {
        if (!d.errorTag) continue;
        if (!ctx.errorCodes.has(d.errorTag))
          err(`drag item ${d.id} errorTag "${d.errorTag}" is not in the taxonomy`, ex.id);
        if (zones === 1 && placed.has(d.id))
          err(
            `drag item ${d.id} is the right card, so it cannot carry an errorTag — tag the decoys`,
            ex.id,
          );
      }
    }

    // A tag has to mean what the child did (docs/04 §11.2) — see error-semantics.ts.
    const correctChoice = (ex.choices ?? []).find((c) => c.id === ex.answerKey);
    for (const c of ex.choices ?? []) {
      if (!c.errorTag || c.id === ex.answerKey) continue;
      const why = explainErrorTagMismatch(
        { code: c.errorTag, distractor: c.text ?? null, correct: correctChoice?.text ?? null },
        {
          type: ex.type,
          language: ex.language,
          subject: pack.subject,
          prompt: ex.prompt.text,
          listenTarget: ex.listenTarget?.text ?? null,
        },
      );
      if (why) err(`choice ${c.id}: ${why}`, ex.id);
    }
    // An exercise that says it drills an error should hand the planner a way to see it.
    if (
      ex.targetsError &&
      (ex.type === "MCQ" || ex.type === "LISTEN_CHOOSE") &&
      !(ex.choices ?? []).some((c) => c.errorTag === ex.targetsError)
    )
      warn(
        `targetsError "${ex.targetsError}" but no option carries that tag — the attempt cannot record it`,
        ex.id,
      );

    // Nothing printed for the child to read may use letters, rimes or tones the class has not met.
    for (const issue of printedVietnameseIssues(ex, skill))
      err(
        `${issue.where} "${issue.word}" uses ${issue.parts.join(", ")} — not taught by bài ${lessonReach} (docs/09 §3)`,
        ex.id,
      );

    // Rubric 11: the distractors of a maths / phonics question must be diagnostic.
    if ((ex.type === "MCQ" || ex.type === "LISTEN_CHOOSE") && needsDiagnosis(pack, skill)) {
      const tagged = (ex.choices ?? []).filter((c) => c.id !== ex.answerKey && c.errorTag);
      if (tagged.length === 0)
        err("at least one wrong choice must carry an errorTag (docs/04 §11.2)", ex.id);
    }

    // Rubric 10: every asset image must exist in the object library, and every emoji must have a
    // picture — an emoji without one is drawn by the device font, at about half the size asked for.
    {
      const refs = [
        ex.prompt.image,
        ex.countTarget?.objects,
        ...(ex.choices ?? []).map((c) => c.image),
        ...(ex.dragItems ?? []).map((d) => d.image),
        ...(ex.dropZones ?? []).map((d) => d.image),
      ];
      for (const ref of refs) {
        if (!ref) continue;
        if (ctx.assetLabels && ref.kind === "asset" && !ctx.assetLabels.has(ref.value))
          err(`image asset "${ref.value}" is not in content/art/objects/manifest.json`, ex.id);
        if (ctx.emoji && ref.kind === "emoji") {
          const lib = ctx.emoji;
          const absent = emojiParts(ref.value).filter((p) => !lib.pictures.has(emojiKey(p)));
          const forgotten = absent.filter((p) => !lib.notInNoto.has(p));
          if (forgotten.length > 0)
            err(
              `emoji ${forgotten.join(" ")} has no picture in content/art/emoji/ — run \`pnpm art:emoji\``,
              ex.id,
            );
          else if (absent.length > 0)
            warn(
              `${absent.join(" ")} is a plain symbol, not an emoji Noto draws — it will be shown as text`,
              ex.id,
            );
        }
      }
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
  if (targeted < MIN_TARGETED_ERROR) {
    // Maths and phonics always have a nameable mistake to drill. A vocabulary pack does not:
    // picking "short" for "tall" is not a diagnosable error, it is simply a word not learnt yet,
    // and inventing a code for it would send the remediation ladder after the wrong thing.
    const message = `only ${targeted} exercises with targetsError, need >= ${MIN_TARGETED_ERROR}`;
    if (needsDiagnosis(pack, skill)) err(message);
    else warn(`${message} (no error code in the taxonomy fits this skill)`);
  }

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

/**
 * Instructions must not all read the same (docs/08 pha 3 việc 0 muc 3).
 *
 * Phase 2 gave all 214 LISTEN_CHOOSE the one sentence "Nghe rồi chọn ô đúng nhé!" and a single
 * hint. A child who meets the same sentence twelve times an evening stops hearing it, and the
 * mascot sounds like a machine. Warnings, not errors: repetition is a quality problem, not a
 * broken file, and a skill with only a handful of exercises of a type cannot be varied.
 */
export function checkPromptVariety(packs: { file: string; pack: ExercisePack }[]): PackIssue[] {
  const issues: PackIssue[] = [];
  const byType = new Map<string, Map<string, number>>();
  const byTypeLang = new Map<string, { prompts: Set<string>; hints: Set<string>; n: number }>();

  for (const { pack } of packs)
    for (const ex of pack.exercises) {
      const prompts = byType.get(ex.type) ?? new Map<string, number>();
      const text = ex.prompt.text.trim();
      prompts.set(text, (prompts.get(text) ?? 0) + 1);
      byType.set(ex.type, prompts);

      const key = `${ex.type}/${ex.language}`;
      const group = byTypeLang.get(key) ?? { prompts: new Set(), hints: new Set(), n: 0 };
      group.prompts.add(text);
      group.hints.add(ex.hints.join(" | ").trim());
      group.n++;
      byTypeLang.set(key, group);
    }

  for (const [type, prompts] of byType) {
    const total = [...prompts.values()].reduce((a, b) => a + b, 0);
    if (total < VARIETY_SAMPLE_FLOOR) continue;
    for (const [text, count] of prompts) {
      const share = count / total;
      if (share > PROMPT_REPEAT_WARN_RATIO)
        issues.push({
          file: "content/exercises",
          level: "warn",
          message: `${type}: "${text}" is the instruction of ${count}/${total} exercises (${Math.round(share * 100)}%) — write more variants (limit ${Math.round(PROMPT_REPEAT_WARN_RATIO * 100)}%)`,
        });
    }
  }

  for (const [key, group] of byTypeLang) {
    if (group.n < VARIETY_SAMPLE_FLOOR) continue;
    if (group.prompts.size < MIN_PROMPT_VARIANTS)
      issues.push({
        file: "content/exercises",
        level: "warn",
        message: `${key}: only ${group.prompts.size} different instructions for ${group.n} exercises, need >= ${MIN_PROMPT_VARIANTS}`,
      });
    if (group.hints.size < MIN_HINT_VARIANTS)
      issues.push({
        file: "content/exercises",
        level: "warn",
        message: `${key}: only ${group.hints.size} different hints for ${group.n} exercises, need >= ${MIN_HINT_VARIANTS}`,
      });
  }
  return issues.sort((a, b) => a.message.localeCompare(b.message));
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
