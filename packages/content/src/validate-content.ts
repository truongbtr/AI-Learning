/**
 * Lesson + exercise-bank validation, run by `pnpm content:validate` (docs/10 sec. 5 step 3).
 * Everything here is file-only: no database, so it can run before the stack is even up.
 */
import {
  bankStats,
  checkPromptVariety,
  findDuplicateIds,
  type PackIssue,
  validatePack,
} from "./exercise-validate";
import { checkVietLexicon, vietLexiconTtsLines } from "./lexicon-viet";
import {
  emojiKey,
  emojiParts,
  loadAssetLabels,
  loadEmojiPictures,
  loadErrorTaxonomy,
  loadExercisePacks,
  loadLessons,
  loadLessonUnitFiles,
  loadLexicon,
  loadSkillMaps,
  loadVietLexicon,
  type NamedPack,
} from "./load";
import type { SkillDef } from "./skill-map";

export interface ContentValidationResult {
  errors: number;
  warnings: number;
  packs: NamedPack[];
}

export function runContentValidation(opts: { quiet?: boolean } = {}): ContentValidationResult {
  const log = opts.quiet ? () => {} : console.log;
  let errors = 0;
  let warnings = 0;

  const maps = loadSkillMaps();
  const skills = new Map<string, SkillDef & { subject: string }>();
  for (const { map } of maps)
    for (const s of map.skills) skills.set(s.code, { ...s, subject: map.subject });

  const unitFiles = loadLessonUnitFiles();
  const lessonCodes = new Set(unitFiles.flatMap((f) => f.units.units.map((u) => u.code)));
  const taxonomy = loadErrorTaxonomy();
  const errorCodes = new Set((taxonomy?.codes ?? []).map((c) => c.code));
  const assetLabels = loadAssetLabels();
  if (!assetLabels)
    console.warn(
      "WARN content/art/objects/manifest.json missing — image asset check skipped (phase 3)",
    );
  const emojiPictures = loadEmojiPictures();
  if (!emojiPictures)
    console.warn("WARN content/art/emoji/ missing — emoji picture check skipped (pnpm art:emoji)");

  // --- Lexicon (pha 11) -------------------------------------------------------------------
  // The picture dictionary behind the vocabulary games: every word needs a skill that is still in
  // use, a picture a child can actually see, and a phrase short enough to say in one breath.
  try {
    const lexicon = loadLexicon();
    if (lexicon) {
      const seen = new Set<string>();
      let words = 0;
      for (const w of lexicon.words) {
        const where = `lexicon/esl.json [${w.id}]`;
        if (seen.has(w.id)) {
          console.error(`ERR ${where}: duplicate word id`);
          errors++;
        }
        seen.add(w.id);
        const wordSkill = skills.get(w.skillCode);
        if (!wordSkill) {
          console.error(`ERR ${where}: skill "${w.skillCode}" does not exist`);
          errors++;
        } else if (wordSkill.isActive === false) {
          console.error(`ERR ${where}: skill "${w.skillCode}" is retired — no new words for it`);
          errors++;
        }
        if (emojiPictures && w.picture.kind === "emoji") {
          const missing = emojiParts(w.picture.value).filter(
            (p) => !emojiPictures.pictures.has(emojiKey(p)) && !emojiPictures.notInNoto.has(p),
          );
          if (missing.length > 0) {
            console.error(
              `ERR ${where}: emoji ${missing.join(" ")} has no picture — run \`pnpm art:emoji\``,
            );
            errors++;
          }
        }
        if (assetLabels && w.picture.kind === "asset" && !assetLabels.has(w.picture.value)) {
          console.error(`ERR ${where}: image asset "${w.picture.value}" is not in the manifest`);
          errors++;
        }
        words++;
      }
      const covered = new Set(lexicon.words.map((w) => w.skillCode));
      log(`OK  lexicon: ${words} từ · ${covered.size} kỹ năng · giọng ${lexicon.voice}`);
    }
  } catch (err) {
    console.error(`ERR lexicon: ${(err as Error).message}`);
    errors++;
  }

  // --- Syllable dictionary (pha 12) ---------------------------------------------------------
  // Xưởng Tiếng builds every syllable out of three spoken tiles, so the file has to agree with the
  // function that reads the tiles back, every skill has to exist, and every picture has to draw.
  try {
    const viet = loadVietLexicon();
    if (viet) {
      for (const problem of checkVietLexicon(viet)) {
        console.error(`ERR lexicon/viet.json ${problem}`);
        errors++;
      }
      const codes = new Set<string>([
        ...viet.syllables.map((s) => s.skillCode),
        ...viet.amDau.map((o) => o.skillCode),
        ...viet.van.map((v) => v.skillCode),
        ...viet.thanh.flatMap((t) => (t.skillCode ? [t.skillCode] : [])),
      ]);
      for (const code of codes) {
        const skill = skills.get(code);
        if (!skill) {
          console.error(`ERR lexicon/viet.json: skill "${code}" does not exist`);
          errors++;
        } else if (skill.isActive === false) {
          console.error(`ERR lexicon/viet.json: skill "${code}" is retired`);
          errors++;
        }
      }
      for (const s of viet.syllables) {
        if (lessonCodes.size > 0 && !lessonCodes.has(s.lessonUnitCode)) {
          console.error(`ERR lexicon/viet.json [${s.id}]: lesson ${s.lessonUnitCode} is unknown`);
          errors++;
        }
        if (emojiPictures && s.tranh?.kind === "emoji") {
          const missing = emojiParts(s.tranh.value).filter(
            (p) => !emojiPictures.pictures.has(emojiKey(p)) && !emojiPictures.notInNoto.has(p),
          );
          if (missing.length > 0) {
            console.error(
              `ERR lexicon/viet.json [${s.id}]: emoji ${missing.join(" ")} has no picture — run \`pnpm art:emoji\``,
            );
            errors++;
          }
        }
      }
      const everyday = viet.syllables.filter((s) => s.hangNgay).length;
      const pictured = viet.syllables.filter((s) => s.tranh).length;
      const chars = vietLexiconTtsLines(viet).reduce((n, l) => n + l.text.length, 0);
      log(
        `OK  lexicon/viet: ${viet.syllables.length} tiếng (${everyday} hằng ngày, ${pictured} có tranh) · ` +
          `${viet.amDau.length} âm đầu · ${viet.van.length} vần · ~${chars.toLocaleString("vi-VN")} ký tự TTS`,
      );
    }
  } catch (err) {
    console.error(`ERR lexicon/viet.json: ${(err as Error).message}`);
    errors++;
  }

  // --- Lessons (docs/10 §4.1) -------------------------------------------------------------
  let lessons: ReturnType<typeof loadLessons> = [];
  try {
    lessons = loadLessons();
  } catch (err) {
    console.error(`ERR lessons: ${(err as Error).message}`);
    errors++;
  }
  const seenLessonCodes = new Set<string>();
  for (const { name, lesson } of lessons) {
    if (seenLessonCodes.has(lesson.code)) {
      console.error(`ERR ${name}: duplicate lesson code ${lesson.code}`);
      errors++;
    }
    seenLessonCodes.add(lesson.code);
    if (!lessonCodes.has(lesson.code))
      console.warn(
        `WARN ${name}: ${lesson.code} has no skeleton unit in *.units.json (it will be created)`,
      );
    for (const s of lesson.skills)
      if (!skills.has(s.code)) {
        console.error(`ERR ${name}: skill "${s.code}" does not exist`);
        errors++;
      }
    if (lesson.objectives.length === 0) {
      console.warn(`WARN ${name}: no objectives yet`);
      warnings++;
    }
  }
  if (lessons.length > 0) log(`OK  lessons: ${lessons.length} files`);

  // --- Exercise packs (docs/10 §4.2 + §6) -------------------------------------------------
  let packs: NamedPack[] = [];
  try {
    packs = loadExercisePacks();
  } catch (err) {
    console.error(`ERR exercises: ${(err as Error).message}`);
    return { errors: errors + 1, warnings, packs: [] };
  }

  const allIssues: PackIssue[] = [];
  for (const { name, pack } of packs)
    allIssues.push(
      ...validatePack(pack, name, {
        skills,
        lessonCodes: new Set([...lessonCodes, ...seenLessonCodes]),
        errorCodes,
        assetLabels,
        emoji: emojiPictures,
      }),
    );
  allIssues.push(...findDuplicateIds(packs.map((p) => ({ file: p.name, pack: p.pack }))));
  allIssues.push(...checkPromptVariety(packs.map((p) => ({ file: p.name, pack: p.pack }))));

  for (const issue of allIssues) {
    const line = `${issue.file}${issue.id ? ` [${issue.id}]` : ""}: ${issue.message}`;
    if (issue.level === "error") {
      console.error(`ERR ${line}`);
      errors++;
    } else {
      console.warn(`WARN ${line}`);
      warnings++;
    }
  }

  if (packs.length > 0) {
    const stats = bankStats(packs.map((p) => p.pack));
    log(
      `OK  exercises: ${stats.exercises} in ${stats.skills} packs · ` +
        `types ${JSON.stringify(stats.byType)} · difficulty ${JSON.stringify(stats.byDifficulty)} · ` +
        `${stats.withErrorTag} with a diagnostic distractor · ${stats.withScaffoldModel} with scaffold "model"`,
    );
  } else {
    log("(no exercise packs in content/exercises yet)");
  }
  return { errors, warnings, packs };
}
