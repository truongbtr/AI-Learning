import { describe, expect, it } from "vitest";
import { MIN_MINUTES, minutesFromAttempts, REQUIRED_DAYS, TRIAL_DAYS } from "./trial";

/**
 * The number the whole phase is judged on. Two ways of getting it wrong, both flattering:
 * counting wall-clock time as learning time, and counting a session nobody finished.
 */
describe("how long a child actually spent (docs/08 pha 8, tiêu chí 1)", () => {
  const at = (minute: number, second = 0) => new Date(Date.UTC(2026, 8, 14, 12, minute, second));

  it("counts nothing when there are no answers", () => {
    expect(minutesFromAttempts([], 3600)).toBe(0);
  });

  it("adds up the gaps between answers", () => {
    // Ten answers, one a minute: nine gaps of 60s, plus 60s for the first question.
    const times = Array.from({ length: 10 }, (_, i) => at(i));
    expect(minutesFromAttempts(times, 900)).toBe(10);
  });

  /**
   * The one that matters: an iPad face-up on the table for forty minutes between two answers is
   * not forty minutes of learning, and a criterion that counted it would be met by leaving the
   * app open.
   */
  it("caps a single gap at three minutes, so a tablet left on the sofa is not learning", () => {
    const long = [at(0), at(40), at(41)];
    // 180s (capped) + 60s + 120s for the first = 6 minutes, not 41.
    expect(minutesFromAttempts(long, 3600)).toBeLessThanOrEqual(7);
    expect(minutesFromAttempts(long, 3600)).toBeGreaterThan(3);
  });

  it("never claims more than the session's own clock", () => {
    const times = Array.from({ length: 20 }, (_, i) => at(i));
    expect(minutesFromAttempts(times, 300)).toBe(5);
  });

  it("does not care what order the answers arrived in", () => {
    const times = [at(3), at(0), at(2), at(1)];
    expect(minutesFromAttempts(times, 900)).toBe(minutesFromAttempts([...times].reverse(), 900));
  });

  it("gives a single answer a nominal half minute rather than zero", () => {
    expect(minutesFromAttempts([at(0)], 600)).toBe(1);
  });

  it("keeps the criterion the owner actually set", () => {
    expect(MIN_MINUTES).toBe(10);
    expect(REQUIRED_DAYS).toBe(10);
    expect(TRIAL_DAYS).toBe(14);
  });
});
