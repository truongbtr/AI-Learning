import { Prisma, prisma } from "@mtct/db";
import { patchUserSchema } from "@/lib/admin/schemas";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { requireRole } from "@/lib/auth/session";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/users/:id — enable/disable, profile, role (adults), linked children. */
export const PATCH = handle(async (request: Request, ctx: Ctx) => {
  const admin = await requireRole("ADMIN");
  const { id } = await ctx.params;
  const input = await parseBody(request, patchUserSchema);
  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!target) throw new ApiError(404, "Không tìm thấy tài khoản");

  if (input.isActive === false && target.id === admin.id) {
    throw new ApiError(400, "Không thể tự tắt tài khoản đang dùng");
  }
  if (input.role && target.role === "CHILD")
    throw new ApiError(400, "Không đổi vai trò của tài khoản con");
  if (input.role && target.id === admin.id && input.role !== "ADMIN") {
    throw new ApiError(400, "Không thể tự hạ quyền admin");
  }
  if (input.guardianStudentIds && target.role === "CHILD") {
    throw new ApiError(400, "Chỉ gắn con cho phụ huynh/admin");
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
          ...(input.email !== undefined ? { email: input.email } : {}),
          ...(input.avatarKey !== undefined ? { avatarKey: input.avatarKey } : {}),
          ...(input.role !== undefined ? { role: input.role } : {}),
        },
      });
      if (input.guardianStudentIds) {
        const students = await tx.student.findMany({
          where: { id: { in: input.guardianStudentIds } },
          select: { id: true },
        });
        const keep = students.map((s) => s.id);
        await tx.studentGuardian.deleteMany({ where: { userId: id, studentId: { notIn: keep } } });
        for (const studentId of keep) {
          await tx.studentGuardian.upsert({
            where: { userId_studentId: { userId: id, studentId } },
            create: { userId: id, studentId, relation: target.role === "ADMIN" ? "ba" : "me" },
            update: {},
          });
        }
      }
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ApiError(409, "Email đã tồn tại");
    }
    throw err;
  }
  await prisma.auditLog.create({
    data: { userId: admin.id, action: "USER_UPDATED", target: id, detail: input as object },
  });
  return json({ ok: true });
});
