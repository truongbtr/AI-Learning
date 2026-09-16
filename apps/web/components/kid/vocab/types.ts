/**
 * The vocabulary games of pha 11 (Bến Cảng Từ).
 *
 * Six short games, 30–60 seconds each, over the same handful of words. They exist because the ESL
 * vocabulary bank is 40% multiple choice: a child answers questions *about* a word without ever
 * playing with it, and nothing knows which words they actually keep. Every meeting here goes to
 * `LexemeProgress` (kind=word) and the Leitner ladder (ADR-22).
 *
 * The rules of the child's world hold here as everywhere: no countdown, no lives, no score, no
 * "sai", no red. A word not recognised simply comes back tomorrow.
 */

export type VocabGameId =
  | "listen-touch"
  | "match-pairs"
  | "what-vanished"
  | "market"
  | "build-word"
  | "say-it";

export interface VocabWord {
  wordId: string;
  stableId: string;
  en: string;
  vi: string;
  picture: { kind: string; value: string; labelVi?: string };
  phraseEn: string;
  phraseVi: string;
  skillCode: string;
  box: number;
  isNew: boolean;
}

export interface VocabGameProps {
  words: VocabWord[];
  /** One meeting with one word. Called as it happens, not at the end. */
  onMeeting: (meeting: { wordId: string; correct: boolean }) => void;
  /** The round is over. */
  onDone: () => void;
}

/** Vietnamese names, said out loud to the child when a station opens. */
export const GAME_NAMES: Record<VocabGameId, string> = {
  "listen-touch": "Nghe rồi chạm tranh",
  "match-pairs": "Lật thẻ tìm đôi",
  "what-vanished": "Cái gì biến mất?",
  market: "Chợ nhỏ",
  "build-word": "Ghép chữ cái",
  "say-it": "Nói to lên",
};

/** Fisher–Yates, seeded by nothing in particular: a round should not be the same twice. */
export function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}
