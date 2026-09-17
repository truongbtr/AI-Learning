/**
 * `/admin` — one page that answers "hai đứa học thế nào rồi?" (owner, 18/09/2026).
 *
 * Everything here is already recorded somewhere: the parent overview builds the per-child cards,
 * and this adds what only makes sense side by side — how much of what they answered was right, the
 * skills that are furthest behind, the mistakes that keep coming back, and what the class itself is
 * on today. No new writes, no AI: it is a read of the evening the children actually had.
 */
import type { PrismaClient, Subject } from "../../generated/client";
import { currentLessons } from "../diary/lesson-pick";
import { type StudentOverview, studentOverview } from "../parent/overview";

type Db = PrismaClient;
const DAY_MS = 86_400_000;

export interface AnsweredWindow {
  /** Attempts the server could mark (a photo waiting to be read is not one). */
  answered: number;
  correct: number;
  /** 0–1, null when nothing was answered in the window. */
  accuracy: number | null;
  minutes: number;
  sessions: number;
}

export interface WeakSkill {
  code: string;
  nameVi: string;
  subject: Subject;
  mastery: number;
  evidenceCount: number;
  /** Days since the last piece of evidence, null when there is none. */
  daysSince: number | null;
}

export interface FrequentError {
  code: string;
  nameVi: string;
  count7d: number;
  remediation: string;
}

export interface ChildReport {
  overview: StudentOverview;
  today: AnsweredWindow;
  week: AnsweredWindow;
  weakest: WeakSkill[];
  errors: FrequentError[];
  /** Batches of their work still waiting to be read or approved. */
  photosWaiting: number;
  homeworkPending: number;
}

export interface AdminDashboard {
  generatedAt: Date;
  currentWeek: number | null;
  /** What the class is on, per subject, from the diary (docs/11 §4). */
  classNow: { subject: Subject; title: string | null; date: Date; source: "POST" | "PARENT" }[];
  children: ChildReport[];
}

/** Attempts and minutes in [since, now), and how many were right. */
async function answeredSince(db: Db, studentId: string, since: Date): Promise<AnsweredWindow> {
  const attempts = await db.attempt.findMany({
    where: { session: { studentId }, createdAt: { gte: since } },
    select: { isCorrect: true, timeMs: true, sessionId: true },
  });
  // A photo waiting to be read has no verdict yet, so it is not part of "how much was right".
  const marked = attempts.filter((a) => a.isCorrect !== null);
  const right = marked.filter((a) => a.isCorrect).length;
  const ms = attempts.reduce((n, a) => n + a.timeMs, 0);
  return {
    answered: marked.length,
    correct: right,
    accuracy: marked.length === 0 ? null : right / marked.length,
    minutes: Math.round(ms / 60000),
    sessions: new Set(attempts.map((a) => a.sessionId)).size,
  };
}

/** The skills with the least mastery that the child has actually met. */
async function weakestSkills(db: Db, studentId: string, take: number): Promise<WeakSkill[]> {
  const rows = await db.skillMastery.findMany({
    where: { studentId, evidenceCount: { gt: 0 }, skill: { isActive: true } },
    orderBy: [{ mastery: "asc" }, { evidenceCount: "desc" }],
    take,
    select: {
      mastery: true,
      evidenceCount: true,
      lastEvidenceAt: true,
      skill: { select: { code: true, nameVi: true, subject: true } },
    },
  });
  const now = Date.now();
  return rows.map((r) => ({
    code: r.skill.code,
    nameVi: r.skill.nameVi,
    subject: r.skill.subject,
    mastery: Math.round(r.mastery),
    evidenceCount: r.evidenceCount,
    daysSince: r.lastEvidenceAt ? Math.floor((now - r.lastEvidenceAt.getTime()) / DAY_MS) : null,
  }));
}

/** The mistakes of the last seven days, most frequent first, with what the taxonomy says to do. */
async function frequentErrors(db: Db, studentId: string, take: number): Promise<FrequentError[]> {
  const stats = await db.errorStat.findMany({
    where: { studentId, count7d: { gt: 0 } },
    orderBy: { count7d: "desc" },
    take,
    select: { errorCode: true, count7d: true },
  });
  if (stats.length === 0) return [];
  const codes = await db.errorCode.findMany({
    where: { code: { in: stats.map((s) => s.errorCode) } },
    select: { code: true, nameVi: true, remediation: true },
  });
  const byCode = new Map(codes.map((c) => [c.code, c]));
  return stats.map((s) => ({
    code: s.errorCode,
    nameVi: byCode.get(s.errorCode)?.nameVi ?? s.errorCode,
    count7d: s.count7d,
    remediation: byCode.get(s.errorCode)?.remediation ?? "",
  }));
}

/** The whole page, for every active child, newest data first. */
export async function adminDashboard(db: Db, at = new Date()): Promise<AdminDashboard> {
  const students = await db.student.findMany({
    where: { user: { isActive: true } },
    orderBy: { createdAt: "asc" },
    select: { id: true, className: true },
  });

  const startOfToday = new Date(at);
  startOfToday.setHours(0, 0, 0, 0);
  const weekAgo = new Date(at.getTime() - 7 * DAY_MS);

  const children: ChildReport[] = [];
  for (const s of students) {
    const overview = await studentOverview(db, s.id, { date: at });
    if (!overview) continue; // a student row without a user: nothing to report
    children.push({
      overview,
      today: await answeredSince(db, s.id, startOfToday),
      week: await answeredSince(db, s.id, weekAgo),
      weakest: await weakestSkills(db, s.id, 5),
      errors: await frequentErrors(db, s.id, 5),
      photosWaiting: await db.intakeJob.count({
        where: {
          studentId: s.id,
          status: { in: ["QUEUED", "PROCESSING", "PENDING_REVIEW", "NEEDS_REVIEW"] },
        },
      }),
      homeworkPending: await db.homework.count({
        where: { studentId: s.id, status: { in: ["PENDING", "IN_PROGRESS"] } },
      }),
    });
  }

  const className = students[0]?.className ?? "1B3";
  const classNow = (await currentLessons(db, className)).map((c) => ({
    subject: c.subject,
    title: c.title,
    date: c.date,
    source: c.source,
  }));

  return {
    generatedAt: at,
    currentWeek: children[0]?.overview.currentWeek ?? null,
    classNow,
    children,
  };
}
