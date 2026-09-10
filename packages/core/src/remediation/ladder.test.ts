import { describe, expect, it } from "vitest";
import {
  nextApplicableRung,
  nextRung,
  REMEDIATION_RUNGS,
  RUNGS,
  rungInfo,
  shouldStartRemediation,
} from "./ladder";

describe("remediation ladder - docs/04 sec. 11.4", () => {
  it("has six rungs in the documented order", () => {
    expect(RUNGS.map((r) => r.key)).toEqual([
      "CHANGE_CHANNEL",
      "LOWER_DIFFICULTY",
      "MODELLED_EXAMPLE",
      "BACK_TO_PREREQUISITE",
      "CONTRAST_PAIR",
      "RECHECK",
    ]);
    expect(rungInfo(3).planner.scaffold).toBe("model");
    expect(() => rungInfo(7)).toThrow(RangeError);
  });

  it("passing any rung leaves the ladder", () => {
    for (let rung = 1; rung <= REMEDIATION_RUNGS; rung++) {
      expect(nextRung({ rung, status: "ACTIVE" }, "PASSED")).toEqual({ rung, status: "PASSED" });
    }
  });

  it("failing moves down one rung; failing rung 6 asks the parents", () => {
    let t = { rung: 1, status: "ACTIVE" as const };
    const rungs: number[] = [];
    for (let i = 0; i < 5; i++) {
      t = nextRung(t, "FAILED") as typeof t;
      rungs.push(t.rung);
    }
    expect(rungs).toEqual([2, 3, 4, 5, 6]);
    expect(nextRung({ rung: 6, status: "ACTIVE" }, "FAILED")).toEqual({
      rung: 6,
      status: "NEEDS_PARENT",
    });
  });

  it("finished tracks are unchanged", () => {
    expect(nextRung({ rung: 2, status: "PASSED" }, "FAILED")).toEqual({
      rung: 2,
      status: "PASSED",
    });
  });

  it("skips rung 4 when the prerequisite is solid and rung 5 without a contrast pair", () => {
    expect(
      nextApplicableRung({ rung: 3, status: "ACTIVE" }, "FAILED", {
        prerequisiteMastery: 80,
        hasContrastPair: false,
      }),
    ).toEqual({ rung: 6, status: "ACTIVE" });
    expect(
      nextApplicableRung({ rung: 3, status: "ACTIVE" }, "FAILED", {
        prerequisiteMastery: 40,
        hasContrastPair: true,
      }),
    ).toEqual({ rung: 4, status: "ACTIVE" });
  });

  it("starts on NEEDS_PRACTICE or an active error (count7d >= 2), never twice", () => {
    expect(shouldStartRemediation({ status: "NEEDS_PRACTICE", hasActiveTrack: false })).toBe(true);
    expect(
      shouldStartRemediation({ status: "SOLID", errorCount7d: 2, hasActiveTrack: false }),
    ).toBe(true);
    expect(
      shouldStartRemediation({ status: "SOLID", errorCount7d: 1, hasActiveTrack: false }),
    ).toBe(false);
    expect(shouldStartRemediation({ status: "NEEDS_PRACTICE", hasActiveTrack: true })).toBe(false);
  });
});
