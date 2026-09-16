import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { type ErrorTaxonomyFile, parseErrorTaxonomy } from "./error-taxonomy";
import { type ExercisePack, parseExercisePack } from "./exercise";
import { type LessonFile, parseLesson } from "./lesson";
import { type LessonUnitsFile, parseLessonUnits } from "./lesson-units";
import { type LexiconFile, parseLexicon } from "./lexicon";
import { contentDir } from "./paths";
import { parseSkillMap, type SkillMapFile } from "./skill-map";

export interface NamedSkillMap {
  name: string;
  map: SkillMapFile;
}
export interface NamedLessonUnits {
  name: string;
  units: LessonUnitsFile;
}
export interface NamedLesson {
  name: string;
  lesson: LessonFile;
}
export interface NamedPack {
  name: string;
  pack: ExercisePack;
}

function jsonFiles(dir: string, suffix = ".json"): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(suffix) && !f.endsWith(".schema.json"))
    .sort();
}

/** Every file under `dir` (one level of subfolders) whose name ends with `suffix`. */
function walk(dir: string, suffix: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path, suffix));
    else if (entry.name.endsWith(suffix) && !entry.name.endsWith(".schema.json")) out.push(path);
  }
  return out.sort();
}

/** content/skill-map/<subject>.json */
export function loadSkillMaps(dir = contentDir("skill-map")): NamedSkillMap[] {
  return jsonFiles(dir).map((name) => ({
    name: `skill-map/${name}`,
    map: parseSkillMap(JSON.parse(readFileSync(join(dir, name), "utf8"))),
  }));
}

/**
 * content/voice/*.json — fixed lines the app speaks (the city clock of pha 12). They are generated
 * as mp3 at import time and played from the cache: the app speaks no line it has not been given
 * beforehand (ADR-10, ADR-11).
 */
export function loadVoiceLines(dir = contentDir("voice")): { text: string; lang: string }[] {
  if (!existsSync(dir)) return [];
  const out: { text: string; lang: string }[] = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".json")) continue;
    const json = JSON.parse(readFileSync(join(dir, name), "utf8")) as {
      lines?: { text?: unknown; lang?: unknown }[];
    };
    for (const line of json.lines ?? []) {
      if (typeof line.text === "string" && typeof line.lang === "string")
        out.push({ text: line.text, lang: line.lang });
    }
  }
  return out;
}

/** content/lexicon/esl.json — the picture dictionary of pha 11; null while it does not exist. */
export function loadLexicon(file = contentDir("lexicon", "esl.json")): LexiconFile | null {
  if (!existsSync(file)) return null;
  return parseLexicon(JSON.parse(readFileSync(file, "utf8")));
}

/** content/lessons/<subject>/*.units.json (recursive one level) */
export function loadLessonUnitFiles(dir = contentDir("lessons")): NamedLessonUnits[] {
  if (!existsSync(dir)) return [];
  const out: NamedLessonUnits[] = [];
  for (const sub of readdirSync(dir, { withFileTypes: true })) {
    if (!sub.isDirectory()) continue;
    for (const name of jsonFiles(join(dir, sub.name), ".units.json")) {
      out.push({
        name: `lessons/${sub.name}/${name}`,
        units: parseLessonUnits(JSON.parse(readFileSync(join(dir, sub.name, name), "utf8"))),
      });
    }
  }
  return out;
}

/**
 * content/lessons/<subject>/<code>.json — the filled-in lessons of docs/10 sec. 4.1
 * (`*.units.json` are skeletons and are loaded by `loadLessonUnitFiles` instead).
 */
export function loadLessons(dir = contentDir("lessons")): NamedLesson[] {
  const root = contentDir();
  return walk(dir, ".json")
    .filter((p) => !p.endsWith(".units.json"))
    .map((path) => ({
      name: relative(root, path).replace(/\\/g, "/"),
      lesson: parseLesson(JSON.parse(readFileSync(path, "utf8"))),
    }));
}

/** content/exercises/<subject>/<SKILL_CODE>.pack.json */
export function loadExercisePacks(dir = contentDir("exercises")): NamedPack[] {
  const root = contentDir();
  return walk(dir, ".pack.json").map((path) => ({
    name: relative(root, path).replace(/\\/g, "/"),
    pack: parseExercisePack(JSON.parse(readFileSync(path, "utf8"))),
  }));
}

/** content/error-taxonomy.json (null when absent) */
export function loadErrorTaxonomy(
  file = contentDir("error-taxonomy.json"),
): ErrorTaxonomyFile | null {
  if (!existsSync(file)) return null;
  return parseErrorTaxonomy(JSON.parse(readFileSync(file, "utf8")));
}

/**
 * Labels of content/art/objects/manifest.json — the object library exercises may point at
 * (`ImageRef.kind = "asset"`). Returns null while the manifest does not exist (phase 3 builds it),
 * and the validator then skips that check instead of failing every pack.
 */
export function loadAssetLabels(
  file = contentDir("art", "objects", "manifest.json"),
): Set<string> | null {
  if (!existsSync(file) || !statSync(file).isFile()) return null;
  const json = JSON.parse(readFileSync(file, "utf8")) as {
    objects?: { key?: string; labelEn?: string; labelVi?: string }[];
  };
  const labels = new Set<string>();
  for (const o of json.objects ?? [])
    for (const v of [o.key, o.labelEn, o.labelVi]) if (v) labels.add(v);
  return labels;
}

/**
 * Emoji that have a picture in `content/art/emoji/` (`pnpm art:emoji`, Noto Color Emoji SVGs).
 *
 * An emoji without one falls back to device text, which on Windows draws at about half the size it
 * was asked for — that is the thumbnail problem pha 10b fixed, and new content would bring it back
 * silently. Returns null when the folder does not exist, and the check is skipped.
 */
export interface EmojiLibrary {
  /** Codepoint keys that have an SVG. */
  pictures: ReadonlySet<string>;
  /** Glyphs Noto has no picture for (▬ ⬢ ◤ …) — drawn as text on purpose, not a mistake. */
  notInNoto: ReadonlySet<string>;
}

export function loadEmojiPictures(dir = contentDir("art", "emoji")): EmojiLibrary | null {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return null;
  const pictures = new Set<string>();
  for (const f of readdirSync(dir)) if (f.endsWith(".svg")) pictures.add(f.slice(0, -4));
  if (pictures.size === 0) return null;
  let notInNoto: string[] = [];
  const index = join(dir, "index.json");
  if (existsSync(index)) {
    const json = JSON.parse(readFileSync(index, "utf8")) as { notInNoto?: string[] };
    notInNoto = json.notInNoto ?? [];
  }
  return { pictures, notInNoto: new Set(notInNoto) };
}

/** Codepoints joined by "-", lower case, without FE0F — the file name in content/art/emoji/. */
export function emojiKey(value: string): string {
  return [...value]
    .map((ch) => (ch.codePointAt(0) as number).toString(16))
    .filter((cp) => cp !== "fe0f")
    .join("-");
}

/** "🐔🦆" → ["🐔", "🦆"]; one emoji (even a ZWJ family) stays one. */
export function emojiParts(value: string): string[] {
  const seg =
    typeof Intl !== "undefined" && "Segmenter" in Intl
      ? new Intl.Segmenter("en", { granularity: "grapheme" })
      : null;
  if (!seg) return [value];
  return [...seg.segment(value)].map((s) => s.segment).filter((g) => g.trim().length > 0);
}

/** Resolves `--dir content/exercises/vmath` (absolute or repo-relative) to an absolute path. */
export function resolveContentDir(arg: string | undefined, fallback: string): string {
  if (!arg) return fallback;
  return existsSync(arg) ? arg : join(contentDir(), arg.replace(/^content[\\/]/, ""));
}
