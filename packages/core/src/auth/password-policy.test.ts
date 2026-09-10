import { describe, expect, it } from "vitest";
import { isPasswordAcceptable, validatePassword } from "./password-policy";

describe("password policy (docs/12 §6)", () => {
  it("requires at least 10 characters", () => {
    expect(validatePassword("Abc123")).toContain("TOO_SHORT");
  });
  it("rejects common passwords", () => {
    expect(validatePassword("password123")).toContain("TOO_COMMON");
    expect(validatePassword("1234567890")).toContain("TOO_COMMON");
  });
  it("rejects a single repeated character class", () => {
    expect(validatePassword("aaaaaaaaaaaa")).toContain("NO_VARIETY");
  });
  it("accepts a reasonable password", () => {
    expect(isPasswordAcceptable("MaiThy-ChiThanh-2026")).toBe(true);
  });
});
