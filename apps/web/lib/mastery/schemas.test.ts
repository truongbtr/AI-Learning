import { describe, expect, it } from "vitest";
import { evidenceInputSchema, skillSearchQuerySchema } from "./schemas";

const base = {
  studentId: "s1",
  skillCode: "VMATH.SO.CONG_PV_10",
  source: "EXERCISE",
  outcome: "CORRECT",
  score: 1,
};

describe("evidenceInputSchema", () => {
  it("accepts a well-formed exercise result", () => {
    const parsed = evidenceInputSchema.parse({ ...base, difficulty: 3, hintsUsed: 1, tries: 2 });
    expect(parsed.skillCode).toBe("VMATH.SO.CONG_PV_10");
  });

  it("needs a skill code or id", () => {
    const { skillCode, ...withoutSkill } = base;
    expect(evidenceInputSchema.safeParse(withoutSkill).success).toBe(false);
    expect(evidenceInputSchema.safeParse({ ...withoutSkill, skillId: "abc" }).success).toBe(true);
  });

  it("rejects malformed skill codes, scores and error codes", () => {
    expect(evidenceInputSchema.safeParse({ ...base, skillCode: "vmath.so.x" }).success).toBe(false);
    expect(evidenceInputSchema.safeParse({ ...base, score: 1.4 }).success).toBe(false);
    expect(evidenceInputSchema.safeParse({ ...base, difficulty: 9 }).success).toBe(false);
    // shape only; whether the code exists is checked against the database
    expect(evidenceInputSchema.safeParse({ ...base, errorCode: "Nham_B_D" }).success).toBe(false);
    expect(evidenceInputSchema.safeParse({ ...base, errorCode: "nham_b_d" }).success).toBe(true);
  });

  it("coerces observedAt from an ISO string", () => {
    const parsed = evidenceInputSchema.parse({ ...base, observedAt: "2026-09-11T10:00:00Z" });
    expect(parsed.observedAt).toBeInstanceOf(Date);
  });
});

describe("skillSearchQuerySchema", () => {
  it("defaults the limit and caps it", () => {
    expect(skillSearchQuerySchema.parse({ q: "sh" }).limit).toBe(10);
    expect(skillSearchQuerySchema.safeParse({ q: "sh", limit: 99 }).success).toBe(false);
    expect(skillSearchQuerySchema.safeParse({ q: "" }).success).toBe(false);
    expect(skillSearchQuerySchema.parse({ q: "sh", subject: "ESL" }).subject).toBe("ESL");
  });
});
