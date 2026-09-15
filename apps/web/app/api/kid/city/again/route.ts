import { planCitySession, prisma } from "@mtct/db";
import { handle, json, parseBody } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";
import { cityAgainSchema } from "@/lib/kid/city-schemas";

export const dynamic = "force-dynamic";

/**
 * POST /api/kid/city/again — "Chơi thêm" after a finished city session (Pha 10 bổ sung §4): a fresh
 * session of the same subject, planned by the same planner. While one is still open it is returned
 * as it is, so tapping twice never stacks sessions.
 */
export const POST = handle(async (request: Request) => {
  const body = await parseBody(request, cityAgainSchema);
  const { student } = await requireStudentAccess(body.studentId);
  const plan = await planCitySession(prisma, student.id, body.city, new Date(), { again: true });
  return json(
    { sessionId: plan.sessionId, created: plan.created },
    { status: plan.created ? 201 : 200 },
  );
});
