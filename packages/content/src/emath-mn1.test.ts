import { type PlannerInput, planSession, type SkillSnapshot } from "@mtct/core";
import { describe, expect, it } from "vitest";
import { lessonFileSchema } from "./lesson";
import { loadLessons, loadLessonUnitFiles, loadSkillMaps } from "./load";
import { lessonToRow } from "./to-rows";

/**
 * Pha 13: MATH NOTES Grade 1 · Volume 1 (EDI-MN1) — the lessons, and what moving the English
 * maths skills to the book's pace does to the evening plan.
 */
const emath = loadSkillMaps().find((m) => m.map.subject === "EMATH")!.map;
const byCode = new Map(emath.skills.map((s) => [s.code, s]));
const mn1 = loadLessons().filter((l) => l.lesson.code.startsWith("EDI-MN1-"));

describe("EDI-MN1 lessons", () => {
  it("has the 14 lessons of Unit 3 and Unit 4 up to Make a 10, in book order", () => {
    const codes = mn1.map((l) => l.lesson.code).sort();
    expect(codes).toEqual([
      ...Array.from({ length: 9 }, (_, i) => `EDI-MN1-U3-L${i + 1}`),
      ...Array.from({ length: 5 }, (_, i) => `EDI-MN1-U4-L${i + 1}`),
    ]);
    const pages = [...mn1]
      .sort((a, b) => a.lesson.book.pageFrom - b.lesson.book.pageFrom)
      .map((l) => l.lesson.code);
    expect(pages).toEqual(codes);
    for (const { lesson } of mn1) {
      expect(lesson.book.pageTo).toBeLessThanOrEqual(51); // the scan stops at book page 51
      expect(lesson.sampleTasks.some((t) => t.text.startsWith("Try This First"))).toBe(true);
      expect(lesson.sampleTasks.some((t) => t.text.startsWith("Exit Ticket"))).toBe(true);
      expect(lesson.contentText).toMatch(/Tuần là ước/);
    }
  });

  it("keeps the number printed at the top of the page where it differs", () => {
    const label = (code: string) => mn1.find((l) => l.lesson.code === code)?.lesson.bookLabel;
    expect(label("EDI-MN1-U3-L7")).toBe("Lesson 3-6");
    expect(label("EDI-MN1-U4-L3")).toBe("Lesson 4-2");
    expect(label("EDI-MN1-U3-L1")).toBeUndefined();
    const row = lessonToRow(mn1.find((l) => l.lesson.code === "EDI-MN1-U3-L7")!.lesson);
    expect(row.title).toBe("Lesson 3-6 · Compare Numbers");
  });

  it("agrees with its skeleton units on title, pages, weeks and skills", () => {
    const units = loadLessonUnitFiles()
      .flatMap((f) => f.units.units)
      .filter((u) => u.code.startsWith("EDI-MN1-"));
    expect(units).toHaveLength(14);
    for (const u of units) {
      const lesson = mn1.find((l) => l.lesson.code === u.code)!.lesson;
      expect(u.title).toBe(lessonToRow(lesson).title);
      expect([u.pageFrom, u.pageTo, u.weekFrom, u.weekTo]).toEqual([
        lesson.book.pageFrom,
        lesson.book.pageTo,
        lesson.weekFrom,
        lesson.weekTo,
      ]);
      expect(u.skills).toEqual(lesson.skills);
    }
  });

  it("refuses a bookLabel that is not a short label", () => {
    const base = {
      code: "EDI-MN1-U3-L7",
      subject: "EMATH",
      title: "Compare Numbers",
      book: { name: "MATH NOTES", file: "x.pdf", pageFrom: 23 },
      skills: [{ code: "EMATH.NBT.COMPARE_TO_20" }],
    };
    expect(lessonFileSchema.safeParse({ ...base, bookLabel: "Lesson 3-6" }).success).toBe(true);
    expect(lessonFileSchema.safeParse({ ...base, bookLabel: "x".repeat(41) }).success).toBe(false);
    expect(lessonFileSchema.safeParse(base).success).toBe(true);
  });
});

describe("EMATH skills at the book's pace", () => {
  it("dates every book skill at its lesson and never before a prerequisite", () => {
    const lessonWeek = new Map(mn1.map((l) => [l.lesson.code, l.lesson.weekFrom]));
    for (const skill of emath.skills) {
      const refs = [skill.lessonRef ?? []].flat().filter((r) => r.startsWith("EDI-MN1-"));
      if (refs.length === 0) continue;
      const first = Math.min(...refs.map((r) => lessonWeek.get(r) as number));
      // a skill taught in an earlier book (COUNT_TO_20, ADD_WITHIN_10) may stay earlier
      expect(skill.expectedWeek, skill.code).toBeLessThanOrEqual(first);
      for (const p of skill.prerequisites) {
        const pre = byCode.get(p);
        if (pre?.expectedWeek != null)
          expect(pre.expectedWeek, `${skill.code} ← ${p}`).toBeLessThanOrEqual(
            skill.expectedWeek as number,
          );
      }
    }
    expect(byCode.get("EMATH.NBT.TENS_ONES")?.prerequisites).toEqual([
      "EMATH.NBT.COUNT_TO_20",
      "EMATH.NBT.TEEN_NUMBERS",
    ]);
  });

  /** One child, every EMATH skill: what the evening looks like under the new map. */
  const snapshot = (
    mastered: Record<string, number>,
    over: (s: SkillSnapshot) => Partial<SkillSnapshot> = () => ({}),
  ): SkillSnapshot[] =>
    emath.skills.map((s) => {
      const m = mastered[s.code];
      const base: SkillSnapshot = {
        code: s.code,
        subject: "EMATH",
        mastery: m ?? 0,
        status: m == null ? "NOT_STARTED" : m >= 60 ? "SOLID" : "LEARNING",
        confidence: m == null ? 0 : 0.6,
        nextReviewAt: null,
        overdueDays: -1,
        trend14d: 0,
        evidenceCount: m == null ? 0 : 6,
        prerequisites: s.prerequisites,
        confusableWith: s.confusableWith,
        expectedWeek: s.expectedWeek ?? null,
      };
      return { ...base, ...over(base) };
    });
  const input = (skills: SkillSnapshot[]): PlannerInput => ({
    date: new Date("2026-09-17T19:00:00+07:00"),
    dailyMinutes: 15,
    skills,
  });
  const newSkills = (skills: SkillSnapshot[]) =>
    planSession(input(skills))
      .slots.filter((s) => s.kind === "new")
      .map((s) => s.skillCode);

  it("opens teen numbers before tens and ones, and tens and ones only after teen numbers", () => {
    const start = {
      "EMATH.NBT.COUNT_TO_20": 70,
      "EMATH.NBT.COMPARE_1_10": 70,
      "EMATH.OA.ADD_WITHIN_5": 70,
      "EMATH.OA.SUB_WITHIN_5": 70,
    };
    const fresh = newSkills(snapshot(start));
    // the only week-4 NBT skill left, ahead of anything the book dates later
    expect(fresh).toContain("EMATH.NBT.TEEN_NUMBERS");
    for (const code of fresh)
      expect(byCode.get(code)?.expectedWeek ?? 99, code).toBeLessThanOrEqual(4);
    expect(fresh).not.toContain("EMATH.NBT.TENS_ONES");
    expect(fresh).not.toContain("EMATH.NBT.COMPARE_TO_20");

    // weeks 4–5 done: before pha 13 tens and ones waited for SKIP_COUNT_10S (week 19)
    const later = newSkills(
      snapshot({
        ...start,
        "EMATH.NBT.TEEN_NUMBERS": 65,
        "EMATH.NBT.NUMBER_CHART_20": 70,
        "EMATH.NBT.NUMBER_LINE_TO_20": 70,
        "EMATH.G.PATTERNS": 70,
        "EMATH.G.NAME_2D_SHAPES": 70,
        "EMATH.MP.MATH_VOCAB_EN": 70,
      }),
    );
    expect(later[0]).toBe("EMATH.NBT.TENS_ONES");
    // place-value models still wait for tens and ones
    expect(later).not.toContain("EMATH.NBT.PLACE_VALUE_MODELS");
  });

  it("keeps at least 30% of the practice half for review under the new weeks", () => {
    const skills = snapshot(
      {
        "EMATH.NBT.COUNT_TO_20": 70,
        "EMATH.NBT.COMPARE_1_10": 75,
        "EMATH.OA.ADD_WITHIN_5": 80,
        "EMATH.OA.SUB_WITHIN_5": 72,
        "EMATH.G.NAME_2D_SHAPES": 68,
        "EMATH.NBT.TEEN_NUMBERS": 64,
      },
      (s) =>
        s.evidenceCount > 0
          ? { nextReviewAt: new Date("2026-09-15T00:00:00+07:00"), overdueDays: 2 }
          : {},
    );
    const plan = planSession(input(skills));
    const reviews = plan.slots.filter((s) => s.kind === "review").length;
    // 12 slots: 1 warm-up and 1 finish, so 10 to share; 30% of 10 is 3
    expect(plan.slots).toHaveLength(12);
    expect(reviews).toBeGreaterThanOrEqual(3);
    expect(plan.slots.filter((s) => s.kind === "new").length).toBeGreaterThan(0);
  });
});
