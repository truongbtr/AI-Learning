import { describe, expect, it } from "vitest";
import { LEARNING_TABLES, PROTECTED_TABLES } from "./reset-learning";

/**
 * The reset is a list of table names, so the test that matters is about the list: the bank of
 * exercises and the skill map must not be on the side that gets emptied. Getting this wrong once
 * costs the 1,236 exercises of the first content batch.
 */
describe("what a learning-data reset may and may not touch (docs/08 pha 8 việc 0.3)", () => {
  it("never lists content among the tables it empties", () => {
    const wiped = new Set<string>(LEARNING_TABLES);
    for (const table of PROTECTED_TABLES) expect(wiped.has(table)).toBe(false);
  });

  it("names the four tables CLAUDE.md forbids touching", () => {
    for (const table of ["Skill", "Exercise", "LessonUnit", "ContentBatch"])
      expect(PROTECTED_TABLES as readonly string[]).toContain(table);
  });

  it("empties the four tables that hold what a child did", () => {
    for (const table of ["Evidence", "SkillMastery", "Session", "Attempt"])
      expect(LEARNING_TABLES as readonly string[]).toContain(table);
  });

  it("empties the Leitner memory of words and syllables, and keeps the dictionaries", () => {
    expect(LEARNING_TABLES as readonly string[]).toContain("LexemeProgress");
    for (const table of ["Word", "Syllable"])
      expect(PROTECTED_TABLES as readonly string[]).toContain(table);
  });

  it("empties the three tables whose dates were a day out", () => {
    // ADR-18's closing note: Session.date, Streak.lastActiveDate, EggProgress.startedOn.
    for (const table of ["Session", "Streak", "EggProgress"])
      expect(LEARNING_TABLES as readonly string[]).toContain(table);
  });

  it("deletes children before their parents, so foreign keys never block", () => {
    const at = (table: string) => (LEARNING_TABLES as readonly string[]).indexOf(table);
    expect(at("Attempt")).toBeLessThan(at("Session"));
    expect(at("IntakeItem")).toBeLessThan(at("IntakeJob"));
    expect(at("IntakeResult")).toBeLessThan(at("IntakeJob"));
    expect(at("PlanItem")).toBeLessThan(at("Plan"));
    expect(at("Message")).toBeLessThan(at("Conversation"));
  });

  it("leaves the login and the profile in place — this empties a child, it does not delete one", () => {
    for (const table of ["User", "Student"])
      expect(LEARNING_TABLES as readonly string[]).not.toContain(table);
  });
});
