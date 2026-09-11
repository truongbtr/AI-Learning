import { openMail, prisma } from "@mtct/db";
import { ApiError, handle, json } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * POST /api/kid/mail/:id — the child opens a letter (FR-PAR-08). The gift that came with it, if
 * there was one, lands in the collection; the parent's view then shows "đã mở".
 */
export const POST = handle(async (_request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const mail = await prisma.kidMail.findUnique({ where: { id }, select: { studentId: true } });
  if (!mail) throw new ApiError(404, "Không tìm thấy thư");
  const { student } = await requireStudentAccess(mail.studentId);
  const opened = await openMail(prisma, student.id, id);
  if (!opened) throw new ApiError(404, "Không tìm thấy thư");
  return json(opened);
});
