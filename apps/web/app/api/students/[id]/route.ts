import { prisma } from "@mtct/db";
import { handle, json } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";

/** GET /api/students/:id — profile without birth date/full name for CHILD callers (docs/00 §5). */
export const GET = handle(async (_request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const { user } = await requireStudentAccess(id);
  const s = await prisma.student.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      slug: true,
      nickname: true,
      fullName: true,
      avatarKey: true,
      birthDate: true,
      grade: true,
      className: true,
      schoolYear: true,
      interests: true,
      mascot: true,
      settings: true,
    },
  });
  const { fullName, birthDate, ...safe } = s;
  return json(user.role === "CHILD" ? safe : { ...safe, fullName, birthDate });
});
