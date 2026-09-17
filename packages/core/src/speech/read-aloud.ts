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

/**
 * How much of the text has to be read for it to count as read (owner, 18/09/2026).
 *
 * Vietnamese is the reading lesson itself — a dropped syllable is the thing being practised, so
 * the bar stays where docs/04 §7 put it. English is pronunciation practice on a browser recogniser
 * that mishears a six-year-old for reasons that are not the child's fault, so it is scored by how
 * much matched and passes well below a perfect reading.
 */
export const PASS_ACCURACY = { vi: 0.85, en: 0.6 } as const;

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

/** Levenshtein distance, for "the recogniser wrote it down slightly wrong". */
function editDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0] as number;
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const next = Math.min(
        (prev[j] as number) + 1,
        (prev[j - 1] as number) + 1,
        diag + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diag = prev[j] as number;
      prev[j] = next;
    }
  }
  return prev[b.length] as number;
}

/**
 * Same word once the accent is allowed for. Tones still count: "ba" is not "bà".
 *
 * English also forgives one or two letters, because that is what the recogniser does to a child's
 * "fourteen" ("forteen", "fourty..."). The allowance is small on purpose: "four" and "five" are two
 * letters apart and must stay different words.
 */
export function sameWord(expected: string, heard: string, lang: "vi" | "en" = "vi"): boolean {
  if (expected.toLowerCase() === heard.toLowerCase()) return true;
  const want = spokenKey(expected, lang);
  const got = spokenKey(heard, lang);
  if (want === got) return true;
  if (lang === "en" && want.length >= 4) {
    const allowed = want.length <= 5 ? 1 : 2;
    return editDistance(want, got) <= allowed;
  }
  // A missing tone mark is a reading mistake, not an accent — it must not pass here.
  return false;
}

/**
 * The recogniser often writes one spoken word as two ("fourteen" → "four teen"). Glue such a pair
 * back together when the join is a word the child was asked to read; otherwise the alignment counts
 * a word the child did say as missing.
 */
function joinSplitWords(want: string[], got: string[], lang: "vi" | "en"): string[] {
  if (lang !== "en" || got.length < 2) return got;
  const out: string[] = [];
  for (let i = 0; i < got.length; i++) {
    const pair = `${got[i]}${got[i + 1] ?? ""}`;
    const joins =
      i + 1 < got.length &&
      want.some(
        (w) =>
          sameWord(w, pair, lang) &&
          !sameWord(w, got[i] as string, lang) &&
          !sameWord(w, got[i + 1] as string, lang),
      );
    if (joins) {
      out.push(pair);
      i++;
    } else out.push(got[i] as string);
  }
  return out;
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
  const got = joinSplitWords(want, normaliseSpoken(heard), lang);

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
    // docs/04 §7 for Vietnamese: above 0.85 is a pass, below 0.5 another go, in between a parent
    // decides. English passes at PASS_ACCURACY.en and is never held for a parent (ADR-27).
    verdict:
      accuracy >= PASS_ACCURACY[lang]
        ? "good"
        : accuracy >= PASS_ACCURACY[lang] * 0.6
          ? "partial"
          : "retry",
  };
}
