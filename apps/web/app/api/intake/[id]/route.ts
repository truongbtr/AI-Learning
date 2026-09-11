import { approveIntakeResult, prisma, rejectIntakeResult } from "@mtct/db";
import { z } from "zod";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { requireRole, requireStudentAccess } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const OUTCOMES = ["CORRECT", "PARTIAL", "INCORRECT", "BLANK", "UNGRADED"] as const;

const approveSchema = z.object({
  action: z.enum(["approve", "reject"]).default("approve"),
  edits: z
    .array(
      z.object({
        id: z.string().min(1),
        outcome: z.enum(OUTCOMES).optional(),
        blankReason: z.enum(["NOT_FINISHED", "DOES_NOT_KNOW"]).nullable().optional(),
        skillCodes: z.array(z.string().regex(/^[A-Z]+\.[A-Z]+\.[A-Z0-9_]+$/)).optional(),
        errorCode: z
          .string()
          .regex(/^[a-z][a-z0-9_]{2,40}$/)
          .nullable()
          .optional(),
        note: z.string().max(300).nullable().optional(),
      }),
    )
    .default([]),
  skipIds: z.array(z.string()).default([]),
});

/**
 * POST /api/intake/<resultId> — P6, "Duyệt tất cả" (FR-INT-02).
 *
 * This is the only door from a photo to a child's mastery: nothing read off a page counts until a
 * parent has looked at it. The edits arrive with the approval, so what is saved is what the parent
 * saw, and the pairs (what was read, what the parent corrected) become the examples the next batch
 * is given (docs/07 §2.3).
 */
export const POST = handle(async (request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("PARENT", "ADMIN");
  const { id } = await ctx.params;
  const result = await prisma.intakeResult.findUnique({
    where: { id },
    select: { id: true, reviewedAt: true, job: { select: { studentId: true } } },
  });
  if (!result) throw new ApiError(404, "Không tìm thấy kết quả đọc ảnh");
  const studentId = result.job.studentId;
  if (!studentId) throw new ApiError(400, "Ảnh chưa gắn với bé nào");
  await requireStudentAccess(studentId);
  if (result.reviewedAt) return json({ alreadyReviewed: true });

  const body = await parseBody(request, approveSchema);
  if (body.action === "reject") {
    await rejectIntakeResult(prisma, { resultId: id, reviewedById: user.id });
    return json({ rejected: true });
  }
  const applied = await approveIntakeResult(prisma, {
    resultId: id,
    reviewedById: user.id,
    studentId,
    edits: body.edits,
    skipIds: body.skipIds,
  });
  return json(applied);
});
