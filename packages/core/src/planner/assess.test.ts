import { describe, expect, it } from "vitest";
import {
  ASSESSMENT_SLOTS,
  type AssessSkill,
  neighbour,
  nextStep,
  openingSteps,
  roundSubjects,
  startingSkill,
  strandsOf,
} from "./assess";
import type { Subject } from "./types";

/** A strand of `n` skills, in teaching order, each with a prerequisite on the one before it. */
function strand(
  subject: Subject,
  name: string,
  n: number,
  opts: { weekFrom?: number; exercises?: number } = {},
): AssessSkill[] {
  const { weekFrom = 1, exercises = 5 } = opts;
  return Array.from({ length: n }, (_, i) => ({
    code: `${subject}.${name}.S${i + 1}`,
    subject,
    strand: `${subject}.${name}`,
    order: i + 1,
    expectedWeek: weekFrom + i,
    prerequisites: i === 0 ? [] : [`${subject}.${name}.S${i}`],
    exerciseCount: exercises,
  }));
}

const BANK: AssessSkill[] = [
  ...strand("VIET", "HV", 8),
  ...strand("VMATH", "SO", 6),
  ...strand("ESL", "VOC", 5),
  ...strand("ENL", "RF", 4),
];

describe("the first three evenings (docs/04 §10)", () => {
  it("pairs the six subjects into three evenings and wraps after that", () => {
    expect(roundSubjects(0)).toEqual(["VIET", "VMATH"]);
    expect(roundSubjects(1)).toEqual(["ESL", "ENL"]);
    expect(roundSubjects(2)).toEqual(["EMATH", "ESCI"]);
    expect(roundSubjects(3)).toEqual(roundSubjects(0));
  });

  it("starts where the class should be, not at the beginning of the strand", () => {
    // Week 5 of a strand whose skills are expected in weeks 1..8: the last one already covered.
    const start = startingSkill(BANK, "VIET.HV", 5);
    expect(start?.code).toBe("VIET.HV.S5");
  });

  it("starts at the first skill when the class has not reached any of them yet", () => {
    expect(startingSkill(BANK, "VIET.HV", 0)?.code).toBe("VIET.HV.S1");
  });

  it("never starts on a skill the bank has no questions for", () => {
    const empty = strand("VIET", "EMPTY", 4, { exercises: 0 });
    expect(startingSkill(empty, "VIET.EMPTY", 3)).toBeNull();
    expect(strandsOf(empty, "VIET")).toEqual([]);
  });

  it("fills ten stations and never asks the same skill twice", () => {
    const steps = openingSteps(BANK, 0, 5);
    expect(steps).toHaveLength(ASSESSMENT_SLOTS);
    expect(new Set(steps.map((s) => s.skillCode)).size).toBe(ASSESSMENT_SLOTS);
  });

  it("leads with the evening's own subjects", () => {
    const steps = openingSteps(BANK, 0, 5);
    expect(["VIET", "VMATH"]).toContain(steps[0]?.subject);
    expect(["VIET", "VMATH"]).toContain(steps[1]?.subject);
  });

  /**
   * Batch one covers 28 skills of 376: English Science has no exercises at all and English Maths
   * has two. The third evening would otherwise be two questions long. A child never sees a gap —
   * the missing content is `pnpm content:stats`'s problem, not hers.
   */
  it("fills the rest from subjects that do have questions when its own are empty", () => {
    const steps = openingSteps(BANK, 2, 5); // round 2 = EMATH + ESCI, neither in BANK
    expect(steps).toHaveLength(ASSESSMENT_SLOTS);
    expect(steps.every((s) => ["VIET", "VMATH", "ESL", "ENL"].includes(s.subject))).toBe(true);
  });

  it("returns nothing at all when the bank is empty", () => {
    expect(openingSteps(strand("VIET", "HV", 5, { exercises: 0 }), 0, 3)).toEqual([]);
  });
});

describe("one answer, one move", () => {
  const at = (code: string) => BANK.find((s) => s.code === code) as AssessSkill;

  it("goes up the strand after a right answer", () => {
    const step = nextStep({
      skills: BANK,
      current: at("VIET.HV.S4"),
      correct: true,
      difficulty: 3,
      asked: new Set(["VIET.HV.S4"]),
    });
    expect(step?.skillCode).toBe("VIET.HV.S5");
    expect(step?.difficulty).toBe(4);
  });

  /**
   * docs/04 §2: a skill standing on a shaky prerequisite is the thing worth finding out about,
   * so a wrong answer goes to the prerequisite before it goes to the previous skill in the strand.
   */
  it("goes to the prerequisite after a wrong answer, and makes it easier", () => {
    const step = nextStep({
      skills: BANK,
      current: at("VIET.HV.S4"),
      correct: false,
      difficulty: 3,
      asked: new Set(["VIET.HV.S4"]),
    });
    expect(step?.skillCode).toBe("VIET.HV.S3");
    expect(step?.difficulty).toBe(2);
    expect(step?.reason).toContain("tiên quyết");
  });

  it("never repeats a skill already asked this evening", () => {
    const step = nextStep({
      skills: BANK,
      current: at("VIET.HV.S4"),
      correct: true,
      difficulty: 3,
      asked: new Set(["VIET.HV.S4", "VIET.HV.S5"]),
    });
    expect(step).toBeNull();
  });

  it("stops at the ends of the strand instead of falling off them", () => {
    expect(neighbour(BANK, at("VIET.HV.S8"), 1)).toBeNull();
    expect(neighbour(BANK, at("VIET.HV.S1"), -1)).toBeNull();
    expect(
      nextStep({
        skills: BANK,
        current: at("VIET.HV.S8"),
        correct: true,
        difficulty: 5,
        asked: new Set(["VIET.HV.S8"]),
      }),
    ).toBeNull();
  });

  it("keeps difficulty inside 1..5 however long the walk goes", () => {
    let current = at("VIET.HV.S1");
    let difficulty = 5;
    const asked = new Set([current.code]);
    for (let i = 0; i < 6; i++) {
      const step = nextStep({ skills: BANK, current, correct: true, difficulty, asked });
      if (!step) break;
      expect(step.difficulty).toBeGreaterThanOrEqual(1);
      expect(step.difficulty).toBeLessThanOrEqual(5);
      difficulty = step.difficulty;
      current = BANK.find((s) => s.code === step.skillCode) as AssessSkill;
      asked.add(current.code);
    }
  });

  /** The point of the whole thing: ten answers locate a child, they do not just fill an evening. */
  it("walks down to the bottom of a strand for a child who gets everything wrong", () => {
    let current = at("VIET.HV.S6");
    let difficulty = 3;
    const asked = new Set([current.code]);
    const path: string[] = [current.code];
    for (let i = 0; i < 5; i++) {
      const step = nextStep({ skills: BANK, current, correct: false, difficulty, asked });
      if (!step) break;
      difficulty = step.difficulty;
      current = BANK.find((s) => s.code === step.skillCode) as AssessSkill;
      asked.add(current.code);
      path.push(current.code);
    }
    expect(path).toEqual([
      "VIET.HV.S6",
      "VIET.HV.S5",
      "VIET.HV.S4",
      "VIET.HV.S3",
      "VIET.HV.S2",
      "VIET.HV.S1",
    ]);
    expect(difficulty).toBe(1);
  });
});
