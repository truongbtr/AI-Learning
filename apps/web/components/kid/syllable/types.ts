/**
 * Xưởng Tiếng — the spelling games of pha 12 (docs/06 §1.10, ADR-24).
 *
 * Sound first, letters as the result. A child hears a syllable, builds it from three spoken tiles,
 * hears the machine read back exactly what was built, and sees the picture that says what it
 * means. Letters are on the tiles so they become familiar, but no game ever asks a child to READ
 * before she can answer. Every tile speaks when it is touched.
 *
 * The rules of the child's world hold here too: no countdown, no lives, no score, no "sai", no
 * red. A syllable not built today comes back tomorrow (ADR-22).
 */
import type {
  BuildItem,
  GameSyllable,
  PairItem,
  SyllableGameId,
  Tone,
  ToneItem,
  TrainCar,
} from "@mtct/core";

export type { BuildItem, GameSyllable, PairItem, SyllableGameId, Tone, ToneItem, TrainCar };

export type SyllableRound =
  | { game: "build" | "split"; items: BuildItem[] }
  | { game: "tone"; items: ToneItem[] }
  | { game: "pair"; items: PairItem[] }
  | { game: "train"; cars: TrainCar[] }
  | { game: "read"; items: GameSyllable[] };

export interface SyllableStationData {
  games: SyllableGameId[];
  rounds: SyllableRound[];
  done?: boolean;
}

/** What one game reports for one syllable. The server decides whether it was right. */
export type SyllableAnswer =
  | { game: "build" | "split"; onset: string; rime: string; tone: Tone }
  | { game: "tone"; tone: Tone }
  | { game: "pair"; picked: string; errorCode: string }
  | { game: "train" }
  | { game: "read" };

export interface SyllableGameProps<R> {
  round: R;
  /** One meeting with one syllable, sent as it happens. */
  onMeeting: (syllableId: string, answer: SyllableAnswer) => void;
  onDone: () => void;
}

/** The three kinds of piece, each with its own shape and colour — none of them red. */
export const PIECE_STYLE = {
  onset: { bg: "#DDEBFF", ring: "#2F80ED", ink: "#1F4E9A", label: "âm đầu" },
  rime: { bg: "#DDF6E4", ring: "#22A06B", ink: "#16623F", label: "vần" },
  tone: { bg: "#FFE9CC", ring: "#F08A24", ink: "#8A4A0C", label: "thanh" },
} as const;

export type PieceKind = keyof typeof PIECE_STYLE;

/** A tap target in these games is never smaller than this (docs/08 pha 12: tiles ≥ 88 px). */
export const TILE_MIN = 88;
