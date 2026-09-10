import { handle, json } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";

/**
 * GET /api/students/:id/mastery — authorization is real (docs/02 §6), data arrives in phase 1.
 * CHILD of another student → 403; PARENT not linked → 403; guest → 401 (proxy).
 */
export const GET = handle(async (_request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const { student } = await requireStudentAccess(id);
  return json({
    studentId: student.id,
    nickname: student.nickname,
    items: [],
    note: "mastery arrives in phase 1",
  });
});
