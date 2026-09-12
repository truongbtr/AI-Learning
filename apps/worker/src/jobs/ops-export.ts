/**
 * `ops.export` — the nightly snapshot of the operations plane (docs/14 §3, §6).
 *
 * 04:30 Vietnam time, half an hour after `planner.daily`, on purpose: the day's sessions have
 * already been decided, so the snapshot describes the day that is about to happen rather than the
 * one that just ended. Claude chat on a phone reads these files and nothing else — it cannot reach
 * Postgres — so if this job stops running, the chat side goes blind without any other symptom.
 *
 * Run by hand:  pnpm ops:export
 */

import type { PrismaClient } from "@mtct/db";
import { exportOpsState, recordOpsExport } from "@mtct/db";
import type { Logger } from "pino";

export const OPS_EXPORT_QUEUE = "ops.export";
/** 04:30 every day; the worker passes tz = Asia/Ho_Chi_Minh. */
export const OPS_EXPORT_CRON = "30 4 * * *";

export async function runOpsExportJob(prisma: PrismaClient, log: Logger): Promise<void> {
  const started = Date.now();
  const now = new Date();
  try {
    const result = await exportOpsState(prisma, { now });
    await recordOpsExport(prisma, result, now);
    log.info(
      {
        job: OPS_EXPORT_QUEUE,
        dir: result.dir,
        files: result.files.length,
        kb: Math.round(result.totalBytes / 1024),
        pruned: result.pruned.length,
        ms: Date.now() - started,
      },
      "ops state exported",
    );
    for (const warning of result.warnings) log.warn({ job: OPS_EXPORT_QUEUE }, warning);
  } catch (err) {
    // A failed snapshot must not take the worker down: the child's evening does not depend on it.
    log.error({ job: OPS_EXPORT_QUEUE, err }, "ops export failed");
  }
}
