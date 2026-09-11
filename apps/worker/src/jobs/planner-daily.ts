/**
 * `planner.daily` — the morning job (docs/04 §4, docs/08 pha 3 việc 4).
 *
 * At 04:00 Vietnam time every active child gets the day's Daily Quest planned and its exercises
 * chosen from the bank, so the first thing a six-year-old sees after breakfast is a ready quest
 * and not a loading spinner. No AI is involved (ADR-9, ADR-10): the planner is an algorithm and
 * the exercises come from `content/` via `pnpm content:import`.
 *
 * Idempotent: a child who already has a session for today keeps it, exercises and all.
 *
 * Run by hand:  pnpm plan:run [--student <nickname|id>] [--date 2026-09-14] [--force]
 */

import type { PrismaClient } from "@mtct/db";
import { planDailyQuest } from "@mtct/db";
import type { Logger } from "pino";

export const PLANNER_DAILY_QUEUE = "planner.daily";
/** 04:00 every day; the worker passes tz = Asia/Ho_Chi_Minh. */
export const PLANNER_DAILY_CRON = "0 4 * * *";

export interface PlannerDailyResult {
  date: string;
  planned: {
    studentId: string;
    nickname: string;
    sessionId: string;
    slots: number;
    created: boolean;
  }[];
  /** Slots the bank could not fill, so a gap in the content is visible instead of silent. */
  gaps: { nickname: string; reason: string }[];
}

export async function runPlannerDailyJob(
  prisma: PrismaClient,
  log: Logger,
  opts: { date?: Date; force?: boolean; studentId?: string } = {},
): Promise<PlannerDailyResult> {
  const started = Date.now();
  const date = opts.date ?? new Date();
  const students = await prisma.student.findMany({
    where: { isActive: true, ...(opts.studentId ? { id: opts.studentId } : {}) },
    select: { id: true, nickname: true },
    orderBy: { nickname: "asc" },
  });

  const result: PlannerDailyResult = {
    date: date.toISOString().slice(0, 10),
    planned: [],
    gaps: [],
  };
  for (const student of students) {
    try {
      const quest = await planDailyQuest(prisma, student.id, date, { force: opts.force });
      result.planned.push({
        studentId: student.id,
        nickname: student.nickname,
        sessionId: quest.sessionId,
        slots: quest.slots.length,
        created: quest.created,
      });
      for (const slot of quest.slots) {
        if (slot.missing) result.gaps.push({ nickname: student.nickname, reason: slot.missing });
      }
    } catch (err) {
      log.error(
        { job: PLANNER_DAILY_QUEUE, student: student.nickname, err },
        "planner.daily failed",
      );
    }
  }

  log.info(
    {
      job: PLANNER_DAILY_QUEUE,
      date: result.date,
      students: students.length,
      created: result.planned.filter((p) => p.created).length,
      kept: result.planned.filter((p) => !p.created).length,
      gaps: result.gaps.length,
      ms: Date.now() - started,
    },
    "planner.daily ok",
  );
  return result;
}
