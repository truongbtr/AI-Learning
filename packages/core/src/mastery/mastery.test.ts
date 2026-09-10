import { describe, expect, it } from "vitest";
import { applyDecay } from "./decay";
import { isReviewDue, nextReviewAt, reviewIntervalAfter } from "./review";
import { isWeakSkill, statusOf } from "./status";
import { computeTrend14d } from "./trend";
import type { MasteryEvidence, MasteryState } from "./types";
import { dayKey, emptyMasteryState, updateMastery } from "./update";

const DAY = 86_400_000;
const T0 = new Date("2026-09-11T12:00:00+07:00");

function state(partial: Partial<MasteryState>): MasteryState {
  return { ...emptyMasteryState(), ...partial };
}

function exercise(score: number, extra: Partial<MasteryEvidence> = {}): MasteryEvidence {
  return { source: "EXERCISE", score, difficulty: 3, observedAt: T0, ...extra };
}

describe("updateMastery - docs/04 sec. 3.1", () => {
  const base = state({ mastery: 50, confidence: 0.5, evidenceCount: 3, status: "LEARNING" });

  it("QC example: m=50, c=0.5, EXERCISE correct d=3 -> 59.9, c=0.58", () => {
    const { state: s, k } = updateMastery(base, exercise(1));
    expect(k).toBe(18);
    expect(s.mastery).toBeCloseTo(59.9, 1);
    expect(s.confidence).toBeCloseTo(0.58, 2);
    expect(s.evidenceCount).toBe(4);
    expect(s.lastEvidenceAt).toEqual(T0);
  });

  it("QC example: same state, incorrect -> 40.1", () => {
    const { state: s } = updateMastery(base, exercise(0));
    expect(s.mastery).toBeCloseTo(40.1, 1);
  });

  it("weights the step by source (INTAKE_PHOTO 0.8 -> k = 14.4)", () => {
    const { state: s, k, weight } = updateMastery(base, exercise(1, { source: "INTAKE_PHOTO" }));
    expect(weight).toBe(0.8);
    expect(k).toBeCloseTo(14.4, 5);
    // 50 + 50 * 0.144 * 1.1 = 57.92
    expect(s.mastery).toBeCloseTo(57.92, 2);
    expect(s.confidence).toBeCloseTo(0.564, 3);
  });

  it("harder items move more: d=5 -> k = 18 * 1.3", () => {
    const { k } = updateMastery(base, exercise(1, { difficulty: 5 }));
    expect(k).toBeCloseTo(23.4, 5);
  });

  it("hints and retries shrink the score (0.6, then 0.7^(tries-1))", () => {
    const hinted = updateMastery(base, exercise(1, { hintsUsed: 1 }));
    expect(hinted.effectiveScore).toBeCloseTo(0.6, 5);
    const retried = updateMastery(base, exercise(1, { tries: 3 }));
    expect(retried.effectiveScore).toBeCloseTo(0.49, 5);
    // with s = 0.6: 50 + (60 - 50) * 0.18 * 1.1 = 51.98
    expect(hinted.state.mastery).toBeCloseTo(51.98, 2);
  });

  it("low confidence jumps faster (c=0 -> factor 1.4)", () => {
    const fresh = updateMastery(emptyMasteryState(), exercise(1));
    expect(fresh.state.mastery).toBeCloseTo(25.2, 5);
    expect(fresh.state.confidence).toBeCloseTo(0.08, 5);
    expect(fresh.state.status).toBe("LEARNING");
  });

  it("PARENT_OVERRIDE sets the value directly with c = 0.9", () => {
    const { state: s, k } = updateMastery(base, {
      source: "PARENT_OVERRIDE",
      score: 0.7,
      observedAt: T0,
    });
    expect(k).toBe(0);
    expect(s.mastery).toBe(70);
    expect(s.confidence).toBe(0.9);
    expect(s.status).toBe("SOLID");
  });

  it("clamps to 0..100 and confidence to 1", () => {
    const high = state({ mastery: 99, confidence: 0.98, evidenceCount: 9 });
    const { state: s } = updateMastery(high, exercise(1));
    expect(s.mastery).toBeLessThanOrEqual(100);
    expect(s.confidence).toBe(1);
  });

  it("does not mutate the input state", () => {
    const before = JSON.stringify(base);
    updateMastery(base, exercise(1));
    expect(JSON.stringify(base)).toBe(before);
  });

  it("records distinct correct days in Vietnam time", () => {
    const a = updateMastery(emptyMasteryState(), exercise(1, { observedAt: T0 }));
    const sameDay = updateMastery(
      a.state,
      exercise(1, { observedAt: new Date(T0.getTime() + 3600e3) }),
    );
    expect(sameDay.state.correctDayKeys).toEqual(["2026-09-11"]);
    const nextDay = updateMastery(
      sameDay.state,
      exercise(1, { observedAt: new Date(T0.getTime() + DAY) }),
    );
    expect(nextDay.state.correctDayKeys).toEqual(["2026-09-11", "2026-09-12"]);
    // 23:30 VN on 11/09 is 16:30 UTC — still the 11th at home
    expect(dayKey(new Date("2026-09-11T16:30:00Z"))).toBe("2026-09-11");
    const wrong = updateMastery(
      nextDay.state,
      exercise(0, { observedAt: new Date(T0.getTime() + 2 * DAY) }),
    );
    expect(wrong.state.correctDayKeys).toHaveLength(2);
  });
});

describe("statusOf - docs/04 sec. 3.3", () => {
  const days = ["2026-09-01", "2026-09-02", "2026-09-03"];
  it.each([
    [
      "NOT_STARTED",
      { mastery: 0, confidence: 0, evidenceCount: 0, trend14d: 0, correctDayKeys: [] },
    ],
    [
      "LEARNING",
      { mastery: 30, confidence: 0.2, evidenceCount: 1, trend14d: 0, correctDayKeys: [] },
    ],
    [
      "LEARNING",
      { mastery: 70, confidence: 0.3, evidenceCount: 2, trend14d: 0, correctDayKeys: days },
    ],
    [
      "NEEDS_PRACTICE",
      { mastery: 55, confidence: 0.5, evidenceCount: 5, trend14d: 0, correctDayKeys: [] },
    ],
    [
      "NEEDS_PRACTICE",
      { mastery: 70, confidence: 0.5, evidenceCount: 5, trend14d: -8, correctDayKeys: [] },
    ],
    [
      "NEEDS_PRACTICE",
      { mastery: 70, confidence: 0.5, evidenceCount: 5, trend14d: -12.5, correctDayKeys: [] },
    ],
    ["SOLID", { mastery: 60, confidence: 0.4, evidenceCount: 4, trend14d: 0, correctDayKeys: [] }],
    [
      "SOLID",
      { mastery: 84.9, confidence: 0.9, evidenceCount: 9, trend14d: -7.9, correctDayKeys: days },
    ],
    [
      "SOLID",
      { mastery: 90, confidence: 0.5, evidenceCount: 9, trend14d: 0, correctDayKeys: days },
    ],
    [
      "SOLID",
      {
        mastery: 90,
        confidence: 0.7,
        evidenceCount: 9,
        trend14d: 0,
        correctDayKeys: days.slice(0, 2),
      },
    ],
    [
      "MASTERED",
      { mastery: 85, confidence: 0.6, evidenceCount: 3, trend14d: 0, correctDayKeys: days },
    ],
    [
      "MASTERED",
      { mastery: 95, confidence: 0.9, evidenceCount: 12, trend14d: -9, correctDayKeys: days },
    ],
  ] as const)("-> %s", (expected, s) => {
    expect(statusOf({ ...s, correctDayKeys: [...s.correctDayKeys] })).toBe(expected);
  });

  it("three transitions through the table with real updates", () => {
    // 1) first correct evidence: NOT_STARTED -> LEARNING
    const first = updateMastery(emptyMasteryState(), exercise(1)).state;
    expect(first.status).toBe("LEARNING");
    // 2) parent sets 70: -> SOLID (c = 0.9)
    const solid = updateMastery(first, {
      source: "PARENT_OVERRIDE",
      score: 0.7,
      observedAt: T0,
    }).state;
    expect(solid.status).toBe("SOLID");
    // 3) wrong answer: 70 - 70 * 0.18 * (1.4 - 0.54) = 59.2 with c >= 0.4 -> NEEDS_PRACTICE
    const weak = updateMastery(solid, exercise(0)).state;
    expect(weak.mastery).toBeCloseTo(59.16, 1);
    expect(weak.status).toBe("NEEDS_PRACTICE");
  });

  it("reaches MASTERED only with 3 correct days", () => {
    let s = updateMastery(emptyMasteryState(), {
      source: "PARENT_OVERRIDE",
      score: 0.9,
      observedAt: new Date(T0.getTime() - 10 * DAY),
    }).state;
    expect(s.status).toBe("SOLID");
    for (let i = 0; i < 3; i++) {
      s = updateMastery(s, exercise(1, { observedAt: new Date(T0.getTime() + i * DAY) })).state;
      expect(s.status).toBe(i < 2 ? "SOLID" : "MASTERED");
    }
  });

  it("isWeakSkill follows sec. 3.5", () => {
    expect(isWeakSkill({ status: "NEEDS_PRACTICE", evidenceCount: 1, mastery: 80 })).toBe(true);
    expect(isWeakSkill({ status: "LEARNING", evidenceCount: 3, mastery: 49 })).toBe(true);
    expect(isWeakSkill({ status: "LEARNING", evidenceCount: 2, mastery: 49 })).toBe(false);
    expect(isWeakSkill({ status: "SOLID", evidenceCount: 5, mastery: 70 }, 2)).toBe(true);
  });
});

describe("applyDecay - docs/04 sec. 3.2", () => {
  const solid = state({
    mastery: 70,
    confidence: 0.5,
    evidenceCount: 5,
    status: "SOLID",
    lastEvidenceAt: T0,
  });

  it("does nothing within 21 days", () => {
    const now = new Date(T0.getTime() + 21 * DAY);
    expect(applyDecay(solid, now)).toBe(solid);
  });

  it("after 21 days: c -0.01/day, m -0.3/day (N = 10 days)", () => {
    const now = new Date(T0.getTime() + 31 * DAY);
    const s = applyDecay(solid, now, 10);
    expect(s.confidence).toBeCloseTo(0.4, 5);
    expect(s.mastery).toBeCloseTo(67, 5);
    expect(s.status).toBe("SOLID");
  });

  it("confidence floor 0.2 flips SOLID to LEARNING; mastery floor 60", () => {
    const now = new Date(T0.getTime() + 100 * DAY);
    const s = applyDecay(solid, now, 60);
    expect(s.confidence).toBe(0.2);
    expect(s.mastery).toBe(60);
    expect(s.status).toBe("LEARNING");
  });

  it("does not touch mastery already at or below 60", () => {
    const low = state({ ...solid, mastery: 45, status: "NEEDS_PRACTICE" });
    const s = applyDecay(low, new Date(T0.getTime() + 40 * DAY), 5);
    expect(s.mastery).toBe(45);
    expect(s.confidence).toBeCloseTo(0.45, 5);
  });

  it("ignores skills without evidence", () => {
    const empty = emptyMasteryState();
    expect(applyDecay(empty, new Date(T0.getTime() + 400 * DAY), 30)).toBe(empty);
  });
});

describe("spaced repetition - docs/04 sec. 3.4", () => {
  it("ladder 2 -> 4 -> 8 -> 16 -> 30 -> 30 on correct reviews", () => {
    let interval = 0;
    const seen: number[] = [];
    for (let i = 0; i < 6; i++) {
      interval = reviewIntervalAfter({
        previousInterval: interval,
        wasSolid: true,
        nowSolid: true,
        correct: true,
      });
      seen.push(interval);
    }
    expect(seen).toEqual([2, 4, 8, 16, 30, 30]);
  });

  it("failed review resets to 2 days", () => {
    expect(
      reviewIntervalAfter({ previousInterval: 16, wasSolid: true, nowSolid: true, correct: false }),
    ).toBe(2);
    expect(
      reviewIntervalAfter({
        previousInterval: 16,
        wasSolid: true,
        nowSolid: false,
        correct: false,
      }),
    ).toBe(2);
  });

  it("not scheduled before SOLID", () => {
    expect(
      reviewIntervalAfter({ previousInterval: 0, wasSolid: false, nowSolid: false, correct: true }),
    ).toBe(0);
    expect(nextReviewAt({ intervalDays: 0, lastEvidenceAt: T0 })).toBeNull();
  });

  it("nextReviewAt = last evidence + interval, and due check", () => {
    const at = nextReviewAt({ intervalDays: 4, lastEvidenceAt: T0 });
    expect(at).toEqual(new Date(T0.getTime() + 4 * DAY));
    expect(isReviewDue({ nextReviewAt: at }, new Date(T0.getTime() + 3 * DAY))).toBe(false);
    expect(isReviewDue({ nextReviewAt: at }, new Date(T0.getTime() + 4 * DAY))).toBe(true);
  });

  it("updateMastery schedules the first review when a skill becomes SOLID", () => {
    const s = updateMastery(emptyMasteryState(), {
      source: "PARENT_OVERRIDE",
      score: 0.7,
      observedAt: T0,
    }).state;
    expect(s.intervalDays).toBe(2);
    expect(s.nextReviewAt).toEqual(new Date(T0.getTime() + 2 * DAY));
    const reviewed = updateMastery(
      s,
      exercise(1, { observedAt: new Date(T0.getTime() + 2 * DAY) }),
    );
    expect(reviewed.state.intervalDays).toBe(4);
  });
});

describe("computeTrend14d", () => {
  it("uses the value 14 days ago as baseline", () => {
    const points = [
      { at: new Date(T0.getTime() - 20 * DAY), masteryBefore: 40, masteryAfter: 50 },
      { at: new Date(T0.getTime() - 10 * DAY), masteryBefore: 50, masteryAfter: 45 },
      { at: new Date(T0.getTime() - 1 * DAY), masteryBefore: 45, masteryAfter: 41 },
    ];
    expect(computeTrend14d(points, 41, T0)).toBe(-9);
  });

  it("falls back to the first in-window masteryBefore, and 0 without history", () => {
    const points = [{ at: new Date(T0.getTime() - 3 * DAY), masteryBefore: 30, masteryAfter: 38 }];
    expect(computeTrend14d(points, 38, T0)).toBe(8);
    expect(computeTrend14d([], 38, T0)).toBe(0);
  });
});
