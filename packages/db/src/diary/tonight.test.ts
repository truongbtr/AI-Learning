import { describe, expect, it } from "vitest";
import { shouldNudgeForDiary } from "./tonight";

/**
 * The nudge that has to earn its place: a parent who is reminded twice stops reading reminders,
 * and one that fires on a Sunday about a school day that did not happen is worse than none.
 */
describe("nudging for tonight's class diary (docs/08 pha 5 việc 6)", () => {
  const base = { hasDiaryToday: false, weekday: 4, hour: 20, today: "2026-09-17" } as const;

  it("asks on a school evening when nothing has been pasted", () => {
    expect(shouldNudgeForDiary(base)).toBe(true);
  });

  it("says nothing once the diary is in", () => {
    expect(shouldNudgeForDiary({ ...base, hasDiaryToday: true })).toBe(false);
  });

  it("says nothing at the weekend", () => {
    expect(shouldNudgeForDiary({ ...base, weekday: 6 })).toBe(false);
    expect(shouldNudgeForDiary({ ...base, weekday: 0 })).toBe(false);
  });

  it("waits until the child is home from school", () => {
    expect(shouldNudgeForDiary({ ...base, hour: 9 })).toBe(false);
    expect(shouldNudgeForDiary({ ...base, hour: 16 })).toBe(true);
  });

  it("asks once: dismissing it today keeps it quiet today", () => {
    expect(shouldNudgeForDiary({ ...base, dismissedFor: "2026-09-17" })).toBe(false);
    expect(shouldNudgeForDiary({ ...base, dismissedFor: "2026-09-16" })).toBe(true);
  });
});
