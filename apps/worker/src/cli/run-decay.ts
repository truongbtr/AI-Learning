/**
 * `pnpm decay:run [--force]` — runs the nightly mastery decay once, from the command line
 * (docs/08 pha 1 việc 3: "có lệnh chạy tay để test"). Same code path as the scheduled job.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "@mtct/db";
import { config as loadEnv } from "dotenv";
import pino from "pino";
import { runMasteryDecayJob } from "../jobs/mastery-decay";

const rootEnv = join(__dirname, "..", "..", "..", "..", ".env");
if (existsSync(rootEnv)) loadEnv({ path: rootEnv, override: false });

const log = pino({ level: process.env.LOG_LEVEL ?? "info" });

runMasteryDecayJob(prisma, log, { force: process.argv.includes("--force") })
  .catch((err) => {
    log.error({ err }, "mastery.decay failed");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
