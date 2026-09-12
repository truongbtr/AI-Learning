/**
 * Worker process (docs/02 §2): pg-boss on the same PostgreSQL.
 *  - `ping` every minute → Setting["worker.lastPing"], read by /api/health (<= 6 min = ok).
 *  - `mastery.decay` at 02:30 Vietnam time (docs/04 §3.2); `pnpm decay:run` does it by hand.
 *  - `planner.daily` at 04:00 Vietnam time (docs/04 §4); `pnpm plan:run` does it by hand.
 *  - `ops.export` at 04:30 (docs/14 §3); `pnpm ops:export` does it by hand.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "@mtct/db";
import { config as loadEnv } from "dotenv";
import { PgBoss } from "pg-boss";
import pino from "pino";
import {
  INTAKE_PREPROCESS_CRON,
  INTAKE_PREPROCESS_QUEUE,
  runIntakePreprocessJob,
} from "./jobs/intake-preprocess";
import { MASTERY_DECAY_CRON, MASTERY_DECAY_QUEUE, runMasteryDecayJob } from "./jobs/mastery-decay";
import { OPS_EXPORT_CRON, OPS_EXPORT_QUEUE, runOpsExportJob } from "./jobs/ops-export";
import { PLANNER_DAILY_CRON, PLANNER_DAILY_QUEUE, runPlannerDailyJob } from "./jobs/planner-daily";

const rootEnv = join(__dirname, "..", "..", "..", ".env");
if (existsSync(rootEnv)) loadEnv({ path: rootEnv, override: false });

const log = pino({ level: process.env.LOG_LEVEL ?? "info" });

const PING_QUEUE = "ping";
const PING_SETTING_KEY = "worker.lastPing";

async function recordPing(): Promise<void> {
  const now = new Date();
  await prisma.setting.upsert({
    where: { key: PING_SETTING_KEY },
    create: { key: PING_SETTING_KEY, value: { at: now.toISOString(), pid: process.pid } },
    update: { value: { at: now.toISOString(), pid: process.pid } },
  });
  log.info({ job: PING_QUEUE, at: now.toISOString() }, "ping ok");
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");

  const boss = new PgBoss({ connectionString, schema: "pgboss" });
  boss.on("error", (err) => log.error({ err }, "pg-boss error"));
  await boss.start();
  log.info("pg-boss started");

  const tz = process.env.TZ ?? "Asia/Ho_Chi_Minh";

  await boss.createQueue(PING_QUEUE);
  await boss.work(PING_QUEUE, async () => {
    await recordPing();
  });
  // Every minute (server local time). One immediate ping so /api/health is green right away.
  await boss.schedule(PING_QUEUE, "* * * * *", {}, { tz });
  await boss.send(PING_QUEUE, {});

  await boss.createQueue(MASTERY_DECAY_QUEUE);
  await boss.work(MASTERY_DECAY_QUEUE, async () => {
    await runMasteryDecayJob(prisma, log);
  });
  await boss.schedule(MASTERY_DECAY_QUEUE, MASTERY_DECAY_CRON, {}, { tz });
  log.info({ queue: MASTERY_DECAY_QUEUE, cron: MASTERY_DECAY_CRON, tz }, "nightly decay scheduled");

  await boss.createQueue(PLANNER_DAILY_QUEUE);
  await boss.work(PLANNER_DAILY_QUEUE, async () => {
    await runPlannerDailyJob(prisma, log);
  });
  await boss.schedule(PLANNER_DAILY_QUEUE, PLANNER_DAILY_CRON, {}, { tz });
  log.info(
    { queue: PLANNER_DAILY_QUEUE, cron: PLANNER_DAILY_CRON, tz },
    "daily quest planning scheduled",
  );

  // The operations snapshot, half an hour after the planner (docs/14 §3): Claude chat reads these
  // files and cannot reach the database any other way.
  await boss.createQueue(OPS_EXPORT_QUEUE);
  await boss.work(OPS_EXPORT_QUEUE, async () => {
    await runOpsExportJob(prisma, log);
  });
  await boss.schedule(OPS_EXPORT_QUEUE, OPS_EXPORT_CRON, {}, { tz });
  log.info({ queue: OPS_EXPORT_QUEUE, cron: OPS_EXPORT_CRON, tz }, "ops export scheduled");

  // Photos of schoolwork: straighten, shrink, hash, hand to the AI queue (docs/07 §2, ADR-10).
  await boss.createQueue(INTAKE_PREPROCESS_QUEUE);
  await boss.work(INTAKE_PREPROCESS_QUEUE, async () => {
    await runIntakePreprocessJob(prisma, log);
  });
  await boss.schedule(INTAKE_PREPROCESS_QUEUE, INTAKE_PREPROCESS_CRON, {}, { tz });
  await boss.send(INTAKE_PREPROCESS_QUEUE, {});
  log.info(
    { queue: INTAKE_PREPROCESS_QUEUE, cron: INTAKE_PREPROCESS_CRON, tz },
    "intake preprocessing scheduled",
  );

  const shutdown = async (signal: string) => {
    log.info({ signal }, "worker stopping");
    await boss.stop({ graceful: true, timeout: 5_000 });
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  log.error({ err }, "worker failed to start");
  process.exit(1);
});
