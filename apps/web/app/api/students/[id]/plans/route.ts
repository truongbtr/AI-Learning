import {
  approvePlan,
  createParentPlan,
  editPlan,
  listPlans,
  prisma,
  rejectPlan,
  requestPlanProposal,
} from "@mtct/db";
import { z } from "zod";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";
import { skillCodeSchema } from "@/lib/mastery/schemas";

export const dynamic = "force-dynamic";

const actionSchema = z.discriminatedUnion("action", [
  /** Queue a PLAN task for Claude Code (docs/13). The app never calls a model itself (ADR-10). */
  z.object({
    action: z.literal("request"),
    weeks: z.union([z.literal(1), z.literal(2)]).optional(),
  }),
  z.object({
    action: z.literal("edit"),
    planId: z.string().min(1),
    rationale: z.string().trim().max(1200).nullish(),
    items: z
      .array(
        z.object({
          skillCode: skillCodeSchema,
          priority: z.number().int().min(1).max(5),
          reason: z.string().trim().max(300).nullish(),
          sessionsPlanned: z.number().int().min(1).max(14).optional(),
          targetMastery: z.number().min(0).max(100).optional(),
        }),
      )
      .min(1)
      .max(12),
  }),
  z.object({ action: z.literal("approve"), planId: z.string().min(1) }),
  z.object({ action: z.literal("reject"), planId: z.string().min(1) }),
  z.object({
    action: z.literal("create"),
    weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    weeks: z.union([z.literal(1), z.literal(2)]).optional(),
    skillCodes: z.array(skillCodeSchema).min(1).max(12),
    rationale: z.string().trim().max(1200).optional(),
  }),
]);

/** GET /api/students/:id/plans — the last few weeks of plans (P9, FR-PAR-03). */
export const GET = handle(async (_request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const { student } = await requireStudentAccess(id);
  return json({ studentId: student.id, plans: await listPlans(prisma, student.id) });
});

/**
 * POST /api/students/:id/plans — request, edit, approve or reject (P9, FR-PAR-03).
 *
 * Approving is the only action with a consequence for the child: it is what lets the planner
 * weight the plan's skills. A CHILD may do none of it.
 */
export const POST = handle(async (request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const { user, student } = await requireStudentAccess(id);
  if (user.role === "CHILD") throw new ApiError(403, "Không có quyền");
  const body = await parseBody(request, actionSchema);

  switch (body.action) {
    case "request": {
      const queued = await requestPlanProposal(prisma, student.id, { weeks: body.weeks });
      return json({ ...queued, hint: "Chạy: pnpm inbox:pull → Claude Code → pnpm inbox:push" });
    }
    case "edit": {
      const plan = await editPlan(prisma, body.planId, {
        items: body.items,
        rationale: body.rationale ?? undefined,
      });
      if (!plan) throw new ApiError(404, "Không tìm thấy kế hoạch");
      return json({ plan });
    }
    case "approve": {
      const plan = await approvePlan(prisma, body.planId, user.id);
      if (!plan) throw new ApiError(404, "Không tìm thấy kế hoạch");
      return json({ plan });
    }
    case "reject": {
      await rejectPlan(prisma, body.planId);
      return json({ ok: true });
    }
    case "create": {
      const plan = await createParentPlan(prisma, student.id, {
        weekStart: new Date(`${body.weekStart}T00:00:00Z`),
        weeks: body.weeks,
        skillCodes: body.skillCodes,
        rationale: body.rationale,
      });
      return json({ plan }, { status: 201 });
    }
  }
});
