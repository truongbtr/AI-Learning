import { cadence, cadenceLine, joinSyllable, splitSyllable, TONES, type Tone } from "@mtct/core";
import { z } from "zod";
import { imageRefSchema } from "./exercise";

/**
 * The syllable dictionary behind Xưởng Tiếng (pha 12, ADR-24): content/lexicon/viet.json.
 *
 * Why it exists: the bank has 3,422 Vietnamese spelling exercises and the children still cannot
 * spell. The trouble is their shape. The core spelling exercise read "c – u, which syllable?" and
 * offered three WRITTEN answers — a child learning to read had to read to answer a question about
 * reading, so she guessed, and a lucky guess moved her mastery up. The games that replace it start
 * from the sound: hear it, build it from three spoken tiles, hear it read back, see the picture.
 *
 * Every syllable carries its three pieces already split, so the games never have to guess them,
 * and `content:validate` proves the split against `splitSyllable` from @mtct/core — the same
 * function the games use to read a child's three tiles back.
 */
const lessonCode = z.string().regex(/^KNTT-TV1-T[12]-B\d{2}$/, "a KNTT Tiếng Việt 1 lesson code");
const skillCode = z.string().regex(/^VIET\.HV\.[A-Z0-9_]+$/, "a VIET.HV.* skill code");
const tone = z.enum(TONES as [Tone, ...Tone[]]);

export const vietSyllableSchema = z.object({
  /** `viet-<letters>-<tone>`, e.g. `viet-ba-huyen`; renaming it makes a new syllable. */
  id: z.string().regex(/^viet-[a-z]+-(ngang|huyen|sac|hoi|nga|nang)$/),
  tieng: z.string().trim().min(1).max(8),
  /** "" when the syllable has no onset ("anh"). */
  amDau: z.string().max(3),
  /** The rime as the book prints it, without the tone mark. */
  van: z.string().min(1).max(5),
  thanh: tone,
  /** A picture that confirms the meaning, or null when no honest picture exists ("lẽ", "đã"). */
  tranh: imageRefSchema.nullable(),
  /** A short phrase a parent could say: "con cá", "bà của con". */
  nghia: z.string().trim().min(1).max(40),
  /** The skill this syllable practises — whichever of its pieces the class met last. */
  skillCode,
  lessonUnitCode: lessonCode,
  tuanSGK: z.number().int().min(1).max(35),
  /** One of the syllables a child hears every day: offered first, before the book order. */
  hangNgay: z.boolean().optional(),
});

export const vietOnsetSchema = z.object({
  amDau: z.string().min(1).max(3),
  /** How the onset is READ ("bờ"), which is what its tile says when touched. */
  doc: z.string().min(1).max(5),
  skillCode,
  lessonUnitCode: lessonCode,
  tuanSGK: z.number().int().min(1).max(35),
});

export const vietRimeSchema = z.object({
  van: z.string().min(1).max(5),
  skillCode,
  lessonUnitCode: lessonCode,
  tuanSGK: z.number().int().min(1).max(35),
});

export const vietToneSchema = z.object({
  thanh: tone,
  ten: z.string().min(1),
  skillCode: skillCode.nullable(),
  lessonUnitCode: lessonCode,
  tuanSGK: z.number().int().min(1).max(35),
});

export const vietLexiconSchema = z.object({
  language: z.literal("vi"),
  voice: z.string().trim().min(1),
  source: z.string().trim().min(1),
  note: z.string().trim().optional(),
  amDau: z.array(vietOnsetSchema).min(20),
  van: z.array(vietRimeSchema).min(100),
  thanh: z.array(vietToneSchema).length(6),
  syllables: z.array(vietSyllableSchema).min(1),
});

export type VietSyllable = z.infer<typeof vietSyllableSchema>;
export type VietLexiconFile = z.infer<typeof vietLexiconSchema>;

export function parseVietLexicon(json: unknown): VietLexiconFile {
  const result = vietLexiconSchema.safeParse(json);
  if (!result.success) throw new Error(`Invalid viet lexicon: ${z.prettifyError(result.error)}`);
  return result.data;
}

/**
 * What the file claims about each syllable, checked against the one function that reads a child's
 * tiles back. Returns human-readable problems; an empty list means the file is sound.
 */
export function checkVietLexicon(file: VietLexiconFile): string[] {
  const problems: string[] = [];
  const onsets = new Set(file.amDau.map((o) => o.amDau));
  const rimes = new Set(file.van.map((v) => v.van));
  const ids = new Set<string>();
  const words = new Set<string>();
  for (const s of file.syllables) {
    const where = `[${s.id}]`;
    if (ids.has(s.id)) problems.push(`${where} duplicate id`);
    ids.add(s.id);
    if (words.has(s.tieng)) problems.push(`${where} "${s.tieng}" is listed twice`);
    words.add(s.tieng);
    const parts = splitSyllable(s.tieng);
    if (!parts) {
      problems.push(`${where} "${s.tieng}" is not a syllable the games can build`);
      continue;
    }
    if (parts.amDau !== s.amDau || parts.van !== s.van || parts.thanh !== s.thanh)
      problems.push(
        `${where} "${s.tieng}" splits as ${parts.amDau || "∅"}+${parts.van}+${parts.thanh}, ` +
          `the file says ${s.amDau || "∅"}+${s.van}+${s.thanh}`,
      );
    if (joinSyllable(s.amDau, s.van, s.thanh) !== s.tieng)
      problems.push(`${where} the three pieces write "${joinSyllable(s.amDau, s.van, s.thanh)}"`);
    if (s.amDau && !onsets.has(s.amDau))
      problems.push(`${where} onset "${s.amDau}" is not in the amDau table`);
    if (!rimes.has(s.van)) problems.push(`${where} rime "${s.van}" is not in the van table`);
    if (cadence(s.tieng).length === 0) problems.push(`${where} has no spelling-out rhythm`);
  }
  return problems;
}

/**
 * Which mp3 lines to generate.
 *
 * - `pieces` — what does not depend on HOW the school spells out loud: every rime, the six tone
 *   names, every syllable, and every onset+rime blend ("ba" in "bà"). Safe to generate today.
 * - `rhythm` — what does: each onset's sound ("bờ" — a letter-name programme would say "bê") and
 *   the whole rhythm of each syllable as one line ("bờ – a – ba – huyền – bà"). Generated once the
 *   project owner has confirmed the rhythm with the class teacher (ADR-24).
 * - `all` — both.
 */
export type VietTtsPart = "pieces" | "rhythm" | "all";

/**
 * Every line that needs an mp3 for Xưởng Tiếng, deduplicated. The cache is keyed by text, so a
 * change of rhythm only ever adds lines — the pieces already generated stay valid.
 */
export function vietLexiconTtsLines(
  file: VietLexiconFile,
  part: VietTtsPart = "all",
): { text: string; lang: string }[] {
  const seen = new Set<string>();
  const lines: { text: string; lang: string }[] = [];
  const add = (text: string) => {
    const t = text.trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    lines.push({ text: t, lang: "vi" });
  };
  const pieces = part !== "rhythm";
  const rhythm = part !== "pieces";
  if (pieces) {
    for (const v of file.van) add(v.van);
    for (const t of file.thanh) add(t.ten);
  }
  if (rhythm) for (const o of file.amDau) add(o.doc);
  for (const s of file.syllables) {
    const steps = cadence(s.tieng);
    if (pieces) {
      add(s.tieng);
      for (const step of steps) if (step.kind !== "onset") add(step.say);
    }
    if (rhythm) {
      for (const step of steps) if (step.kind === "onset") add(step.say);
      // a syllable with a single step ("anh") has no separate rhythm line — it is the syllable
      if (steps.length > 1) add(cadenceLine(s.tieng));
    }
  }
  return lines;
}
