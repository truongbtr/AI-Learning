import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { statfs } from "node:fs/promises";
import { join } from "node:path";
import type { PrismaClient } from "../../generated/client";
import { readTtsUsage, summariseTtsUsage, type TtsUsageSummary } from "./tts-usage";

/**
 * What has to be true for two children to be able to sit down tonight (docs/08 pha 8 việc 3,
 * FR-ADM-04). Read by `GET /api/health` and drawn by `/admin/health`.
 *
 * Everything here answers a question the owner will actually have at 19:25 on a school night:
 *
 *  - is the database there;
 *  - is the worker alive (no worker = no Daily Quest at four in the morning);
 *  - did any job fail today, and which;
 *  - is the disk about to fill up — the machine is short of space, and Postgres stopping because
 *    of that is the failure mode that eats a week of evidence;
 *  - when was the last backup;
 *  - how much of the free Azure voice allowance is gone.
 *
 * Nothing here throws. A health page that crashes is worse than one that says "không đọc được".
 */

/** A worker that has not pinged in six minutes is not running (it pings every minute). */
export const WORKER_STALE_MS = 6 * 60 * 1000;
/** A backup older than this is a problem worth a red card, not a shrug. */
export const BACKUP_STALE_HOURS = 36;

export type Level = "ok" | "warn" | "error";

export interface HealthReport {
  status: Level;
  time: string;
  db: { ok: boolean; migrations: number; sizeMb: number | null };
  worker: { ok: boolean; lastPing: string | null; ageSeconds: number | null };
  jobs: {
    ok: boolean;
    failed24h: number;
    byQueue: { queue: string; failed: number; lastFailedAt: string | null }[];
    stuckActive: number;
  };
  disk: {
    ok: boolean;
    path: string;
    freeGb: number | null;
    totalGb: number | null;
    warnBelowGb: number;
  };
  backup: {
    ok: boolean;
    dir: string | null;
    latest: string | null;
    ageHours: number | null;
    sizeMb: number | null;
    count: number;
  };
  tts: TtsUsageSummary & { ok: boolean };
  queueWaiting: { toRead: number; toReview: number };
}

const worst = (levels: Level[]): Level =>
  levels.includes("error") ? "error" : levels.includes("warn") ? "warn" : "ok";

async function diskFor(path: string, warnBelowGb: number) {
  try {
    // `statfs` is the only cross-platform free-space call Node gives us; on Windows it reports the
    // volume holding `path`, which is what we want.
    const fs = await statfs(path);
    const freeGb = (fs.bavail * fs.bsize) / 1024 ** 3;
    const totalGb = (fs.blocks * fs.bsize) / 1024 ** 3;
    return {
      ok: freeGb >= warnBelowGb,
      path,
      freeGb: Math.round(freeGb * 10) / 10,
      totalGb: Math.round(totalGb * 10) / 10,
      warnBelowGb,
    };
  } catch {
    return { ok: true, path, freeGb: null, totalGb: null, warnBelowGb };
  }
}

function backupState(dir: string | undefined) {
  if (!dir || !existsSync(dir))
    return { ok: false, dir: dir ?? null, latest: null, ageHours: null, sizeMb: null, count: 0 };
  try {
    const dbDir = join(dir, "db");
    const files = existsSync(dbDir)
      ? readdirSync(dbDir).filter((f) => f.startsWith("mtct-") && f.endsWith(".dump"))
      : [];
    if (files.length === 0)
      return { ok: false, dir, latest: null, ageHours: null, sizeMb: null, count: 0 };
    const named = join(dir, "latest.txt");
    const latest =
      (existsSync(named) ? readFileSync(named, "utf8").split("\n")[0]?.trim() : "") ||
      (files.sort().at(-1) as string);
    const stat = statSync(join(dbDir, latest));
    const ageHours = (Date.now() - stat.mtimeMs) / 3_600_000;
    return {
      ok: ageHours <= BACKUP_STALE_HOURS,
      dir,
      latest,
      ageHours: Math.round(ageHours * 10) / 10,
      sizeMb: Math.round((stat.size / 1024 ** 2) * 10) / 10,
      count: files.length,
    };
  } catch {
    return { ok: false, dir, latest: null, ageHours: null, sizeMb: null, count: 0 };
  }
}

export async function healthReport(db: PrismaClient, env = process.env): Promise<HealthReport> {
  const time = new Date().toISOString();
  let dbOk = true;
  let migrations = 0;
  let sizeMb: number | null = null;
  let lastPing: string | null = null;
  let failedRows: { queue: string; failed: number; lastFailedAt: string | null }[] = [];
  let stuckActive = 0;
  let toRead = 0;
  let toReview = 0;
  let tts = summariseTtsUsage({});

  try {
    await db.$queryRaw`SELECT 1`;
    const ping = await db.setting.findUnique({ where: { key: "worker.lastPing" } });
    lastPing = (ping?.value as { at?: string } | null)?.at ?? null;

    const rows = await db.$queryRaw<
      { n: bigint }[]
    >`SELECT count(*)::bigint AS n FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`;
    migrations = Number(rows[0]?.n ?? 0);

    const size = await db.$queryRaw<
      { bytes: bigint }[]
    >`SELECT pg_database_size(current_database())::bigint AS bytes`;
    sizeMb = Math.round((Number(size[0]?.bytes ?? 0) / 1024 ** 2) * 10) / 10;

    // pg-boss keeps its own schema. A job that failed is the thing a family never notices by
    // itself: the Daily Quest simply is not there in the morning and nobody knows why.
    const failed = await db.$queryRaw<{ name: string; n: bigint; last: Date | null }[]>`
      SELECT name, count(*)::bigint AS n, max(completed_on) AS last
      FROM pgboss.job
      WHERE state = 'failed' AND created_on > now() - interval '24 hours'
      GROUP BY name ORDER BY n DESC`;
    failedRows = failed.map((r) => ({
      queue: r.name,
      failed: Number(r.n),
      lastFailedAt: r.last ? r.last.toISOString() : null,
    }));

    // Active for more than an hour means a worker died holding the job.
    const stuck = await db.$queryRaw<{ n: bigint }[]>`
      SELECT count(*)::bigint AS n FROM pgboss.job
      WHERE state = 'active' AND started_on < now() - interval '1 hour'`;
    stuckActive = Number(stuck[0]?.n ?? 0);

    [toRead, toReview] = await Promise.all([
      db.inboxItem.count({ where: { status: "PENDING" } }),
      db.intakeJob.count({ where: { status: "PENDING_REVIEW" } }),
    ]);

    tts = summariseTtsUsage(await readTtsUsage(db));
  } catch (err) {
    console.error("[health] db check failed", err);
    dbOk = false;
  }

  const ageMs = lastPing ? Date.now() - new Date(lastPing).getTime() : null;
  const workerOk = ageMs !== null && ageMs <= WORKER_STALE_MS;
  const totalFailed = failedRows.reduce((n, r) => n + r.failed, 0);

  const warnBelowGb = Number(env.DISK_WARN_FREE_GB ?? 10);
  const disk = await diskFor(env.FILE_ROOT || process.cwd(), warnBelowGb);
  const backup = backupState(env.BACKUP_DIR);

  return {
    status: worst([
      dbOk ? "ok" : "error",
      workerOk ? "ok" : "error",
      totalFailed > 0 || stuckActive > 0 ? "warn" : "ok",
      disk.ok ? "ok" : "warn",
      backup.ok ? "ok" : "warn",
      tts.level === "over" ? "warn" : "ok",
    ]),
    time,
    db: { ok: dbOk, migrations, sizeMb },
    worker: {
      ok: workerOk,
      lastPing,
      ageSeconds: ageMs === null ? null : Math.round(ageMs / 1000),
    },
    jobs: {
      ok: totalFailed === 0 && stuckActive === 0,
      failed24h: totalFailed,
      byQueue: failedRows,
      stuckActive,
    },
    disk,
    backup,
    tts: { ...tts, ok: tts.level !== "over" },
    queueWaiting: { toRead, toReview },
  };
}
