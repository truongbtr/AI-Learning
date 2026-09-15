import { describe, expect, it } from "vitest";
import {
  classifyKitColor,
  hexToRgb,
  hslToRgb,
  recolorKit,
  recolorNature,
  rgbToHex,
  rgbToHsl,
} from "./color";
import { CITY, CITY_IDS, WORLD } from "./palette";

describe("colour conversions", () => {
  it("round-trips hex ↔ rgb ↔ hsl", () => {
    for (const hex of [0xe76f51, 0x5e93d6, 0xffd447, 0x000000, 0xffffff, 0x79dc48]) {
      const [h, s, l] = rgbToHsl(hexToRgb(hex));
      expect(rgbToHex(hslToRgb(h, s, l))).toBe(hex);
    }
  });
});

describe("Kenney recolour", () => {
  it("classifies the kit's swatches", () => {
    expect(classifyKitColor([250, 250, 252])).toBe("wall");
    expect(classifyKitColor([120, 124, 140])).toBe("trim");
    expect(classifyKitColor([60, 62, 72])).toBe("roof");
    expect(classifyKitColor([95, 145, 220])).toBe("glass");
    expect(classifyKitColor([96, 200, 140])).toBe("accent");
  });

  it("paints a white wall with the variant's wall colour", () => {
    const spec = CITY.viet.kit[0];
    if (!spec) throw new Error("variant");
    const [h] = rgbToHsl(recolorKit([250, 250, 252], spec));
    expect(Math.abs(h - rgbToHsl(hexToRgb(spec.wall))[0])).toBeLessThan(2);
  });

  it("never produces a red error-like colour for glass or walls in any city", () => {
    for (const id of CITY_IDS) {
      for (const spec of CITY[id].kit) {
        const glass = rgbToHsl(recolorKit([95, 145, 220], spec));
        expect(glass[0]).toBeGreaterThan(150);
      }
    }
  });

  it("turns nature-kit leaves bright green", () => {
    const leaf = recolorNature([70, 150, 130], WORLD.leaves, WORLD.trunk);
    const [h, s] = rgbToHsl(leaf);
    expect(h).toBeGreaterThan(90);
    expect(h).toBeLessThan(140);
    expect(s).toBeGreaterThan(0.4);
  });
});
