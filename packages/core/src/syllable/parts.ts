/**
 * The three pieces a Vietnamese syllable is made of — the onset, the rime and the tone — and the
 * tables the Xưởng Tiếng games hand a child to build one (pha 13, ADR-24).
 *
 * Everything here is pure data and pure functions: the games, the content validator and the mp3
 * pre-generation read the same tables, so every piece a child can touch is a piece the dictionary
 * already knows how to say.
 *
 * Vietnamese spelling as first grade teaches it: `tiếng = âm đầu + vần + thanh`. "bà" is b + a +
 * huyền, "anh" is ∅ + anh + ngang, "quyển" is qu + yên + hỏi. The tone is lifted off the letters
 * before anything else is decided, because "quyển" and "quyên" are the same rime.
 */

export type Tone = "ngang" | "huyen" | "sac" | "hoi" | "nga" | "nang";

/** Tone order everywhere in this phase, including the six notches of the tone wheel. */
export const TONES: readonly Tone[] = ["ngang", "huyen", "sac", "hoi", "nga", "nang"];

/** What the machine says when it names a tone out loud. */
export const TONE_NAMES: Record<Tone, string> = {
  ngang: "ngang",
  huyen: "huyền",
  sac: "sắc",
  hoi: "hỏi",
  nga: "ngã",
  nang: "nặng",
};

/** The mark drawn on the tone tile — a hat, never a word. */
export const TONE_MARKS: Record<Tone, string> = {
  ngang: "",
  huyen: "̀",
  sac: "́",
  hoi: "̉",
  nga: "̃",
  nang: "̣",
};

/**
 * Every vowel letter by its plain form and its six tone forms, in the order of `TONES`.
 * `â ê ô ơ ă ư` are letters in their own right here, not `a` with a hat: "quyên" keeps its ê.
 */
const VOWEL_ROWS: readonly (readonly string[])[] = [
  ["a", "à", "á", "ả", "ã", "ạ"],
  ["ă", "ằ", "ắ", "ẳ", "ẵ", "ặ"],
  ["â", "ầ", "ấ", "ẩ", "ẫ", "ậ"],
  ["e", "è", "é", "ẻ", "ẽ", "ẹ"],
  ["ê", "ề", "ế", "ể", "ễ", "ệ"],
  ["i", "ì", "í", "ỉ", "ĩ", "ị"],
  ["o", "ò", "ó", "ỏ", "õ", "ọ"],
  ["ô", "ồ", "ố", "ổ", "ỗ", "ộ"],
  ["ơ", "ờ", "ớ", "ở", "ỡ", "ợ"],
  ["u", "ù", "ú", "ủ", "ũ", "ụ"],
  ["ư", "ừ", "ứ", "ử", "ữ", "ự"],
  ["y", "ỳ", "ý", "ỷ", "ỹ", "ỵ"],
];

/** Vowels that take the tone mark before any other vowel in the same rime. */
const PRIORITY_VOWELS = "âêôơăư";

const TONE_OF_LETTER = new Map<string, { plain: string; tone: Tone }>();
const ROW_OF_PLAIN = new Map<string, readonly string[]>();
for (const row of VOWEL_ROWS) {
  const plain = row[0] as string;
  ROW_OF_PLAIN.set(plain, row);
  row.forEach((letter, i) => {
    TONE_OF_LETTER.set(letter, { plain, tone: TONES[i] as Tone });
  });
}

const CONSONANT_LETTERS = "bcdđghklmnpqrstvx";

/**
 * The onsets of first grade, longest first so "ngh" is never read as "ng" + "h".
 *
 * `qu` and `gi` are onsets here, which is the choice the school books make: a child is told "quả"
 * is quờ + a, not q + ua. ADR-24 records why the app follows the book and not the linguists.
 */
export const ONSETS: readonly string[] = [
  "ngh",
  "ng",
  "nh",
  "ch",
  "gh",
  "gi",
  "kh",
  "ph",
  "th",
  "tr",
  "qu",
  "b",
  "c",
  "d",
  "đ",
  "g",
  "h",
  "k",
  "l",
  "m",
  "n",
  "p",
  "r",
  "s",
  "t",
  "v",
  "x",
];

/**
 * How an onset is READ OUT LOUD, which is not its name.
 *
 * This is the reason the phase exists. A child taught letter names says "bê – a – ba" and gets
 * stuck; a child taught sounds says "bờ – a – ba" and reads. The current programme teaches the
 * sounds, so every piece in the games says its sound when it is touched.
 */
export const ONSET_SOUNDS: Record<string, string> = {
  b: "bờ",
  c: "cờ",
  ch: "chờ",
  d: "dờ",
  đ: "đờ",
  g: "gờ",
  gh: "gờ",
  gi: "giờ",
  h: "hờ",
  k: "cờ",
  kh: "khờ",
  l: "lờ",
  m: "mờ",
  n: "nờ",
  ng: "ngờ",
  ngh: "ngờ",
  nh: "nhờ",
  p: "pờ",
  ph: "phờ",
  qu: "quờ",
  r: "rờ",
  s: "sờ",
  t: "tờ",
  th: "thờ",
  tr: "trờ",
  v: "vờ",
  x: "xờ",
};

/** The sound of an onset, for a tile that speaks when it is touched. */
export function onsetSound(amDau: string): string {
  return ONSET_SOUNDS[amDau] ?? amDau;
}

/** True when every letter is one Vietnamese spelling uses. */
export function isVietnameseLetters(text: string): boolean {
  for (const ch of text) {
    if (!TONE_OF_LETTER.has(ch) && !CONSONANT_LETTERS.includes(ch)) return false;
  }
  return text.length > 0;
}

/** Lifts the tone off a written syllable: "quyển" → { plain: "quyên", tone: "hoi" }. */
export function stripTone(text: string): { plain: string; tone: Tone } {
  let tone: Tone = "ngang";
  let plain = "";
  for (const ch of text) {
    const found = TONE_OF_LETTER.get(ch);
    if (found) {
      plain += found.plain;
      if (found.tone !== "ngang") tone = found.tone;
    } else {
      plain += ch;
    }
  }
  return { plain, tone };
}

/**
 * Which letter of a toneless rime carries the mark:
 *   1. the last of `â ê ô ơ ă ư` — "ươu" puts it on the ơ, not the ư;
 *   2. otherwise the last vowel when a consonant follows it ("oan" → oàn);
 *   3. otherwise the vowel before the last ("oai" → oài, "ua" → ùa, "oe" → òe).
 *
 * This is the placing first-grade books print, which is what a six-year-old copies. Whether "hoà"
 * or "hòa" is the better spelling is an argument for grown-ups.
 */
function tonePosition(plainRime: string): number {
  const letters = [...plainRime];
  const vowelAt: number[] = [];
  letters.forEach((ch, i) => {
    if (ROW_OF_PLAIN.has(ch)) vowelAt.push(i);
  });
  if (vowelAt.length === 0) return -1;
  let priority = -1;
  letters.forEach((ch, i) => {
    if (PRIORITY_VOWELS.includes(ch)) priority = i;
  });
  if (priority >= 0) return priority;
  if (vowelAt.length === 1) return vowelAt[0] as number;
  const last = vowelAt[vowelAt.length - 1] as number;
  const endsInVowel = last === letters.length - 1;
  return endsInVowel ? (vowelAt[vowelAt.length - 2] as number) : last;
}

/** Writes a toneless rime with its tone put back on: ("yên", "hoi") → "yển". */
export function applyTone(plainRime: string, tone: Tone): string {
  if (tone === "ngang") return plainRime;
  const at = tonePosition(plainRime);
  if (at < 0) return plainRime;
  const letters = [...plainRime];
  const row = ROW_OF_PLAIN.get(letters[at] as string);
  if (!row) return plainRime;
  letters[at] = row[TONES.indexOf(tone)] as string;
  return letters.join("");
}

export interface SyllableParts {
  /** "" when the syllable starts with its rime ("anh", "ăn"). */
  amDau: string;
  /** Spelt as the book prints the rime tile — "yên", "ươn", "oan" — and never with a tone mark. */
  van: string;
  thanh: Tone;
}

/**
 * Splits a written syllable into the three pieces a child puts in the three slots, or null when
 * the text is not one syllable this phase can build.
 *
 * Out of scope on purpose: the merged spellings "gì" and "gìn", where the i of the onset "gi" and
 * the i of the rime are written as one letter. They cannot be built out of three tiles without
 * teaching a six-year-old an exception, and the content validator refuses them.
 */
export function splitSyllable(text: string): SyllableParts | null {
  const raw = text.trim().toLowerCase().normalize("NFC");
  if (!isVietnameseLetters(raw)) return null;
  const { plain, tone } = stripTone(raw);
  for (const onset of ONSETS) {
    if (!plain.startsWith(onset)) continue;
    const rest = plain.slice(onset.length);
    // a rime always starts with a vowel; "g" + "ia" is "gi" + "a", handled by the longest-first list
    if (rest.length === 0 || !ROW_OF_PLAIN.has(rest[0] as string)) continue;
    return { amDau: onset, van: rest, thanh: tone };
  }
  if (ROW_OF_PLAIN.has(plain[0] as string)) return { amDau: "", van: plain, thanh: tone };
  return null;
}

/** Puts the three pieces back together the way they are written: ("qu", "yên", "hoi") → "quyển". */
export function joinSyllable(amDau: string, van: string, thanh: Tone): string {
  return amDau + applyTone(van, thanh);
}
