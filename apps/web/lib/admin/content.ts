import { bankCoverage, prisma, type Subject } from "@mtct/db";

/** Server queries behind /admin/content (FR-ADM-05). ADMIN-only routes call these. */

export interface BatchRow {
  id: string;
  kind: string;
  sourceDir: string;
  fileCount: number;
  created: number;
  updated: number;
  retired: number;
  runBy: string;
  note: string | null;
  at: string;
  /** Live counts of the exercises still attached to this batch. */
  draft: number;
  published: number;
  bad: number;
}

export async function listBatches(limit = 30): Promise<BatchRow[]> {
  const batches = await prisma.contentBatch.findMany({ orderBy: { at: "desc" }, take: limit });
  if (batches.length === 0) return [];
  const counts = await prisma.exercise.groupBy({
    by: ["batchId", "status"],
    where: { batchId: { in: batches.map((b) => b.id) } },
    _count: { _all: true },
  });
  const bad = await prisma.exercise.groupBy({
    by: ["batchId"],
    where: { batchId: { in: batches.map((b) => b.id) }, qualityFlag: "BAD" },
    _count: { _all: true },
  });
  const find = (id: string, status: string) =>
    counts.find((c) => c.batchId === id && c.status === status)?._count._all ?? 0;
  return batches.map((b) => ({
    id: b.id,
    kind: b.kind,
    sourceDir: b.sourceDir,
    fileCount: b.fileCount,
    created: b.created,
    updated: b.updated,
    retired: b.retired,
    runBy: b.runBy,
    note: b.note,
    at: b.at.toISOString(),
    draft: find(b.id, "DRAFT"),
    published: find(b.id, "PUBLISHED"),
    bad: bad.find((x) => x.batchId === b.id)?._count._all ?? 0,
  }));
}

export interface ExerciseRow {
  stableId: string;
  type: string;
  subject: Subject;
  language: string;
  difficulty: number;
  status: string;
  qualityFlag: string;
  assetTheme: string;
  targetsError: string | null;
  scaffold: string;
  sourceRef: string | null;
  skillCodes: string[];
  /** ExerciseSpec — safe for the child; the adult reviewer also gets `answer` below. */
  spec: unknown;
  /** Reviewers must see the answer to judge the exercise; children never get this. */
  answer: unknown;
  explanation: string | null;
}

export interface ExerciseQuery {
  batchId?: string | null;
  skillCode?: string | null;
  status?: "DRAFT" | "PUBLISHED" | "RETIRED" | null;
  type?: string | null;
  flag?: "OK" | "GOOD" | "BAD" | "UNREVIEWED" | null;
  limit?: number;
}

export async function listExercises(q: ExerciseQuery = {}): Promise<ExerciseRow[]> {
  const rows = await prisma.exercise.findMany({
    where: {
      ...(q.batchId ? { batchId: q.batchId } : {}),
      ...(q.status ? { status: q.status } : {}),
      ...(q.type ? { type: q.type as "MCQ" } : {}),
      ...(q.flag ? { qualityFlag: q.flag } : {}),
      ...(q.skillCode ? { skills: { some: { skill: { code: q.skillCode } } } } : {}),
    },
    orderBy: [{ difficulty: "asc" }, { stableId: "asc" }],
    take: Math.min(Math.max(q.limit ?? 200, 1), 1000),
    select: {
      stableId: true,
      type: true,
      subject: true,
      language: true,
      difficulty: true,
      status: true,
      qualityFlag: true,
      assetTheme: true,
      targetsError: true,
      sourceRef: true,
      spec: true,
      answerKey: true,
      explanation: true,
      skills: { select: { weight: true, skill: { select: { code: true } } } },
    },
  });
  return rows.map((r) => ({
    stableId: r.stableId,
    type: r.type,
    subject: r.subject,
    language: r.language,
    difficulty: r.difficulty,
    status: r.status,
    qualityFlag: r.qualityFlag,
    assetTheme: r.assetTheme,
    targetsError: r.targetsError,
    scaffold: ((r.spec ?? {}) as { scaffold?: string }).scaffold ?? "none",
    sourceRef: r.sourceRef,
    skillCodes: r.skills.sort((a, b) => b.weight - a.weight).map((s) => s.skill.code),
    spec: r.spec,
    answer: r.answerKey,
    explanation: r.explanation,
  }));
}

/** The coverage table of FR-ADM-05: how many published exercises each skill has. */
export async function contentCoverage(subject?: Subject | null) {
  return bankCoverage(prisma, { subject: subject ?? undefined });
}
