import { prisma, useMemory } from "@mtct/db";
import { ApiError, handle, json } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * POST /api/kid/memory/:id — the mascot has now said this line, so it is not said again
 * (docs/06 §1.8c item 7).
 */
export const POST = handle(async (_request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const row = await prisma.mascotMemory.findUnique({
    where: { id },
    select: { studentId: true },
  });
  if (!row) throw new ApiError(404, "Không tìm thấy ký ức");
  const { student } = await requireStudentAccess(row.studentId);
  await useMemory(prisma, student.id, id);
  return json({ ok: true });
});
