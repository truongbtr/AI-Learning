import type { PrismaClient } from "../../generated/client";

/**
 * Wiping the dev learning data before the real fortnight begins (docs/08 pha 8 việc 0.3).
 *
 * Two things had to be true before Mai Thy and Chí Thanh started for real:
 *
 *   1. **The dates had to be right.** `Session.date`, `Streak.lastActiveDate` and
 *      `EggProgress.startedOn` were written with local midnight until phase 5 fixed it, so every
 *      row created before the fix sits a day early (ADR-18, the note at the end). Fifty-two of the
 *      seventy-two sessions in the dev database were affected.
 *   2. **The numbers had to be the children's own.** Those seventy-two sessions, 354 pieces of
 *      evidence and thirty-seven batches of photographs were produced by end-to-end suites, not by
 *      a child. Carrying them in would mean the first diagnostic session (docs/04 §10) starts from
 *      a mastery model built out of a robot's answers, and the parent dashboard's first week would
 *      be describing a child who does not exist.
 *
 * Shifting the dates would have fixed (1) and left (2). So this clears the learning data instead,
 * which fixes both, and the shift is not worth writing for rows that are about to be deleted.
 *
 * What it never touches: `Skill`, `Exercise`, `LessonUnit`, `ContentBatch`, `ErrorCode`,
 * `SkillPrerequisite`, the timetable, the school weeks, badges, pets, pictures, collectibles, or
 * any `User`. The bank of 1,236 exercises and the skill map are content, and content survives.
 */

/** Tables emptied, child-owned rows first so foreign keys never block. Order matters. */
export const LEARNING_TABLES = [
  "Attempt",
  "Session",
  "MasteryHistory",
  "SkillMastery",
  "Evidence",
  "ErrorStat",
  "RemediationTrack",
  "ExternalProgress",
  "IntakeItem",
  "IntakeResult",
  "IntakeJob",
  "Homework",
  "PlanItem",
  "Plan",
  "PlanHint",
  "Report",
  "StarLedger",
  "RewardGoal",
  "Streak",
  "EggProgress",
  "StudentPet",
  "StudentCollectible",
  "StudentPicturePiece",
  "StudentBadge",
  "Certificate",
  "KidMail",
  "MascotMemory",
  "Message",
  "Conversation",
  "InboxItem",
  "AiCall",
] as const;

/** Content and configuration. Named here so the CLI can prove, out loud, that it left them alone. */
export const PROTECTED_TABLES = [
  "Skill",
  "SkillPrerequisite",
  "Exercise",
  "ExerciseSkill",
  "LessonUnit",
  "LessonUnitSkill",
  "ContentBatch",
  "ErrorCode",
  "Material",
  "Timetable",
  "TimetableSlot",
  "SchoolWeek",
  "Badge",
  "Pet",
  "Collectible",
  "WeeklyPicture",
  "User",
  "Student",
] as const;

export interface TableCount {
  table: string;
  rows: number;
}

export interface ResetLearningResult {
  before: TableCount[];
  after: TableCount[];
  protectedBefore: TableCount[];
  protectedAfter: TableCount[];
  deleted: number;
  applied: boolean;
}

async function countAll(db: PrismaClient, tables: readonly string[]): Promise<TableCount[]> {
  const out: TableCount[] = [];
  for (const table of tables) {
    const rows = await db.$queryRawUnsafe<{ n: bigint }[]>(
      `SELECT count(*)::bigint AS n FROM "${table}"`,
    );
    out.push({ table, rows: Number(rows[0]?.n ?? 0) });
  }
  return out;
}

/**
 * Nothing happens unless `apply` is true. `studentSlugs` limits the wipe to named children; left
 * out, every child's learning data goes — which is what "start the fortnight clean" means.
 */
export async function resetLearningData(
  db: PrismaClient,
  opts: { apply?: boolean; studentSlugs?: string[] } = {},
): Promise<ResetLearningResult> {
  const before = await countAll(db, LEARNING_TABLES);
  const protectedBefore = await countAll(db, PROTECTED_TABLES);
  if (!opts.apply) {
    return {
      before,
      after: before,
      protectedBefore,
      protectedAfter: protectedBefore,
      deleted: 0,
      applied: false,
    };
  }

  if (opts.studentSlugs?.length) {
    const ids = (
      await db.student.findMany({
        where: { slug: { in: opts.studentSlugs } },
        select: { id: true },
      })
    ).map((s) => s.id);
    await deleteForStudents(db, ids);
  } else {
    // Every child. TRUNCATE ... CASCADE would reach past this list, so the deletes are explicit.
    for (const table of LEARNING_TABLES) await db.$executeRawUnsafe(`DELETE FROM "${table}"`);
  }

  const after = await countAll(db, LEARNING_TABLES);
  const protectedAfter = await countAll(db, PROTECTED_TABLES);
  const deleted = before.reduce((n, t) => n + t.rows, 0) - after.reduce((n, t) => n + t.rows, 0);
  return { before, after, protectedBefore, protectedAfter, deleted, applied: true };
}

/**
 * One child's learning data and nothing else — FR-ADM-03's "xoá dữ liệu 1 bé", and the piece
 * `export-student` hands back. The `Student` row and the login stay; this empties them.
 */
export async function deleteForStudents(db: PrismaClient, studentIds: string[]): Promise<void> {
  if (studentIds.length === 0) return;
  const where = { studentId: { in: studentIds } };
  await db.attempt.deleteMany({ where: { session: where } });
  await db.session.deleteMany({ where });
  await db.masteryHistory.deleteMany({ where });
  await db.skillMastery.deleteMany({ where });
  await db.evidence.deleteMany({ where });
  await db.errorStat.deleteMany({ where });
  await db.remediationTrack.deleteMany({ where });
  await db.externalProgress.deleteMany({ where });
  await db.intakeItem.deleteMany({ where: { result: { job: where } } });
  await db.intakeResult.deleteMany({ where: { job: where } });
  await db.intakeJob.deleteMany({ where });
  await db.homework.deleteMany({ where });
  await db.planItem.deleteMany({ where: { plan: where } });
  await db.plan.deleteMany({ where });
  await db.planHint.deleteMany({ where });
  await db.report.deleteMany({ where });
  await db.starLedger.deleteMany({ where });
  await db.rewardGoal.deleteMany({ where });
  await db.streak.deleteMany({ where });
  await db.eggProgress.deleteMany({ where });
  await db.studentPet.deleteMany({ where });
  await db.studentCollectible.deleteMany({ where });
  await db.studentPicturePiece.deleteMany({ where });
  await db.studentBadge.deleteMany({ where });
  await db.certificate.deleteMany({ where });
  await db.kidMail.deleteMany({ where });
  await db.mascotMemory.deleteMany({ where });
  await db.message.deleteMany({ where: { conversation: where } });
  await db.conversation.deleteMany({ where });
  await db.inboxItem.deleteMany({ where });
}
