/**
 * `pnpm intake:run [--job <id>]` — preprocesses the photos waiting in `IntakeJob(QUEUED)` right
 * now, instead of waiting for the minute-by-minute job. Same code path as the scheduled worker.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "@mtct/db";
import { config as loadEnv } from "dotenv";
import pino from "pino";
import { runIntakePreprocessJob } from "../jobs/intake-preprocess";

const rootEnv = join(__dirname, "..", "..", "..", "..", ".env");
if (existsSync(rootEnv)) loadEnv({ path: rootEnv, override: false });

const log = pino({ level: process.env.LOG_LEVEL ?? "info" });

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main(): Promise<void> {
  const result = await runIntakePreprocessJob(prisma, log, { jobId: arg("job") });
  if (result.jobs.length === 0 && result.failed.length === 0) {
    console.log("Không có ảnh nào đang chờ xử lý.");
  }
  for (const job of result.jobs) {
    console.log(
      `${job.jobId}: ${job.files} ảnh${job.split ? `, tách ${job.split} ảnh hai trang` : ""}` +
        `${job.duplicates ? `, ${job.duplicates} ảnh nghi trùng` : ""} — ${job.ms} ms`,
    );
  }
  for (const fail of result.failed) console.log(`  lỗi — ${fail.jobId}: ${fail.error}`);
}

main()
  .catch((err) => {
    log.error({ err }, "intake.preprocess failed");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
