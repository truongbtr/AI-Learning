import {
  buildRound,
  type GameSyllable,
  pairRound,
  seededRng,
  toneRound,
  trainRound,
} from "@mtct/core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SyllableStation } from "./station";
import type { SyllableRound } from "./types";

/**
 * Every Xưởng Tiếng game draws its first screen without falling over, with pieces that are real
 * and without the words a child's screen may never show. (The games themselves are played end to
 * end in e2e/phase12-syllable.spec.ts.)
 */
const s = (
  text: string,
  onset: string,
  rime: string,
  tone: GameSyllable["tone"],
): GameSyllable => ({
  id: `id-${text}`,
  text,
  onset,
  rime,
  tone,
  meaning: `nghĩa ${text}`,
  picture: { kind: "emoji", value: "🐟" },
  skillCode: "VIET.HV.AM_B",
});
const DICT = [
  s("bà", "b", "a", "huyen"),
  s("ba", "b", "a", "ngang"),
  s("cá", "c", "a", "sac"),
  s("gà", "g", "a", "huyen"),
  s("mà", "m", "a", "huyen"),
  s("nhà", "nh", "a", "huyen"),
  s("anh", "", "anh", "ngang"),
  s("mả", "m", "a", "hoi"),
];
const TABLES = { onsets: ["b", "c", "d", "g", "m", "nh", "x"], rimes: ["a", "anh", "o", "ô"] };
const rng = seededRng(3);

const ROUNDS: SyllableRound[] = [
  { game: "build", items: buildRound(DICT, TABLES, { rng }) },
  { game: "split", items: buildRound(DICT, TABLES, { rng, split: true }) },
  { game: "pair", items: pairRound(DICT, rng) },
  { game: "tone", items: toneRound(DICT, DICT, { rng }) },
  { game: "train", cars: trainRound(DICT, { rng, minAnswers: 3, onsets: TABLES.onsets }) },
  { game: "read", items: DICT.slice(0, 3) },
];

describe("Xưởng Tiếng screens", () => {
  it.each(ROUNDS.map((r) => [r.game, r] as const))("draws %s", (_game, round) => {
    const html = renderToStaticMarkup(
      createElement(SyllableStation, {
        sessionId: "s",
        order: 1,
        station: { games: [round.game], rounds: [round] },
        mascot: "robot",
        onFinished: () => {},
        offline: true,
      }),
    );
    expect(html).toContain('data-testid="syllable-station"');
    expect(html.toLowerCase()).not.toMatch(/\bsai\b/);
  });

  it("has something to deal for each game", () => {
    for (const r of ROUNDS) {
      const size = "items" in r ? r.items.length : r.cars.length;
      expect(size, r.game).toBeGreaterThan(0);
    }
  });
});
