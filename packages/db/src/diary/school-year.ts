import type { LessonSighting, SchoolStartGuess } from "@mtct/core";
import {
  buildSchoolWeeks,
  inferSchoolYearStart,
  lessonNumberIn,
  VN_AUTUMN_HOLIDAYS,
} from "@mtct/core";
import type { PrismaClient } from "../../generated/client";

/**
 * Re-dating the school year from what the class actually did (docs/11 §5).
 *
 * The seed built 35 weeks from a guess (08/09/2026). The diary knows better: a class on Tiếng Việt
 * lesson 13 on 10/09 started well before that. This proposes the correction and — only when a
 * parent confirms it — rewrites `SchoolWeek`, which is what every `expectedWeek` is measured
 * against.
 */

type Db = PrismaClient;

export const SCHOOL_START_SETTING = "school.year.startConfirmedAt";

export interface SchoolYearProposal {
  current: { weekOneFrom: string | null; weeks: number };
  guess:
    | (Omit<SchoolStartGuess, "weekOneMonday" | "firstTeachingDay" | "from" | "disagreeing"> & {
        weekOneMonday: string;
        firstTeachingDay: string;
        from: { date: string; lessonNumber: number };
        disagreeing: { date: string; lessonNumber: number; weekOneMonday: string }[];
      })
    | null;
  /** What the guess was read from, for a parent to check line by line. */
  sightings: { date: string; lessonNumber: number; lessonRefText: string }[];
  changed: boolean;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Vietnamese lesson numbers seen in the diary. Only `VIET` is used: it is the one subject with a
 * lesson a day and a numbered textbook, which is exactly what makes the arithmetic work.
 */
export async function lessonSightings(db: Db, className?: string): Promise<LessonSighting[]> {
  const rows = await db.diaryLesson.findMany({
    where: { subject: "VIET", ...(className ? { diary: { className } } : {}) },
    select: { lessonRefText: true, diary: { select: { date: true } } },
    orderBy: { diary: { date: "desc" } },
    take: 40,
  });
  const out: LessonSighting[] = [];
  for (const row of rows) {
    const lessonNumber = lessonNumberIn(row.lessonRefText);
    if (lessonNumber !== null) out.push({ date: row.diary.date, lessonNumber });
  }
  return out;
}

export async function proposeSchoolYearStart(
  db: Db,
  opts: { className?: string; holidays?: Date[]; preludeLessons?: number } = {},
): Promise<SchoolYearProposal> {
  const weeks = await db.schoolWeek.findMany({ orderBy: { weekNo: "asc" } });
  const first = weeks[0];
  const current = { weekOneFrom: first ? iso(first.dateFrom) : null, weeks: weeks.length };
  const sightings = await lessonSightings(db, opts.className);
  const rows = await db.diaryLesson.findMany({
    where: { subject: "VIET", ...(opts.className ? { diary: { className: opts.className } } : {}) },
    select: { lessonRefText: true, diary: { select: { date: true } } },
    orderBy: { diary: { date: "desc" } },
    take: 10,
  });

  const guess = inferSchoolYearStart(sightings, {
    holidays: opts.holidays ?? VN_AUTUMN_HOLIDAYS(sightings[0]?.date.getFullYear() ?? 2026),
    preludeLessons: opts.preludeLessons ?? 0,
  });

  return {
    current,
    guess: guess
      ? {
          weekOneMonday: iso(guess.weekOneMonday),
          firstTeachingDay: iso(guess.firstTeachingDay),
          from: { date: iso(guess.from.date), lessonNumber: guess.from.lessonNumber },
          teachingDays: guess.teachingDays,
          agreeing: guess.agreeing,
          disagreeing: guess.disagreeing.map((d) => ({
            date: iso(d.date),
            lessonNumber: d.lessonNumber,
            weekOneMonday: iso(d.weekOneMonday),
          })),
        }
      : null,
    sightings: rows
      .map((r) => ({
        date: iso(r.diary.date),
        lessonNumber: lessonNumberIn(r.lessonRefText) ?? 0,
        lessonRefText: r.lessonRefText,
      }))
      .filter((s) => s.lessonNumber > 0),
    changed: Boolean(guess && current.weekOneFrom !== iso(guess.weekOneMonday)),
  };
}

/**
 * Rewrites the 35 weeks from `startMonday`. Week numbers keep their meaning, so nothing that
 * points at "week 7" has to be migrated; only the dates move.
 */
export async function applySchoolYearStart(
  db: Db,
  startMonday: Date,
  userId: string,
): Promise<{ weeks: number; from: string; schoolYear: string }> {
  const weeks = buildSchoolWeeks(startMonday);
  // The label follows the year the first week starts in, exactly as the seed builds it.
  const schoolYear = `${startMonday.getUTCFullYear()}-${startMonday.getUTCFullYear() + 1}`;
  const existingYears = await db.schoolWeek.findMany({
    distinct: ["schoolYear"],
    select: { schoolYear: true },
  });
  for (const week of weeks) {
    await db.schoolWeek.upsert({
      where: { schoolYear_weekNo: { schoolYear, weekNo: week.weekNo } },
      create: {
        schoolYear,
        weekNo: week.weekNo,
        dateFrom: week.dateFrom,
        dateTo: week.dateTo,
        term: week.term,
        isHoliday: week.isHoliday,
        note: week.note,
      },
      update: { dateFrom: week.dateFrom, dateTo: week.dateTo, term: week.term },
    });
  }
  // The year the seed guessed at ("2026-2027" built from 08/09) is now wrong in its dates and, if
  // the start moved into August, wrong in its label too. Remove the weeks nobody points at.
  for (const { schoolYear: old } of existingYears) {
    if (old !== schoolYear) await db.schoolWeek.deleteMany({ where: { schoolYear: old } });
  }
  await db.setting.upsert({
    where: { key: SCHOOL_START_SETTING },
    create: {
      key: SCHOOL_START_SETTING,
      value: { at: new Date().toISOString(), by: userId, startMonday: iso(startMonday) },
    },
    update: {
      value: { at: new Date().toISOString(), by: userId, startMonday: iso(startMonday) },
    },
  });
  return { weeks: weeks.length, from: iso(startMonday), schoolYear };
}
