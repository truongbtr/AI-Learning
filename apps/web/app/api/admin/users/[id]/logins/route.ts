import { prisma } from "@mtct/db";
import { ApiError, handle, json } from "@/lib/api";
import { requireRole } from "@/lib/auth/session";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/admin/users/:id/logins — last 50 LoginAudit rows (docs/12 §5 op 5). */
export const GET = handle(async (_request: Request, ctx: Ctx) => {
  await requireRole("ADMIN");
  const { id } = await ctx.params;
  const exists = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new ApiError(404, "Không tìm thấy tài khoản");
  const items = await prisma.loginAudit.findMany({
    where: { userId: id },
    orderBy: { at: "desc" },
    take: 50,
    select: { id: true, at: true, ip: true, userAgent: true, result: true, usernameTried: true },
  });
  return json({ items });
});
