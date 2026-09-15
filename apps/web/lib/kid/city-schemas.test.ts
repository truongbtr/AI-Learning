import { describe, expect, it } from "vitest";
import { cityPlotSchema, cityPracticeSchema, cityQuerySchema } from "./city-schemas";

describe("city request schemas (never trust the device)", () => {
  it("accepts the six city codes only", () => {
    expect(cityQuerySchema.safeParse({ studentId: "s1", city: "viet" }).success).toBe(true);
    expect(cityQuerySchema.safeParse({ studentId: "s1", city: "VIET" }).success).toBe(false);
    expect(cityQuerySchema.safeParse({ studentId: "s1", city: "mars" }).success).toBe(false);
  });

  it("takes a plot index and a catalogue code, nothing else of value", () => {
    expect(
      cityPlotSchema.safeParse({ studentId: "s1", city: "esl", plot: 0, build: "garden" }).success,
    ).toBe(true);
    expect(
      cityPlotSchema.safeParse({ studentId: "s1", city: "esl", plot: -1, build: "garden" }).success,
    ).toBe(false);
    expect(
      cityPlotSchema.safeParse({ studentId: "s1", city: "esl", plot: 0, build: "castle" }).success,
    ).toBe(false);
    const extra = cityPlotSchema.safeParse({
      studentId: "s1",
      city: "esl",
      plot: 0,
      build: "pond",
      owned: 99,
    });
    expect(extra.success && !("owned" in extra.data)).toBe(true);
  });

  it("asks only which building was tapped", () => {
    expect(
      cityPracticeSchema.safeParse({ studentId: "s1", city: "vmath", skillId: "abc" }).success,
    ).toBe(true);
    expect(cityPracticeSchema.safeParse({ studentId: "s1", city: "vmath" }).success).toBe(false);
  });
});
