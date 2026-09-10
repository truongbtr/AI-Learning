import { describe, expect, it } from "vitest";
import { applyFailure, applySuccess, ipThrottled, isLocked, lockRemainingSeconds } from "./lockout";

const t0 = new Date("2026-09-10T20:00:00Z");

describe("lockout policy (docs/12 §6)", () => {
  it("locks for 10 minutes on the 5th failure", () => {
    let state = { failedCount: 0, lockedUntil: null as Date | null };
    for (let i = 1; i <= 4; i++) {
      state = applyFailure(state, t0);
      expect(state.failedCount).toBe(i);
      expect(isLocked(state, t0)).toBe(false);
    }
    state = applyFailure(state, t0);
    expect(state.failedCount).toBe(5);
    expect(isLocked(state, t0)).toBe(true);
    expect(lockRemainingSeconds(state, t0)).toBe(600);
  });

  it("unlocks after the window and restarts the counter", () => {
    let state = { failedCount: 5, lockedUntil: new Date(t0.getTime() + 600_000) };
    const later = new Date(t0.getTime() + 601_000);
    expect(isLocked(state, later)).toBe(false);
    state = applyFailure(state, later);
    expect(state.failedCount).toBe(1);
    expect(state.lockedUntil).toBeNull();
  });

  it("resets on success", () => {
    expect(applySuccess()).toEqual({ failedCount: 0, lockedUntil: null });
  });

  it("throttles an IP at 10 attempts/minute", () => {
    expect(ipThrottled(9)).toBe(false);
    expect(ipThrottled(10)).toBe(true);
  });
});
