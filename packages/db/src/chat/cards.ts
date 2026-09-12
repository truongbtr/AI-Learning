import type { ChatBatchStatus, PrismaClient } from "../../generated/client";

/**
 * The card a parent sees on the dashboard every evening (docs/13 §7.3).
 *
 * It answers three questions in one glance — what was read, what it changed, what it was unsure
 * about — and carries the undo. A batch that applied without moving any mastery still shows: "we
 * read your photos and they told us nothing new" is information, and silence would look like a
 * broken upload.
 */

type Db = PrismaClient;

export interface ChatBatchCard {
  id: string;
  kind: "INTAKE" | "DIARY";
  status: ChatBatchStatus;
  nickname: string | null;
  studentId: string | null;
  /** Vietnam calendar day of the work. */
  date: string | null;
  appliedAt: Date;
  summary: string;
  photoCount: number;
  itemCount: number;
  evidenceCount: number;
  heldCount: number;
  heldReasons: string[];
  confidence: number;
  /** Only when there is evidence to take back out. */
  canUndo: boolean;
  undoneAt: Date | null;
  /** The review page for the items that were held, when there are any. */
  reviewHref: string | null;
  /** Skills that moved, biggest change first. */
  moved: { skillCode: string; nameVi: string; before: number; after: number }[];
}

export interface ChatBatchCardOptions {
  /** null = every child (ADMIN). */
  studentIds: string[] | null;
  /** How far back to look; the dashboard asks for two days. */
  since?: Date;
  limit?: number;
}

export async function chatBatchCards(db: Db, opts: ChatBatchCardOptions): Promise<ChatBatchCard[]> {
  const since = opts.since ?? new Date(Date.now() - 2 * 86_400_000);
  const batches = await db.chatBatch.findMany({
    where: {
      appliedAt: { gte: since },
      ...(opts.studentIds ? { studentId: { in: opts.studentIds } } : {}),
    },
    orderBy: { appliedAt: "desc" },
    take: opts.limit ?? 8,
    include: { student: { select: { nickname: true } } },
  });
  if (batches.length === 0) return [];

  const cards: ChatBatchCard[] = [];
  for (const batch of batches) {
    const snapshot = (Array.isArray(batch.masterySnapshot) ? batch.masterySnapshot : []) as {
      skillId?: string;
      skillCode?: string;
      mastery?: number;
    }[];
    const evidences =
      batch.evidenceCount > 0
        ? await db.evidence.findMany({
            where: { chatBatchId: batch.id },
            select: { skillId: true, skill: { select: { code: true, nameVi: true } } },
          })
        : [];
    const skillIds = [...new Set(evidences.map((e) => e.skillId))];
    const now =
      skillIds.length > 0
        ? await db.skillMastery.findMany({
            where: { studentId: batch.studentId ?? "", skillId: { in: skillIds } },
            select: { skillId: true, mastery: true },
          })
        : [];
    const masteryNow = new Map(now.map((m) => [m.skillId, m.mastery]));
    const nameById = new Map(evidences.map((e) => [e.skillId, e.skill]));
    const moved = skillIds
      .map((id) => {
        const skill = nameById.get(id);
        const before = snapshot.find((s) => s.skillId === id)?.mastery ?? 0;
        return {
          skillCode: skill?.code ?? id,
          nameVi: skill?.nameVi ?? "",
          before,
          after: masteryNow.get(id) ?? before,
        };
      })
      .sort((a, b) => Math.abs(b.after - b.before) - Math.abs(a.after - a.before))
      .slice(0, 6);

    cards.push({
      id: batch.id,
      kind: batch.kind,
      status: batch.status,
      nickname: batch.student?.nickname ?? null,
      studentId: batch.studentId,
      date: batch.date ? batch.date.toISOString().slice(0, 10) : null,
      appliedAt: batch.appliedAt,
      summary: batch.summary,
      photoCount: batch.photoCount,
      itemCount: batch.itemCount,
      evidenceCount: batch.evidenceCount,
      heldCount: batch.heldCount,
      heldReasons: batch.heldReasons,
      confidence: batch.confidence,
      canUndo: batch.status !== "UNDONE" && batch.evidenceCount > 0,
      undoneAt: batch.undoneAt,
      reviewHref:
        batch.heldCount > 0 && batch.status !== "UNDONE" && batch.intakeResultId
          ? `/parent/intake/${batch.intakeResultId}`
          : null,
      moved,
    });
  }
  return cards;
}

/** Is this batch one of the children this adult is allowed to see? Checked in the database. */
export async function chatBatchBelongsTo(
  db: Db,
  batchId: string,
  studentIds: string[] | null,
): Promise<boolean> {
  const batch = await db.chatBatch.findUnique({
    where: { id: batchId },
    select: { studentId: true },
  });
  if (!batch) return false;
  if (studentIds === null) return true;
  return batch.studentId !== null && studentIds.includes(batch.studentId);
}
