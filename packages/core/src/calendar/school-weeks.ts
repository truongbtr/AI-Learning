/**
 * School-year weeks (docs/03 §2.9, docs/05 §5): 35 weeks, term 1 = 18, term 2 = 17.
 * Week 1 may start mid-week (08/09/2026 is a Tuesday); every later week runs Mon -> Sun.
 */
export interface SchoolWeekDef {
  weekNo: number;
  dateFrom: Date;
  dateTo: Date;
  term: 1 | 2;
  isHoliday: boolean;
  note: string | null;
}

export interface SchoolWeekOptions {
  totalWeeks?: number;
  term1Weeks?: number;
}

const DAY_MS = 86_400_000;

function utcDate(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d));
}

/** Start-of-day in UTC (dates are calendar dates, no time zone drama). */
function toUtcDay(date: Date): Date {
  return utcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Sunday that ends the week containing `date` (Mon = start). */
function sundayOf(date: Date): Date {
  const dow = date.getUTCDay(); // 0 = Sunday
  const daysToSunday = dow === 0 ? 0 : 7 - dow;
  return addDays(date, daysToSunday);
}

export function buildSchoolWeeks(start: Date, options: SchoolWeekOptions = {}): SchoolWeekDef[] {
  const totalWeeks = options.totalWeeks ?? 35;
  const term1Weeks = options.term1Weeks ?? 18;
  const weeks: SchoolWeekDef[] = [];
  let from = toUtcDay(start);
  for (let weekNo = 1; weekNo <= totalWeeks; weekNo++) {
    const to = sundayOf(from);
    weeks.push({
      weekNo,
      dateFrom: from,
      dateTo: to,
      term: weekNo <= term1Weeks ? 1 : 2,
      isHoliday: false,
      note: null,
    });
    from = addDays(to, 1);
  }
  return weeks;
}

/** Parse "YYYY-MM-DD" into a UTC calendar date; throws on bad input. */
export function parseIsoDate(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) throw new Error(`Invalid ISO date: ${value}`);
  const date = utcDate(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid ISO date: ${value}`);
  return date;
}
