import { prisma, sessionForKid, startSession } from "@mtct/db";
import { ApiError, handle, json } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/sessions/:id — the session as the child's device is allowed to see it (ADR-14): specs
 * without answer keys, plus which stations are already done so a session interrupted by a flat
 * battery carries on where it stopped.
 *
 * `?start=1` also marks the session started — one round trip instead of two on a slow connection.
 */
export const GET = handle(async (request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const row = await prisma.session.findUnique({ where: { id }, select: { studentId: true } });
  if (!row) throw new ApiError(404, "Không tìm thấy phiên học");
  const { student } = await requireStudentAccess(row.studentId);

  if (new URL(request.url).searchParams.get("start") === "1") await startSession(prisma, id);
  const session = await sessionForKid(prisma, id, { studentId: student.id });
  if (!session) throw new ApiError(404, "Không tìm thấy phiên học");
  return json(session);
});
