import { describe, expect, it } from "vitest";
import { getPictureSet, PICTURE_SETS, pinToSecret, validatePin } from "./picture-pin";

describe("picture pin (docs/12 §4)", () => {
  it("every set has 9-12 unique pictures", () => {
    for (const set of PICTURE_SETS) {
      expect(set.pictures.length).toBeGreaterThanOrEqual(9);
      expect(set.pictures.length).toBeLessThanOrEqual(12);
      expect(new Set(set.pictures.map((p) => p.key)).size).toBe(set.pictures.length);
    }
  });
  it("requires exactly 4 known pictures", () => {
    const set = getPictureSet("animals");
    expect(validatePin(["cat", "dog", "fish", "bird"], set)).toEqual([]);
    expect(validatePin(["cat", "dog", "fish"], set)).toContain("WRONG_LENGTH");
    expect(validatePin(["cat", "dog", "fish", "dragon"], set)).toContain("UNKNOWN_PICTURE");
  });
  it("order matters in the secret", () => {
    expect(pinToSecret(["cat", "dog", "fish", "bird"])).toBe("cat.dog.fish.bird");
    expect(pinToSecret(["cat", "dog", "fish", "bird"])).not.toBe(
      pinToSecret(["dog", "cat", "fish", "bird"]),
    );
  });
  it("falls back to the first set for unknown keys", () => {
    expect(getPictureSet("nope").key).toBe("animals");
  });
});
