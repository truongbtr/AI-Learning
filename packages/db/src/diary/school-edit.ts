import type { PrismaClient, Subject } from "../../generated/client";

/**
 * P12 — editing the timetable and the school calendar (FR-PAR-06, docs/08 pha 5 việc 4).
 *
 * The class timetable is the strongest signal the app has on a day with no diary entry: the
 * planner weights tonight's subjects by what the class had this morning (docs/05 §2). So this
 * screen has a real consequence, and the acceptance criterion says so — change the timetable and
 * tomorrow's Daily Quest leads with a different subject.
 *
 * Slots are edited in place rather than by replacing the timetable, because `Timetable.validFrom`
 * is a fact about the school year and not a version number.
 */

export const PERIODS = ["1-2", "3-4", "5-6", "7-8", "DATN", "9-10"] as const;
export const WEEKDAYS = [1, 2, 3, 4, 5] as const;

export interface TimetableView {
  id: string;
  className: string;
  schoolYear: string;
  validFrom: string;
  periods: { period: string; timeFrom: string; timeTo: string }[];
  slots: {
    weekday: number;
    period: string;
    subjectLabelVi: string;
    subjectLabelEn: string;
    subject: Subject | null;
    isNative: boolean;
  }[];
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

export async function getTimetable(
  db: PrismaClient,
  className: string,
): Promise<TimetableView | null> {
  const timetable = await db.timetable.findFirst({
    where: { className },
    orderBy: { validFrom: "desc" },
    include: { slots: { orderBy: [{ weekday: "asc" }, { period: "asc" }] } },
  });
  if (!timetable) return null;

  const periods = new Map<string, { period: string; timeFrom: string; timeTo: string }>();
  for (const slot of timetable.slots)
    if (!periods.has(slot.period))
      periods.set(slot.period, {
        period: slot.period,
        timeFrom: slot.timeFrom,
        timeTo: slot.timeTo,
      });

  return {
    id: timetable.id,
    className: timetable.className,
    schoolYear: timetable.schoolYear,
    validFrom: iso(timetable.validFrom),
    periods: PERIODS.map(
      (p) => periods.get(p) ?? { period: p, timeFrom: "00:00", timeTo: "00:00" },
    ),
    slots: timetable.slots.map((s) => ({
      weekday: s.weekday,
      period: s.period,
      subjectLabelVi: s.subjectLabelVi,
      subjectLabelEn: s.subjectLabelEn,
      subject: s.subject,
      isNative: s.isNative,
    })),
  };
}

export interface SlotEdit {
  weekday: number;
  period: string;
  subject: Subject | null;
  subjectLabelVi?: string;
  isNative?: boolean;
}

/**
 * Changes which core subject a period maps to. The Vietnamese label the school uses is kept unless
 * a parent retyped it: "Life+ (PTCN)" is what is on the school's own sheet, and rewriting it to
 * "VMATH" would make the screen stop matching the paper on the fridge.
 */
export async function updateTimetableSlots(
  db: PrismaClient,
  timetableId: string,
  edits: SlotEdit[],
): Promise<number> {
  let changed = 0;
  for (const edit of edits) {
    const result = await db.timetableSlot.updateMany({
      where: { timetableId, weekday: edit.weekday, period: edit.period },
      data: {
        subject: edit.subject,
        ...(edit.subjectLabelVi ? { subjectLabelVi: edit.subjectLabelVi } : {}),
        ...(edit.isNative === undefined ? {} : { isNative: edit.isNative }),
      },
    });
    changed += result.count;
  }
  return changed;
}

export interface SchoolWeekView {
  id: string;
  weekNo: number;
  dateFrom: string;
  dateTo: string;
  term: number;
  isHoliday: boolean;
  note: string | null;
  /** True for the week containing today. */
  isCurrent: boolean;
}

export async function listSchoolWeeks(
  db: PrismaClient,
  date = new Date(),
): Promise<SchoolWeekView[]> {
  const weeks = await db.schoolWeek.findMany({ orderBy: { weekNo: "asc" } });
  return weeks.map((w) => ({
    id: w.id,
    weekNo: w.weekNo,
    dateFrom: iso(w.dateFrom),
    dateTo: iso(w.dateTo),
    term: w.term,
    isHoliday: w.isHoliday,
    note: w.note,
    isCurrent: w.dateFrom <= date && w.dateTo >= date,
  }));
}

/**
 * A week off. `expectedWeek` counts teaching weeks, so marking a holiday is how a family tells the
 * system the class did not move that week and nobody is behind because of Tết.
 */
export async function updateSchoolWeek(
  db: PrismaClient,
  weekId: string,
  edit: { isHoliday?: boolean; note?: string | null; dateFrom?: Date; dateTo?: Date },
): Promise<SchoolWeekView | null> {
  const week = await db.schoolWeek.update({
    where: { id: weekId },
    data: {
      ...(edit.isHoliday === undefined ? {} : { isHoliday: edit.isHoliday }),
      ...(edit.note === undefined ? {} : { note: edit.note }),
      ...(edit.dateFrom ? { dateFrom: edit.dateFrom } : {}),
      ...(edit.dateTo ? { dateTo: edit.dateTo } : {}),
    },
  });
  const now = new Date();
  return {
    id: week.id,
    weekNo: week.weekNo,
    dateFrom: iso(week.dateFrom),
    dateTo: iso(week.dateTo),
    term: week.term,
    isHoliday: week.isHoliday,
    note: week.note,
    isCurrent: week.dateFrom <= now && week.dateTo >= now,
  };
}
