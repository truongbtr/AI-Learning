/**
 * How a word is kept: the Leitner ladder behind the vocabulary games (pha 11, ADR-22).
 *
 * A six-year-old needs to meet a word 15–20 times, spread over days, before it stays. Meeting it
 * twenty times in one evening does not do it, and neither does meeting it once a month. So every
 * word sits in a box; the box says how long to wait before showing it again:
 *
 *   box 1 → tomorrow · box 2 → in 3 days · box 3 → in a week · box 4 → in two weeks ·
 *   box 5 → in a month ("thuộc rồi")
 *
 * Recognised: up a box. Not recognised: back to box 1 — the word is not lost, it simply comes back
 * tomorrow. Nothing here counts as a mistake, nothing is scored, and no word is ever "failed":
 * `box` is a schedule, not a mark (docs/06 §1.1).
 */

/** Days to wait after landing in each box. Index 0 is "never met", shown today. */
export const BOX_DAYS = [0, 1, 3, 7, 14, 30] as const;
export const TOP_BOX = BOX_DAYS.length - 1;
/** From this box on, the word counts as known for the Sổ từ and the harbour boat. */
export const KNOWN_BOX = 4;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface WordMemory {
  box: number;
  dueAt: Date;
  seen: number;
  known: number;
  streak: number;
  lastSeenAt?: Date | null;
}

export interface WordReview {
  /** The child recognised the word. */
  correct: boolean;
  now: Date;
  /** Which game asked, so the next one can ask a different way. */
  game?: string;
}

export interface WordMemoryUpdate extends WordMemory {
  lastGame?: string | null;
}

/**
 * The state of a word after one meeting. Pure, so the schedule is a test rather than a promise.
 *
 * A word answered right twice in the same evening does not skip two boxes: the second meeting
 * still counts as practice (`seen`), but the box only moves once per day. Spacing is the whole
 * point, and a child who sees a word four times in one game would otherwise "know" it by bedtime.
 */
export function reviewWord(before: WordMemory, review: WordReview): WordMemoryUpdate {
  const { correct, now } = review;
  const movedToday = before.lastSeenAt != null && sameDay(before.lastSeenAt, now) && before.box > 0;

  const box = correct
    ? movedToday
      ? before.box
      : Math.min(TOP_BOX, Math.max(1, before.box + 1))
    : 1;
  const streak = correct ? before.streak + 1 : 0;
  return {
    box,
    dueAt: new Date(now.getTime() + (BOX_DAYS[box] ?? 1) * DAY_MS),
    seen: before.seen + 1,
    known: before.known + (correct ? 1 : 0),
    streak,
    lastSeenAt: now,
    lastGame: review.game ?? null,
  };
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export interface SchedulableWord {
  wordId: string;
  box: number;
  dueAt: Date;
  lastGame?: string | null;
}

/**
 * Which words tonight's games should use, most overdue first, with words never met at the back —
 * a child who has ten words waiting should meet those ten before being handed a new one.
 *
 * `limit` is small on purpose: docs/08 caps the vocabulary games at two stations an evening.
 */
export function wordsDue<T extends SchedulableWord>(words: T[], now: Date, limit: number): T[] {
  const due = words.filter((w) => w.dueAt.getTime() <= now.getTime());
  due.sort((a, b) => {
    // never met (box 0) waits until the words already started are dealt with
    if ((a.box === 0) !== (b.box === 0)) return a.box === 0 ? 1 : -1;
    return a.dueAt.getTime() - b.dueAt.getTime();
  });
  return due.slice(0, Math.max(0, limit));
}

/** How far along a child is with a set of words — for the Sổ từ, never shown as a score. */
export function vocabProgress(words: { box: number }[]): {
  met: number;
  learning: number;
  known: number;
} {
  let met = 0;
  let learning = 0;
  let known = 0;
  for (const w of words) {
    if (w.box <= 0) continue;
    met++;
    if (w.box >= KNOWN_BOX) known++;
    else learning++;
  }
  return { met, learning, known };
}
