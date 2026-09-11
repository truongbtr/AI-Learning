/**
 * `mastery.decay` — nightly job (docs/04 §3.2, docs/08 pha 1 việc 3).
 *
 * Runs at 02:30 Vietnam time: every SkillMastery with no evidence for more than 21 days loses
 * 0.01 confidence and 0.3 mastery per elapsed day (floors 0.2 / 60), and every ErrorStat window
 * is recomputed. The job is catch-up safe: it applies one step per whole day since its previous
 * run, so a machine that was switched off for a week is not left stale.
 *
 * Run by hand:  pnpm decay:run        (add --force to run again the same day)
 */

import type { PrismaClient } from "@mtct/db";
import { runMasteryDecay } from "@mtct/db";
import type { Logger } from "pino";

export const MASTERY_DECAY_QUEUE = "mastery.decay";
/** 02:30 every day; the worker passes tz = Asia/Ho_Chi_Minh. */
export const MASTERY_DECAY_CRON = "30 2 * * *";

export async function runMasteryDecayJob(
  prisma: PrismaClient,
  log: Logger,
  opts: { force?: boolean } = {},
): Promise<void> {
  const started = Date.now();
  const result = await runMasteryDecay(prisma, new Date(), opts);
  if (result.skipped) {
    log.info({ job: MASTERY_DECAY_QUEUE }, "mastery.decay already ran today — skipped");
    return;
  }
  log.info(
    {
      job: MASTERY_DECAY_QUEUE,
      days: result.days,
      candidates: result.candidates,
      changed: result.changed,
      historyRows: result.historyRows,
      errorStats: result.errorStatsRefreshed,
      ms: Date.now() - started,
    },
    "mastery.decay ok",
  );
}
