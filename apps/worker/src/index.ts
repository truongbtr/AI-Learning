/**
 * Worker process (docs/02 §2): pg-boss on the same PostgreSQL. Phase 0 runs one job, `ping`,
 * every minute and records Setting["worker.lastPing"] which /api/health reads (<= 6 min = ok).
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "@mtct/db";
import { config as loadEnv } from "dotenv";
import { PgBoss } from "pg-boss";
import pino from "pino";

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

  await boss.createQueue(PING_QUEUE);
  await boss.work(PING_QUEUE, async () => {
    await recordPing();
  });
  // Every minute (server local time). One immediate ping so /api/health is green right away.
  await boss.schedule(PING_QUEUE, "* * * * *", {}, { tz: process.env.TZ ?? "Asia/Ho_Chi_Minh" });
  await boss.send(PING_QUEUE, {});

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
