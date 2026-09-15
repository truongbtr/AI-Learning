import { describe, expect, it } from "vitest";
import { CITY, CITY_IDS, LOT_ROOF_COLOURS, LOT_WALL_COLOURS, lotPalette } from "./palette";

describe("lot palettes", () => {
  it.each(CITY_IDS)("%s: four neighbouring lots show ≥ 3 roof and ≥ 4 wall colours", (id) => {
    const city = CITY[id];
    const base = lotPalette(city, 0);
    expect(base.roofs).toHaveLength(LOT_ROOF_COLOURS);
    expect(base.walls).toHaveLength(LOT_WALL_COLOURS);
    for (let s = 1; s < 40; s++) {
      const lots = [s, s + 1, s + 2, s + 3].map((seed) => ({ seed, p: lotPalette(city, seed) }));
      // builders pick by fixed index (roofs[0], walls[0], walls[1]) and by seed (walls[seed])
      expect(new Set(lots.map(({ p }) => p.roofs[0])).size).toBeGreaterThanOrEqual(3);
      expect(new Set(lots.map(({ p }) => p.walls[0])).size).toBeGreaterThanOrEqual(4);
      expect(
        new Set(lots.map(({ p, seed }) => p.walls[seed % p.walls.length])).size,
      ).toBeGreaterThanOrEqual(4);
    }
  });

  it("mixes the city's own colours with the shared ones", () => {
    const p = lotPalette(CITY.vmath, 0);
    expect(p.roofs).toContain(CITY.vmath.roofs[0]);
    expect(p.walls.some((w) => !CITY.vmath.walls.includes(w))).toBe(true);
  });
});
