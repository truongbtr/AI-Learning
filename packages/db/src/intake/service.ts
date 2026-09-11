import type { IntakeFileRef } from "@mtct/core";
import { INTAKE_DUPLICATE_WINDOW_DAYS, looksLikeSamePhoto } from "@mtct/core";
import type { DocType, Prisma, PrismaClient, Subject } from "../../generated/client";

/**
 * The intake pipeline, database side (docs/07 §2, FR-INT-01/02).
 *
 * A photo of schoolwork travels: POST /api/intake stores it and makes an `IntakeJob(QUEUED)` →
 * the worker straightens and shrinks it and puts an `InboxItem(PHOTO_INTAKE)` in the queue →
 * Claude Code writes `result.json` and `inbox:push` makes an `IntakeResult(PENDING_REVIEW)` →
 * a parent approves it in P6 and only then does anything become `Evidence`.
 *
 * Nothing in this file calls an AI (ADR-10), and nothing here writes `Evidence` on its own.
 */

type Db = PrismaClient;

export interface CreateIntakeJobInput {
  studentId: string | null;
  createdById: string;
  subjectHint?: Subject | null;
  docTypeHint?: DocType | null;
  dateHint?: Date | null;
  files: IntakeFileRef[];
  /** Free text the parent typed with the photos ("vở Tiếng Việt hôm nay"). */
  note?: string | null;
}

export async function createIntakeJob(
  db: Db,
  input: CreateIntakeJobInput,
): Promise<{ id: string; files: number }> {
  const job = await db.intakeJob.create({
    data: {
      studentId: input.studentId,
      createdById: input.createdById,
      kind: "PHOTO_BATCH",
      status: "QUEUED",
      subjectHint: input.subjectHint ?? null,
      docTypeHint: input.docTypeHint ?? null,
      dateHint: input.dateHint ?? null,
      note: input.note?.trim() || null,
      files: input.files as unknown as Prisma.InputJsonValue,
    },
  });
  return { id: job.id, files: input.files.length };
}

export function filesOf(job: { files: unknown }): IntakeFileRef[] {
  return Array.isArray(job.files) ? (job.files as IntakeFileRef[]) : [];
}

/**
 * Photos uploaded in the last week that look like this one (docs/07 §2.2).
 * A warning only — a parent may well want the same page twice, a week apart.
 */
export async function findDuplicates(
  db: Db,
  studentId: string | null,
  hash: string,
  opts: { exceptJobId?: string; at?: Date } = {},
): Promise<{ jobId: string; key: string; at: Date }[]> {
  const since = new Date(
    (opts.at ?? new Date()).getTime() - INTAKE_DUPLICATE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );
  const jobs = await db.intakeJob.findMany({
    where: {
      createdAt: { gte: since },
      ...(studentId ? { studentId } : {}),
      ...(opts.exceptJobId ? { id: { not: opts.exceptJobId } } : {}),
    },
    select: { id: true, files: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const out: { jobId: string; key: string; at: Date }[] = [];
  for (const job of jobs) {
    for (const file of filesOf(job)) {
      if (file.pHash && looksLikeSamePhoto(file.pHash, hash)) {
        out.push({ jobId: job.id, key: file.key, at: job.createdAt });
      }
    }
  }
  return out;
}

/** Everything waiting for a grown-up, for the P7 badge (docs/06 §2.1). */
export async function inboxCounts(
  db: Db,
  studentIds: string[] | null,
): Promise<{ toReview: number; inQueue: number; waitingToGrade: number; total: number }> {
  const scope = studentIds ? { in: studentIds } : undefined;
  const [toReview, inQueue, waitingToGrade] = await Promise.all([
    db.intakeResult.count({
      where: {
        reviewedAt: null,
        job: { ...(scope ? { studentId: scope } : {}), status: { in: ["PENDING_REVIEW"] } },
      },
    }),
    db.inboxItem.count({
      where: { status: { in: ["PENDING", "PULLED"] }, ...(scope ? { studentId: scope } : {}) },
    }),
    db.attempt.count({
      where: {
        gradedBy: "PENDING",
        ...(scope ? { session: { studentId: scope } } : {}),
      },
    }),
  ]);
  return { toReview, inQueue, waitingToGrade, total: toReview + inQueue + waitingToGrade };
}
