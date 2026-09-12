import { planTargetedSession, prisma, TargetedSessionError } from "@mtct/db";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";
import { targetedSessionSchema } from "@/lib/parent/schemas";

export const dynamic = "force-dynamic";

/**
 * POST /api/sessions/targeted — "Luyện hôm nay" from the skill drawer (FR-PAR-02).
 *
 * A grown-up decision, so a CHILD may not make it: a six-year-old must not be able to conjure a
 * session of the skill they find easiest. The child's own Daily Quest is left untouched.
 */
export const POST = handle(async (request: Request) => {
  const body = await parseBody(request, targetedSessionSchema);
  const { user, student } = await requireStudentAccess(body.studentId);
  if (user.role === "CHILD") throw new ApiError(403, "Không có quyền tạo phiên luyện riêng");

  try {
    const result = await planTargetedSession(prisma, student.id, body.skillCode, {
      withPrerequisites: body.withPrerequisites,
    });
    return json(result, { status: 201 });
  } catch (err) {
    if (err instanceof TargetedSessionError)
      throw new ApiError(err.code === "SKILL_NOT_FOUND" ? 404 : 409, err.message);
    throw err;
  }
});
