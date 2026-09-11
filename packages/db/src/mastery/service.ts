/**
 * Mastery services on top of the pure algorithms in @mtct/core/mastery (docs/04 sec. 3, sec. 11.3).
 * Used by POST /api/evidence (web) and the nightly `mastery.decay` job (worker).
 */
import {
  applyDecay,
  computeTrend14d,
  DAY_MS,
  DECAY_AFTER_DAYS,
  dayKey,
  decayDaysBetween,
  type EvidenceOutcome,
  type EvidenceSource,
  emptyMasteryState,
  type MasteryState,
  SOURCE_WEIGHT,
  updateMastery,
} from "@mtct/core";
import type { Prisma, PrismaClient, Subject } from "../../generated/client";

type Db = PrismaClient;
type Tx = Prisma.TransactionClient;

export class MasteryServiceError extends Error {
  constructor(
    public code: "SKILL_NOT_FOUND" | "UNKNOWN_ERROR_CODE" | "STUDENT_NOT_FOUND",
    message: string,
  ) {
    super(message);
  }
}

export interface CommitEvidenceInput {
  studentId: string;
  skillCode?: string;
  skillId?: string;
  source: EvidenceSource;
  outcome: EvidenceOutcome;
  /** 0-1 */
  score: number;
  difficulty?: number;
  hintsUsed?: number;
  tries?: number;
  errorCode?: string | null;
  /** 0-1: scales this evidence's weight (docs/07 §2.2 blanks). Default 1. */
  weightFactor?: number;
  note?: string | null;
  observedAt?: Date;
  attemptId?: string | null;
  intakeItemId?: string | null;
  createdById?: string | null;
}

const KNOWN_ERROR_CODE_TTL_MS = 60_000;
let knownErrorCodes: { at: number; codes: Set<string> } | null = null;

/** Error codes must be in content/error-taxonomy.json (seeded into ErrorCode). Cached 60 s. */
export async function isKnownErrorCode(db: Db | Tx, code: string): Promise<boolean> {
  const now = Date.now();
  if (!knownErrorCodes || now - knownErrorCodes.at > KNOWN_ERROR_CODE_TTL_MS) {
    const rows = await db.errorCode.findMany({ where: { isActive: true }, select: { code: true } });
    knownErrorCodes = { at: now, codes: new Set(rows.map((r) => r.code)) };
  }
  return knownErrorCodes.codes.has(code);
}

export function resetErrorCodeCache(): void {
  knownErrorCodes = null;
}

function toState(
  row: {
    mastery: number;
    confidence: number;
    evidenceCount: number;
    lastEvidenceAt: Date | null;
    trend14d: number;
    status: MasteryState["status"];
    nextReviewAt: Date | null;
    intervalDays: number;
    easeFactor: number;
  } | null,
  correctDayKeys: string[],
): MasteryState {
  if (!row) return emptyMasteryState();
  return {
    mastery: row.mastery,
    confidence: row.confidence,
    evidenceCount: row.evidenceCount,
    lastEvidenceAt: row.lastEvidenceAt,
    trend14d: row.trend14d,
    status: row.status,
    nextReviewAt: row.nextReviewAt,
    intervalDays: row.intervalDays,
    easeFactor: row.easeFactor,
    correctDayKeys,
  };
}

/** Distinct Vietnam-calendar days with a CORRECT (non-override) evidence for the pair. */
async function loadCorrectDayKeys(
  tx: Tx | Db,
  studentId: string,
  skillId: string,
): Promise<string[]> {
  const rows = await tx.evidence.findMany({
    where: { studentId, skillId, outcome: "CORRECT", source: { not: "PARENT_OVERRIDE" } },
    select: { observedAt: true },
    orderBy: { observedAt: "desc" },
    take: 200,
  });
  return [...new Set(rows.map((r) => dayKey(r.observedAt)))].sort();
}

async function loadTrendPoints(tx: Tx | Db, studentId: string, skillId: string, now: Date) {
  const since = new Date(now.getTime() - 15 * DAY_MS);
  const recent = await tx.masteryHistory.findMany({
    where: { studentId, skillId, at: { gte: since } },
    select: { at: true, masteryBefore: true, masteryAfter: true },
  });
  const before = await tx.masteryHistory.findFirst({
    where: { studentId, skillId, at: { lt: since } },
    orderBy: { at: "desc" },
    select: { at: true, masteryBefore: true, masteryAfter: true },
  });
  return before ? [before, ...recent] : recent;
}

/** ErrorStat windows (docs/04 sec. 11.3) recomputed from Evidence, so the job and the API agree. */
export async function refreshErrorStat(
  tx: Tx | Db,
  studentId: string,
  errorCode: string,
  now: Date = new Date(),
): Promise<{ count7d: number; count30d: number }> {
  const d7 = new Date(now.getTime() - 7 * DAY_MS);
  const d30 = new Date(now.getTime() - 30 * DAY_MS);
  const [count7d, count30d, last] = await Promise.all([
    tx.evidence.count({ where: { studentId, errorCode, observedAt: { gte: d7 } } }),
    tx.evidence.count({ where: { studentId, errorCode, observedAt: { gte: d30 } } }),
    tx.evidence.findFirst({
      where: { studentId, errorCode },
      orderBy: { observedAt: "desc" },
      select: { id: true, observedAt: true },
    }),
  ]);
  await tx.errorStat.upsert({
    where: { studentId_errorCode: { studentId, errorCode } },
    create: {
      studentId,
      errorCode,
      count7d,
      count30d,
      lastAt: last?.observedAt ?? null,
      lastEvidenceId: last?.id ?? null,
    },
    update: {
      count7d,
      count30d,
      lastAt: last?.observedAt ?? null,
      lastEvidenceId: last?.id ?? null,
    },
  });
  return { count7d, count30d };
}

export interface CommitEvidenceResult {
  evidenceId: string;
  skill: { id: string; code: string; subject: Subject };
  before: MasteryState;
  after: MasteryState;
  errorStat: { count7d: number; count30d: number } | null;
}

/**
 * Records one Evidence row and applies docs/04 sec. 3.1 to the (student, skill) SkillMastery in a
 * single transaction; writes MasteryHistory(EVIDENCE) and refreshes ErrorStat when an error code
 * is attached. Unknown error codes are rejected before anything is written.
 */
export async function commitEvidence(
  db: Db,
  input: CommitEvidenceInput,
): Promise<CommitEvidenceResult> {
  const observedAt = input.observedAt ?? new Date();
  const skill = input.skillId
    ? await db.skill.findUnique({
        where: { id: input.skillId },
        select: { id: true, code: true, subject: true },
      })
    : input.skillCode
      ? await db.skill.findUnique({
          where: { code: input.skillCode },
          select: { id: true, code: true, subject: true },
        })
      : null;
  if (!skill) throw new MasteryServiceError("SKILL_NOT_FOUND", "Không tìm thấy kỹ năng");
  const student = await db.student.findUnique({
    where: { id: input.studentId },
    select: { id: true },
  });
  if (!student) throw new MasteryServiceError("STUDENT_NOT_FOUND", "Không tìm thấy học sinh");
  const errorCode = input.errorCode?.trim() || null;
  if (errorCode && !(await isKnownErrorCode(db, errorCode))) {
    throw new MasteryServiceError("UNKNOWN_ERROR_CODE", `Mã lỗi lạ: ${errorCode}`);
  }

  return db.$transaction(async (tx) => {
    const evidence = await tx.evidence.create({
      data: {
        studentId: input.studentId,
        skillId: skill.id,
        source: input.source,
        outcome: input.outcome,
        score: Math.min(1, Math.max(0, input.score)),
        weight: SOURCE_WEIGHT[input.source] * Math.min(1, Math.max(0, input.weightFactor ?? 1)),
        difficulty: input.difficulty ?? 3,
        errorCode,
        note: input.note ?? null,
        observedAt,
        attemptId: input.attemptId ?? null,
        intakeItemId: input.intakeItemId ?? null,
        createdById: input.createdById ?? null,
      },
    });

    const row = await tx.skillMastery.findUnique({
      where: { studentId_skillId: { studentId: input.studentId, skillId: skill.id } },
    });
    const [correctDayKeys, points] = await Promise.all([
      loadCorrectDayKeys(tx, input.studentId, skill.id),
      loadTrendPoints(tx, input.studentId, skill.id, observedAt),
    ]);
    // Keys already include the evidence just inserted; the pure update handles duplicates.
    const before = toState(
      row,
      correctDayKeys.filter((k) => k !== dayKey(observedAt) || row !== null),
    );
    const beforeWithTrend = {
      ...before,
      trend14d: computeTrend14d(points, before.mastery, observedAt),
    };
    const { state } = updateMastery(beforeWithTrend, {
      source: input.source,
      score: input.score,
      difficulty: input.difficulty,
      hintsUsed: input.hintsUsed,
      tries: input.tries,
      outcome: input.outcome,
      observedAt,
      weightFactor: input.weightFactor,
    });
    const trend14d = computeTrend14d(
      [...points, { at: observedAt, masteryBefore: before.mastery, masteryAfter: state.mastery }],
      state.mastery,
      observedAt,
    );
    const after: MasteryState = { ...state, trend14d };
    // trend can flip SOLID -> NEEDS_PRACTICE (docs/04 sec. 3.3)
    if (after.status === "SOLID" && trend14d <= -8) after.status = "NEEDS_PRACTICE";

    await tx.skillMastery.upsert({
      where: { studentId_skillId: { studentId: input.studentId, skillId: skill.id } },
      create: {
        studentId: input.studentId,
        skillId: skill.id,
        mastery: after.mastery,
        confidence: after.confidence,
        evidenceCount: after.evidenceCount,
        lastEvidenceAt: after.lastEvidenceAt,
        trend14d: after.trend14d,
        status: after.status,
        nextReviewAt: after.nextReviewAt,
        intervalDays: after.intervalDays,
        easeFactor: after.easeFactor,
      },
      update: {
        mastery: after.mastery,
        confidence: after.confidence,
        evidenceCount: after.evidenceCount,
        lastEvidenceAt: after.lastEvidenceAt,
        trend14d: after.trend14d,
        status: after.status,
        nextReviewAt: after.nextReviewAt,
        intervalDays: after.intervalDays,
        easeFactor: after.easeFactor,
      },
    });
    await tx.masteryHistory.create({
      data: {
        studentId: input.studentId,
        skillId: skill.id,
        masteryBefore: before.mastery,
        masteryAfter: after.mastery,
        confidenceAfter: after.confidence,
        cause: input.source === "PARENT_OVERRIDE" ? "PARENT_OVERRIDE" : "EVIDENCE",
        evidenceId: evidence.id,
        at: observedAt,
      },
    });
    const errorStat = errorCode
      ? await refreshErrorStat(tx, input.studentId, errorCode, observedAt)
      : null;
    return { evidenceId: evidence.id, skill, before: beforeWithTrend, after, errorStat };
  });
}

export const DECAY_LAST_RUN_SETTING = "mastery.decay.lastRunAt";

export interface DecayRunResult {
  days: number;
  candidates: number;
  changed: number;
  historyRows: number;
  errorStatsRefreshed: number;
  skipped: boolean;
}

/**
 * Nightly job (docs/04 sec. 3.2): applies `days` daily decay steps (days since the previous run,
 * 1 on the first run) to every SkillMastery older than 21 days, writes MasteryHistory(DECAY) at
 * most once per 7 days per pair, then refreshes every ErrorStat window.
 */
export async function runMasteryDecay(
  db: Db,
  now: Date = new Date(),
  opts: { force?: boolean } = {},
): Promise<DecayRunResult> {
  const setting = await db.setting.findUnique({ where: { key: DECAY_LAST_RUN_SETTING } });
  const lastRunAt = (setting?.value as { at?: string } | null)?.at;
  const lastRun = lastRunAt ? new Date(lastRunAt) : null;
  const days = opts.force
    ? Math.max(1, decayDaysBetween(lastRun, now))
    : decayDaysBetween(lastRun, now);
  if (days === 0) {
    return {
      days: 0,
      candidates: 0,
      changed: 0,
      historyRows: 0,
      errorStatsRefreshed: 0,
      skipped: true,
    };
  }
  const cutoff = new Date(now.getTime() - DECAY_AFTER_DAYS * DAY_MS);
  const rows = await db.skillMastery.findMany({
    where: { evidenceCount: { gt: 0 }, lastEvidenceAt: { lt: cutoff } },
  });
  let changed = 0;
  let historyRows = 0;
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  for (const row of rows) {
    const correctDayKeys = await loadCorrectDayKeys(db, row.studentId, row.skillId);
    const state = toState(row, correctDayKeys);
    const next = applyDecay(state, now, days);
    if (next === state) continue;
    await db.skillMastery.update({
      where: { id: row.id },
      data: { mastery: next.mastery, confidence: next.confidence, status: next.status },
    });
    changed++;
    const recentDecay = await db.masteryHistory.findFirst({
      where: {
        studentId: row.studentId,
        skillId: row.skillId,
        cause: "DECAY",
        at: { gte: weekAgo },
      },
      select: { id: true },
    });
    if (!recentDecay) {
      await db.masteryHistory.create({
        data: {
          studentId: row.studentId,
          skillId: row.skillId,
          masteryBefore: state.mastery,
          masteryAfter: next.mastery,
          confidenceAfter: next.confidence,
          cause: "DECAY",
          at: now,
        },
      });
      historyRows++;
    }
  }
  const stats = await db.errorStat.findMany({ select: { studentId: true, errorCode: true } });
  for (const s of stats) await refreshErrorStat(db, s.studentId, s.errorCode, now);
  await db.setting.upsert({
    where: { key: DECAY_LAST_RUN_SETTING },
    create: { key: DECAY_LAST_RUN_SETTING, value: { at: now.toISOString(), days, changed } },
    update: { value: { at: now.toISOString(), days, changed } },
  });
  return {
    days,
    candidates: rows.length,
    changed,
    historyRows,
    errorStatsRefreshed: stats.length,
    skipped: false,
  };
}

export interface StudentMasteryItem {
  skillId: string;
  code: string;
  subject: Subject;
  strand: string;
  nameVi: string;
  nameEn: string;
  gradeLevel: string;
  expectedWeek: number | null;
  mastery: number;
  confidence: number;
  evidenceCount: number;
  lastEvidenceAt: Date | null;
  trend14d: number;
  status: MasteryState["status"];
  nextReviewAt: Date | null;
  intervalDays: number;
}

/** Every active skill (optionally one subject) with the student's mastery row or NOT_STARTED. */
export async function getStudentMastery(
  db: Db,
  studentId: string,
  opts: { subject?: Subject | null } = {},
): Promise<StudentMasteryItem[]> {
  const skills = await db.skill.findMany({
    where: { isActive: true, ...(opts.subject ? { subject: opts.subject } : {}) },
    orderBy: [{ subject: "asc" }, { strand: "asc" }, { order: "asc" }, { code: "asc" }],
    select: {
      id: true,
      code: true,
      subject: true,
      strand: true,
      nameVi: true,
      nameEn: true,
      gradeLevel: true,
      expectedWeek: true,
      masteries: { where: { studentId }, take: 1 },
    },
  });
  return skills.map((s) => {
    const m = s.masteries[0];
    return {
      skillId: s.id,
      code: s.code,
      subject: s.subject,
      strand: s.strand,
      nameVi: s.nameVi,
      nameEn: s.nameEn,
      gradeLevel: s.gradeLevel,
      expectedWeek: s.expectedWeek,
      mastery: m?.mastery ?? 0,
      confidence: m?.confidence ?? 0,
      evidenceCount: m?.evidenceCount ?? 0,
      lastEvidenceAt: m?.lastEvidenceAt ?? null,
      trend14d: m?.trend14d ?? 0,
      status: m?.status ?? "NOT_STARTED",
      nextReviewAt: m?.nextReviewAt ?? null,
      intervalDays: m?.intervalDays ?? 0,
    };
  });
}

export async function getMasteryHistory(
  db: Db,
  studentId: string,
  skillCode: string,
  opts: { limit?: number } = {},
) {
  const skill = await db.skill.findUnique({
    where: { code: skillCode },
    select: { id: true, code: true, nameVi: true, nameEn: true, subject: true },
  });
  if (!skill) throw new MasteryServiceError("SKILL_NOT_FOUND", "Không tìm thấy kỹ năng");
  const limit = Math.min(Math.max(opts.limit ?? 100, 1), 500);
  const [current, history, evidences] = await Promise.all([
    db.skillMastery.findUnique({ where: { studentId_skillId: { studentId, skillId: skill.id } } }),
    db.masteryHistory.findMany({
      where: { studentId, skillId: skill.id },
      orderBy: { at: "desc" },
      take: limit,
    }),
    db.evidence.findMany({
      where: { studentId, skillId: skill.id },
      orderBy: { observedAt: "desc" },
      take: limit,
      select: {
        id: true,
        source: true,
        outcome: true,
        score: true,
        weight: true,
        difficulty: true,
        errorCode: true,
        note: true,
        observedAt: true,
      },
    }),
  ]);
  return { skill, current, history, evidences };
}
