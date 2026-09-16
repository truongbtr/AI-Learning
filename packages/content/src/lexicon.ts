import { z } from "zod";
import { imageRefSchema } from "./exercise";

/**
 * The picture dictionary behind the vocabulary games (pha 11, docs/08).
 *
 * Why it is its own file rather than more exercises: 754 of the ESL vocabulary exercises exist and
 * 40% of them are multiple choice, so a child answers *questions about* a word without ever
 * meeting the word often enough to keep it. Children need a word 15–20 times, spaced out, before
 * it sticks; a word heard and said sticks better than a word read; and a word inside a phrase
 * sticks better than a word on its own. So every entry carries a picture, a voice, the Vietnamese
 * meaning and one short phrase — and `LexemeProgress` (ADR-22) counts the meetings.
 *
 * The children are six and cannot read English yet: the picture and the voice are the word, the
 * spelling is only there to become familiar.
 */
export const lexiconWordSchema = z.object({
  /** Stable id, `esl-<topic>-<word>`; renaming it makes a new word, so do not. */
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)+$/, "id must be lower-case words joined by hyphens"),
  en: z.string().trim().min(1).max(30),
  vi: z.string().trim().min(1).max(40),
  /** The ESL.VOC.* skill this word belongs to. */
  skillCode: z.string().regex(/^[A-Z]+(\.[A-Z0-9_]+)+$/),
  /** Global Stage 1 unit, when the word comes from one. */
  unit: z.number().int().min(1).max(12).optional(),
  picture: imageRefSchema,
  /**
   * One short phrase the word lives in — the child hears the word twice, once alone and once in
   * use. Kept to a line a six-year-old can repeat in one breath.
   */
  phrase: z.object({
    en: z.string().trim().min(3).max(60),
    vi: z.string().trim().min(3).max(80),
  }),
});

export const lexiconSchema = z.object({
  language: z.literal("en"),
  /** Azure voice the mp3s are generated with (docs/02 §6, ADR-11). */
  voice: z.string().trim().min(1),
  source: z.string().trim().min(1),
  note: z.string().trim().optional(),
  words: z.array(lexiconWordSchema).min(1),
});

export type LexiconWord = z.infer<typeof lexiconWordSchema>;
export type LexiconFile = z.infer<typeof lexiconSchema>;

export function parseLexicon(json: unknown): LexiconFile {
  const result = lexiconSchema.safeParse(json);
  if (!result.success) throw new Error(`Invalid lexicon: ${z.prettifyError(result.error)}`);
  return result.data;
}

/** Every line that needs an mp3 at import time: the word, then the word in its phrase. */
export function lexiconTtsLines(file: LexiconFile): { text: string; lang: string }[] {
  const lines: { text: string; lang: string }[] = [];
  for (const w of file.words) {
    lines.push({ text: w.en, lang: "en" });
    lines.push({ text: w.phrase.en, lang: "en" });
  }
  return lines;
}
