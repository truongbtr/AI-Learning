import { describe, expect, it } from "vitest";
import { lessonNumberIn, pagesIn, parseClassDiary, subjectOf } from "./parse";
import { inferSchoolYearStart, mondayOf, VN_AUTUMN_HOLIDAYS } from "./school-start";

/** The real post of 10/09/2026, copied from docs/11 §1 — the acceptance case of phase 4. */
const POST = `Phần Thông tin
Hôm nay, con đã tham gia các hoạt động học tập của các môn học:
- Tiếng Việt: Bài 13: U u – Ư ư
- ESL: Unit 1 - Lesson 16 - Unit Review: Con ôn tập từ vựng và ngữ pháp Unit 1:
       family members, adjectives, have, to be
- Toán: Các số 6,7,8,9,10 (Tiếp)

Phần dặn dò
1. Tiếng Việt:
   + Con luyện đọc 5 lần Bài 13 - trang 38, 39.
   Cô khuyến khích con quay video luyện đọc các tiếng, từ và câu trong mục 2 và mục 4
   – Bài 13: U u - Ư ư (SGK Tiếng Việt tập 1, trang 38,39) tại bài tập được giao trong
   Teams – Chương trình Việt
2. ESL: Con hoàn thành phiếu bài tập
3. Đồng phục: Ngày mai, con mặc quần áo tự do, đi giày/ dép có quai.

Trân trọng,
GVCN lớp 1B3`;

describe("reading the class diary with patterns", () => {
  const read = parseClassDiary(POST);

  it("finds the three lessons the class had", () => {
    expect(read.taught).toHaveLength(3);
    expect(read.taught.map((l) => l.subject)).toEqual(["VIET", "ESL", "VMATH"]);
    expect(read.taught[0]?.lessonRefText).toContain("Bài 13");
    expect(read.taught[0]?.lessonNumber).toBe(13);
    expect(read.taught[1]?.unit).toBe("1");
    expect(read.taught[1]?.lesson).toBe("16");
    // The only description of the ESL syllabus anyone has (docs/11 §6.3).
    expect(read.taught[1]?.contentNote).toContain("family members");
    expect(read.taught[2]?.lessonRefText).toContain("6,7,8,9,10");
  });

  it("finds the three things the teacher set, and which one is only an invitation", () => {
    expect(read.homework).toHaveLength(3);
    const [reading, video, worksheet] = read.homework;

    expect(reading?.taskType).toBe("READ_ALOUD");
    expect(reading?.repeatCount).toBe(5);
    expect(reading?.pages).toEqual([38, 39]);
    expect(reading?.lessonNumber).toBe(13);
    expect(reading?.subject).toBe("VIET");
    expect(reading?.optional).toBe(false);

    expect(video?.taskType).toBe("VIDEO_SUBMIT");
    expect(video?.optional).toBe(true); // "Cô khuyến khích"
    expect(video?.submitTo).toContain("Teams");

    expect(worksheet?.taskType).toBe("WORKSHEET");
    expect(worksheet?.subject).toBe("ESL");
  });

  it("keeps the uniform note away from the child's schoolwork", () => {
    expect(read.reminders).toHaveLength(1);
    expect(read.reminders[0]?.kind).toBe("UNIFORM");
    expect(read.reminders[0]?.forTomorrow).toBe(true);
    expect(read.homework.some((h) => /đồng phục/i.test(h.text))).toBe(false);
  });

  it("explains nearly all of the post, and says so", () => {
    expect(read.confidence).toBeGreaterThan(0.8);
    expect(read.unmatched).toHaveLength(0);
  });

  it("hands the lines it cannot place to the queue instead of guessing", () => {
    const odd = parseClassDiary(
      `Phần Thông tin\nHôm nay lớp mình có một buổi rất vui ở sân trường.\n\nPhần dặn dò\n1. Tiếng Việt: Con ôn lại bài cũ`,
    );
    expect(odd.unmatched).toHaveLength(1);
    expect(odd.unmatched[0]).toContain("sân trường");
    expect(odd.homework).toHaveLength(1);
  });
});

describe("the little helpers", () => {
  it("knows the subject whatever the teacher types", () => {
    expect(subjectOf("Tiếng Việt")).toBe("VIET");
    expect(subjectOf("tieng viet")).toBe("VIET");
    expect(subjectOf("Toán")).toBe("VMATH");
    expect(subjectOf("ESL")).toBe("ESL");
    expect(subjectOf("English Maths")).toBe("EMATH");
    expect(subjectOf("Science")).toBe("ESCI");
    expect(subjectOf("Nghệ thuật")).toBeNull();
  });

  it("reads page numbers in every shape the teacher writes them", () => {
    expect(pagesIn("trang 38, 39")).toEqual([38, 39]);
    expect(pagesIn("tr.38-40")).toEqual([38, 39, 40]);
    expect(pagesIn("(SGK Tiếng Việt tập 1, trang 38,39)")).toEqual([38, 39]);
    expect(pagesIn("không có trang nào")).toEqual([]);
  });

  it("reads the lesson number", () => {
    expect(lessonNumberIn("Bài 13: U u – Ư ư")).toBe(13);
    expect(lessonNumberIn("bài  7")).toBe(7);
    expect(lessonNumberIn("Các số 6,7,8,9,10")).toBeNull();
  });
});

describe("working out when the school year started (docs/11 §5)", () => {
  it("puts week 1 before the assumed 08/09 when the class is already on lesson 13", () => {
    const guess = inferSchoolYearStart(
      [{ date: new Date("2026-09-10T08:00:00"), lessonNumber: 13 }],
      { holidays: VN_AUTUMN_HOLIDAYS(2026) },
    );
    expect(guess).not.toBeNull();
    // Thirteen teaching days back from Thursday 10/09, skipping weekends and 02/09.
    expect(guess?.firstTeachingDay.toISOString().slice(0, 10)).toBe("2026-08-24");
    expect(guess?.weekOneMonday.toISOString().slice(0, 10)).toBe("2026-08-24");
    expect(guess?.weekOneMonday.getTime()).toBeLessThan(new Date("2026-09-08").getTime());
    expect(guess?.teachingDays).toBe(13);
  });

  it("says which later sightings disagree, instead of averaging them away", () => {
    const guess = inferSchoolYearStart(
      [
        { date: new Date("2026-09-10T08:00:00"), lessonNumber: 13 },
        { date: new Date("2026-09-11T08:00:00"), lessonNumber: 14 },
        { date: new Date("2026-09-14T08:00:00"), lessonNumber: 20 },
      ],
      { holidays: VN_AUTUMN_HOLIDAYS(2026) },
    );
    expect(guess?.agreeing).toBe(2);
    expect(guess?.disagreeing).toHaveLength(1);
    expect(guess?.disagreeing[0]?.lessonNumber).toBe(20);
  });

  it("counts a first-day welcome lesson when asked to", () => {
    const withPrelude = inferSchoolYearStart(
      [{ date: new Date("2026-09-10T08:00:00"), lessonNumber: 13 }],
      { holidays: VN_AUTUMN_HOLIDAYS(2026), preludeLessons: 1 },
    );
    expect(withPrelude?.firstTeachingDay.toISOString().slice(0, 10)).toBe("2026-08-21");
  });

  it("has no opinion when there is nothing to go on", () => {
    expect(inferSchoolYearStart([])).toBeNull();
    expect(mondayOf(new Date("2026-09-10T08:00:00")).getDay()).toBe(1);
  });
});
