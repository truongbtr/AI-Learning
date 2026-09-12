import type { PrismaClient, Subject } from "../../generated/client";

/**
 * The state a fortnight has to be planned against (docs/04 §4, task `PLAN`; docs/08 pha 5 việc 3).
 *
 * Built here rather than in the queue package because it is the same set of facts the planner
 * itself reads — mastery, mistakes, the ladder, the timetable, what the class actually did — and
 * two divergent answers to "how is this child doing" would show up as a plan that argues with the
 * dashboard in front of a parent.
 *
 * It is assembled when `inbox:pull` runs, not when the task was queued: a plan written against a
 * three-day-old snapshot plans for a child who has since moved on.
 */

const DAY_MS = 86_400_000;

export interface PlanSnapshotJson {
  weekStart: string;
  weekEnd: string;
  schoolWeek: number | null;
  dailyMinutes: number;
  timetable: Record<string, string[]>;
  recentLessons: {
    date: string;
    subjectLabel: string;
    lessonRefText: string;
    skillCodes: string[];
  }[];
  skills: {
    code: string;
    nameVi: string;
    subject: Subject;
    strand: string;
    mastery: number;
    status: string;
    confidence: number;
    evidenceCount: number;
    trend14d: number;
    expectedWeek: number | null;
    dueForReview: boolean;
    exerciseCount: number;
  }[];
  activeErrors: {
    code: string;
    nameVi: string;
    count7d: number;
    count30d: number;
    remediationSkills: string[];
  }[];
  remediating: { skillCode: string; rung: number; errorCode: string | null }[];
  previousPlans: {
    weekStart: string;
    status: string;
    items: { skillCode: string; sessionsPlanned: number; sessionsDone: number }[];
  }[];
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** The Monday on or after `date`: a plan starts at the top of a school week. */
export function nextMonday(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const shift = (8 - (d.getUTCDay() || 7)) % 7;
  return new Date(d.getTime() + shift * DAY_MS);
}

export async function buildPlanSnapshot(
  db: PrismaClient,
  studentId: string,
  opts: { weeks?: 1 | 2; from?: Date } = {},
): Promise<PlanSnapshotJson> {
  const weeks = opts.weeks ?? 1;
  const weekStart = nextMonday(opts.from ?? new Date());
  const weekEnd = new Date(weekStart.getTime() + (weeks * 7 - 1) * DAY_MS);

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { settings: true, className: true, schoolYear: true },
  });
  const settings = (student?.settings ?? {}) as { dailyMinutes?: number };
  const className = student?.className ?? "1B3";

  const [week, timetableRows, diaryLessons, masteries, errorStats, tracks, plans, published] =
    await Promise.all([
      db.schoolWeek.findFirst({
        where: { dateFrom: { lte: weekStart }, dateTo: { gte: weekStart } },
        select: { weekNo: true },
      }),
      // Whatever timetable is in force; if none has started yet, the newest one for the class.
      db.timetableSlot.findMany({
        where: { timetable: { className } },
        orderBy: [{ timetable: { validFrom: "desc" } }, { weekday: "asc" }, { period: "asc" }],
        select: {
          weekday: true,
          period: true,
          subject: true,
          subjectLabelVi: true,
          timetable: { select: { validFrom: true } },
        },
      }),
      db.diaryLesson.findMany({
        where: {
          diary: {
            className,
            date: { gte: new Date(weekStart.getTime() - 7 * DAY_MS) },
          },
        },
        orderBy: { diary: { date: "desc" } },
        take: 20,
        select: {
          subjectLabel: true,
          lessonRefText: true,
          skillCodes: true,
          diary: { select: { date: true } },
        },
      }),
      db.skillMastery.findMany({
        where: { studentId },
        select: {
          mastery: true,
          status: true,
          confidence: true,
          evidenceCount: true,
          trend14d: true,
          nextReviewAt: true,
          skill: {
            select: {
              code: true,
              nameVi: true,
              subject: true,
              strand: true,
              expectedWeek: true,
              _count: { select: { exerciseSkills: true } },
            },
          },
        },
      }),
      db.errorStat.findMany({
        where: { studentId, OR: [{ count7d: { gt: 0 } }, { count30d: { gt: 0 } }] },
        orderBy: { count7d: "desc" },
      }),
      db.remediationTrack.findMany({
        where: { studentId, status: "ACTIVE" },
        select: { rung: true, errorCode: true, skill: { select: { code: true } } },
      }),
      db.plan.findMany({
        where: { studentId },
        orderBy: { weekStart: "desc" },
        take: 2,
        select: {
          weekStart: true,
          status: true,
          items: {
            select: {
              sessionsPlanned: true,
              sessionsDone: true,
              skill: { select: { code: true } },
            },
          },
        },
      }),
      // Skills the class should have reached that the child has no mastery row for yet.
      db.skill.findMany({
        where: { isActive: true, masteries: { none: { studentId } } },
        select: {
          code: true,
          nameVi: true,
          subject: true,
          strand: true,
          expectedWeek: true,
          _count: { select: { exerciseSkills: true } },
        },
      }),
    ]);

  const newestValidFrom = timetableRows[0]?.timetable.validFrom;
  const timetable: Record<string, string[]> = {};
  for (const slot of timetableRows) {
    if (newestValidFrom && slot.timetable.validFrom.getTime() !== newestValidFrom.getTime())
      continue;
    const key = String(slot.weekday);
    const day = timetable[key] ?? [];
    day.push(slot.subject ?? slot.subjectLabelVi);
    timetable[key] = day;
  }

  const schoolWeek = week?.weekNo ?? null;
  const errorNames = new Map(
    (
      await db.errorCode.findMany({
        where: { code: { in: errorStats.map((e) => e.errorCode) } },
        select: { code: true, nameVi: true, remediationSkills: true },
      })
    ).map((c) => [c.code, c]),
  );

  return {
    weekStart: iso(weekStart),
    weekEnd: iso(weekEnd),
    schoolWeek,
    dailyMinutes: settings.dailyMinutes ?? 15,
    timetable,
    recentLessons: diaryLessons.map((l) => ({
      date: iso(l.diary.date),
      subjectLabel: l.subjectLabel,
      lessonRefText: l.lessonRefText,
      skillCodes: l.skillCodes,
    })),
    skills: [
      ...masteries.map((m) => ({
        code: m.skill.code,
        nameVi: m.skill.nameVi,
        subject: m.skill.subject,
        strand: m.skill.strand,
        mastery: Math.round(m.mastery * 10) / 10,
        status: m.status,
        confidence: Math.round(m.confidence * 100) / 100,
        evidenceCount: m.evidenceCount,
        trend14d: Math.round(m.trend14d * 10) / 10,
        expectedWeek: m.skill.expectedWeek,
        dueForReview: Boolean(m.nextReviewAt && m.nextReviewAt <= weekEnd),
        exerciseCount: m.skill._count.exerciseSkills,
      })),
      // Untouched skills only matter when the class has already been there.
      ...published
        .filter((s) => schoolWeek != null && s.expectedWeek != null && s.expectedWeek <= schoolWeek)
        .map((s) => ({
          code: s.code,
          nameVi: s.nameVi,
          subject: s.subject,
          strand: s.strand,
          mastery: 0,
          status: "NOT_STARTED",
          confidence: 0,
          evidenceCount: 0,
          trend14d: 0,
          expectedWeek: s.expectedWeek,
          dueForReview: false,
          exerciseCount: s._count.exerciseSkills,
        })),
    ],
    activeErrors: errorStats.map((e) => ({
      code: e.errorCode,
      nameVi: errorNames.get(e.errorCode)?.nameVi ?? e.errorCode,
      count7d: e.count7d,
      count30d: e.count30d,
      remediationSkills: errorNames.get(e.errorCode)?.remediationSkills ?? [],
    })),
    remediating: tracks.map((t) => ({
      skillCode: t.skill.code,
      rung: t.rung,
      errorCode: t.errorCode,
    })),
    previousPlans: plans.map((p) => ({
      weekStart: iso(p.weekStart),
      status: p.status,
      items: p.items.map((i) => ({
        skillCode: i.skill.code,
        sessionsPlanned: i.sessionsPlanned,
        sessionsDone: i.sessionsDone,
      })),
    })),
  };
}

/**
 * Queues a `PLAN` task for a week (P9's "Nhờ Claude Code đề xuất"). Idempotent per child per week:
 * asking twice before the queue is processed does not produce two proposals to reconcile.
 */
export async function requestPlanProposal(
  db: PrismaClient,
  studentId: string,
  opts: { weeks?: 1 | 2; from?: Date } = {},
): Promise<{ inboxItemId: string; weekStart: string; created: boolean }> {
  const weekStart = nextMonday(opts.from ?? new Date());
  const weekStartIso = iso(weekStart);
  const existing = await db.inboxItem.findFirst({
    where: {
      kind: "PLAN",
      studentId,
      status: { in: ["PENDING", "PULLED"] },
      payload: { path: ["weekStart"], equals: weekStartIso },
    },
    select: { id: true },
  });
  if (existing) return { inboxItemId: existing.id, weekStart: weekStartIso, created: false };

  const item = await db.inboxItem.create({
    data: {
      kind: "PLAN",
      studentId,
      payload: {
        weekStart: weekStartIso,
        weeks: opts.weeks ?? 1,
        requestedAt: new Date().toISOString(),
      },
    },
    select: { id: true },
  });
  return { inboxItemId: item.id, weekStart: weekStartIso, created: true };
}
