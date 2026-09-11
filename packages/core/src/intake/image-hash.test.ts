import { describe, expect, it } from "vitest";
import {
  DHASH_HEIGHT,
  DHASH_WIDTH,
  dHashFromGrey,
  findPageGutter,
  hashDistance,
  looksLikeSamePhoto,
} from "./image-hash";

/** A grey grid from a function of (x, y), the way sharp hands one over. */
function grid(f: (x: number, y: number) => number): number[] {
  const out: number[] = [];
  for (let y = 0; y < DHASH_HEIGHT; y++)
    for (let x = 0; x < DHASH_WIDTH; x++) out.push(Math.max(0, Math.min(255, Math.round(f(x, y)))));
  return out;
}

describe("telling two photos of the same page apart from two pages", () => {
  const page = grid((x, y) => 40 + x * 18 + (y % 3) * 25);

  it("hashes to 16 hex characters", () => {
    expect(dHashFromGrey(page)).toMatch(/^[0-9a-f]{16}$/);
  });

  it("gives the same hash to the same page shot a little darker and a little blurrier", () => {
    const again = grid((x, y) => (40 + x * 18 + (y % 3) * 25) * 0.82 + 6);
    expect(looksLikeSamePhoto(dHashFromGrey(page), dHashFromGrey(again))).toBe(true);
  });

  it("does not call a different page a duplicate", () => {
    const other = grid((x, y) => 220 - x * 9 + ((x * y) % 5) * 30);
    expect(looksLikeSamePhoto(dHashFromGrey(page), dHashFromGrey(other))).toBe(false);
  });

  it("counts differing bits, and says 64 when the hashes are not comparable", () => {
    expect(hashDistance("0000000000000000", "0000000000000000")).toBe(0);
    expect(hashDistance("0000000000000000", "000000000000000f")).toBe(4);
    expect(hashDistance("abc", "0000000000000000")).toBe(64);
  });
});

describe("finding the fold of an open notebook", () => {
  const columns = (width: number, f: (x: number) => number) =>
    Array.from({ length: width }, (_, x) => f(x));

  it("finds the dark gutter of a wide two-page photo", () => {
    const wide = columns(200, (x) => (Math.abs(x - 100) < 5 ? 60 : 210));
    expect(findPageGutter(wide, { aspectRatio: 1.8 })).toBeGreaterThan(94);
    expect(findPageGutter(wide, { aspectRatio: 1.8 })).toBeLessThan(106);
  });

  it("leaves an evenly lit single page alone", () => {
    const flat = columns(200, () => 200);
    expect(findPageGutter(flat, { aspectRatio: 1.8 })).toBeNull();
  });

  it("never splits a portrait photo, however shadowed the middle is", () => {
    const shadowed = columns(200, (x) => (Math.abs(x - 100) < 5 ? 40 : 200));
    expect(findPageGutter(shadowed, { aspectRatio: 0.75 })).toBeNull();
  });

  it("ignores a picture that is simply dark all over", () => {
    const dark = columns(200, () => 50);
    expect(findPageGutter(dark, { aspectRatio: 1.8 })).toBeNull();
  });
});
