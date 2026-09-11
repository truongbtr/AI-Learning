import { prisma } from "@mtct/db";
import { z } from "zod";
import { handle, json, parseBody } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const schema = z.object({
  studentId: z.string().min(1),
  codes: z.array(z.string().trim().min(1).max(60)).max(20),
});

/**
 * POST /api/kid/badges — the ceremony has been played, so these badges are no longer new
 * (docs/06 §1.5: a badge gets its own moment, but only once).
 */
export const POST = handle(async (request: Request) => {
  const body = await parseBody(request, schema);
  const { student } = await requireStudentAccess(body.studentId);
  const { count } = await prisma.studentBadge.updateMany({
    where: { studentId: student.id, badgeCode: { in: body.codes }, seen: false },
    data: { seen: true },
  });
  return json({ seen: count });
});
