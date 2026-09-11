import { getMasteryHistory, MasteryServiceError, prisma } from "@mtct/db";
import { ApiError, handle, json } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";
import { skillCodeSchema } from "@/lib/mastery/schemas";

export const dynamic = "force-dynamic";

/**
 * GET /api/students/:id/mastery/history?skill=VMATH.SO.CONG_PV_10 — mastery curve plus the
 * evidence behind it for one skill (docs/08 pha 1 việc 3, FR-CORE-04).
 */
export const GET = handle(async (request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const { student } = await requireStudentAccess(id);
  const params = new URL(request.url).searchParams;
  const skill = skillCodeSchema.parse(params.get("skill") ?? "");
  const limit = Math.min(Math.max(Number(params.get("limit") ?? 100) || 100, 1), 500);

  try {
    const {
      skill: s,
      current,
      history,
      evidences,
    } = await getMasteryHistory(prisma, student.id, skill, {
      limit,
    });
    return json({
      studentId: student.id,
      skill: s,
      current: current
        ? {
            mastery: Math.round(current.mastery * 10) / 10,
            confidence: Math.round(current.confidence * 100) / 100,
            evidenceCount: current.evidenceCount,
            status: current.status,
            trend14d: current.trend14d,
            lastEvidenceAt: current.lastEvidenceAt?.toISOString() ?? null,
            nextReviewAt: current.nextReviewAt?.toISOString() ?? null,
            intervalDays: current.intervalDays,
          }
        : null,
      history: history.map((h) => ({
        at: h.at.toISOString(),
        masteryBefore: Math.round(h.masteryBefore * 10) / 10,
        masteryAfter: Math.round(h.masteryAfter * 10) / 10,
        confidenceAfter: Math.round(h.confidenceAfter * 100) / 100,
        cause: h.cause,
        evidenceId: h.evidenceId,
      })),
      evidences: evidences.map((e) => ({
        id: e.id,
        source: e.source,
        outcome: e.outcome,
        score: e.score,
        weight: e.weight,
        difficulty: e.difficulty,
        errorCode: e.errorCode,
        note: e.note,
        observedAt: e.observedAt.toISOString(),
      })),
    });
  } catch (err) {
    if (err instanceof MasteryServiceError) throw new ApiError(404, err.message);
    throw err;
  }
});
