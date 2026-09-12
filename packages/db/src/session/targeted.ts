import { difficultyFor, type Slot, vnDayDate } from "@mtct/core";
import type { Prisma, PrismaClient } from "../../generated/client";
import { type PickedSlot, pickExercises } from "./plan";

/**
 * "Luyện hôm nay" — the button in the skill drawer on P4 (FR-PAR-02, docs/08 pha 5 việc 2).
 *
 * A parent looking at one weak skill wants one thing: practise *this*, now. So this builds a
 * session containing that skill and nothing else — except the prerequisites the child is not yet
 * standing on. docs/04 §2 is explicit that a skill whose prerequisite is below 60 should not be
 * drilled on its own; six questions on blends when the letters are not secure is six wasted
 * questions and one discouraged child.
 *
 * It is a separate `Session` of kind `TARGETED`, never a change to the Daily Quest: today's quest
 * is already planned and a child halfway through it must not have the ground move.
 */

/** Below this a prerequisite is worth practising first (docs/04 §2, §4 step 3). */
export const PREREQUISITE_FLOOR = 60;
/** Short by design — this is an extra, not a second session. */
export const TARGETED_MAX_SLOTS = 8;

export interface TargetedSessionResult {
  sessionId: string;
  created: boolean;
  slots: PickedSlot[];
  /** Codes in the session: the skill asked for, then any prerequisite that came with it. */
  skillCodes: string[];
  /** Prerequisites pulled in, with the mastery that justified each. */
  prerequisites: { code: string; nameVi: string; mastery: number }[];
  /** Slots the exercise bank could not fill, if any. */
  missing: string[];
}

export class TargetedSessionError extends Error {
  constructor(
    public code: "SKILL_NOT_FOUND" | "NO_EXERCISES",
    message: string,
  ) {
    super(message);
  }
}

export async function planTargetedSession(
  db: PrismaClient,
  studentId: string,
  skillCode: string,
  opts: { withPrerequisites?: boolean; date?: Date } = {},
): Promise<TargetedSessionResult> {
  const withPrerequisites = opts.withPrerequisites ?? true;
  const date = opts.date ?? new Date();
  const day = vnDayDate(date);

  const skill = await db.skill.findUnique({
    where: { code: skillCode },
    select: {
      id: true,
      code: true,
      nameVi: true,
      subject: true,
      prerequisites: {
        select: {
          prerequisite: { select: { id: true, code: true, nameVi: true, subject: true } },
        },
      },
    },
  });
  if (!skill) throw new TargetedSessionError("SKILL_NOT_FOUND", "Không tìm thấy kỹ năng");

  const ids = [skill.id, ...skill.prerequisites.map((p) => p.prerequisite.id)];
  const masteries = await db.skillMastery.findMany({
    where: { studentId, skillId: { in: ids } },
    select: { skillId: true, mastery: true },
  });
  const masteryOf = (id: string) => masteries.find((m) => m.skillId === id)?.mastery ?? 0;

  const shaky = withPrerequisites
    ? skill.prerequisites
        .map((p) => p.prerequisite)
        .filter((p) => masteryOf(p.id) < PREREQUISITE_FLOOR)
        .sort((a, b) => masteryOf(a.id) - masteryOf(b.id))
        // Two at most: a session that starts three skills below the one the parent tapped stops
        // being "practise this" and becomes a different lesson.
        .slice(0, 2)
    : [];

  const mainMastery = masteryOf(skill.id);
  const slots: Slot[] = [];

  // Prerequisites go first and gently: they are the ground the target stands on.
  shaky.forEach((p) => {
    for (let i = 0; i < 2; i++)
      slots.push({
        order: slots.length + 1,
        kind: "focus",
        skillCode: p.code,
        subject: p.subject,
        difficulty: Math.max(1, difficultyFor(masteryOf(p.id)) - 1),
        reason: `tiên quyết của ${skill.nameVi} (${Math.round(masteryOf(p.id))}/100)`,
      });
  });

  const mainCount = Math.max(4, TARGETED_MAX_SLOTS - slots.length);
  for (let i = 0; i < mainCount; i++)
    slots.push({
      order: slots.length + 1,
      kind: "focus",
      skillCode: skill.code,
      subject: skill.subject,
      // Rising within one step, so the last question is the one worth getting right.
      difficulty: difficultyFor(mainMastery, 0, i >= mainCount - 2 ? 1 : 0),
      reason: `ba mẹ chọn luyện hôm nay: ${skill.nameVi}`,
    });

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { mascot: true },
  });
  const picked = await pickExercises(db, slots, {
    theme: student?.mascot === "OWL" ? "GARDEN" : "ROBOT",
  });
  if (picked.every((p) => !p.exerciseId))
    throw new TargetedSessionError(
      "NO_EXERCISES",
      `Ngân hàng chưa có bài nào cho ${skill.nameVi} — chạy pnpm content:stats để xem kỹ năng nào còn thiếu`,
    );

  const session = await db.session.create({
    data: {
      studentId,
      kind: "TARGETED",
      date: day,
      status: "PLANNED",
      slots: picked as unknown as Prisma.InputJsonValue,
      generationLog: {
        log: [
          `ba mẹ bấm "Luyện hôm nay" cho ${skill.code}`,
          ...shaky.map((p) => `kèm tiên quyết ${p.code} (${Math.round(masteryOf(p.id))}/100)`),
        ],
        targetSkill: skill.code,
        prerequisites: shaky.map((p) => p.code),
        plannedAt: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    },
  });

  return {
    sessionId: session.id,
    created: true,
    slots: picked,
    skillCodes: [...new Set(picked.map((p) => p.skillCode))],
    prerequisites: shaky.map((p) => ({
      code: p.code,
      nameVi: p.nameVi,
      mastery: Math.round(masteryOf(p.id)),
    })),
    missing: picked.map((p) => p.missing).filter((m): m is string => Boolean(m)),
  };
}
