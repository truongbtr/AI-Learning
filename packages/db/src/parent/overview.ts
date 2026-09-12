import {
  type AttentionErrorInput,
  type AttentionPoint,
  type AttentionSkillInput,
  attentionPoints,
  dayKey,
  vnDayDate,
} from "@mtct/core";
import type { PrismaClient, SessionStatus, Subject } from "../../generated/client";

/**
 * What P2 and P3 draw (docs/06 §2.1, FR-PAR-01, docs/08 pha 5 việc 1).
 *
 * One rule shapes every field here: **a number a parent cannot click through is not allowed on
 * this page.** So nothing is a rolled-up score with no provenance — each count comes with the
 * filter that reproduces it on `/parent/<bé>/evidence`, and the evidence list ends at the actual
 * question, the actual photo, the actual attempt.
 *
 * Nothing compares the two children (docs/00 §6): every figure is this child against their own
 * last fortnight.
 */

const DAY_MS = 86_400_000;

/** docs/05 §1. ESL and ENL are both English; they stay separate because the skill maps are. */
export const SUBJECT_LABEL: Record<Subject, string> = {
  VIET: "Tiếng Việt",
  VMATH: "Toán (chương trình VN)",
  ESL: "Tiếng Anh — ESL",
  ENL: "Tiếng Anh — đọc & viết",
  EMATH: "English Maths",
  ESCI: "English Science",
};

/** Order the cards read in, following the child's own timetable weight (docs/05 §2). */
export const SUBJECT_ORDER: Subject[] = ["VIET", "VMATH", "ESL", "ENL", "EMATH", "ESCI"];

export interface SubjectCard {
  subject: Subject;
  labelVi: string;
  total: number;
  avgMastery: number;
  /** SOLID + MASTERED. */
  solid: number;
  needsPractice: number;
  learning: number;
  notStarted: number;
  /** Mean 14-day movement over the skills that have any evidence at all. */
  trend14d: number;
  evidence7d: number;
  /** Skills the class should have reached by now that have no evidence yet. */
  behind: number;
}

export interface DayActivity {
  date: string;
  /** 1 = Monday … 7 = Sunday, so the strip can grey out the weekend. */
  weekday: number;
  exercises: number;
  minutes: number;
  stars: number;
  evidence: number;
  photos: number;
  sessionStatus: SessionStatus | null;
}

export interface TodaySession {
  sessionId: string;
  status: SessionStatus;
  done: number;
  total: number;
  starsEarned: number;
  minutes: number;
}

export interface StudentOverview {
  student: {
    id: string;
    slug: string;
    nickname: string;
    avatarKey: string | null;
    mascot: string;
    className: string;
  };
  today: TodaySession | null;
  streak: { current: number; longest: number; lastActiveDate: string | null };
  attention: AttentionPoint[];
  subjects: SubjectCard[];
  activity7d: DayActivity[];
  /** Everything the counts on the cards add up to, so the totals can be clicked too. */
  totals: { evidence: number; evidence7d: number; photos: number; attempts7d: number };
  /** The school week the year calendar says we are in (docs/11 §5), for "behind" to mean anything. */
  currentWeek: number | null;
}

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

/**
 * Which calendar day at home a moment belongs to (`dayKey`, Asia/Ho_Chi_Minh).
 *
 * `toISOString().slice(0,10)` is the obvious thing to write here and it is wrong in a way that
 * hides for months: at UTC+7 local midnight is 17:00 the previous day in UTC, so every column of
 * the seven-day strip would carry yesterday's date beside today's weekday. Using the same helper
 * for a `@db.Date` column (stored as UTC midnight of the Vietnam day) and for a `DateTime` gives
 * one answer for both.
 */
const iso = dayKey;

/** The school week containing `date`, or null before the year starts. */
export async function currentSchoolWeek(db: PrismaClient, date: Date): Promise<number | null> {
  const week = await db.schoolWeek.findFirst({
    where: { dateFrom: { lte: date }, dateTo: { gte: date } },
    select: { weekNo: true },
  });
  return week?.weekNo ?? null;
}

/**
 * One child, everything both screens need. Deliberately a handful of wide queries rather than a
 * query per card: a parent on a phone at nine in the evening should not wait on twelve round
 * trips (FR-PAR-01: page in under two seconds).
 */
export async function studentOverview(
  db: PrismaClient,
  studentId: string,
  opts: { date?: Date } = {},
): Promise<StudentOverview | null> {
  const now = opts.date ?? new Date();
  // Two shapes of "today", because the columns have two shapes. `observedAt` and `StarLedger.at`
  // are moments, so they are cut at local midnight; `Session.date` is a `@db.Date` holding the
  // Vietnam calendar day as UTC midnight, so it is compared against `vnDayDate`. Mixing the two
  // is what makes an evening's work land in yesterday's column.
  const today = startOfDay(now);
  const weekAgo = new Date(today.getTime() - 6 * DAY_MS);
  const fortnightAgo = new Date(today.getTime() - 14 * DAY_MS);
  const todayDate = vnDayDate(now);
  const weekAgoDate = new Date(todayDate.getTime() - 6 * DAY_MS);

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      slug: true,
      nickname: true,
      avatarKey: true,
      mascot: true,
      className: true,
    },
  });
  if (!student) return null;

  const [
    skills,
    masteries,
    errorStats,
    errorCodes,
    tracks,
    todaySession,
    streak,
    sessions7d,
    evidence7d,
    evidenceTotal,
    photoTotal,
    recentErrorEvidence,
    stars7d,
    currentWeek,
  ] = await Promise.all([
    db.skill.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        subject: true,
        nameVi: true,
        expectedWeek: true,
        prerequisites: { select: { prerequisite: { select: { code: true } } } },
      },
    }),
    db.skillMastery.findMany({
      where: { studentId },
      select: {
        skillId: true,
        mastery: true,
        status: true,
        confidence: true,
        evidenceCount: true,
        trend14d: true,
      },
    }),
    db.errorStat.findMany({
      where: { studentId, OR: [{ count7d: { gt: 0 } }, { count30d: { gt: 0 } }] },
    }),
    db.errorCode.findMany({
      select: {
        code: true,
        nameVi: true,
        group: true,
        remediationSkills: true,
        behavioural: true,
      },
    }),
    db.remediationTrack.findMany({
      where: { studentId, status: "ACTIVE" },
      select: { rung: true, errorCode: true, status: true, skill: { select: { code: true } } },
    }),
    db.session.findFirst({
      where: { studentId, date: todayDate },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        slots: true,
        starsEarned: true,
        durationSec: true,
        _count: { select: { attempts: true } },
      },
    }),
    db.streak.findUnique({ where: { studentId } }),
    db.session.findMany({
      where: { studentId, date: { gte: weekAgoDate } },
      select: {
        date: true,
        status: true,
        durationSec: true,
        starsEarned: true,
        _count: { select: { attempts: true } },
      },
    }),
    db.evidence.findMany({
      where: { studentId, observedAt: { gte: weekAgo } },
      select: { observedAt: true, source: true, skillId: true },
    }),
    db.evidence.count({ where: { studentId } }),
    db.evidence.count({ where: { studentId, source: "INTAKE_PHOTO" } }),
    // Which mistakes turned up on which skill in the last fortnight — the second half of §3.5.
    db.evidence.findMany({
      where: { studentId, observedAt: { gte: fortnightAgo }, errorCode: { not: null } },
      select: { skillId: true, errorCode: true },
    }),
    db.starLedger.findMany({
      where: { studentId, at: { gte: weekAgo } },
      select: { at: true, delta: true },
    }),
    currentSchoolWeek(db, today),
  ]);

  const masteryBySkill = new Map(masteries.map((m) => [m.skillId, m]));

  // ── subject cards ──────────────────────────────────────────────────────────────────────────
  const evidence7dBySkill = new Map<string, number>();
  for (const e of evidence7d)
    evidence7dBySkill.set(e.skillId, (evidence7dBySkill.get(e.skillId) ?? 0) + 1);

  const cards = new Map<Subject, SubjectCard>();
  for (const subject of SUBJECT_ORDER)
    cards.set(subject, {
      subject,
      labelVi: SUBJECT_LABEL[subject],
      total: 0,
      avgMastery: 0,
      solid: 0,
      needsPractice: 0,
      learning: 0,
      notStarted: 0,
      trend14d: 0,
      evidence7d: 0,
      behind: 0,
    });

  const trendSum = new Map<Subject, { sum: number; n: number }>();
  for (const skill of skills) {
    const card = cards.get(skill.subject);
    if (!card) continue;
    const m = masteryBySkill.get(skill.id);
    const status = m?.status ?? "NOT_STARTED";
    card.total++;
    card.avgMastery += m?.mastery ?? 0;
    if (status === "SOLID" || status === "MASTERED") card.solid++;
    else if (status === "NEEDS_PRACTICE") card.needsPractice++;
    else if (status === "LEARNING") card.learning++;
    else card.notStarted++;
    card.evidence7d += evidence7dBySkill.get(skill.id) ?? 0;
    if (m && m.evidenceCount > 0) {
      const t = trendSum.get(skill.subject) ?? { sum: 0, n: 0 };
      trendSum.set(skill.subject, { sum: t.sum + m.trend14d, n: t.n + 1 });
    }
    // "Behind" only means something once the calendar says the class has been there.
    if (
      currentWeek != null &&
      skill.expectedWeek != null &&
      skill.expectedWeek <= currentWeek &&
      (m?.evidenceCount ?? 0) === 0
    )
      card.behind++;
  }
  for (const card of cards.values()) {
    card.avgMastery = card.total ? Math.round((card.avgMastery / card.total) * 10) / 10 : 0;
    const t = trendSum.get(card.subject);
    card.trend14d = t && t.n ? Math.round((t.sum / t.n) * 10) / 10 : 0;
  }

  // ── "3 điều cần chú ý" ─────────────────────────────────────────────────────────────────────
  const errorCodeByCode = new Map(errorCodes.map((c) => [c.code, c]));
  const attentionErrors: AttentionErrorInput[] = errorStats.flatMap((stat) => {
    const meta = errorCodeByCode.get(stat.errorCode);
    if (!meta) return [];
    return [
      {
        code: stat.errorCode,
        nameVi: meta.nameVi,
        group: meta.group,
        count7d: stat.count7d,
        count30d: stat.count30d,
        lastAt: stat.lastAt,
        remediationSkills: meta.remediationSkills,
        behavioural: meta.behavioural,
      },
    ];
  });

  const errorCounts14dBySkill = new Map<string, Record<string, number>>();
  for (const row of recentErrorEvidence) {
    if (!row.errorCode) continue;
    const bucket = errorCounts14dBySkill.get(row.skillId) ?? {};
    bucket[row.errorCode] = (bucket[row.errorCode] ?? 0) + 1;
    errorCounts14dBySkill.set(row.skillId, bucket);
  }

  const attentionSkills: AttentionSkillInput[] = skills.flatMap((skill) => {
    const m = masteryBySkill.get(skill.id);
    // A skill with no evidence at all cannot be "weak"; it is simply not started (§3.3).
    if (!m || m.evidenceCount === 0) return [];
    return [
      {
        code: skill.code,
        nameVi: skill.nameVi,
        subject: skill.subject,
        mastery: m.mastery,
        status: m.status,
        confidence: m.confidence,
        evidenceCount: m.evidenceCount,
        trend14d: m.trend14d,
        prerequisites: skill.prerequisites.map((p) => p.prerequisite.code),
        errorCounts14d: errorCounts14dBySkill.get(skill.id),
        expectedWeek: skill.expectedWeek,
      },
    ];
  });

  const attention = attentionPoints({
    errors: attentionErrors,
    skills: attentionSkills,
    tracks: tracks.map((t) => ({
      skillCode: t.skill.code,
      errorCode: t.errorCode,
      rung: t.rung,
      status: t.status as "ACTIVE",
    })),
    currentWeek,
  });

  // ── the seven-day strip ────────────────────────────────────────────────────────────────────
  const byDay = new Map<string, DayActivity>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS);
    byDay.set(iso(d), {
      date: iso(d),
      weekday: d.getDay() === 0 ? 7 : d.getDay(),
      exercises: 0,
      minutes: 0,
      stars: 0,
      evidence: 0,
      photos: 0,
      sessionStatus: null,
    });
  }
  for (const s of sessions7d) {
    const day = byDay.get(iso(s.date));
    if (!day) continue;
    day.exercises += s._count.attempts;
    day.minutes += Math.round(s.durationSec / 60);
    // A completed session outranks an abandoned one on the same day.
    if (day.sessionStatus !== "COMPLETED") day.sessionStatus = s.status;
  }
  for (const e of evidence7d) {
    const day = byDay.get(iso(e.observedAt));
    if (!day) continue;
    day.evidence++;
    if (e.source === "INTAKE_PHOTO") day.photos++;
  }
  for (const s of stars7d) {
    const day = byDay.get(iso(s.at));
    if (day && s.delta > 0) day.stars += s.delta;
  }

  const slots = Array.isArray(todaySession?.slots) ? (todaySession.slots as unknown[]) : [];

  return {
    student: { ...student, mascot: String(student.mascot) },
    today: todaySession
      ? {
          sessionId: todaySession.id,
          status: todaySession.status,
          done: todaySession._count.attempts,
          total: slots.length,
          starsEarned: todaySession.starsEarned,
          minutes: Math.round(todaySession.durationSec / 60),
        }
      : null,
    streak: {
      current: streak?.current ?? 0,
      longest: streak?.longest ?? 0,
      lastActiveDate: streak?.lastActiveDate ? iso(streak.lastActiveDate) : null,
    },
    attention,
    subjects: SUBJECT_ORDER.map((s) => cards.get(s) as SubjectCard).filter((c) => c.total > 0),
    activity7d: [...byDay.values()],
    totals: {
      evidence: evidenceTotal,
      evidence7d: evidence7d.length,
      photos: photoTotal,
      attempts7d: sessions7d.reduce((n, s) => n + s._count.attempts, 0),
    },
    currentWeek,
  };
}

/** Which children this adult may look at, in a stable order. Used by P2. */
export async function visibleStudents(
  db: PrismaClient,
  opts: { userId: string; isAdmin: boolean },
): Promise<{ id: string; nickname: string; slug: string; className: string }[]> {
  return db.student.findMany({
    where: {
      user: { isActive: true },
      ...(opts.isAdmin ? {} : { guardians: { some: { userId: opts.userId } } }),
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, nickname: true, slug: true, className: true },
  });
}
