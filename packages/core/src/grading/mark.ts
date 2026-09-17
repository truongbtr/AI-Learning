/**
 * Marking one attempt at a closed exercise (docs/04 §7) and the three-try feedback ladder
 * (docs/04 §6 last paragraph).
 *
 * Pure on purpose. The answer never reaches the child's device (ADR-14), so marking happens on
 * the server — but the same functions run in a unit test, which is the only way to be sure that a
 * child who taps the right card is never told otherwise.
 *
 * Nothing here calls an AI. A photo of handwriting and a reading in the grey zone are marked
 * `pending`: they go to the offline queue or to a parent (ADR-9, ADR-10).
 */
import { matchReadAloud, type ReadAloudResult } from "../speech/read-aloud";

export type MarkableType =
  | "MCQ"
  | "LISTEN_CHOOSE"
  | "DRAG_DROP"
  | "COUNT_TAP"
  | "READ_ALOUD"
  | "WRITE_PHOTO"
  | "TRACE"
  | "SPEAK_ANSWER"
  | "MINI_STORY";

export type Outcome = "CORRECT" | "PARTIAL" | "INCORRECT" | "OBSERVED";

/** `Exercise.answerKey`: the server-only bundle built by `answerBundleOf` (ADR-14). */
export interface AnswerBundle {
  value: unknown;
  /** choice id or drag-card id -> error code (docs/04 §11.2, ADR-15). */
  errorTags?: Record<string, string>;
  correctCount?: number;
  /**
   * DRAG_DROP: every card the child sees (from the spec). A card that is on screen but absent from
   * the key is a distractor that belongs in the tray — dropping it in a zone is a real mistake.
   */
  cards?: string[];
  /**
   * DRAG_DROP: card id -> what the card looks like, for cards that look exactly like another card.
   * Seven identical dots dragged into a ten-frame are right whichever seven they are (pha 13), so
   * the key's ids stand for "a card that looks like this", not for one particular card.
   */
  twins?: Record<string, string>;
}

/** What a drag card shows, as a comparable string. */
function faceOf(item: { text?: unknown; image?: unknown }): string {
  return JSON.stringify([item.text ?? null, item.image ?? null]);
}

/**
 * Cards that look the same as at least one other card (from the spec the child was shown).
 * Returns undefined when every card is different — the common case, and the old behaviour.
 */
export function twinsOf(
  items: { id?: unknown; text?: unknown; image?: unknown }[],
): Record<string, string> | undefined {
  const byFace = new Map<string, string[]>();
  for (const item of items) {
    if (typeof item.id !== "string") continue;
    const face = faceOf(item);
    byFace.set(face, [...(byFace.get(face) ?? []), item.id]);
  }
  const out: Record<string, string> = {};
  for (const [face, ids] of byFace) if (ids.length > 1) for (const id of ids) out[id] = face;
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Renames twin cards so the answer key's ids line up with where the child put look-alikes.
 * In each zone a twin takes the id of a key card of the same face still unclaimed there; a twin
 * with no such place takes the id of a look-alike the key leaves in the tray, so an extra dot is
 * still an extra dot. `original` maps a new id back to the card the child actually moved.
 */
export function resolveTwins(
  key: AnswerBundle,
  placements: Record<string, string[]>,
): { placements: Record<string, string[]>; original: Map<string, string> } {
  const original = new Map<string, string>();
  const twins = key.twins;
  if (!twins) return { placements, original };
  const want = (key.value ?? {}) as Record<string, string[]>;
  const inKey = new Set(Object.values(want).flat());
  const take = (pool: Map<string, string[]>, face: string) => pool.get(face)?.shift();
  const spare = new Map<string, string[]>();
  for (const id of key.cards ?? [])
    if (twins[id] && !inKey.has(id)) spare.set(twins[id], [...(spare.get(twins[id]) ?? []), id]);
  const out: Record<string, string[]> = {};
  for (const [zoneId, ids] of Object.entries(placements)) {
    const pool = new Map<string, string[]>();
    for (const id of want[zoneId] ?? [])
      if (twins[id]) pool.set(twins[id], [...(pool.get(twins[id]) ?? []), id]);
    out[zoneId] = (ids ?? []).map((id) => {
      const face = twins[id];
      if (!face) return id;
      const renamed = take(pool, face) ?? take(spare, face) ?? id;
      if (!original.has(renamed)) original.set(renamed, id);
      return renamed;
    });
  }
  return { placements: out, original };
}

/** What the kid renderer sends back. Every field is optional: a child may simply skip. */
export interface AttemptResponse {
  /** MCQ, LISTEN_CHOOSE. */
  choiceId?: string;
  /** DRAG_DROP: zone id -> the card ids dropped in it. */
  placements?: Record<string, string[]>;
  /** COUNT_TAP: how many objects the child tapped. */
  count?: number;
  /** READ_ALOUD: what the speech recogniser heard. */
  heard?: string;
  seconds?: number;
  /** READ_ALOUD without a recogniser: a grown-up listened and said yes. */
  parentVerdict?: "good" | "retry";
  /** WRITE_PHOTO: the stored photo. */
  photoKey?: string;
  /** The child moved on without answering. */
  skipped?: boolean;
}

export interface MarkResult {
  correct: boolean;
  outcome: Outcome;
  /** 0–1. DRAG_DROP is the share of cards in the right place; READ_ALOUD is the accuracy. */
  score: number;
  /** The diagnosis to store on the Evidence row, when the answer names one. */
  errorCode: string | null;
  /** The server cannot decide alone — a photo to grade, or a reading a grown-up should hear. */
  pending: boolean;
  /** Cards in the wrong zone; the renderer floats exactly these home. */
  wrongItems?: string[];
  /** The word-by-word result, so the screen can highlight what to try again. */
  readAloud?: ReadAloudResult;
}

const BLANK = "bo_trong";

function nonEmpty(v: string | undefined | null): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function blank(): MarkResult {
  return { correct: false, outcome: "INCORRECT", score: 0, errorCode: BLANK, pending: false };
}

function tagOf(key: AnswerBundle, id: string | undefined): string | null {
  if (!id) return null;
  return key.errorTags?.[id] ?? null;
}

/** MCQ and LISTEN_CHOOSE: one of the choice ids. */
function markChoice(key: AnswerBundle, res: AttemptResponse): MarkResult {
  if (res.skipped || !nonEmpty(res.choiceId)) return blank();
  const correct = res.choiceId === key.value;
  return {
    correct,
    outcome: correct ? "CORRECT" : "INCORRECT",
    score: correct ? 1 : 0,
    errorCode: correct ? null : tagOf(key, res.choiceId),
    pending: false,
  };
}

/** DRAG_DROP: the share of cards that ended up where the answer key puts them (docs/04 §7). */
function markDrag(key: AnswerBundle, res: AttemptResponse): MarkResult {
  const want = (key.value ?? {}) as Record<string, string[]>;
  const twin = resolveTwins(key, res.placements ?? {});
  const got = twin.placements;
  const home = new Map<string, string>();
  for (const [zoneId, items] of Object.entries(want)) for (const id of items) home.set(id, zoneId);
  const total = home.size;
  if (total === 0) return blank();

  const shown = new Set(key.cards ?? []);
  const placed = new Set<string>();
  const wrongItems: string[] = [];
  let right = 0;
  for (const [zoneId, items] of Object.entries(got)) {
    for (const id of items ?? []) {
      if (!home.has(id)) {
        // a distractor the child can see belongs in the tray (pha 10b: "kéo chữ ch vào giỏ")
        if (shown.has(id)) {
          placed.add(id);
          wrongItems.push(id);
        }
        continue; // a card nobody showed the child: ignore rather than punish
      }
      placed.add(id);
      if (home.get(id) === zoneId) right++;
      else wrongItems.push(id);
    }
  }
  if (placed.size === 0 || res.skipped) return blank();

  const score = right / total;
  const correct = right === total && wrongItems.length === 0;
  return {
    correct,
    outcome: correct ? "CORRECT" : score > 0 ? "PARTIAL" : "INCORRECT",
    score,
    errorCode: correct ? null : tagOf(key, wrongItems[0]),
    pending: false,
    // the cards the child moved, so the right ones float home
    wrongItems: wrongItems.map((id) => twin.original.get(id) ?? id),
  };
}

/** COUNT_TAP: one short of the answer and one over are different mistakes, and both are common. */
function markCount(key: AnswerBundle, res: AttemptResponse): MarkResult {
  const want = typeof key.correctCount === "number" ? key.correctCount : Number(key.value);
  if (res.skipped || typeof res.count !== "number" || Number.isNaN(want)) return blank();
  const correct = res.count === want;
  let errorCode: string | null = null;
  if (!correct) {
    errorCode =
      tagOf(key, String(res.count)) ??
      (res.count === want - 1 ? "dem_thieu_1" : res.count === want + 1 ? "dem_thua_1" : null);
  }
  return {
    correct,
    outcome: correct ? "CORRECT" : "INCORRECT",
    score: correct ? 1 : 0,
    errorCode,
    pending: false,
  };
}

/**
 * READ_ALOUD: word-by-word against `readTarget.words`, with the northern-accent tolerance the
 * matcher already knows. The grey zone (0.5–0.85) is not guessed at — it waits for a grown-up.
 */
function markReadAloud(key: AnswerBundle, res: AttemptResponse, lang: "vi" | "en"): MarkResult {
  const words = ((key.value ?? {}) as { words?: string[] }).words ?? [];
  if (res.parentVerdict) {
    const good = res.parentVerdict === "good";
    return {
      correct: good,
      outcome: good ? "CORRECT" : "INCORRECT",
      score: good ? 1 : 0,
      errorCode: good ? null : lang === "en" ? "doc_bo_tu_tieng_anh" : "doc_bo_tieng",
      pending: false,
    };
  }
  if (res.skipped || !nonEmpty(res.heard) || words.length === 0) return blank();

  const read = matchReadAloud(words, res.heard, { lang, seconds: res.seconds });
  const slow = read.wordsPerMinute !== null && read.wordsPerMinute < 30;
  const errorCode =
    read.verdict === "good"
      ? slow
        ? "doc_danh_van_cham"
        : null
      : read.missed.length > 0
        ? lang === "en"
          ? "doc_bo_tu_tieng_anh"
          : "doc_bo_tieng"
        : "doc_nham_van";
  return {
    correct: read.verdict === "good",
    outcome:
      read.verdict === "good" ? "CORRECT" : read.verdict === "partial" ? "PARTIAL" : "INCORRECT",
    // The score *is* the share that matched: an English reading is marked by how much of it came
    // back, not by all-or-nothing (owner, 18/09/2026, ADR-27).
    score: read.accuracy,
    errorCode,
    // A Vietnamese reading in the grey zone is the case docs/04 §7 sends to a human. An English one
    // never waits: it is scored where it landed and the child moves on.
    pending: lang !== "en" && read.verdict === "partial",
    readAloud: read,
  };
}

/**
 * DRAG_DROP only: the child pressed "Xong!" with baskets still waiting for cards, and has not put
 * a single distractor in a basket — nothing here says "mistake", it says "not finished".
 *
 * The client knows how many cards each basket wants (`dropZones[].expect`) and keeps the button
 * dim until they are there, so this is the second lock: a session that started before pha 11 holds
 * a spec without `expect`, and its half-finished answer must not become a wrong attempt with an
 * error code on the child's evidence. The caller answers with a nudge and writes nothing.
 */
export function dragNotFinished(key: AnswerBundle, res: AttemptResponse): boolean {
  if (res.skipped) return false;
  const want = (key.value ?? {}) as Record<string, string[]>;
  const home = new Map<string, string>();
  for (const [zoneId, items] of Object.entries(want)) for (const id of items) home.set(id, zoneId);
  if (home.size === 0) return false;

  const shown = new Set(key.cards ?? []);
  let placedFromKey = 0;
  for (const items of Object.values(resolveTwins(key, res.placements ?? {}).placements)) {
    for (const id of items ?? []) {
      if (home.has(id)) placedFromKey++;
      // a distractor in a basket is a real answer, wrong but finished: mark it, do not nudge
      else if (shown.has(id)) return false;
    }
  }
  return placedFromKey > 0 && placedFromKey < home.size;
}

/**
 * Marks one attempt. Types the server cannot mark on its own (a photo of handwriting, a spoken
 * answer, a traced letter) come back `pending`: the attempt is stored, no evidence is written yet.
 */
export function markAttempt(
  type: MarkableType,
  key: AnswerBundle,
  res: AttemptResponse,
  opts: { lang?: "vi" | "en" } = {},
): MarkResult {
  const lang = opts.lang ?? "vi";
  // "I'll do this one later" is a decision, not a mistake (docs/07 §2.2: BLANK is not wrong). The
  // attempt is over, nothing is scored, and the child moves on.
  if (res.skipped) {
    return {
      correct: false,
      outcome: "OBSERVED",
      score: 0,
      errorCode: BLANK,
      pending: true,
    };
  }
  switch (type) {
    case "MCQ":
    case "LISTEN_CHOOSE":
    case "MINI_STORY":
      return markChoice(key, res);
    case "DRAG_DROP":
      return markDrag(key, res);
    case "COUNT_TAP":
      return markCount(key, res);
    case "READ_ALOUD":
      return markReadAloud(key, res, lang);
    default:
      return {
        correct: false,
        outcome: "OBSERVED",
        score: 0,
        errorCode: null,
        pending: true,
      };
  }
}

// ---------------------------------------------------------------------------
// The three-try ladder
// ---------------------------------------------------------------------------

/** docs/04 §6: wrong once -> hint 1, twice -> hint 2, three times -> the answer, read aloud. */
export const MAX_TRIES = 3;

export interface TryFeedback {
  /** What the screen does next. Never the word "sai" (docs/06 §1.5). */
  stage: "retry" | "hint" | "reveal";
  /** Index into `hints` when the mascot has one to give. */
  hintIndex: number | null;
  revealAnswer: boolean;
  /** The mascot's line, warm and short. */
  line: string;
  /** This attempt is over: store it and move on. */
  done: boolean;
}

/** Said when the child may try again. Rotated so the same sentence is not repeated all session. */
const RETRY_LINES = [
  "Gần lắm rồi! Mình thử lại nhé.",
  "Suýt nữa thôi! Con thử lần nữa nhé.",
  "Mình cùng nhìn lại một lượt nhé!",
  "Thử cách khác xem sao nào!",
];

const HINT_LINES = [
  "Mình mách con một chút nhé!",
  "Có một bí mật nhỏ này!",
  "Nghe gợi ý của mình nha!",
];

const REVEAL_LINES = [
  "Để mình chỉ cho con nhé!",
  "Mình làm cùng con nào!",
  "Cùng xem đáp án nhé, lần sau con nhớ rồi!",
];

function rotate(lines: string[], seed: number): string {
  return lines[Math.abs(seed) % lines.length] as string;
}

/**
 * What to do after a wrong answer. `tries` is how many times the child has answered *including*
 * this one, `seed` is anything stable per exercise (its order in the session) so two exercises in
 * a row do not get the same sentence.
 */
export function feedbackForTry(tries: number, hints: string[] = [], seed = 0): TryFeedback {
  const hintCount = hints.length;
  if (tries >= MAX_TRIES || (hintCount === 0 && tries >= 2)) {
    return {
      stage: "reveal",
      hintIndex: null,
      revealAnswer: true,
      line: rotate(REVEAL_LINES, seed),
      done: true,
    };
  }
  const hintIndex = Math.min(tries - 1, hintCount - 1);
  if (hintIndex >= 0) {
    return {
      stage: "hint",
      hintIndex,
      revealAnswer: false,
      line: rotate(HINT_LINES, seed + tries),
      done: false,
    };
  }
  return {
    stage: "retry",
    hintIndex: null,
    revealAnswer: false,
    line: rotate(RETRY_LINES, seed + tries),
    done: false,
  };
}
