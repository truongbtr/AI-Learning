import type { PrismaClient } from "../../generated/client";
import { recomputeSkillMastery } from "../mastery/recompute";
import { refreshErrorStat } from "../mastery/service";

/**
 * "Hoàn tác lô này" — the one tap that makes applying straight away safe (docs/13 §7.3).
 *
 * Order matters. The evidence goes first, then the mastery is rebuilt from what is left
 * (`recomputeSkillMastery`), then the error counters, then the page is taken off the review list.
 * If the process died halfway the worst case is a mastery that is one recompute behind its
 * evidence, which the next piece of evidence for that skill fixes — never a mastery standing on
 * evidence that no longer exists.
 *
 * Idempotent: a second tap on a slow phone returns the first result and changes nothing.
 */

type Db = PrismaClient;

export interface UndoChatBatchResult {
  batchId: string;
  alreadyUndone: boolean;
  evidenceRemoved: number;
  skillsRecomputed: number;
  mastery: { skillCode: string; before: number; after: number }[];
}

export async function undoChatBatch(
  db: Db,
  batchId: string,
  opts: { byUserId?: string | null; at?: Date } = {},
): Promise<UndoChatBatchResult> {
  const at = opts.at ?? new Date();
  const batch = await db.chatBatch.findUnique({ where: { id: batchId } });
  if (!batch) throw new Error("Không tìm thấy lô này");
  if (batch.undoneAt)
    return {
      batchId,
      alreadyUndone: true,
      evidenceRemoved: 0,
      skillsRecomputed: 0,
      mastery: [],
    };

  const evidences = await db.evidence.findMany({
    where: { chatBatchId: batchId },
    select: {
      id: true,
      studentId: true,
      skillId: true,
      errorCode: true,
      skill: { select: { code: true } },
    },
  });
  const pairs = new Map<string, { studentId: string; skillId: string; skillCode: string }>();
  const errorPairs = new Map<string, { studentId: string; errorCode: string }>();
  for (const e of evidences) {
    pairs.set(`${e.studentId}:${e.skillId}`, {
      studentId: e.studentId,
      skillId: e.skillId,
      skillCode: e.skill.code,
    });
    if (e.errorCode)
      errorPairs.set(`${e.studentId}:${e.errorCode}`, {
        studentId: e.studentId,
        errorCode: e.errorCode,
      });
  }
  const before = new Map<string, number>();
  for (const { studentId, skillId, skillCode } of pairs.values()) {
    const row = await db.skillMastery.findUnique({
      where: { studentId_skillId: { studentId, skillId } },
      select: { mastery: true },
    });
    before.set(skillCode, row?.mastery ?? 0);
  }

  const ids = evidences.map((e) => e.id);
  if (ids.length > 0) {
    // The history lines this batch wrote go with it; the RECALC line below records the undo.
    await db.masteryHistory.deleteMany({ where: { evidenceId: { in: ids } } });
    await db.evidence.deleteMany({ where: { id: { in: ids } } });
  }

  const mastery: UndoChatBatchResult["mastery"] = [];
  for (const { studentId, skillId, skillCode } of pairs.values()) {
    const result = await recomputeSkillMastery(db, studentId, skillId, at);
    mastery.push({
      skillCode,
      before: before.get(skillCode) ?? 0,
      after: result.masteryAfter,
    });
  }
  for (const { studentId, errorCode } of errorPairs.values())
    await refreshErrorStat(db, studentId, errorCode, at);

  if (batch.intakeResultId) {
    const items = await db.intakeItem.findMany({
      where: { resultId: batch.intakeResultId },
      select: { id: true },
    });
    if (items.length > 0)
      await db.intakeItem.updateMany({
        where: { id: { in: items.map((i) => i.id) } },
        data: { evidenceIds: [] },
      });
    const result = await db.intakeResult.findUnique({
      where: { id: batch.intakeResultId },
      select: { jobId: true },
    });
    // A parent who undid the reading has judged it: the page leaves the review list rather than
    // reappearing as work to do. Re-sending the photos reads them again.
    await db.intakeResult.update({
      where: { id: batch.intakeResultId },
      data: { reviewedAt: at, reviewedById: opts.byUserId ?? null },
    });
    if (result)
      await db.intakeJob.update({ where: { id: result.jobId }, data: { status: "REJECTED" } });
  }

  await db.chatBatch.update({
    where: { id: batchId },
    data: {
      status: "UNDONE",
      undoneAt: at,
      undoneById: opts.byUserId ?? null,
      evidenceCount: 0,
    },
  });

  return {
    batchId,
    alreadyUndone: false,
    evidenceRemoved: ids.length,
    skillsRecomputed: pairs.size,
    mastery,
  };
}
