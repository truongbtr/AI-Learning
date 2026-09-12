import type {
  EvidenceOutcome,
  EvidenceSource,
  Prisma,
  PrismaClient,
  Subject,
} from "../../generated/client";

/**
 * The place every number on the parent dashboard lands (docs/08 pha 5, tiêu chí 1).
 *
 * There is exactly one of these, deliberately. A dashboard where each tile opens its own bespoke
 * drill-down grows six half-finished drill-downs; a dashboard where every tile is a link to the
 * same filtered list of `Evidence` grows one that gets better. The filters are the same words the
 * tiles are labelled with: this subject, this skill, this mistake, this source, these seven days.
 *
 * A row ends at the thing that actually happened — the exercise the child answered, or the
 * question read off a photo, with the photo's key so the page can show it.
 */

export interface EvidenceFilter {
  subject?: Subject | null;
  skillCode?: string | null;
  errorCode?: string | null;
  source?: EvidenceSource | null;
  outcome?: EvidenceOutcome | null;
  /** Inclusive, calendar days. */
  from?: Date | null;
  to?: Date | null;
  limit?: number;
  cursor?: string | null;
}

export interface EvidenceRow {
  id: string;
  observedAt: Date;
  source: EvidenceSource;
  outcome: EvidenceOutcome;
  score: number;
  weight: number;
  difficulty: number;
  errorCode: string | null;
  errorNameVi: string | null;
  note: string | null;
  skill: { code: string; nameVi: string; subject: Subject; strand: string };
  /** Set when this came from an exercise in a session. */
  attempt: {
    id: string;
    sessionId: string;
    sessionDate: Date;
    order: number;
    exerciseType: string;
    promptText: string;
    hintsUsed: number;
    tries: number;
    photoKey: string | null;
    audioKey: string | null;
  } | null;
  /** Set when this came from a photo of schoolwork (phase 4). */
  intake: {
    itemId: string;
    resultId: string;
    index: number;
    questionText: string;
    studentAnswer: string | null;
    expectedAnswer: string | null;
    blankReason: string | null;
    docType: string;
    /** The picture the question was read off, if the file is still on disk. */
    fileKey: string | null;
    bbox: { x: number; y: number; w: number; h: number } | null;
  } | null;
}

export interface EvidencePage {
  rows: EvidenceRow[];
  total: number;
  /** Pass back as `cursor` for the next page. */
  nextCursor: string | null;
}

function whereFor(studentId: string, f: EvidenceFilter): Prisma.EvidenceWhereInput {
  return {
    studentId,
    ...(f.skillCode ? { skill: { code: f.skillCode } } : {}),
    ...(f.subject && !f.skillCode ? { skill: { subject: f.subject } } : {}),
    ...(f.errorCode ? { errorCode: f.errorCode } : {}),
    ...(f.source ? { source: f.source } : {}),
    ...(f.outcome ? { outcome: f.outcome } : {}),
    ...(f.from || f.to
      ? {
          observedAt: {
            ...(f.from ? { gte: f.from } : {}),
            ...(f.to ? { lte: f.to } : {}),
          },
        }
      : {}),
  };
}

/** The `files` column of an intake job: `[{ key, ... }]` written by the upload route. */
function fileKeyAt(files: unknown, index: number): string | null {
  if (!Array.isArray(files)) return null;
  const entry = files[index] ?? files[0];
  if (typeof entry === "string") return entry;
  if (entry && typeof entry === "object" && typeof (entry as { key?: string }).key === "string")
    return (entry as { key: string }).key;
  return null;
}

export async function listEvidence(
  db: PrismaClient,
  studentId: string,
  filter: EvidenceFilter = {},
): Promise<EvidencePage> {
  const limit = Math.min(Math.max(filter.limit ?? 50, 1), 200);
  const where = whereFor(studentId, filter);

  const [total, rows] = await Promise.all([
    db.evidence.count({ where }),
    db.evidence.findMany({
      where,
      orderBy: [{ observedAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(filter.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        observedAt: true,
        source: true,
        outcome: true,
        score: true,
        weight: true,
        difficulty: true,
        errorCode: true,
        note: true,
        skill: { select: { code: true, nameVi: true, subject: true, strand: true } },
        attempt: {
          select: {
            id: true,
            order: true,
            hintsUsed: true,
            tries: true,
            photoKey: true,
            audioKey: true,
            session: { select: { id: true, date: true } },
            exercise: { select: { type: true, spec: true } },
          },
        },
        intakeItem: {
          select: {
            id: true,
            index: true,
            questionText: true,
            studentAnswer: true,
            expectedAnswer: true,
            blankReason: true,
            bbox: true,
            fileIndex: true,
            result: {
              select: { id: true, docType: true, job: { select: { files: true } } },
            },
          },
        },
      },
    }),
  ]);

  const more = rows.length > limit;
  const page = more ? rows.slice(0, limit) : rows;

  const codes = [...new Set(page.map((r) => r.errorCode).filter((c): c is string => Boolean(c)))];
  const errorNames = new Map(
    (
      await db.errorCode.findMany({
        where: { code: { in: codes } },
        select: { code: true, nameVi: true },
      })
    ).map((c) => [c.code, c.nameVi]),
  );

  return {
    total,
    nextCursor: more ? (page.at(-1)?.id ?? null) : null,
    rows: page.map((r) => {
      const spec = (r.attempt?.exercise.spec ?? {}) as { prompt?: { text?: string } };
      const bbox = r.intakeItem?.bbox as EvidenceRow["intake"] extends null
        ? never
        : { x: number; y: number; w: number; h: number } | null;
      return {
        id: r.id,
        observedAt: r.observedAt,
        source: r.source,
        outcome: r.outcome,
        score: r.score,
        weight: r.weight,
        difficulty: r.difficulty,
        errorCode: r.errorCode,
        errorNameVi: r.errorCode ? (errorNames.get(r.errorCode) ?? null) : null,
        note: r.note,
        skill: r.skill,
        attempt: r.attempt
          ? {
              id: r.attempt.id,
              sessionId: r.attempt.session.id,
              sessionDate: r.attempt.session.date,
              order: r.attempt.order,
              exerciseType: r.attempt.exercise.type,
              promptText: spec.prompt?.text ?? "",
              hintsUsed: r.attempt.hintsUsed,
              tries: r.attempt.tries,
              photoKey: r.attempt.photoKey,
              audioKey: r.attempt.audioKey,
            }
          : null,
        intake: r.intakeItem
          ? {
              itemId: r.intakeItem.id,
              resultId: r.intakeItem.result.id,
              index: r.intakeItem.index,
              questionText: r.intakeItem.questionText,
              studentAnswer: r.intakeItem.studentAnswer,
              expectedAnswer: r.intakeItem.expectedAnswer,
              blankReason: r.intakeItem.blankReason,
              docType: r.intakeItem.result.docType,
              fileKey: fileKeyAt(r.intakeItem.result.job.files, r.intakeItem.fileIndex),
              bbox: bbox ?? null,
            }
          : null,
      };
    }),
  };
}

/** Counts by source over a window — the caption under "bằng chứng" on the profile. */
export async function evidenceBySource(
  db: PrismaClient,
  studentId: string,
  since?: Date,
): Promise<{ source: EvidenceSource; count: number }[]> {
  const rows = await db.evidence.groupBy({
    by: ["source"],
    where: { studentId, ...(since ? { observedAt: { gte: since } } : {}) },
    _count: { _all: true },
  });
  return rows
    .map((r) => ({ source: r.source, count: r._count._all }))
    .sort((a, b) => b.count - a.count);
}
