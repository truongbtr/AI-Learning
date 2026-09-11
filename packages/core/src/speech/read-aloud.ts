/**
 * Marking a READ_ALOUD attempt, on the device and on the server (docs/04 §7).
 *
 * No AI: the words are known, the child's speech comes back from the browser as text, and the two
 * are lined up word by word. What makes it fair is the tolerance table — a six-year-old in the
 * north of Vietnam says "trâu" as "châu" and "rổ" as "dổ", and the speech recogniser writes down
 * whichever it heard. Marking that as a mistake would teach the child that their own accent is
 * wrong, so the pairs below count as the same word.
 *
 * Pure: no browser, no network, so both the kid component and `POST /api/attempts` use it and the
 * same attempt is never marked two different ways.
 */

export interface ReadAloudResult {
  /** 0–1: how many of the expected words were read. */
  accuracy: number;
  /** Per expected word, in order. */
  words: { word: string; ok: boolean; heardAs?: string }[];
  missed: string[];
  /** Words the child said that are not in the text — usually a false start, not an error. */
  extra: string[];
  wordsPerMinute: number | null;
  /** What the caller should do next (docs/04 §7: the grey zone goes to a parent, not to a guess). */
  verdict: "good" | "partial" | "retry";
}

/** Lower case, no punctuation, tones kept (they are the point in Vietnamese). */
export function normaliseSpoken(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[.,!?;:"“”'’()[\]…]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Sounds a child (or a recogniser) swaps without being wrong about the word.
 * Northern Vietnamese: s/x, ch/tr, r/d/gi, and the final pairs n/ng and t/c.
 */
const VI_EQUIVALENT: [RegExp, string][] = [
  [/^(s|x)/, "S"],
  [/^(ch|tr)/, "C"],
  [/^(r|d|gi)/, "R"],
  [/n$/, "N"],
  [/ng$/, "N"],
  [/t$/, "T"],
  [/c$/, "T"],
];

/** A key two words share when a child's accent would make them sound the same. */
export function spokenKey(word: string, lang: "vi" | "en" = "vi"): string {
  let w = word.toLowerCase();
  if (lang === "en") return w.replace(/[^a-z]/g, "");
  for (const [pattern, replacement] of VI_EQUIVALENT) w = w.replace(pattern, replacement);
  return w;
}

/** Same word once the accent is allowed for. Tones still count: "ba" is not "bà". */
export function sameWord(expected: string, heard: string, lang: "vi" | "en" = "vi"): boolean {
  if (expected.toLowerCase() === heard.toLowerCase()) return true;
  if (spokenKey(expected, lang) === spokenKey(heard, lang)) return true;
  // A missing tone mark is a reading mistake, not an accent — it must not pass here.
  return false;
}

/**
 * Lines the child's words up with the text, allowing words to be skipped or added, and returns
 * what was read. `seconds` is how long they spoke, for the words-per-minute figure.
 */
export function matchReadAloud(
  expected: string[],
  heard: string,
  opts: { lang?: "vi" | "en"; seconds?: number } = {},
): ReadAloudResult {
  const lang = opts.lang ?? "vi";
  const want = expected.flatMap((w) => normaliseSpoken(w));
  const got = normaliseSpoken(heard);

  // Needleman–Wunsch alignment: cheap, and it handles "skipped a word" and "said it twice".
  const n = want.length;
  const m = got.length;
  const score: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) score[i]![0] = -i;
  for (let j = 1; j <= m; j++) score[0]![j] = -j;
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++) {
      const hit = sameWord(want[i - 1] as string, got[j - 1] as string, lang) ? 1 : -1;
      score[i]![j] = Math.max(
        (score[i - 1]![j - 1] as number) + hit,
        (score[i - 1]![j] as number) - 1,
        (score[i]![j - 1] as number) - 1,
      );
    }

  const words: ReadAloudResult["words"] = want.map((w) => ({ word: w, ok: false }));
  const extra: string[] = [];
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    const hit = sameWord(want[i - 1] as string, got[j - 1] as string, lang) ? 1 : -1;
    if (score[i]![j] === (score[i - 1]![j - 1] as number) + hit) {
      if (hit === 1) {
        words[i - 1] = { word: want[i - 1] as string, ok: true, heardAs: got[j - 1] };
      } else {
        words[i - 1] = { word: want[i - 1] as string, ok: false, heardAs: got[j - 1] };
      }
      i--;
      j--;
    } else if (score[i]![j] === (score[i - 1]![j] as number) - 1) {
      i--;
    } else {
      extra.unshift(got[j - 1] as string);
      j--;
    }
  }
  while (j > 0) {
    extra.unshift(got[j - 1] as string);
    j--;
  }

  const ok = words.filter((w) => w.ok).length;
  const accuracy = want.length === 0 ? 0 : ok / want.length;
  const seconds = opts.seconds ?? 0;
  const wordsPerMinute = seconds > 0 ? Math.round((ok / seconds) * 60) : null;

  return {
    accuracy,
    words,
    missed: words.filter((w) => !w.ok).map((w) => w.word),
    extra,
    wordsPerMinute,
    // docs/04 §7: above 0.85 is a pass, below 0.5 is another go; in between a parent decides.
    verdict: accuracy >= 0.85 ? "good" : accuracy >= 0.5 ? "partial" : "retry",
  };
}
