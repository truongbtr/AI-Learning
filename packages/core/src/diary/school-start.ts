/**
 * Working out when the school year actually started (docs/11 §5).
 *
 * The class is on Tiếng Việt lesson 13 on Thursday 10/09/2026. The textbook has one lesson per
 * teaching day, so thirteen lessons means thirteen school days — count them backwards, skipping
 * weekends and public holidays, and the first day of the year appears. That beats the guess of
 * 08/09/2026 the seed started from, and every `expectedWeek` in the skill map hangs off it.
 *
 * Pure and explicit: the holidays are passed in, never assumed, and the result says what it was
 * derived from so a parent can check it before confirming (docs/11 §5 step 1).
 */

const DAY_MS = 86_400_000;

export interface LessonSighting {
  /** The day the class covered it. */
  date: Date;
  /** "Bài 13" → 13. */
  lessonNumber: number;
}

export interface SchoolStartGuess {
  /** Monday of week 1 — what `SchoolWeek.dateFrom` should become. */
  weekOneMonday: Date;
  /** The teaching day lesson 1 fell on. */
  firstTeachingDay: Date;
  /** The sighting the guess was derived from. */
  from: LessonSighting;
  /** Teaching days counted backwards, holidays excluded. */
  teachingDays: number;
  /** How many sightings agree with this guess. */
  agreeing: number;
  /** Sightings that point at a different Monday — the pace is not what we assumed. */
  disagreeing: { date: Date; lessonNumber: number; weekOneMonday: Date }[];
}

/**
 * Calendar dates live at UTC midnight here, exactly as `buildSchoolWeeks` and Prisma's `@db.Date`
 * keep them. A date typed as "10/09/2026" in Hanoi and the same date read back from the database
 * must be the same day, and local midnight is not (it is the evening before, in UTC).
 */
function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/** The Monday of the week `date` falls in. */
export function mondayOf(date: Date): Date {
  const d = startOfDay(date);
  return new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY_MS);
}

export interface InferOptions {
  /** Days with no lessons: public holidays, school closures. */
  holidays?: Date[];
  /** Lessons the class covers on one teaching day. One, for Tiếng Việt tập một. */
  lessonsPerDay?: number;
  /** Lessons before lesson 1 (Tiếng Việt starts with "Chào em vào lớp 1"). */
  preludeLessons?: number;
}

/** Counts `count` teaching days back from `from` (inclusive), skipping weekends and holidays. */
export function teachingDaysBack(from: Date, count: number, holidays: Date[] = []): Date {
  let cursor = startOfDay(from);
  let left = count;
  const off = (d: Date) => isWeekend(d) || holidays.some((h) => isSameDay(h, d));
  while (off(cursor)) cursor = new Date(cursor.getTime() - DAY_MS);
  while (left > 1) {
    cursor = new Date(cursor.getTime() - DAY_MS);
    if (off(cursor)) continue;
    left--;
  }
  return cursor;
}

/**
 * Infers week 1 from one or more lesson sightings.
 *
 * The Monday most sightings point at wins, and the most recent sighting breaks a tie: a single odd
 * day — a revision lesson, a lesson number the teacher mistyped, a day the class doubled up —
 * should not move the whole school year. Whatever does not fit is returned rather than averaged
 * away, because a pattern of disagreement means the pace assumption itself is wrong (docs/11 §5).
 */
export function inferSchoolYearStart(
  sightings: LessonSighting[],
  options: InferOptions = {},
): SchoolStartGuess | null {
  const usable = sightings
    .filter((s) => Number.isFinite(s.lessonNumber) && s.lessonNumber > 0)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  if (usable.length === 0) return null;
  const holidays = (options.holidays ?? []).map(startOfDay);
  const lessonsPerDay = options.lessonsPerDay ?? 1;
  const prelude = options.preludeLessons ?? 0;

  const guessFor = (s: LessonSighting) => {
    const teachingDays = Math.max(1, Math.ceil((s.lessonNumber + prelude) / lessonsPerDay));
    const firstTeachingDay = teachingDaysBack(s.date, teachingDays, holidays);
    return { teachingDays, firstTeachingDay, weekOneMonday: mondayOf(firstTeachingDay) };
  };

  const guesses = usable.map((s) => ({ sighting: s, ...guessFor(s) }));
  const groups = new Map<number, typeof guesses>();
  for (const g of guesses) {
    const key = g.weekOneMonday.getTime();
    groups.set(key, [...(groups.get(key) ?? []), g]);
  }
  // Most votes wins; `usable` is newest first, so the first group of a tie holds the newest one.
  let best = guesses[0] as (typeof guesses)[number];
  let bestSize = 0;
  for (const [, group] of groups) {
    if (group.length > bestSize) {
      bestSize = group.length;
      best = group[0] as (typeof guesses)[number];
    }
  }

  return {
    weekOneMonday: best.weekOneMonday,
    firstTeachingDay: best.firstTeachingDay,
    from: best.sighting,
    teachingDays: best.teachingDays,
    agreeing: bestSize,
    disagreeing: guesses
      .filter((g) => g.weekOneMonday.getTime() !== best.weekOneMonday.getTime())
      .map((g) => ({
        date: g.sighting.date,
        lessonNumber: g.sighting.lessonNumber,
        weekOneMonday: g.weekOneMonday,
      })),
  };
}

/** Vietnam's fixed public holidays that can fall inside a first term. */
export const VN_AUTUMN_HOLIDAYS = (year: number): Date[] => [
  new Date(Date.UTC(year, 8, 2)), // 02/09 Quốc khánh
];
