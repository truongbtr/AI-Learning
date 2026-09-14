/**
 * "Chu nao da hoc toi bai N" — the phonics progression of Tieng Viet 1, tap mot (docs/09 §3).
 *
 * A hoc-van book is built on one promise: a child is never asked to *read* a letter, a rime or a
 * tone mark that the class has not met yet. Phase 2 broke that promise — skill VIET.HV.AM_A
 * (bai 1, the class knows exactly one letter) shipped a question that prints "Nam" / "Nem" and a
 * drag card "ca" carrying a huyen, which arrives at bai 9. This table is the check.
 *
 * What is checked and what is not:
 * - **Checked**: text the child must decode to answer — `choices[].text`, `dragItems[].text`,
 *   `readTarget`. Those are the letters they read.
 * - **Not checked**: `prompt.text`, `dropZones[].label`, `hints`, `explanation` and `listenTarget`.
 *   The mascot reads all of those out loud (listenTarget is never printed at all, ADR-14), so they
 *   are heard, not decoded — the textbook does the same with its "cau nhan biet".
 * - **Not checked**: a string of one single grapheme ("o", "ă", "B"). Picking the letter *a* out of
 *   a row of letters it has not met is exactly what bai 1 asks for; the foils must be allowed.
 */

/** The five tone marks. The breve of ă, the circumflex of â/ê/ô and the horn of ơ/ư are *letters*. */
export const TONE_NAMES = ["huyen", "sac", "hoi", "nga", "nang"] as const;
export type ToneName = (typeof TONE_NAMES)[number];

/** Combining marks, as they come out of NFD. */
const TONE_BY_MARK: Record<string, ToneName> = {
  "\u0300": "huyen",
  "\u0301": "sac",
  "\u0309": "hoi",
  "\u0303": "nga",
  "\u0323": "nang",
};

export const TONE_LABEL_VI: Record<ToneName, string> = {
  huyen: "dấu huyền",
  sac: "dấu sắc",
  hoi: "dấu hỏi",
  nga: "dấu ngã",
  nang: "dấu nặng",
};

/** Longest first: "ngh" must win over "ng", "ng" over "n". */
const DIGRAPHS = ["ngh", "ng", "nh", "ch", "gh", "gi", "kh", "ph", "qu", "th", "tr"] as const;

const VIETNAMESE_LETTER = /^[a-zăâêôơưđ]$/;

export interface LessonTeaches {
  letters?: string[];
  rimes?: string[];
  tones?: ToneName[];
}

/**
 * Bai -> what it introduces, straight from the 83-lesson table of docs/09 §3.
 * "On tap va ke chuyen" lessons introduce nothing and are simply absent.
 */
export const LESSON_TEACHES: Readonly<Record<number, LessonTeaches>> = {
  1: { letters: ["a"] },
  2: { letters: ["b"], tones: ["huyen"] },
  3: { letters: ["c"], tones: ["sac"] },
  4: { letters: ["e", "ê"] },
  6: { letters: ["o"], tones: ["hoi"] },
  7: { letters: ["ô"], tones: ["nang"] },
  8: { letters: ["d", "đ"] },
  9: { letters: ["ơ"], tones: ["nga"] },
  11: { letters: ["i", "k"] },
  12: { letters: ["h", "l"] },
  13: { letters: ["u", "ư"] },
  14: { letters: ["ch", "kh"] },
  16: { letters: ["m", "n"] },
  17: { letters: ["g", "gi"] },
  18: { letters: ["gh", "nh"] },
  19: { letters: ["ng", "ngh"] },
  21: { letters: ["r", "s"] },
  22: { letters: ["t", "tr"] },
  23: { letters: ["th"], rimes: ["ia"] },
  24: { rimes: ["ua", "ưa"] },
  // SGK tr.64 dạy "p – ph": p đứng một mình chỉ gặp lại ở vần ap/op/ep/ip/up (bài 53–56).
  26: { letters: ["p", "ph", "qu"] },
  27: { letters: ["v", "x"] },
  28: { letters: ["y"] },
  31: { letters: ["ă", "â"], rimes: ["an", "ăn", "ân"] },
  32: { rimes: ["on", "ôn", "ơn"] },
  33: { rimes: ["en", "ên", "in", "un"] },
  34: { rimes: ["am", "ăm", "âm"] },
  36: { rimes: ["om", "ôm", "ơm"] },
  37: { rimes: ["em", "êm", "im", "um"] },
  38: { rimes: ["ai", "ay", "ây"] },
  39: { rimes: ["oi", "ôi", "ơi"] },
  41: { rimes: ["ui", "ưi"] },
  42: { rimes: ["ao", "eo"] },
  43: { rimes: ["au", "âu", "êu"] },
  44: { rimes: ["iu", "ưu"] },
  46: { rimes: ["ac", "ăc", "âc"] },
  47: { rimes: ["oc", "ôc", "uc", "ưc"] },
  48: { rimes: ["at", "ăt", "ât"] },
  49: { rimes: ["ot", "ôt", "ơt"] },
  51: { rimes: ["et", "êt", "it"] },
  52: { rimes: ["ut", "ưt"] },
  53: { rimes: ["ap", "ăp", "âp"] },
  54: { rimes: ["op", "ôp", "ơp"] },
  56: { rimes: ["ep", "êp", "ip", "up"] },
  57: { rimes: ["anh", "ênh", "inh"] },
  58: { rimes: ["ach", "êch", "ich"] },
  59: { rimes: ["ang", "ăng", "âng"] },
  61: { rimes: ["ong", "ông", "ung", "ưng"] },
  62: { rimes: ["iêc", "iên", "iêp"] },
  63: { rimes: ["iêng", "iêm", "yên"] },
  64: { rimes: ["iêt", "iêu", "yêu"] },
  66: { rimes: ["uôi", "uôm"] },
  67: { rimes: ["uôc", "uôt"] },
  68: { rimes: ["uôn", "uông"] },
  69: { rimes: ["ươi", "ươu"] },
  71: { rimes: ["ươc", "ươt"] },
  72: { rimes: ["ươm", "ươp"] },
  73: { rimes: ["ươn", "ương"] },
  74: { rimes: ["oa", "oe"] },
  76: { rimes: ["oan", "oăn", "oat", "oăt"] },
  77: { rimes: ["oai", "uê", "uy"] },
  78: { rimes: ["uân", "uât"] },
  79: { rimes: ["uyên", "uyêt"] },
};

export interface TaughtSet {
  lesson: number;
  letters: ReadonlySet<string>;
  rimes: ReadonlySet<string>;
  tones: ReadonlySet<ToneName>;
}

/** "KNTT-TV1-T1-B13" -> 13. Null for anything that is not a tap-mot hoc-van lesson code. */
export function lessonNumberOf(code: string): number | null {
  const m = /^KNTT-TV1-T1-B(\d{1,2})$/.exec(code.trim());
  return m ? Number(m[1]) : null;
}

/** The highest tap-mot lesson among a skill's `lessonRef` — how far the class has got. */
export function lessonReachOf(lessonRef: string | string[] | null | undefined): number | null {
  const refs = lessonRef == null ? [] : Array.isArray(lessonRef) ? lessonRef : [lessonRef];
  const numbers = refs.map(lessonNumberOf).filter((n): n is number => n != null);
  return numbers.length > 0 ? Math.max(...numbers) : null;
}

export function taughtUpTo(lesson: number): TaughtSet {
  const letters = new Set<string>();
  const rimes = new Set<string>();
  const tones = new Set<ToneName>();
  for (const key of Object.keys(LESSON_TEACHES)
    .map(Number)
    .sort((a, b) => a - b)) {
    if (key > lesson) break;
    const t = LESSON_TEACHES[key] as LessonTeaches;
    for (const l of t.letters ?? []) letters.add(l);
    for (const r of t.rimes ?? []) rimes.add(r);
    for (const x of t.tones ?? []) tones.add(x);
  }
  return { lesson, letters, rimes, tones };
}

/** Pulls the tone mark off a syllable, keeping ă/â/ê/ô/ơ/ư whole. */
export function splitTone(syllable: string): { base: string; tone: ToneName | null } {
  let tone: ToneName | null = null;
  let base = "";
  for (const ch of syllable.normalize("NFD")) {
    const named = TONE_BY_MARK[ch];
    if (named) tone = named;
    else base += ch;
  }
  return { base: base.normalize("NFC").toLowerCase(), tone };
}

/** Splits a toneless syllable into graphemes, digraphs kept together ("ngh", "tr", "gi"). */
export function graphemesOf(base: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < base.length) {
    const digraph = DIGRAPHS.find((d) => base.startsWith(d, i));
    if (digraph) {
      out.push(digraph);
      i += digraph.length;
    } else {
      out.push(base[i] as string);
      i += 1;
    }
  }
  return out;
}

const VOWELS = new Set(["a", "ă", "â", "e", "ê", "i", "o", "ô", "ơ", "u", "ư", "y"]);

/**
 * Everything in `syllable` the class has not met by `taught`, in Vietnamese, ready for an error
 * message. Empty array = the child can read it.
 */
export function untaughtPartsOf(syllable: string, taught: TaughtSet): string[] {
  const { base, tone } = splitTone(syllable);
  if (!base) return [];
  const out: string[] = [];
  if (tone && !taught.tones.has(tone)) out.push(TONE_LABEL_VI[tone]);

  const graphemes = graphemesOf(base);
  if (graphemes.some((g) => !VIETNAMESE_LETTER.test(g) && g.length === 1)) return out; // digits etc.
  for (const g of graphemes) if (!taught.letters.has(g)) out.push(`chữ "${g}"`);

  // The rime: one taught vowel is always fine, anything longer has to be a rime of the table.
  const firstVowel = graphemes.findIndex((g) => VOWELS.has(g));
  if (firstVowel >= 0) {
    const rime = graphemes.slice(firstVowel).join("");
    if (rime.length > 1 && !taught.rimes.has(rime)) out.push(`vần "${rime}"`);
  }
  return [...new Set(out)];
}

/** A word of one grapheme ("o", "ă", "ngh") is a letter foil, not something to decode. */
export function isSingleGrapheme(word: string): boolean {
  return graphemesOf(splitTone(word).base).length <= 1;
}

export interface ProgressionIssue {
  where: string;
  word: string;
  parts: string[];
}

/**
 * Checks one piece of printed Vietnamese. `where` is echoed back so the caller can say which
 * field of which exercise is at fault.
 */
export function checkPrintedVietnamese(
  where: string,
  text: string,
  taught: TaughtSet,
): ProgressionIssue[] {
  const issues: ProgressionIssue[] = [];
  for (const word of text.split(/[^\p{L}]+/u).filter(Boolean)) {
    if (isSingleGrapheme(word)) continue;
    const parts = untaughtPartsOf(word, taught);
    if (parts.length > 0) issues.push({ where, word, parts });
  }
  return issues;
}
