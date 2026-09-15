import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { dayKey, vnDayDate } from "@mtct/core";
import type { PrismaClient } from "../../generated/client";
import { csvFile, median, ratio } from "./csv";
import { docsRoot, opsRoot } from "./paths";

/**
 * `pnpm ops:export` — the nightly snapshot two AI agents share (docs/14 §2, §3).
 *
 * Claude chat on a phone cannot reach Postgres: the database runs in Docker on Windows behind a
 * Linux VM, and the bridge only reaches the project folder. So the folder *is* the API. Every night
 * at 04:30, after the planner has decided the day, this writes the whole operational truth as flat
 * CSV — one record per line, same columns every night, diffable between two days by eye.
 *
 * Two rules it must never break (docs/14 §3):
 *   - **No full names, no birth dates, no keys, no photos.** `thy` / `thanh` are the only
 *     identifiers. A snapshot of a six-year-old's learning is still a snapshot of a six-year-old.
 *   - **Under 5 MB a day, 90 days kept.** This is a family machine, not a warehouse.
 *
 * The file that matters most here is `exercise-health.csv`: which exercises get skipped, which
 * everybody gets right (too easy) and which everybody gets wrong (broken). That is the evidence
 * phase 6 will write content against, and nothing else in the system records it.
 */

const DAY_MS = 86_400_000;
/** docs/14 §3 — how far back the history files reach. */
export const HISTORY_DAYS = 90;
export const KEEP_DAYS = 90;
export const SCHEMA_VERSION = 1;
/** docs/14 §3: a day's folder over this is a bug, not a big day. */
export const MAX_DAY_BYTES = 5 * 1024 * 1024;

type Db = PrismaClient;

export interface OpsExportResult {
  dir: string;
  day: string;
  files: { name: string; rows: number; bytes: number }[];
  totalBytes: number;
  /** Day folders deleted for being older than `KEEP_DAYS`. */
  pruned: string[];
  warnings: string[];
}

export interface OpsExportOptions {
  root?: string;
  now?: Date;
  /** Skip `latest/` (the copy doubles the bytes written; the nightly job wants it). */
  skipLatest?: boolean;
  /** Project documents folder; `null` = not reachable (tests). Default: `docsRoot()`. */
  docsRoot?: string | null;
}

export async function exportOpsState(
  db: Db,
  opts: OpsExportOptions = {},
): Promise<OpsExportResult> {
  const now = opts.now ?? new Date();
  const root = opts.root ?? opsRoot();
  const docs = opts.docsRoot === undefined ? docsRoot() : opts.docsRoot;
  const day = dayKey(now);
  const dir = join(root, "state", day);
  mkdirSync(dir, { recursive: true });

  const since = new Date(now.getTime() - HISTORY_DAYS * DAY_MS);
  const out: OpsExportResult = {
    dir,
    day,
    files: [],
    totalBytes: 0,
    pruned: [],
    warnings: [],
  };
  const write = (name: string, content: string, rows: number) => {
    writeFileSync(join(dir, name), content, "utf8");
    const bytes = Buffer.byteLength(content, "utf8");
    out.files.push({ name, rows, bytes });
    out.totalBytes += bytes;
  };

  // ── students ──────────────────────────────────────────────────────────────────────────────
  const students = await db.student.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      nickname: true,
      slug: true,
      grade: true,
      className: true,
      mascot: true,
      settings: true,
    },
  });
  const nick = new Map(students.map((s) => [s.id, s.slug]));
  write(
    "students.csv",
    csvFile(
      ["nickname", "grade", "className", "world", "dailyMinutes", "difficultyBias"],
      students.map((s) => {
        const settings = (s.settings ?? {}) as { dailyMinutes?: number; difficultyBias?: number };
        return [
          s.slug,
          s.grade,
          s.className,
          s.mascot === "OWL" ? "garden" : "robot",
          settings.dailyMinutes ?? 15,
          settings.difficultyBias ?? 0,
        ];
      }),
    ),
    students.length,
  );

  // ── mastery ───────────────────────────────────────────────────────────────────────────────
  const masteries = await db.skillMastery.findMany({
    where: { studentId: { in: [...nick.keys()] } },
    orderBy: [{ studentId: "asc" }, { mastery: "desc" }],
    select: {
      studentId: true,
      mastery: true,
      confidence: true,
      status: true,
      evidenceCount: true,
      trend14d: true,
      lastEvidenceAt: true,
      nextReviewAt: true,
      skill: { select: { code: true, subject: true, strand: true, expectedWeek: true } },
    },
  });
  write(
    "mastery.csv",
    csvFile(
      [
        "nickname",
        "skillCode",
        "subject",
        "strand",
        "mastery",
        "confidence",
        "status",
        "evidenceCount",
        "trend14d",
        "expectedWeek",
        "lastEvidenceAt",
        "nextReviewAt",
      ],
      masteries.map((m) => [
        nick.get(m.studentId),
        m.skill.code,
        m.skill.subject,
        m.skill.strand,
        m.mastery,
        m.confidence,
        m.status,
        m.evidenceCount,
        m.trend14d,
        m.skill.expectedWeek,
        m.lastEvidenceAt,
        m.nextReviewAt,
      ]),
    ),
    masteries.length,
  );

  const history = await db.masteryHistory.findMany({
    where: { studentId: { in: [...nick.keys()] }, at: { gte: since } },
    orderBy: { at: "asc" },
    select: {
      studentId: true,
      at: true,
      masteryBefore: true,
      masteryAfter: true,
      confidenceAfter: true,
      cause: true,
      skill: { select: { code: true } },
    },
  });
  write(
    "mastery-history.csv",
    csvFile(
      ["nickname", "skillCode", "at", "masteryBefore", "masteryAfter", "confidenceAfter", "cause"],
      history.map((h) => [
        nick.get(h.studentId),
        h.skill.code,
        h.at,
        h.masteryBefore,
        h.masteryAfter,
        h.confidenceAfter,
        h.cause,
      ]),
    ),
    history.length,
  );

  // ── sessions and attempts ─────────────────────────────────────────────────────────────────
  const sessions = await db.session.findMany({
    where: { studentId: { in: [...nick.keys()] }, date: { gte: since } },
    orderBy: { date: "asc" },
    select: {
      id: true,
      studentId: true,
      date: true,
      kind: true,
      status: true,
      slots: true,
      durationSec: true,
      starsEarned: true,
      startedAt: true,
      finishedAt: true,
      attempts: {
        orderBy: { order: "asc" },
        select: {
          order: true,
          exerciseId: true,
          isCorrect: true,
          score: true,
          tries: true,
          hintsUsed: true,
          timeMs: true,
          gradedBy: true,
          exercise: {
            select: {
              stableId: true,
              type: true,
              difficulty: true,
              skills: { select: { skill: { select: { code: true } } } },
            },
          },
        },
      },
    },
  });

  const sessionRows = sessions.map((s) => {
    const slots = (Array.isArray(s.slots) ? s.slots : []) as {
      order?: number;
      kind?: string;
      exerciseId?: string | null;
    }[];
    const answered = s.attempts.filter((a) => a.isCorrect !== null).length;
    const minutes = Math.round((s.durationSec / 60) * 10) / 10;
    // Where a child stopped is the most useful column in this file: it is the only place the
    // database says "this is where the evening fell apart".
    const stoppedAt =
      s.status === "COMPLETED"
        ? null
        : (s.attempts.at(-1)?.order ?? 0) + 1 <= slots.length
          ? (s.attempts.at(-1)?.order ?? 0) + 1
          : null;
    return [
      nick.get(s.studentId),
      dayKey(s.date),
      s.kind,
      s.status,
      slots.length,
      answered,
      minutes,
      s.starsEarned,
      stoppedAt,
      s.id,
    ];
  });
  write(
    "sessions.csv",
    csvFile(
      [
        "nickname",
        "date",
        "kind",
        "status",
        "slots",
        "answered",
        "minutes",
        "stars",
        "stoppedAtSlot",
        "sessionId",
      ],
      sessionRows,
    ),
    sessionRows.length,
  );

  const attemptRows: (string | number | null)[][] = [];
  for (const session of sessions)
    for (const a of session.attempts)
      attemptRows.push([
        session.id,
        nick.get(session.studentId) ?? null,
        dayKey(session.date),
        a.order,
        a.exercise?.stableId ?? null,
        a.exercise?.type ?? null,
        a.exercise?.skills.map((s) => s.skill.code).join(" ") ?? null,
        a.isCorrect === null ? "UNANSWERED" : a.isCorrect ? "CORRECT" : "INCORRECT",
        a.score,
        a.tries,
        a.hintsUsed,
        Math.round(a.timeMs / 1000),
        a.gradedBy,
      ]);
  write(
    "attempts.csv",
    csvFile(
      [
        "sessionId",
        "nickname",
        "date",
        "order",
        "exerciseStableId",
        "exerciseType",
        "skillCodes",
        "outcome",
        "score",
        "tries",
        "hintsUsed",
        "seconds",
        "gradedBy",
      ],
      attemptRows,
    ),
    attemptRows.length,
  );

  // ── evidence and errors ───────────────────────────────────────────────────────────────────
  const evidence = await db.evidence.findMany({
    where: { studentId: { in: [...nick.keys()] }, observedAt: { gte: since } },
    orderBy: { observedAt: "asc" },
    select: {
      studentId: true,
      source: true,
      outcome: true,
      score: true,
      weight: true,
      errorCode: true,
      observedAt: true,
      skill: { select: { code: true } },
    },
  });
  write(
    "evidence.csv",
    csvFile(
      ["nickname", "skillCode", "source", "outcome", "score", "weight", "errorCode", "observedAt"],
      evidence.map((e) => [
        nick.get(e.studentId),
        e.skill.code,
        e.source,
        e.outcome,
        e.score,
        e.weight,
        e.errorCode,
        e.observedAt,
      ]),
    ),
    evidence.length,
  );

  const errorStats = await db.errorStat.findMany({
    where: { studentId: { in: [...nick.keys()] } },
    orderBy: [{ studentId: "asc" }, { count30d: "desc" }],
    select: { studentId: true, errorCode: true, count7d: true, count30d: true, lastAt: true },
  });
  // docs/14 §3 asks for a 14-day window too; `ErrorStat` keeps 7 and 30 (docs/04 §11.3), so the
  // middle one is counted here out of the evidence already in hand.
  const since14 = new Date(now.getTime() - 14 * DAY_MS);
  const count14 = new Map<string, number>();
  for (const e of evidence)
    if (e.errorCode && e.observedAt >= since14) {
      const key = `${e.studentId}:${e.errorCode}`;
      count14.set(key, (count14.get(key) ?? 0) + 1);
    }
  write(
    "error-stats.csv",
    csvFile(
      ["nickname", "errorCode", "count7d", "count14d", "count30d", "lastAt"],
      errorStats.map((s) => [
        nick.get(s.studentId),
        s.errorCode,
        s.count7d,
        count14.get(`${s.studentId}:${s.errorCode}`) ?? 0,
        s.count30d,
        s.lastAt,
      ]),
    ),
    errorStats.length,
  );

  const tracks = await db.remediationTrack.findMany({
    where: { studentId: { in: [...nick.keys()] } },
    orderBy: { startedAt: "asc" },
    select: {
      studentId: true,
      errorCode: true,
      rung: true,
      status: true,
      startedAt: true,
      lastStepAt: true,
      skill: { select: { code: true } },
    },
  });
  write(
    "remediation.csv",
    csvFile(
      ["nickname", "skillCode", "errorCode", "rung", "status", "startedAt", "lastStepAt"],
      tracks.map((t) => [
        nick.get(t.studentId),
        t.skill.code,
        t.errorCode,
        t.rung,
        t.status,
        t.startedAt,
        t.lastStepAt,
      ]),
    ),
    tracks.length,
  );

  // ── content coverage and exercise health ──────────────────────────────────────────────────
  const exercises = await db.exercise.findMany({
    select: {
      id: true,
      stableId: true,
      type: true,
      difficulty: true,
      status: true,
      qualityFlag: true,
      usageCount: true,
      spec: true,
      skills: { select: { skill: { select: { code: true, subject: true } } } },
    },
  });
  const hasAudio = (spec: unknown): boolean => {
    const json = JSON.stringify(spec ?? {});
    return (
      json.includes('"audio"') || json.includes('"audioKey"') || json.includes('"modelAudioKey"')
    );
  };
  interface Coverage {
    subject: string;
    published: number;
    draft: number;
    retired: number;
    byType: Map<string, number>;
    byDifficulty: Map<number, number>;
    noAudio: number;
  }
  const coverage = new Map<string, Coverage>();
  const allSkills = await db.skill.findMany({
    where: { isActive: true },
    select: { code: true, subject: true, expectedWeek: true },
    orderBy: { code: "asc" },
  });
  for (const skill of allSkills)
    coverage.set(skill.code, {
      subject: skill.subject,
      published: 0,
      draft: 0,
      retired: 0,
      byType: new Map(),
      byDifficulty: new Map(),
      noAudio: 0,
    });
  for (const ex of exercises)
    for (const link of ex.skills) {
      const row = coverage.get(link.skill.code);
      if (!row) continue;
      if (ex.status === "PUBLISHED") {
        row.published++;
        row.byType.set(ex.type, (row.byType.get(ex.type) ?? 0) + 1);
        row.byDifficulty.set(ex.difficulty, (row.byDifficulty.get(ex.difficulty) ?? 0) + 1);
        if (!hasAudio(ex.spec)) row.noAudio++;
      } else if (ex.status === "RETIRED") row.retired++;
      else row.draft++;
    }
  write(
    "content-coverage.csv",
    csvFile(
      [
        "skillCode",
        "subject",
        "expectedWeek",
        "published",
        "draft",
        "retired",
        "byType",
        "byDifficulty",
        "noAudio",
      ],
      allSkills.map((skill) => {
        const row = coverage.get(skill.code) as Coverage;
        return [
          skill.code,
          skill.subject,
          skill.expectedWeek,
          row.published,
          row.draft,
          row.retired,
          [...row.byType.entries()].map(([t, n]) => `${t}:${n}`).join(" "),
          [...row.byDifficulty.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([d, n]) => `d${d}:${n}`)
            .join(" "),
          row.noAudio,
        ];
      }),
    ),
    allSkills.length,
  );

  // Offers come from the session plan, answers from the attempts: the gap between them is the
  // "skipped" column, and it is the only number that says a child would not even try.
  interface Health {
    offers: number;
    attempts: number;
    correct: number;
    skipped: number;
    seconds: number[];
    tries: number[];
  }
  const health = new Map<string, Health>();
  const idToStable = new Map(exercises.map((e) => [e.id, e.stableId]));
  const blank = (): Health => ({
    offers: 0,
    attempts: 0,
    correct: 0,
    skipped: 0,
    seconds: [],
    tries: [],
  });
  for (const session of sessions) {
    const slots = (Array.isArray(session.slots) ? session.slots : []) as {
      exerciseId?: string | null;
    }[];
    for (const slot of slots) {
      const stable = slot.exerciseId ? idToStable.get(slot.exerciseId) : null;
      if (!stable) continue;
      const row = health.get(stable) ?? blank();
      row.offers++;
      health.set(stable, row);
    }
    for (const a of session.attempts) {
      const stable = a.exercise?.stableId;
      if (!stable) continue;
      const row = health.get(stable) ?? blank();
      if (a.isCorrect === null) row.skipped++;
      else {
        row.attempts++;
        if (a.isCorrect) row.correct++;
        row.seconds.push(Math.round(a.timeMs / 1000));
        row.tries.push(a.tries);
      }
      health.set(stable, row);
    }
  }
  const healthRows = [...health.entries()]
    .sort((a, b) => b[1].offers - a[1].offers)
    .map(([stableId, row]) => [
      stableId,
      row.offers,
      row.attempts,
      ratio(row.correct, row.attempts),
      // Offered and never answered: the child closed the app, or would not touch it.
      ratio(row.offers - row.attempts, row.offers),
      median(row.seconds),
      median(row.tries),
    ]);
  write(
    "exercise-health.csv",
    csvFile(
      [
        "exerciseStableId",
        "offers",
        "attempts",
        "correctRate",
        "skipRate",
        "medianSeconds",
        "medianTries",
      ],
      healthRows,
    ),
    healthRows.length,
  );

  // ── the class diary ───────────────────────────────────────────────────────────────────────
  const diaries = await db.classDiary.findMany({
    where: { date: { gte: since } },
    orderBy: { date: "asc" },
    select: {
      date: true,
      className: true,
      createdAt: true,
      confirmedAt: true,
      confidence: true,
      lessons: { select: { subjectLabel: true, lessonRefText: true, skillCodes: true } },
      homeworks: { select: { text: true, taskType: true, status: true } },
    },
  });
  const diaryRows: (string | number | null)[][] = [];
  for (const d of diaries) {
    const dayStr = dayKey(d.date);
    if (d.lessons.length === 0 && d.homeworks.length === 0)
      diaryRows.push([
        dayStr,
        d.className,
        "",
        "",
        "",
        "",
        d.confidence,
        d.createdAt.toISOString(),
      ]);
    for (const lesson of d.lessons)
      diaryRows.push([
        dayStr,
        d.className,
        lesson.subjectLabel,
        lesson.lessonRefText,
        lesson.skillCodes.join(" "),
        "",
        d.confidence,
        d.createdAt.toISOString(),
      ]);
    for (const hw of d.homeworks)
      diaryRows.push([
        dayStr,
        d.className,
        "",
        "",
        "",
        `${hw.taskType}: ${hw.text}`,
        d.confidence,
        d.createdAt.toISOString(),
      ]);
  }
  write(
    "diary.csv",
    csvFile(
      [
        "date",
        "className",
        "subjectLabel",
        "lessonRefText",
        "skillCodes",
        "homework",
        "confidence",
        "pastedAt",
      ],
      diaryRows,
    ),
    diaryRows.length,
  );

  // ── meta + the page a person reads ────────────────────────────────────────────────────────
  const meta = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    day,
    timezone: "Asia/Ho_Chi_Minh",
    windowDays: HISTORY_DAYS,
    from: dayKey(since),
    to: day,
    students: students.map((s) => s.slug),
    files: out.files.map((f) => ({ name: f.name, rows: f.rows, bytes: f.bytes })),
    totalBytes: out.totalBytes,
    notes: [
      "Chỉ có tên gọi ở nhà (thy, thanh) — không tên đầy đủ, không ngày sinh, không khoá.",
      "CSV thuần, một dòng một bản ghi, cùng thứ tự cột mỗi đêm để diff được giữa hai ngày.",
    ],
  };
  write("meta.json", `${JSON.stringify(meta, null, 2)}\n`, out.files.length);

  let summary = await buildSummary(db, {
    now,
    students: students.map((s) => ({ id: s.id, slug: s.slug })),
    masteries,
    history,
    sessions,
    errorStats,
    count14,
    coverage,
    health,
    diaries: diaries.length,
  });
  if (!docs) {
    // Never overwrite the decisions with an error line: keep yesterday's context, say so here.
    out.warnings.push("không tìm thấy docs/ — giữ nguyên ops/context/QUYET-DINH.md");
    summary = `${summary}
## ⚠️ Cảnh báo khi xuất

- Không tìm thấy thư mục \`docs/\` (đã thử DOCS_ROOT, gốc repo, cạnh \`ops/\`). **\`ops/context/QUYET-DINH.md\` được giữ nguyên bản cũ**; phiên bản pha trong HIEN-TRANG.md lấy từ lần xuất trước. Trong container worker, mount \`../docs:/data/docs:ro\` (docker/compose.yml).
`;
  }
  write("SUMMARY.md", summary, summary.split("\n").length);

  if (out.totalBytes > MAX_DAY_BYTES)
    out.warnings.push(
      `ảnh chụp hôm nay ${(out.totalBytes / 1024 / 1024).toFixed(1)} MB, vượt mức 5 MB/ngày của docs/14 §3`,
    );

  // The summary is also the top-level page of `ops/state/` (docs/14 §3).
  writeFileSync(join(root, "state", "SUMMARY.md"), summary, "utf8");

  if (!opts.skipLatest) {
    const latest = join(root, "state", "latest");
    rmSync(latest, { recursive: true, force: true });
    // A copy, not a symlink: this is Windows, and a junction needs a privilege the owner should
    // not have to grant a nightly job (docs/14 §3 allows either).
    cpSync(dir, latest, { recursive: true });
  }

  out.pruned = pruneOldDays(join(root, "state"), now);
  await writeContextFiles(db, root, { now, summary, docs });
  return out;
}

/** Day folders older than `KEEP_DAYS` go; `latest/` and the top-level files stay. */
export function pruneOldDays(stateDir: string, now: Date): string[] {
  if (!existsSync(stateDir)) return [];
  const cutoff = new Date(now.getTime() - KEEP_DAYS * DAY_MS);
  const pruned: string[] = [];
  for (const name of readdirSync(stateDir)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(name)) continue;
    const path = join(stateDir, name);
    if (!statSync(path).isDirectory()) continue;
    if (new Date(`${name}T00:00:00Z`) >= cutoff) continue;
    rmSync(path, { recursive: true, force: true });
    pruned.push(name);
  }
  return pruned;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// SUMMARY.md — one page, thirty seconds (docs/14 §3)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

interface SummaryInput {
  now: Date;
  students: { id: string; slug: string }[];
  masteries: { studentId: string; mastery: number; status: string; skill: { code: string } }[];
  history: {
    studentId: string;
    at: Date;
    masteryBefore: number;
    masteryAfter: number;
    skill: { code: string };
  }[];
  sessions: { studentId: string; date: Date; status: string; durationSec: number }[];
  errorStats: { studentId: string; errorCode: string; count7d: number; count30d: number }[];
  count14: Map<string, number>;
  coverage: Map<string, { subject: string; published: number }>;
  health: Map<string, { offers: number; attempts: number; correct: number }>;
  diaries: number;
}

async function buildSummary(db: Db, input: SummaryInput): Promise<string> {
  const { now } = input;
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const lines: string[] = [];
  lines.push(`# Tuần này thế nào — ${dayKey(now)}`);
  lines.push("");
  lines.push(
    "> Sinh tự động bởi `pnpm ops:export` (docs/14 §3). Đọc file này trước, rồi mới mở CSV.",
  );
  lines.push("");

  // Per child, in sentences.
  for (const student of input.students) {
    const sessions = input.sessions.filter((s) => s.studentId === student.id && s.date >= weekAgo);
    const done = sessions.filter((s) => s.status === "COMPLETED");
    const minutes = Math.round(done.reduce((n, s) => n + s.durationSec, 0) / 60);
    const days = new Set(done.map((s) => dayKey(s.date))).size;
    const up = input.history
      .filter((h) => h.studentId === student.id && h.at >= weekAgo)
      .reduce<Map<string, number>>((map, h) => {
        map.set(h.skill.code, (map.get(h.skill.code) ?? 0) + (h.masteryAfter - h.masteryBefore));
        return map;
      }, new Map());
    const sorted = [...up.entries()].sort((a, b) => b[1] - a[1]);
    const best = sorted.slice(0, 3).filter(([, d]) => d > 0);
    const worst = sorted.slice(-3).filter(([, d]) => d < 0);
    const errors = input.errorStats
      .filter((s) => s.studentId === student.id && s.count30d > 0)
      .sort((a, b) => b.count30d - a.count30d)
      .slice(0, 3);
    const needPractice = input.masteries.filter(
      (m) => m.studentId === student.id && m.status === "NEEDS_PRACTICE",
    ).length;

    lines.push(`## ${student.slug}`);
    lines.push("");
    if (sessions.length === 0) {
      lines.push("Tuần này **chưa có phiên nào**. Không có gì để báo, và tôi không đoán.");
    } else {
      lines.push(
        `Học **${days}/7 ngày**, **${minutes} phút**, xong ${done.length}/${sessions.length} phiên.` +
          (needPractice > 0 ? ` ${needPractice} kỹ năng đang ở mức cần luyện thêm.` : ""),
      );
      if (best.length > 0)
        lines.push(`- Lên: ${best.map(([code, d]) => `${code} (+${Math.round(d)})`).join(", ")}`);
      if (worst.length > 0)
        lines.push(`- Tụt: ${worst.map(([code, d]) => `${code} (${Math.round(d)})`).join(", ")}`);
      if (errors.length > 0)
        lines.push(
          `- Hay gặp: ${errors
            .map(
              (e) =>
                `\`${e.errorCode}\` ${input.count14.get(`${e.studentId}:${e.errorCode}`) ?? 0} lần/14 ngày (${e.count30d}/30 ngày)`,
            )
            .join(", ")}`,
        );
    }
    lines.push("");
  }

  // Content, in one paragraph, because this is what decides the next content batch.
  const withExercises = [...input.coverage.values()].filter((c) => c.published > 0).length;
  const total = input.coverage.size;
  const emptyBySubject = new Map<string, number>();
  for (const row of input.coverage.values())
    if (row.published === 0)
      emptyBySubject.set(row.subject, (emptyBySubject.get(row.subject) ?? 0) + 1);
  lines.push("## Nội dung");
  lines.push("");
  lines.push(
    `${withExercises}/${total} kỹ năng có bài đã xuất bản. Còn trắng theo môn: ${
      [...emptyBySubject.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([subject, n]) => `${subject} ${n}`)
        .join(" · ") || "không còn môn nào"
    }.`,
  );
  const suspicious = [...input.health.entries()]
    .filter(([, h]) => h.attempts >= 5)
    .map(([stableId, h]) => ({ stableId, rate: h.correct / h.attempts, attempts: h.attempts }));
  const tooEasy = suspicious.filter((s) => s.rate === 1).length;
  const tooHard = suspicious.filter((s) => s.rate === 0).length;
  if (suspicious.length > 0)
    lines.push(
      `Trong ${suspicious.length} bài đã làm ít nhất 5 lượt: **${tooEasy} bài ai cũng đúng** (quá dễ), **${tooHard} bài ai cũng sai** (xem lại đề). Chi tiết ở \`exercise-health.csv\`.`,
    );
  else lines.push("Chưa đủ lượt làm để nói bài nào quá dễ hay quá khó (`exercise-health.csv`).");
  lines.push("");

  // Anything broken, from the same place /admin/health looks.
  lines.push("## Có gì hỏng không");
  lines.push("");
  const broken: string[] = [];
  const ping = await db.setting.findUnique({ where: { key: "worker.lastPing" } });
  const pingAt = (ping?.value as { at?: string } | null)?.at;
  if (!pingAt || now.getTime() - new Date(pingAt).getTime() > 6 * 60_000)
    broken.push(`worker không ping từ ${pingAt ?? "chưa bao giờ"} — xem docs/VAN-HANH.md §2`);
  const pendingInbox = await db.inboxItem.count({
    where: { status: { in: ["PENDING", "PULLED"] } },
  });
  if (pendingInbox > 0) broken.push(`${pendingInbox} việc trong hàng chờ AI chưa xử lý`);
  const held = await db.chatBatch.count({ where: { status: { in: ["HELD", "PARTIAL"] } } });
  if (held > 0) broken.push(`${held} lô ảnh từ chat còn câu chờ ba mẹ xem (/parent)`);
  const failedCalls = await db.internalApiCall.count({
    where: { status: { gte: 400 }, at: { gte: weekAgo } },
  });
  if (failedCalls > 0)
    broken.push(`${failedCalls} lời gọi /api/internal/* bị từ chối trong 7 ngày`);
  if (input.diaries === 0) broken.push("chưa dán nhật ký lớp nào trong 90 ngày");
  lines.push(broken.length === 0 ? "Không có gì." : broken.map((b) => `- ${b}`).join("\n"));
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(
    "Muốn thay đổi gì thì **đặt một yêu cầu** vào `ops/requests/` rồi chạy `pnpm ops:apply` — nó in diff và chờ người đồng ý (docs/14 §4). Không sửa thẳng DB.",
  );
  lines.push("");
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// ops/context — what a fresh chat session reads first (docs/14 §5)
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function writeContextFiles(
  db: Db,
  root: string,
  opts: { now: Date; summary: string; docs: string | null },
): Promise<void> {
  const dir = join(root, "context");
  mkdirSync(dir, { recursive: true });
  const statePath = join(dir, "HIEN-TRANG.md");
  const previousPhase = existsSync(statePath)
    ? /\*\*(.+)\*\*/.exec(
        readFileSync(statePath, "utf8")
          .split("\n")
          .find((l) => l.includes("Pha gần nhất")) ?? "",
      )?.[1]
    : undefined;
  writeFileSync(statePath, await buildCurrentState(db, { ...opts, previousPhase }), "utf8");
  // Without the documents the decisions cannot be rebuilt: the old file stays as it is.
  if (opts.docs) writeFileSync(join(dir, "QUYET-DINH.md"), buildDecisions(opts.docs), "utf8");
}

/** docs/14 §5 — the first file a new chat session opens. */
async function buildCurrentState(
  db: Db,
  opts: { now: Date; summary: string; docs: string | null; previousPhase?: string },
): Promise<string> {
  const { now } = opts;
  const phase =
    (opts.docs ? latestPhaseHeading(opts.docs) : null) ??
    opts.previousPhase ??
    "không đọc được docs/TIEN-DO.md";
  const [students, skills, exercises, sessions, evidence, batches, lastExport] = await Promise.all([
    db.student.count({ where: { isActive: true } }),
    db.skill.count({ where: { isActive: true } }),
    db.exercise.count({ where: { status: "PUBLISHED" } }),
    db.session.count(),
    db.evidence.count(),
    db.chatBatch.count(),
    db.setting.findUnique({ where: { key: OPS_EXPORT_SETTING } }),
  ]);
  const firstSession = await db.session.findFirst({
    orderBy: { date: "asc" },
    select: { date: true },
  });

  return [
    `# Hiện trạng — ${dayKey(now)}`,
    "",
    "> Sinh tự động mỗi lần `pnpm ops:export`. **Đây là file một phiên chat mới đọc đầu tiên** (docs/14 §5).",
    "",
    "## Hệ thống đang ở đâu",
    "",
    `- Pha gần nhất ghi trong \`docs/TIEN-DO.md\`: **${phase}**`,
    `- ${students} bé đang học · ${skills} kỹ năng trong bản đồ · ${exercises} bài đã xuất bản`,
    `- ${sessions} phiên, ${evidence} bằng chứng, ${batches} lô ảnh gửi qua chat`,
    firstSession
      ? `- Ngày học đầu tiên có trong DB: ${dayKey(firstSession.date)}`
      : "- **Chưa có phiên học nào** — hai tuần chạy thật chưa bắt đầu",
    `- Lần xuất trước: ${(lastExport?.value as { at?: string } | null)?.at ?? "chưa có"}`,
    "",
    "## Đọc gì, ở đâu",
    "",
    "| Cần gì | Mở |",
    "|---|---|",
    "| Tuần này thế nào | `ops/state/SUMMARY.md` |",
    "| Số liệu chi tiết | `ops/state/latest/*.csv` (cột giữ nguyên mỗi đêm, diff được) |",
    "| Bài nào hỏng / quá dễ / bị bỏ qua | `ops/state/latest/exercise-health.csv` |",
    "| Kỹ năng nào chưa có bài | `ops/state/latest/content-coverage.csv` |",
    "| Quyết định đã chốt, đừng đề xuất lại | `ops/context/QUYET-DINH.md` |",
    "| Muốn thay đổi gì | đặt file vào `ops/requests/`, rồi `pnpm ops:apply` (docs/14 §4) |",
    "",
    "## Việc đang chờ chủ dự án",
    "",
    "Xem mục 7 của pha gần nhất trong `docs/TIEN-DO.md` — đó là danh sách duy nhất được cập nhật bằng tay.",
    "",
    "## Ranh giới không được vượt",
    "",
    "- Không sửa/xoá `Evidence`, `Attempt`, `Session`, `SkillMastery`, `User` — kể cả qua `ops/requests/`.",
    "- Không đụng `.env`, không xoá file.",
    "- Không gửi tên đầy đủ hay ngày sinh của bé đi đâu cả; chỉ dùng `thy` / `thanh`.",
    "- App không gọi API LLM nào (ADR-10). Việc cần AI đi qua hàng chờ hoặc qua `/api/internal/*`.",
    "",
  ].join("\n");
}

/** The first line of the newest phase entry in docs/TIEN-DO.md, when it can be read. */
function latestPhaseHeading(docs: string): string | null {
  try {
    const text = readFileSync(join(docs, "TIEN-DO.md"), "utf8");
    return /^## (.+)$/m.exec(text)?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
}

/**
 * docs/14 §5 — the decisions, so a fresh session does not propose what has already been ruled out.
 *
 * Generated from the two places the decisions actually live (the ADR table in `docs/02` §8 and the
 * ADR files in `docs/adr/`) rather than retyped here, because a summary that drifts from the ADRs
 * is worse than no summary: it would be believed.
 */
function buildDecisions(docs: string): string {
  const lines = [
    `# Quyết định đã chốt`,
    "",
    "> Sinh tự động từ `docs/02-KIEN-TRUC.md` §8 và `docs/adr/`. Đừng đề xuất lại những thứ ở đây;",
    "> muốn đổi thì viết ADR mới và nói rõ trong báo cáo (CLAUDE.md quy tắc 2).",
    "",
  ];
  try {
    const arch = readFileSync(join(docs, "02-KIEN-TRUC.md"), "utf8");
    const rows = arch
      .split("\n")
      .filter((line) => /^\| ADR-\d+ \|/.test(line))
      .map((line) => {
        const cells = line.split("|").map((c) => c.trim());
        return `- **${cells[1]}** — ${cells[2]} _(vì: ${cells[4] ?? ""})_`;
      });
    if (rows.length > 0) {
      lines.push("## ADR-1…10 (trong `docs/02` §8)", "", ...rows, "");
    }
  } catch {
    lines.push("_Không đọc được `docs/02-KIEN-TRUC.md`._", "");
  }
  const adrDir = join(docs, "adr");
  if (existsSync(adrDir)) {
    const files = readdirSync(adrDir)
      .filter((f) => f.endsWith(".md"))
      .sort();
    if (files.length > 0) {
      lines.push("## ADR-11 trở đi (`docs/adr/`)", "");
      for (const file of files) {
        let title = file.replace(/\.md$/, "");
        try {
          const first = readFileSync(join(adrDir, file), "utf8")
            .split("\n")
            .find((l) => l.startsWith("# "));
          if (first) title = first.replace(/^#\s*/, "").trim();
        } catch {
          // keep the file name
        }
        lines.push(`- \`docs/adr/${file}\` — ${title}`);
      }
      lines.push("");
    }
  }
  lines.push(
    "## Hai thứ bị đảo ngược, đừng đọc bản cũ",
    "",
    "- **ADR-3 (pgvector)** bị bãi bỏ bởi ADR-10/ADR-12: tra cứu kỹ năng bằng Postgres full-text + `unaccent`.",
    "- **ADR-18 mục 1** bị đảo ngược 12/09/2026: `PLAN_SHARE` = 0,4 và **sàn ôn 30% không phá được** —",
    "  kể cả bằng `setPlannerWeight` trong `ops/requests/` (docs/14 §4).",
    "",
  );
  return lines.join("\n");
}

export const OPS_EXPORT_SETTING = "ops.export.lastRunAt";

/** Records the run so `/admin/health` and HIEN-TRANG.md can say when it last happened. */
export async function recordOpsExport(db: Db, result: OpsExportResult, at: Date): Promise<void> {
  await db.setting.upsert({
    where: { key: OPS_EXPORT_SETTING },
    create: {
      key: OPS_EXPORT_SETTING,
      value: { at: at.toISOString(), day: result.day, bytes: result.totalBytes },
    },
    update: { value: { at: at.toISOString(), day: result.day, bytes: result.totalBytes } },
  });
}

/** Exported for the test: the Vietnam calendar day a snapshot belongs to. */
export function opsDay(now: Date): string {
  return dayKey(vnDayDate(now));
}
