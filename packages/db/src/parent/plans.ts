import type { PrismaClient } from "../../generated/client";

/**
 * P9 — kế hoạch (FR-PAR-03, docs/08 pha 5 việc 3).
 *
 * The queue proposes, a parent decides. A proposal sits as `PROPOSED` and changes nothing; the
 * planner only ever reads a plan a parent has approved (`activePlanSkills` below is the only door
 * into `PlannerInput.planSkills`). Approving is therefore a real decision with a real consequence,
 * which is why the reason for every skill has to be on the screen when it is made.
 */

const DAY_MS = 86_400_000;

export interface PlanView {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: string;
  rationale: string | null;
  createdBy: string;
  approvedAt: Date | null;
  approvedBy: string | null;
  items: {
    id: string;
    skillCode: string;
    skillNameVi: string;
    subject: string;
    priority: number;
    reason: string | null;
    targetMastery: number;
    sessionsPlanned: number;
    sessionsDone: number;
    /** Where the child stands right now, so a parent can sanity-check the proposal. */
    mastery: number;
    masteryStatus: string;
    exerciseCount: number;
  }[];
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

async function toView(
  db: PrismaClient,
  plan: {
    id: string;
    studentId: string;
    weekStart: Date;
    weekEnd: Date;
    status: string;
    rationale: string | null;
    createdBy: string;
    updatedAt: Date;
    approvedById: string | null;
    items: {
      id: string;
      priority: number;
      reason: string | null;
      targetMastery: number;
      sessionsPlanned: number;
      sessionsDone: number;
      skill: {
        id: string;
        code: string;
        nameVi: string;
        subject: string;
        _count: { exerciseSkills: number };
      };
    }[];
  },
): Promise<PlanView> {
  const masteries = await db.skillMastery.findMany({
    where: { studentId: plan.studentId, skillId: { in: plan.items.map((i) => i.skill.id) } },
    select: { skillId: true, mastery: true, status: true },
  });
  const approver = plan.approvedById
    ? await db.user.findUnique({
        where: { id: plan.approvedById },
        select: { displayName: true },
      })
    : null;

  return {
    id: plan.id,
    weekStart: iso(plan.weekStart),
    weekEnd: iso(plan.weekEnd),
    status: plan.status,
    rationale: plan.rationale,
    createdBy: plan.createdBy,
    approvedAt: plan.approvedById ? plan.updatedAt : null,
    approvedBy: approver?.displayName ?? null,
    items: plan.items
      .map((i) => {
        const m = masteries.find((row) => row.skillId === i.skill.id);
        return {
          id: i.id,
          skillCode: i.skill.code,
          skillNameVi: i.skill.nameVi,
          subject: i.skill.subject,
          priority: i.priority,
          reason: i.reason,
          targetMastery: i.targetMastery,
          sessionsPlanned: i.sessionsPlanned,
          sessionsDone: i.sessionsDone,
          mastery: Math.round(m?.mastery ?? 0),
          masteryStatus: m?.status ?? "NOT_STARTED",
          exerciseCount: i.skill._count.exerciseSkills,
        };
      })
      .sort((a, b) => a.priority - b.priority || a.skillCode.localeCompare(b.skillCode)),
  };
}

const PLAN_INCLUDE = {
  items: {
    include: {
      skill: {
        select: {
          id: true,
          code: true,
          nameVi: true,
          subject: true,
          _count: { select: { exerciseSkills: true } },
        },
      },
    },
  },
} as const;

/** Plans for one child, newest week first. */
export async function listPlans(
  db: PrismaClient,
  studentId: string,
  limit = 6,
): Promise<PlanView[]> {
  const plans = await db.plan.findMany({
    where: { studentId },
    orderBy: [{ weekStart: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: PLAN_INCLUDE,
  });
  return Promise.all(plans.map((p) => toView(db, p)));
}

/**
 * The skill codes the planner is allowed to weight for `date` — an **approved or active** plan
 * whose window contains that day, and nothing else. A proposal has no effect (FR-PAR-03).
 */
export async function activePlanSkills(
  db: PrismaClient,
  studentId: string,
  date: Date,
): Promise<{ planId: string; skillCodes: string[] } | null> {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const plan = await db.plan.findFirst({
    where: {
      studentId,
      status: { in: ["APPROVED", "ACTIVE"] },
      weekStart: { lte: day },
      weekEnd: { gte: day },
    },
    orderBy: [{ weekStart: "desc" }, { updatedAt: "desc" }],
    select: { id: true, items: { select: { skill: { select: { code: true } } } } },
  });
  if (!plan) return null;
  return { planId: plan.id, skillCodes: plan.items.map((i) => i.skill.code) };
}

export interface PlanEdit {
  /** Items to keep, in the order and with the priorities the parent decided. */
  items: {
    skillCode: string;
    priority: number;
    reason?: string | null;
    sessionsPlanned?: number;
    targetMastery?: number;
  }[];
  rationale?: string | null;
}

/**
 * Saves a parent's edits to a proposal. The plan stays `PROPOSED`: editing is not approving, and a
 * parent who changed three lines and closed the tab has not committed to anything.
 */
export async function editPlan(
  db: PrismaClient,
  planId: string,
  edit: PlanEdit,
): Promise<PlanView | null> {
  const plan = await db.plan.findUnique({
    where: { id: planId },
    select: { id: true, studentId: true, status: true },
  });
  if (!plan) return null;

  const skills = await db.skill.findMany({
    where: { code: { in: edit.items.map((i) => i.skillCode) } },
    select: { id: true, code: true },
  });
  const idByCode = new Map(skills.map((s) => [s.code, s.id]));
  const unknown = edit.items.filter((i) => !idByCode.has(i.skillCode));
  if (unknown.length > 0)
    throw new Error(`Không có kỹ năng: ${unknown.map((i) => i.skillCode).join(", ")}`);

  await db.$transaction([
    db.planItem.deleteMany({ where: { planId } }),
    db.planItem.createMany({
      data: edit.items.map((i) => ({
        planId,
        skillId: idByCode.get(i.skillCode) as string,
        priority: i.priority,
        reason: i.reason ?? null,
        sessionsPlanned: i.sessionsPlanned ?? 3,
        targetMastery: i.targetMastery ?? 70,
      })),
      skipDuplicates: true,
    }),
    db.plan.update({
      where: { id: planId },
      data: { ...(edit.rationale === undefined ? {} : { rationale: edit.rationale }) },
    }),
  ]);

  const fresh = await db.plan.findUnique({ where: { id: planId }, include: PLAN_INCLUDE });
  return fresh ? toView(db, fresh) : null;
}

/**
 * Approving is the moment the plan starts steering sessions. Any other approved plan for the same
 * child whose window overlaps is retired, so "which plan is in force" always has one answer.
 */
export async function approvePlan(
  db: PrismaClient,
  planId: string,
  userId: string,
): Promise<PlanView | null> {
  const plan = await db.plan.findUnique({
    where: { id: planId },
    select: { id: true, studentId: true, weekStart: true, weekEnd: true },
  });
  if (!plan) return null;

  await db.plan.updateMany({
    where: {
      studentId: plan.studentId,
      id: { not: planId },
      status: { in: ["APPROVED", "ACTIVE"] },
      weekStart: { lte: plan.weekEnd },
      weekEnd: { gte: plan.weekStart },
    },
    data: { status: "DONE" },
  });
  await db.plan.update({
    where: { id: planId },
    data: { status: "APPROVED", approvedById: userId },
  });

  const fresh = await db.plan.findUnique({ where: { id: planId }, include: PLAN_INCLUDE });
  return fresh ? toView(db, fresh) : null;
}

export async function rejectPlan(db: PrismaClient, planId: string): Promise<void> {
  await db.plan.update({ where: { id: planId }, data: { status: "REJECTED" } });
}

/**
 * A plan a parent wrote themselves, with no queue involved — the fallback FR-PAR-03 asks for when
 * nothing has been proposed and a parent already knows what they want practised.
 */
export async function createParentPlan(
  db: PrismaClient,
  studentId: string,
  input: { weekStart: Date; weeks?: 1 | 2; skillCodes: string[]; rationale?: string },
): Promise<PlanView | null> {
  const weekStart = new Date(
    Date.UTC(
      input.weekStart.getUTCFullYear(),
      input.weekStart.getUTCMonth(),
      input.weekStart.getUTCDate(),
    ),
  );
  const weekEnd = new Date(weekStart.getTime() + ((input.weeks ?? 1) * 7 - 1) * DAY_MS);
  const skills = await db.skill.findMany({
    where: { code: { in: input.skillCodes } },
    select: { id: true, code: true },
  });
  const plan = await db.plan.create({
    data: {
      studentId,
      weekStart,
      weekEnd,
      status: "PROPOSED",
      createdBy: "PARENT",
      rationale: input.rationale ?? "Ba mẹ tự chọn trọng tâm cho tuần này.",
      items: {
        create: skills.map((s, i) => ({
          skillId: s.id,
          priority: Math.min(5, i + 1),
          reason: "ba mẹ chọn",
        })),
      },
    },
    include: PLAN_INCLUDE,
  });
  return toView(db, plan);
}
