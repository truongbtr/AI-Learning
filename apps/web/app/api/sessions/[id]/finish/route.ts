import { finishSession, prisma, SessionError } from "@mtct/db";
import { ApiError, handle, json } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * POST /api/sessions/:id/finish — closes the quest: the day's stars, the streak, a step on every
 * remediation ladder the session drilled, and the summary the celebration screen reads out.
 *
 * A child who stops early may call this too — stopping is allowed and keeps the streak
 * (docs/06 §1.8c item 4). Calling it twice does not hand out the bonus twice.
 */
export const POST = handle(async (_request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const row = await prisma.session.findUnique({ where: { id }, select: { studentId: true } });
  if (!row) throw new ApiError(404, "Không tìm thấy phiên học");
  const { student } = await requireStudentAccess(row.studentId);

  try {
    return json(await finishSession(prisma, id, { studentId: student.id }));
  } catch (err) {
    if (err instanceof SessionError) throw new ApiError(404, err.message);
    throw err;
  }
});
