import { planDailyQuest, prisma, sessionForKid } from "@mtct/db";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";
import { planSessionSchema } from "@/lib/kid/schemas";

export const dynamic = "force-dynamic";

/**
 * POST /api/sessions — today's Daily Quest for one child (docs/08 pha 3 việc 4).
 *
 * Idempotent: the worker usually plans the day at 04:00, and this endpoint returns that same
 * session. Only if there is none — a new child, a machine that was off — does it plan one now, so
 * a six-year-old opening the app never waits on a cron job. `force` re-plans and is for a parent
 * or admin only: a child cannot reshuffle a session to dodge an exercise.
 */
export const POST = handle(async (request: Request) => {
  const body = await parseBody(request, planSessionSchema);
  const { user, student } = await requireStudentAccess(body.studentId);
  if (body.force && user.role === "CHILD") throw new ApiError(403, "Không có quyền lên lại phiên");

  const quest = await planDailyQuest(prisma, student.id, body.date ?? new Date(), {
    force: body.force,
  });
  const session = await sessionForKid(prisma, quest.sessionId, { studentId: student.id });
  if (!session) throw new ApiError(500, "Không dựng được phiên học");

  return json(
    {
      ...session,
      created: quest.created,
      /** For the parent dashboard; the kid screens ignore it. */
      why: quest.plan.log,
      remediating: quest.plan.remediating,
    },
    { status: quest.created ? 201 : 200 },
  );
});

/** GET /api/sessions?studentId=… — the child's sessions, newest first (parent dashboard). */
export const GET = handle(async (request: Request) => {
  const studentId = new URL(request.url).searchParams.get("studentId");
  if (!studentId) throw new ApiError(400, "Thiếu studentId");
  const { student } = await requireStudentAccess(studentId);

  const rows = await prisma.session.findMany({
    where: { studentId: student.id },
    orderBy: { date: "desc" },
    take: 30,
    select: {
      id: true,
      kind: true,
      date: true,
      status: true,
      starsEarned: true,
      durationSec: true,
      summary: true,
      _count: { select: { attempts: true } },
    },
  });

  return json({
    studentId: student.id,
    sessions: rows.map((s) => ({
      id: s.id,
      kind: s.kind,
      date: s.date.toISOString().slice(0, 10),
      status: s.status,
      starsEarned: s.starsEarned,
      durationSec: s.durationSec,
      attempts: s._count.attempts,
      summary: s.summary,
    })),
  });
});
