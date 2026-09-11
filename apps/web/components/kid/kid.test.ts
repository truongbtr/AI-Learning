import { describe, expect, it } from "vitest";
import { TIME_GREETING, timeOfDay } from "./time";
import { KID, THEME, zoneFor } from "./tokens";

/**
 * The rules of the child's area that are worth a test: the minimum sizes the design fixes, which
 * zone a subject sends the child to, and what the sky does at each hour.
 */

describe("kid design tokens", () => {
  it("keeps the two numbers the design will not bend on", () => {
    expect(KID.tapMin).toBeGreaterThanOrEqual(64); // docs/06 §1 rule 2
    expect(KID.textMin).toBeGreaterThanOrEqual(22); // docs/06 §1 rule 3
    expect(KID.buttonHeight).toBeGreaterThanOrEqual(KID.tapMin);
  });

  it("gives each child a world and a companion", () => {
    expect(THEME.robot.mascot).toBe("robot");
    expect(THEME.garden.mascot).toBe("cu");
    expect(THEME.robot.primary).toBe("#2F80ED");
    expect(THEME.garden.primary).toBe("#E85D9C");
  });
});

describe("which zone a subject belongs to", () => {
  it("sends each subject to its building in the robot city", () => {
    expect(zoneFor("robot", "VMATH")).toBe("xuong-so");
    expect(zoneFor("robot", "EMATH")).toBe("xuong-so");
    expect(zoneFor("robot", "VIET")).toBe("thap-chu");
    expect(zoneFor("robot", "ESL")).toBe("ben-tau-tieng-anh");
    expect(zoneFor("robot", "ESCI")).toBe("tram-khong-gian");
  });

  it("falls back to the workshop rather than showing nothing", () => {
    expect(zoneFor("robot", null)).toBe("xuong-so");
    expect(zoneFor("robot", "UNKNOWN")).toBe("xuong-so");
  });

  it("uses the one garden zone phase 3 builds", () => {
    expect(zoneFor("garden", "VIET")).toBe("vuon-so");
    expect(zoneFor("garden", null)).toBe("vuon-so");
  });
});

describe("the sky follows the clock", () => {
  const at = (h: number) => new Date(2026, 8, 11, h, 0, 0);
  it("splits the day the way a school day does", () => {
    expect(timeOfDay(at(7))).toBe("morning");
    expect(timeOfDay(at(11))).toBe("day");
    expect(timeOfDay(at(17))).toBe("evening");
    expect(timeOfDay(at(21))).toBe("night");
    expect(timeOfDay(at(0))).toBe("morning");
  });

  it("has a greeting for every part of the day", () => {
    for (const h of [7, 11, 17, 21]) {
      const greeting = TIME_GREETING[timeOfDay(at(h))];
      expect(greeting.length).toBeGreaterThan(4);
      expect(greeting).not.toMatch(/\bsai\b/i);
    }
  });
});
