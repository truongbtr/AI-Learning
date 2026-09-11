import { prisma, SessionError, submitAttempt } from "@mtct/db";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";
import { submitAttemptSchema } from "@/lib/kid/schemas";

export const dynamic = "force-dynamic";

/**
 * POST /api/sessions/:id/attempts — one answer (docs/08 pha 3 việc 4).
 *
 * The marking happens here, on the server, because the answer key never left it (ADR-14). What
 * comes back is what a six-year-old may see: yes, or a hint, or — on the third try — the answer
 * with its explanation. A wrong choice is turned into an `Evidence.errorCode` through the
 * exercise's own `choices[].errorTag` / `dragItems[].errorTag`, which is how tomorrow's session
 * knows what to drill.
 *
 * Safe to call twice with the same `token`: the second call returns the first answer and writes
 * nothing, so a dropped connection costs the child neither a star nor a try.
 */
export const POST = handle(async (request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const row = await prisma.session.findUnique({ where: { id }, select: { studentId: true } });
  if (!row) throw new ApiError(404, "Không tìm thấy phiên học");
  const { student } = await requireStudentAccess(row.studentId);
  const body = await parseBody(request, submitAttemptSchema);

  try {
    const feedback = await submitAttempt(prisma, {
      sessionId: id,
      studentId: student.id,
      order: body.order,
      response: body.response,
      timeMs: body.timeMs,
      hintsUsed: body.hintsUsed,
      token: body.token,
    });
    return json(feedback, { status: 201 });
  } catch (err) {
    if (err instanceof SessionError) throw new ApiError(404, err.message);
    throw err;
  }
});
