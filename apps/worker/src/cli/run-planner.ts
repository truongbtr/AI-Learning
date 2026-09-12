/**
 * `pnpm plan:run [--student thy] [--date 2026-09-14] [--force] [--no-assessment]` — plans today's
 * Daily Quest from the command line (docs/08 pha 3 việc 4: "job planner.daily 04:00 + gọi tay").
 * Same code path as the scheduled job, so what you test by hand is what runs at four in the morning.
 *
 * `--no-assessment` skips the three diagnostic evenings of docs/04 §10 and plans an ordinary quest.
 * For a child whose level the family already knows — and for the acceptance suites, which are
 * about the Daily Quest and would otherwise meet a diagnostic on a freshly seeded database.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "@mtct/db";
import { config as loadEnv } from "dotenv";
import pino from "pino";
import { runPlannerDailyJob } from "../jobs/planner-daily";

const rootEnv = join(__dirname, "..", "..", "..", "..", ".env");
if (existsSync(rootEnv)) loadEnv({ path: rootEnv, override: false });

const log = pino({ level: process.env.LOG_LEVEL ?? "info" });

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main(): Promise<void> {
  const who = arg("student");
  const student = who
    ? await prisma.student.findFirst({
        where: { OR: [{ id: who }, { slug: who }, { nickname: who }] },
        select: { id: true, nickname: true },
      })
    : null;
  if (who && !student) throw new Error(`Không tìm thấy học sinh "${who}"`);

  const dateArg = arg("date");
  const date = dateArg ? new Date(`${dateArg}T08:00:00+07:00`) : new Date();
  if (Number.isNaN(date.getTime())) throw new Error(`Ngày không hợp lệ: ${dateArg}`);

  const result = await runPlannerDailyJob(prisma, log, {
    date,
    force: process.argv.includes("--force"),
    // A child whose level the family already knows, and the acceptance suites, skip the three
    // diagnostic evenings of docs/04 §10 and get an ordinary Daily Quest straight away.
    skipAssessment: process.argv.includes("--no-assessment"),
    studentId: student?.id,
  });

  for (const p of result.planned) {
    console.log(
      `${p.created ? "đã lên" : "giữ nguyên"} phiên ${p.sessionId} cho ${p.nickname}: ${p.slots} bài`,
    );
  }
  for (const gap of result.gaps) console.log(`  thiếu bài — ${gap.nickname}: ${gap.reason}`);
}

main()
  .catch((err) => {
    log.error({ err }, "planner.daily failed");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
