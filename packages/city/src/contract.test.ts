import {
  COLLECTIBLE_DECORATION,
  DECORATION_CODES,
  PET_ANIMAL,
  PLOT_BUILD_ORDER,
  PUBLIC_ORDER,
  WONDER_TOTAL,
} from "@mtct/core";
import { describe, expect, it } from "vitest";
import { DECORATIONS, PLOT_CATALOGUE, PUBLIC_BUILDINGS } from "./build/civic";
import { WONDER_PIECES } from "./build/wonders";
import { CITY_IDS } from "./palette";

// @mtct/core decides WHAT the city contains; @mtct/city knows how to draw it. Same codes, both sides.
describe("contract between the data rules (core) and the renderer (city)", () => {
  it("draws every public building the rules can unlock", () => {
    for (const id of CITY_IDS)
      for (const code of PUBLIC_ORDER[id]) expect(PUBLIC_BUILDINGS).toHaveProperty(code);
  });

  it("draws every plot build and decoration the rules can produce", () => {
    for (const code of PLOT_BUILD_ORDER) expect(PLOT_CATALOGUE).toHaveProperty(code);
    for (const code of DECORATION_CODES) expect(DECORATIONS).toHaveProperty(code);
    for (const code of Object.values(COLLECTIBLE_DECORATION))
      expect(DECORATIONS).toHaveProperty(code);
  });

  it("agrees on wonder sizes and pet animals", () => {
    for (const id of CITY_IDS) expect(WONDER_TOTAL[id]).toBe(WONDER_PIECES[id]);
    expect(new Set(Object.values(PET_ANIMAL))).toEqual(new Set(["dog", "cat", "bunny", "duck"]));
  });
});
