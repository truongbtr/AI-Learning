// Sample city views for the bench, screenshots and budget tests (not real children's data).

import type { BuildingLevel, CityView, GrowthStep } from "@mtct/core";
import { DECORATIONS, PLOT_CATALOGUE, PUBLIC_BUILDINGS } from "./build/civic";
import { WONDER_PIECES } from "./build/wonders";
import type { CityId } from "./palette";

export const SKILL_COUNT: Record<CityId, number> = {
  viet: 102,
  vmath: 48,
  esl: 75,
  enl: 53,
  emath: 51,
  esci: 47,
};

const LABELS: Record<CityId, string[]> = {
  viet: [
    "a",
    "b",
    "c",
    "ă",
    "â",
    "đ",
    "e",
    "ê",
    "o",
    "ô",
    "ơ",
    "u",
    "ư",
    "ch",
    "nh",
    "ng",
    "gh",
    "kh",
    "ph",
    "th",
    "tr",
    "qu",
  ],
  vmath: ["1", "2", "3", "5", "7", "10", "+", "−", "=", ">", "<", "20", "50", "100"],
  esl: ["cat", "dog", "sun", "red", "one", "hat", "pen", "cup", "hi", "bee", "sea", "fish"],
  enl: ["read", "book", "rhyme", "the", "and", "see", "look", "play", "tree", "star"],
  emath: ["1", "2", "5", "10", "+", "−", "=", "½", "20", "3D"],
  esci: ["sun", "moon", "leaf", "rain", "rock", "bug", "star", "sky", "seed", "fish"],
};

/**
 * start = a real first evening: a handful of skills, most not built yet, nothing needing help.
 * endOfYear = pha 12's worst case: every subject at the size of the biggest one, every plot built,
 * every public building up, the wonder finished and the busiest streets there are.
 */
export type SampleSize = "start" | "day1" | "mid" | "full" | "endOfYear";

export function sampleView(city: CityId, size: SampleSize): CityView {
  const n =
    size === "start"
      ? 6
      : size === "day1"
        ? 5
        : size === "mid"
          ? Math.min(28, SKILL_COUNT[city])
          : size === "endOfYear"
            ? 102
            : SKILL_COUNT[city];
  const skills = Array.from({ length: n }, (_, i) => {
    const raw = ((i * 7 + 3) % 5) as BuildingLevel;
    const level =
      size === "start"
        ? ((i < 2 ? 1 : 0) as BuildingLevel)
        : size === "day1"
          ? (Math.min(raw, 2) as BuildingLevel)
          : raw;
    return {
      skillId: `${city}-skill-${i}`,
      label: LABELS[city][i % LABELS[city].length] as string,
      level,
      step: (level > 0 && level < 4 ? i % 3 : 0) as GrowthStep,
      // the city caps scaffolding at three (MAX_SCAFFOLDS)
      needsHelp: size !== "start" && i % 9 === 4 && i < 9 * 3,
      mission: i % 6 === 1,
    };
  });
  const publics = Object.keys(PUBLIC_BUILDINGS);
  const plotCodes = Object.keys(PLOT_CATALOGUE);
  const owned =
    size === "day1" || size === "start" ? 0 : size === "mid" ? 3 : size === "endOfYear" ? 40 : 10;
  const first = size === "day1" || size === "start";
  return {
    subject: city,
    skills,
    land: {
      owned,
      nextCost: 20 + owned * 5,
      progress: 7,
      builds: Array.from({ length: Math.max(0, owned - 1) }, (_, i) => ({
        plot: i,
        build: plotCodes[i % plotCodes.length] as string,
      })),
    },
    publicBuildings: first
      ? []
      : size === "mid"
        ? publics.slice(0, 5)
        : publics.slice(0, size === "endOfYear" ? 15 : 14),
    wonder: {
      pieces: first
        ? size === "start"
          ? 0
          : 1
        : size === "mid"
          ? Math.floor(WONDER_PIECES[city] / 2)
          : size === "endOfYear"
            ? WONDER_PIECES[city]
            : WONDER_PIECES[city] - 1,
    },
    bustle: first ? 1 : size === "mid" ? 3 : 4,
    decorations: first ? [] : Object.keys(DECORATIONS).slice(0, size === "mid" ? 4 : 10),
    harbourBoats: size === "endOfYear" ? 4 : 0,
    pets: first ? [] : ["dog", "cat"],
    townHallOrder: "open",
  };
}
