// Sample city views for the bench, screenshots and budget tests (not real children's data).

import type { BuildingLevel, CityView } from "@mtct/core";
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

export type SampleSize = "day1" | "mid" | "full";

export function sampleView(city: CityId, size: SampleSize): CityView {
  const n =
    size === "day1" ? 5 : size === "mid" ? Math.min(28, SKILL_COUNT[city]) : SKILL_COUNT[city];
  const skills = Array.from({ length: n }, (_, i) => {
    const level = ((i * 7 + 3) % 5) as BuildingLevel;
    return {
      skillId: `${city}-skill-${i}`,
      label: LABELS[city][i % LABELS[city].length] as string,
      level: size === "day1" ? (Math.min(level, 2) as BuildingLevel) : level,
      needsHelp: i % 9 === 4,
      mission: i % 6 === 1,
    };
  });
  const publics = Object.keys(PUBLIC_BUILDINGS);
  const plotCodes = Object.keys(PLOT_CATALOGUE);
  const owned = size === "day1" ? 0 : size === "mid" ? 3 : 10;
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
    publicBuildings:
      size === "day1" ? [] : size === "mid" ? publics.slice(0, 5) : publics.slice(0, 14),
    wonder: {
      pieces:
        size === "day1"
          ? 1
          : size === "mid"
            ? Math.floor(WONDER_PIECES[city] / 2)
            : WONDER_PIECES[city] - 1,
    },
    bustle: size === "day1" ? 1 : size === "mid" ? 3 : 4,
    decorations: size === "day1" ? [] : Object.keys(DECORATIONS).slice(0, size === "mid" ? 4 : 10),
    pets: size === "day1" ? [] : ["dog", "cat"],
    townHallOrder: "open",
  };
}
