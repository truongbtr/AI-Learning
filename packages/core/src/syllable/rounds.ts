/**
 * The rounds of Xưởng Tiếng (pha 12, ADR-24): which tiles, cards, notches and carriages a child
 * gets for a handful of syllables. Pure — the database chooses the syllables, this decides what to
 * put around them, and the tests hold it to three promises:
 *
 *   1. no syllable twice in one round;
 *   2. every distractor is a REAL onset, rime or tone — never an invented string;
 *   3. the numbers are what the game expects (three tiles a slot, exactly two cards …).
 */
import { joinSyllable, ONSETS, TONES, type Tone } from "./parts";

/** The six games, by the id the kid UI and the API use. */
export const SYLLABLE_GAMES = ["build", "split", "tone", "pair", "train", "read"] as const;
export type SyllableGameId = (typeof SYLLABLE_GAMES)[number];

/** The ExerciseType each game stands for (docs/06 §1.10). */
export const SYLLABLE_GAME_TYPES: Record<SyllableGameId, string> = {
  build: "SYL_BUILD",
  split: "SYL_SPLIT",
  tone: "SYL_TONE",
  pair: "SYL_PAIR",
  train: "SYL_TRAIN",
  read: "SYL_READ",
};

/** Vietnamese names, said out loud when a station opens. */
export const SYLLABLE_GAME_NAMES: Record<SyllableGameId, string> = {
  build: "Lắp tiếng",
  split: "Tách tiếng",
  tone: "Bánh xe thanh điệu",
  pair: "Cặp dễ lẫn",
  train: "Tàu chở vần",
  read: "Đọc to",
};

/** One syllable as the games see it. */
export interface GameSyllable {
  id: string;
  text: string;
  onset: string;
  rime: string;
  tone: Tone;
  meaning: string;
  picture: unknown | null;
  skillCode: string;
}

export type Rng = () => number;

export function shuffleWith<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/** A small seeded generator (mulberry32), so a test — or a reload — gets the same round. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Drops repeats (same id or same written text), keeping the first. */
export function distinctSyllables<T extends { id: string; text: string }>(
  items: readonly T[],
): T[] {
  const ids = new Set<string>();
  const texts = new Set<string>();
  const out: T[] = [];
  for (const s of items) {
    if (ids.has(s.id) || texts.has(s.text)) continue;
    ids.add(s.id);
    texts.add(s.text);
    out.push(s);
  }
  return out;
}

// ------------------------------------------------------------------ what a child mixes up

/** Onsets a six-year-old swaps for each other (docs/04 error codes, ADR-24). */
const ONSET_CONFUSIONS: Record<string, readonly string[]> = {
  b: ["d", "đ"],
  d: ["b", "gi", "r", "đ"],
  đ: ["d", "b"],
  ch: ["tr"],
  tr: ["ch"],
  s: ["x"],
  x: ["s"],
  ng: ["ngh", "nh"],
  ngh: ["ng"],
  g: ["gh", "gi"],
  gh: ["g"],
  gi: ["d", "r"],
  r: ["d", "gi"],
  c: ["k", "qu"],
  k: ["c", "kh"],
  qu: ["c"],
  l: ["n"],
  n: ["l", "nh"],
  nh: ["n", "ng"],
  th: ["t", "kh"],
  t: ["th"],
  kh: ["k", "h"],
  h: ["kh"],
  ph: ["p", "b"],
  m: ["n"],
  v: ["b"],
};

/** Letters that differ only by a hat or a hook: o/ô/ơ, e/ê, u/ư, a/ă/â. */
const VOWEL_SIBLINGS: Record<string, readonly string[]> = {
  a: ["ă", "â"],
  ă: ["a", "â"],
  â: ["a", "ă"],
  e: ["ê"],
  ê: ["e"],
  o: ["ô", "ơ"],
  ô: ["o", "ơ"],
  ơ: ["o", "ô"],
  u: ["ư"],
  ư: ["u"],
  i: ["y"],
  y: ["i"],
};

/** Endings a child mishears: n/ng, t/c, nh/ch. */
const ENDING_SWAPS: readonly [string, string][] = [
  ["ng", "n"],
  ["nh", "n"],
  ["ch", "c"],
  ["c", "t"],
  ["t", "c"],
  ["n", "ng"],
  ["m", "n"],
  ["p", "t"],
];

/** Tones heard alike: hỏi/ngã above all. */
const TONE_CONFUSIONS: Record<Tone, readonly Tone[]> = {
  ngang: ["huyen", "sac"],
  huyen: ["ngang", "nga"],
  sac: ["hoi", "nang"],
  hoi: ["nga", "sac"],
  nga: ["hoi", "sac"],
  nang: ["sac", "huyen"],
};

/** Rimes that are one hat or one ending away from `rime`, restricted to rimes that exist. */
export function confusableRimes(rime: string, known: ReadonlySet<string>): string[] {
  const out = new Set<string>();
  const letters = [...rime];
  letters.forEach((ch, i) => {
    for (const sib of VOWEL_SIBLINGS[ch] ?? []) {
      const next = [...letters];
      next[i] = sib;
      out.add(next.join(""));
    }
  });
  for (const [from, to] of ENDING_SWAPS) {
    if (rime.endsWith(from) && rime.length > from.length) out.add(rime.slice(0, -from.length) + to);
  }
  out.delete(rime);
  return [...out].filter((r) => known.has(r));
}

/**
 * `n` distractors for one slot: the confusable ones first, then any other real piece. Never the
 * target, never a repeat, never anything outside `pool`.
 */
function distractors<T extends string>(
  target: T,
  confusable: readonly T[],
  pool: readonly T[],
  n: number,
  rng: Rng,
): T[] {
  const inPool = new Set(pool);
  const picked: T[] = [];
  for (const c of shuffleWith(confusable, rng)) {
    if (picked.length >= n) break;
    if (c !== target && inPool.has(c) && !picked.includes(c)) picked.push(c);
  }
  for (const c of shuffleWith(pool, rng)) {
    if (picked.length >= n) break;
    if (c !== target && !picked.includes(c)) picked.push(c);
  }
  return picked;
}

export interface PieceTables {
  /** Every onset the dictionary teaches ("b", "ngh", …). */
  onsets: readonly string[];
  /** Every rime the dictionary teaches ("a", "an", "uyên", …). */
  rimes: readonly string[];
}

/** The onsets of `ONSETS` — the default table when the dictionary is not at hand. */
export const DEFAULT_ONSETS: readonly string[] = ONSETS;

// ------------------------------------------------------------------ (a)/(b) lắp tiếng, tách tiếng

export interface BuildItem {
  syllable: GameSyllable;
  /** Tiles for the onset slot — empty when the syllable has none ("anh"). */
  onsets: string[];
  rimes: string[];
  tones: Tone[];
  /** Tách tiếng: the written syllable is on screen from the start. */
  showWord: boolean;
}

export interface BuildOptions {
  rng: Rng;
  /** Tiles offered per slot, the right one included. 3 by default: big tiles, few of them. */
  perSlot?: number;
  split?: boolean;
}

export function buildRound(
  targets: readonly GameSyllable[],
  tables: PieceTables,
  opts: BuildOptions,
): BuildItem[] {
  const perSlot = Math.max(2, opts.perSlot ?? 3);
  const rimeSet = new Set(tables.rimes);
  return distinctSyllables(targets).map((s) => {
    const onsets = s.onset
      ? shuffleWith(
          [
            s.onset,
            ...distractors(
              s.onset,
              ONSET_CONFUSIONS[s.onset] ?? [],
              tables.onsets,
              perSlot - 1,
              opts.rng,
            ),
          ],
          opts.rng,
        )
      : [];
    const rimes = shuffleWith(
      [
        s.rime,
        ...distractors(
          s.rime,
          confusableRimes(s.rime, rimeSet),
          tables.rimes,
          perSlot - 1,
          opts.rng,
        ),
      ],
      opts.rng,
    );
    const tones = shuffleWith(
      [s.tone, ...distractors(s.tone, TONE_CONFUSIONS[s.tone], TONES, perSlot - 1, opts.rng)],
      opts.rng,
    );
    return { syllable: s, onsets, rimes, tones, showWord: opts.split === true };
  });
}

export type BuildMistake = "onset" | "rime" | "tone";

/**
 * What a child's three tiles got wrong, in the order the error codes are looked at. Empty when the
 * build is the syllable. Compared piece by piece, never by the written result, so "gh" for "g" is
 * an onset mistake even where the letters happen to spell a real word.
 */
export function buildMistakes(
  target: Pick<GameSyllable, "onset" | "rime" | "tone">,
  built: { onset: string; rime: string; tone: Tone },
): BuildMistake[] {
  const out: BuildMistake[] = [];
  if (built.onset !== target.onset) out.push("onset");
  if (built.rime !== target.rime) out.push("rime");
  if (built.tone !== target.tone) out.push("tone");
  return out;
}

/**
 * The error code for a build, from the taxonomy (docs/04 §11.1): the onset slot first, then the
 * rime, then the tone — one code per meeting, the one a parent would fix first.
 */
export function buildErrorCode(
  target: Pick<GameSyllable, "onset" | "rime" | "tone">,
  built: { onset: string; rime: string; tone: Tone },
): string | null {
  const [first] = buildMistakes(target, built);
  if (!first) return null;
  if (first === "onset") return pairErrorCode(target.onset, built.onset) ?? "nham_am_dau";
  if (first === "rime") return "doc_nham_van";
  return toneErrorCode(target.tone, built.tone);
}

/** A tone mix-up: hỏi/ngã has its own code, the rest are "sai dấu thanh". */
export function toneErrorCode(target: Tone, chosen: Tone): string {
  const pair = new Set([target, chosen]);
  if (pair.has("hoi") && pair.has("nga")) return "nham_hoi_nga";
  if (chosen === "ngang" && target !== "ngang") return "thieu_dau_thanh";
  return "sai_dau_thanh";
}

// ------------------------------------------------------------------ (d) cặp dễ lẫn

export type PairKind = "b_d" | "ch_tr" | "s_x" | "ng_ngh" | "c_k" | "hoi_nga";

const PAIR_ONSETS: Record<string, { other: string; kind: PairKind }> = {
  b: { other: "d", kind: "b_d" },
  d: { other: "b", kind: "b_d" },
  ch: { other: "tr", kind: "ch_tr" },
  tr: { other: "ch", kind: "ch_tr" },
  s: { other: "x", kind: "s_x" },
  x: { other: "s", kind: "s_x" },
  ng: { other: "ngh", kind: "ng_ngh" },
  ngh: { other: "ng", kind: "ng_ngh" },
  c: { other: "k", kind: "c_k" },
  k: { other: "c", kind: "c_k" },
};

export const PAIR_ERROR_CODES: Record<PairKind, string> = {
  b_d: "nham_b_d",
  ch_tr: "nham_ch_tr",
  s_x: "nham_s_x",
  ng_ngh: "nham_ng_ngh",
  c_k: "nham_c_k_q",
  hoi_nga: "nham_hoi_nga",
};

/** The pair-specific code when two onsets are a known pair ("b" for "d" → nham_b_d). */
export function pairErrorCode(target: string, chosen: string): string | null {
  const p = PAIR_ONSETS[target];
  return p && p.other === chosen ? PAIR_ERROR_CODES[p.kind] : null;
}

export interface PairItem {
  syllable: GameSyllable;
  kind: PairKind;
  /** Exactly two cards, shuffled: the syllable and its look-alike. */
  cards: [string, string];
  errorCode: string;
}

/** The look-alike of a syllable for its pair, or null when it has none. */
export function lookAlike(s: GameSyllable): { text: string; kind: PairKind } | null {
  if (s.tone === "hoi" || s.tone === "nga") {
    const other: Tone = s.tone === "hoi" ? "nga" : "hoi";
    return { text: joinSyllable(s.onset, s.rime, other), kind: "hoi_nga" };
  }
  const p = PAIR_ONSETS[s.onset];
  if (!p) return null;
  return { text: joinSyllable(p.other, s.rime, s.tone), kind: p.kind };
}

/** Only syllables that belong to a pair get a card; the rest are left for other games. */
export function pairRound(targets: readonly GameSyllable[], rng: Rng): PairItem[] {
  const out: PairItem[] = [];
  for (const s of distinctSyllables(targets)) {
    const twin = lookAlike(s);
    if (!twin || twin.text === s.text) continue;
    const cards = shuffleWith([s.text, twin.text], rng) as [string, string];
    out.push({ syllable: s, kind: twin.kind, cards, errorCode: PAIR_ERROR_CODES[twin.kind] });
  }
  return out;
}

// ------------------------------------------------------------------ (c) bánh xe thanh điệu

export interface ToneNotch {
  tone: Tone;
  text: string;
  /** The dictionary knows this syllable: its picture comes up when the wheel stops here. */
  syllable: GameSyllable | null;
}

export interface ToneItem {
  /** The syllable the machine asks for. */
  syllable: GameSyllable;
  onset: string;
  rime: string;
  /** Always six, in the order of `TONES`. */
  notches: ToneNotch[];
}

/**
 * One wheel per target: the onset and rime stay, the tone turns. Targets whose base has the most
 * real syllables come first, and hỏi/ngã targets before the rest when `preferHoiNga` — the pair a
 * child who mixes them up needs to hear side by side.
 */
export function toneRound(
  targets: readonly GameSyllable[],
  dictionary: readonly GameSyllable[],
  opts: { rng: Rng; preferHoiNga?: boolean; size?: number },
): ToneItem[] {
  const byText = new Map(dictionary.map((s) => [s.text, s]));
  const items = distinctSyllables(targets).map((s) => {
    const notches = TONES.map((t) => {
      const text = joinSyllable(s.onset, s.rime, t);
      return { tone: t, text, syllable: byText.get(text) ?? null };
    });
    return { syllable: s, onset: s.onset, rime: s.rime, notches };
  });
  // one wheel per base: "má" and "mà" would be the same wheel twice
  const seenBase = new Set<string>();
  const unique = items.filter((it) => {
    const key = `${it.onset}|${it.rime}`;
    if (seenBase.has(key)) return false;
    seenBase.add(key);
    return true;
  });
  const real = (it: ToneItem) => it.notches.filter((n) => n.syllable).length;
  const hn = (it: ToneItem) =>
    opts.preferHoiNga && (it.syllable.tone === "hoi" || it.syllable.tone === "nga") ? 1 : 0;
  const ranked = shuffleWith(unique, opts.rng).sort((a, b) => hn(b) - hn(a) || real(b) - real(a));
  return ranked.slice(0, opts.size ?? 4);
}

// ------------------------------------------------------------------ (e) tàu chở vần

export interface TrainCar {
  /** The rime with its tone, as it is written on the carriage ("à", "an", "ồng"). */
  chunk: string;
  rime: string;
  tone: Tone;
  /** Onset tiles offered for this carriage — some make a real syllable, some do not. */
  onsets: string[];
  /** onset → the dictionary syllable it makes. Onsets missing here make nothing meaningful. */
  answers: Record<string, GameSyllable>;
}

/** How many meaningful syllables end a round, unless the child says "xong" first. */
export const TRAIN_GOAL = 4;

/**
 * Carriages for Tàu chở vần. A carriage is a rime+tone that at least `minAnswers` onsets turn into
 * a real syllable from `dictionary`; its tiles are some of those onsets plus real onsets that turn
 * it into nothing — so a child can try, hear "chưa có nghĩa", and try again.
 *
 * `allowed` limits the syllables that count, usually to what the class has reached.
 */
export function trainRound(
  dictionary: readonly GameSyllable[],
  opts: {
    rng: Rng;
    allowed?: (s: GameSyllable) => boolean;
    cars?: number;
    minAnswers?: number;
    tilesPerCar?: number;
    onsets?: readonly string[];
  },
): TrainCar[] {
  const minAnswers = opts.minAnswers ?? 3;
  const tilesPerCar = opts.tilesPerCar ?? 6;
  const pool = opts.onsets ?? DEFAULT_ONSETS;
  const groups = new Map<string, GameSyllable[]>();
  for (const s of dictionary) {
    if (!s.onset) continue;
    if (opts.allowed && !opts.allowed(s)) continue;
    const key = `${s.rime}|${s.tone}`;
    const list = groups.get(key) ?? [];
    if (!list.some((x) => x.onset === s.onset)) list.push(s);
    groups.set(key, list);
  }
  const eligible = shuffleWith(
    [...groups.values()].filter((g) => g.length >= minAnswers),
    opts.rng,
  );
  const cars: TrainCar[] = [];
  for (const group of eligible.slice(0, opts.cars ?? 2)) {
    const first = group[0] as GameSyllable;
    const right = shuffleWith(group, opts.rng).slice(0, Math.min(4, tilesPerCar - 2));
    const makes = new Set(group.map((s) => s.onset));
    const wrong = shuffleWith(
      pool.filter((o) => !makes.has(o)),
      opts.rng,
    ).slice(0, tilesPerCar - right.length);
    const answers: Record<string, GameSyllable> = {};
    for (const s of group) answers[s.onset] = s;
    cars.push({
      chunk: joinSyllable("", first.rime, first.tone),
      rime: first.rime,
      tone: first.tone,
      onsets: shuffleWith([...right.map((s) => s.onset), ...wrong], opts.rng),
      answers,
    });
  }
  return cars;
}

// ------------------------------------------------------------------ which games are open

export interface SyllableStats {
  /** Syllables met at least once. */
  met: number;
  /** Syllables at box 2 or above. */
  steady: number;
  /** Build meetings with syllables that were already at box ≥ 2, and how many were right. */
  buildAtBox2: { seen: number; correct: number };
  /** The class has reached this SGK week (all six tones are taught by week 2). */
  classWeek: number;
}

/** Tách tiếng opens once the child builds ≥ 80% right on syllables they already know (box ≥ 2). */
export const SPLIT_ACCURACY = 0.8;
export const SPLIT_MIN_SEEN = 5;
/** The tone wheel needs all six tones taught (Bài 9, week 2) and a few syllables met. */
export const TONE_MIN_MET = 6;
export const TONE_MIN_WEEK = 2;
/** The train needs enough rimes in the child's ear to find words with. */
export const TRAIN_MIN_STEADY = 10;

export function unlockedGames(stats: SyllableStats): SyllableGameId[] {
  const open: SyllableGameId[] = ["build", "pair", "read"];
  const { seen, correct } = stats.buildAtBox2;
  if (seen >= SPLIT_MIN_SEEN && correct / seen >= SPLIT_ACCURACY) open.push("split");
  if (stats.met >= TONE_MIN_MET && stats.classWeek >= TONE_MIN_WEEK) open.push("tone");
  if (stats.steady >= TRAIN_MIN_STEADY) open.push("train");
  return open;
}

/**
 * The two games of one station, different from each other, turning with the day so an evening
 * never repeats the one before. Lắp tiếng is the core game and opens every first round; the
 * second round takes the rest in turn.
 */
export function stationGames(
  open: readonly SyllableGameId[],
  dayNumber: number,
  stationIndex: number,
): [SyllableGameId, SyllableGameId] {
  const others = SYLLABLE_GAMES.filter((g) => g !== "build" && open.includes(g));
  const second = others.length > 0 ? others[(dayNumber + stationIndex) % others.length] : "pair";
  // the second station of an evening leads with something other than building, when it can
  const first: SyllableGameId =
    stationIndex % 2 === 1 && others.length > 1
      ? (others[(dayNumber + stationIndex + 1) % others.length] as SyllableGameId)
      : "build";
  return [first, (second === first ? "build" : second) as SyllableGameId];
}
