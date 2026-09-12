import { listEvidence, prisma } from "@mtct/db";
import { handle, json } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";
import { evidenceQueryFrom } from "@/lib/parent/schemas";

export const dynamic = "force-dynamic";

const DAY_MS = 86_400_000;

/**
 * GET /api/students/:id/evidence — the drill-down behind every number on the parent dashboard
 * (docs/08 pha 5, tiêu chí 1). Same filters as the page: subject, skill, mistake, source, window.
 *
 * Authorization is the database's answer, not the caller's: PARENT only sees a linked child.
 */
export const GET = handle(async (request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const { student } = await requireStudentAccess(id);
  const q = evidenceQueryFrom(new URL(request.url).searchParams);

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const from = q.days ? new Date(today.getTime() - (q.days - 1) * DAY_MS) : null;
  if (from) from.setHours(0, 0, 0, 0);

  const page = await listEvidence(prisma, student.id, {
    subject: q.subject ?? null,
    skillCode: q.skill ?? null,
    errorCode: q.error ?? null,
    source: q.source ?? null,
    outcome: q.outcome ?? null,
    from,
    to: q.days ? today : null,
    limit: q.limit ?? 50,
    cursor: q.cursor ?? null,
  });

  return json({
    studentId: student.id,
    total: page.total,
    nextCursor: page.nextCursor,
    rows: page.rows.map((r) => ({
      ...r,
      observedAt: r.observedAt.toISOString(),
      attempt: r.attempt
        ? { ...r.attempt, sessionDate: r.attempt.sessionDate.toISOString().slice(0, 10) }
        : null,
    })),
  });
});
