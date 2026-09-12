import { dayKey, vnDayDate } from "@mtct/core";
import type { PrismaClient } from "../../generated/client";

/**
 * The measurement behind the only acceptance criterion of phase 8 that matters (docs/08):
 *
 *   **"Hai bé tự dùng 10 phút/ngày không cần trợ giúp trong ≥ 10/14 ngày."**
 *
 * The owner was explicit that this is measured from the database, not felt. So this counts, per
 * child and per day, what the database can actually see — and is equally explicit about the one
 * part of the sentence it cannot see.
 *
 * ### What "tự dùng 10 phút" means here
 *
 * A **qualifying day** is a day on which the child
 *
 *   1. finished a session (`status = COMPLETED`) — not started one and wandered off, and
 *   2. spent at least `MIN_MINUTES` on it, counted from the attempts themselves rather than from
 *      the wall clock, so a tablet left face-up on the table for an hour does not become an hour
 *      of learning, and
 *   3. did it **unaided** by the two marks a parent's help actually leaves behind.
 *
 * ### The honest limit
 *
 * The database cannot see a parent sitting next to a child reading the question aloud. It can see
 * two things:
 *
 *   - a `PARENT_OVERRIDE` piece of evidence recorded that day — a parent corrected a mark, and
 *   - an attempt whose `gradedBy = PARENT` — a parent marked a spoken or written answer.
 *
 * Those cover the deliberate kinds of help. The quiet kind — "con đọc câu này đi", a finger
 * pointing at the right box — leaves no trace at all, and pretending otherwise would make this
 * number a lie. That is what `docs/nhat-ky-chay-that.md` is for: a human writes down whether help
 * was needed, and the two are compared at the end. The number below is the ceiling, and the diary
 * is the correction to it.
 */

/** docs/08 pha 8, tiêu chí 1. */
export const MIN_MINUTES = 10;
export const TRIAL_DAYS = 14;
export const REQUIRED_DAYS = 10;
/** A single answer that took longer than this was the child leaving the room, not thinking. */
const MAX_GAP_SECONDS = 180;

export interface TrialDay {
  /** `YYYY-MM-DD` in Vietnam time. */
  day: string;
  sessions: number;
  /** Sessions started but never finished — where a child gave up, and the number to watch. */
  abandoned: number;
  minutes: number;
  attempts: number;
  stars: number;
  parentHelped: boolean;
  /** Finished a session, ≥ MIN_MINUTES, no recorded parent help. */
  qualifies: boolean;
}

export interface TrialChild {
  slug: string;
  nickname: string;
  days: TrialDay[];
  daysLearnt: number;
  daysQualifying: number;
  totalMinutes: number;
  totalAttempts: number;
  abandoned: number;
  /** Days on which help was recorded — always report it, never hide it in an average. */
  daysWithHelp: number;
  meetsCriterion: boolean;
}

export interface TrialReport {
  from: string;
  to: string;
  requiredDays: number;
  minMinutes: number;
  children: TrialChild[];
  /** True only when **both** children clear it — the criterion says "hai bé". */
  meetsCriterion: boolean;
}

/**
 * Minutes a child actually spent, from the gaps between answers.
 *
 * `Session.durationSec` is wall clock and includes the twenty minutes the iPad sat on the sofa
 * while somebody found a sock. Summing the gaps between consecutive answers, capped, is closer to
 * time on task — and it is the number the criterion is really about.
 */
export function minutesFromAttempts(times: Date[], durationSec: number): number {
  if (times.length === 0) return 0;
  const sorted = [...times].sort((a, b) => a.getTime() - b.getTime());
  let seconds = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = ((sorted[i] as Date).getTime() - (sorted[i - 1] as Date).getTime()) / 1000;
    seconds += Math.min(Math.max(gap, 0), MAX_GAP_SECONDS);
  }
  // The first question had no gap before it; give it the median of the others, or 30 seconds.
  seconds += sorted.length > 1 ? seconds / (sorted.length - 1) : 30;
  // Never claim more than the session's own clock.
  return Math.round(Math.min(seconds, durationSec || seconds) / 60);
}

export async function trialReport(
  db: PrismaClient,
  opts: { to?: Date; days?: number; slugs?: string[] } = {},
): Promise<TrialReport> {
  const days = opts.days ?? TRIAL_DAYS;
  const to = opts.to ?? new Date();
  const from = new Date(vnDayDate(to).getTime() - (days - 1) * 86_400_000);

  const students = await db.student.findMany({
    where: { isActive: true, ...(opts.slugs?.length ? { slug: { in: opts.slugs } } : {}) },
    select: { id: true, slug: true, nickname: true },
    orderBy: { slug: "asc" },
  });

  const children: TrialChild[] = [];
  for (const student of students) {
    const [sessions, overrides] = await Promise.all([
      db.session.findMany({
        where: { studentId: student.id, date: { gte: from, lte: vnDayDate(to) } },
        select: {
          date: true,
          status: true,
          durationSec: true,
          starsEarned: true,
          attempts: { select: { createdAt: true, gradedBy: true } },
        },
      }),
      db.evidence.findMany({
        where: {
          studentId: student.id,
          source: "PARENT_OVERRIDE",
          observedAt: { gte: from },
        },
        select: { observedAt: true },
      }),
    ]);

    const helpDays = new Set(overrides.map((e) => dayKey(e.observedAt)));
    const byDay = new Map<string, TrialDay>();
    for (let i = 0; i < days; i++) {
      const at = new Date(from.getTime() + i * 86_400_000);
      const day = at.toISOString().slice(0, 10);
      byDay.set(day, {
        day,
        sessions: 0,
        abandoned: 0,
        minutes: 0,
        attempts: 0,
        stars: 0,
        parentHelped: helpDays.has(day),
        qualifies: false,
      });
    }

    for (const session of sessions) {
      const day = session.date.toISOString().slice(0, 10);
      const row = byDay.get(day);
      if (!row) continue;
      row.sessions++;
      if (session.status !== "COMPLETED") row.abandoned++;
      row.attempts += session.attempts.length;
      row.stars += session.starsEarned;
      if (session.status === "COMPLETED")
        row.minutes += minutesFromAttempts(
          session.attempts.map((a) => a.createdAt),
          session.durationSec,
        );
      if (session.attempts.some((a) => a.gradedBy === "PARENT")) row.parentHelped = true;
    }

    const rows = [...byDay.values()];
    for (const row of rows)
      row.qualifies =
        row.sessions > row.abandoned && row.minutes >= MIN_MINUTES && !row.parentHelped;

    children.push({
      slug: student.slug,
      nickname: student.nickname,
      days: rows,
      daysLearnt: rows.filter((r) => r.attempts > 0).length,
      daysQualifying: rows.filter((r) => r.qualifies).length,
      totalMinutes: rows.reduce((n, r) => n + r.minutes, 0),
      totalAttempts: rows.reduce((n, r) => n + r.attempts, 0),
      abandoned: rows.reduce((n, r) => n + r.abandoned, 0),
      daysWithHelp: rows.filter((r) => r.parentHelped).length,
      meetsCriterion: rows.filter((r) => r.qualifies).length >= REQUIRED_DAYS,
    });
  }

  return {
    from: from.toISOString().slice(0, 10),
    to: vnDayDate(to).toISOString().slice(0, 10),
    requiredDays: REQUIRED_DAYS,
    minMinutes: MIN_MINUTES,
    children,
    meetsCriterion: children.length > 0 && children.every((c) => c.meetsCriterion),
  };
}
