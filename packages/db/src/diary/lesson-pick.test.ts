import { afterAll, beforeAll, describe, expect, it, type TestContext } from "vitest";
import { databaseReachable, disconnectTestDb, testDb } from "../test-db";
import { currentLessons, lessonChoices, nextLessonAfter, setTodaysLesson } from "./lesson-pick";
import { saveClassDiary } from "./save";

/**
 * "Hôm nay lớp học bài nào?" (docs/11 §4) against the real lesson units.
 *
 * The thing worth guarding: the row a parent picks is the one tonight's planner reads, and pasting
 * the teacher's post afterwards — which rebuilds the day from its text — must not wipe it.
 */
const CLASS = "itest-1B3";

describe("picking today's lesson (integration, needs the seeded database)", () => {
  let ready = false;
  const needDb = (ctx: TestContext) => {
    if (!ready) ctx.skip("no seeded database (start Postgres and run pnpm db:seed)");
  };
  const day = new Date("2026-09-18T03:00:00Z");

  beforeAll(async () => {
    ready = await databaseReachable();
    if (!ready) return;
    const units = await testDb().lessonUnit.count({ where: { subject: "EMATH" } });
    ready = units > 0;
  });

  afterAll(async () => {
    if (ready) await testDb().classDiary.deleteMany({ where: { className: CLASS } });
    await disconnectTestDb();
  });

  it("offers the book's lessons in order, with pages to recognise them by", async (ctx) => {
    needDb(ctx);
    const lessons = await lessonChoices(testDb(), "EMATH");
    const codes = lessons.map((l) => l.code);
    expect(codes).toContain("EDI-MN1-U3-L8");
    expect(codes.indexOf("EDI-MN1-U3-L8")).toBeLessThan(codes.indexOf("EDI-MN1-U5-L1"));
    const l8 = lessons.find((l) => l.code === "EDI-MN1-U3-L8");
    expect(l8?.title).toContain("Compare Numbers on a Number Line");
    expect(l8?.pageFrom).toBe(26);
  });

  it("writes the lesson with its skills, so tonight's session follows it", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const saved = await setTodaysLesson(db, {
      className: CLASS,
      subject: "EMATH",
      unitCode: "EDI-MN1-U3-L8",
      date: day,
    });
    expect(saved.skillCodes).toContain("EMATH.NBT.COMPARE_TO_20");

    const row = await db.diaryLesson.findFirst({
      where: { diaryId: saved.diaryId, subject: "EMATH" },
      select: { source: true, skillCodes: true, lessonUnit: { select: { code: true } } },
    });
    expect(row?.source).toBe("PARENT");
    expect(row?.lessonUnit?.code).toBe("EDI-MN1-U3-L8");

    // picking again the same day replaces the pick instead of stacking a second lesson
    await setTodaysLesson(db, {
      className: CLASS,
      subject: "EMATH",
      unitCode: "EDI-MN1-U3-L9",
      date: day,
    });
    const rows = await db.diaryLesson.findMany({
      where: { diaryId: saved.diaryId, subject: "EMATH" },
      select: { lessonUnit: { select: { code: true } } },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.lessonUnit?.code).toBe("EDI-MN1-U3-L9");
  });

  it("survives a later paste of the teacher's post", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    await setTodaysLesson(db, {
      className: CLASS,
      subject: "EMATH",
      unitCode: "EDI-MN1-U3-L9",
      date: day,
    });
    await saveClassDiary(db, {
      className: CLASS,
      date: day,
      rawText: [
        "Phần Thông tin",
        "Hôm nay, con đã tham gia các hoạt động học tập của các môn học:",
        "- Tiếng Việt: Bài 13: U u – Ư ư",
        "- Toán: Các số 6,7,8,9,10 (Tiếp)",
      ].join("\n"),
    });
    const rows = await db.diaryLesson.findMany({
      where: { diary: { className: CLASS } },
      select: { source: true, subject: true, lessonUnit: { select: { code: true } } },
    });
    // the pasted lessons are there, and so is the one the parent picked
    expect(rows.some((r) => r.source === "POST")).toBe(true);
    const picked = rows.find((r) => r.source === "PARENT");
    expect(picked?.lessonUnit?.code).toBe("EDI-MN1-U3-L9");
  });

  it("knows where the class is and what comes next", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const current = await currentLessons(db, CLASS);
    const emath = current.find((c) => c.subject === "EMATH");
    expect(emath?.code).toBe("EDI-MN1-U3-L9");
    expect(emath?.source).toBe("PARENT");
    const next = await nextLessonAfter(db, "EMATH", "EDI-MN1-U3-L9");
    expect(next?.code).toBe("EDI-MN1-U4-L1");
  });
});
