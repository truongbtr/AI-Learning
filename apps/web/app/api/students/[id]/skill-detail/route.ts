import { getMasteryHistory, listEvidence, MasteryServiceError, prisma } from "@mtct/db";
import { ApiError, handle, json } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";
import { skillCodeSchema } from "@/lib/mastery/schemas";

export const dynamic = "force-dynamic";

/**
 * GET /api/students/:id/skill-detail?skill=CODE — everything the P4 drawer draws in one call
 * (FR-PAR-02): where the child stands, how it got there, the evidence behind it including the
 * photos of schoolwork phase 4 brought in, and which prerequisites are holding it up.
 *
 * One request rather than three, because the drawer opens on a tap and a parent should not watch
 * three spinners land at different moments.
 */
export const GET = handle(async (request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const { student } = await requireStudentAccess(id);
  const code = skillCodeSchema.parse(new URL(request.url).searchParams.get("skill") ?? "");

  const skill = await prisma.skill.findUnique({
    where: { code },
    select: {
      code: true,
      nameVi: true,
      nameEn: true,
      subject: true,
      strand: true,
      description: true,
      expectedWeek: true,
      gradeLevel: true,
      confusableWith: true,
      prerequisites: {
        select: { prerequisite: { select: { id: true, code: true, nameVi: true } } },
      },
      exerciseSkills: {
        where: { exercise: { status: "PUBLISHED" } },
        select: { exerciseId: true },
      },
    },
  });
  if (!skill) throw new ApiError(404, "Không tìm thấy kỹ năng");

  let history: Awaited<ReturnType<typeof getMasteryHistory>>;
  try {
    history = await getMasteryHistory(prisma, student.id, code, { limit: 60 });
  } catch (err) {
    if (err instanceof MasteryServiceError) throw new ApiError(404, err.message);
    throw err;
  }

  const [evidence, prerequisiteMastery, track, week] = await Promise.all([
    listEvidence(prisma, student.id, { skillCode: code, limit: 20 }),
    prisma.skillMastery.findMany({
      where: {
        studentId: student.id,
        skillId: { in: skill.prerequisites.map((p) => p.prerequisite.id) },
      },
      select: { skillId: true, mastery: true, status: true },
    }),
    prisma.remediationTrack.findFirst({
      where: { studentId: student.id, skill: { code }, status: "ACTIVE" },
      select: { rung: true, errorCode: true, startedAt: true },
    }),
    prisma.schoolWeek.findFirst({
      where: { dateFrom: { lte: new Date() }, dateTo: { gte: new Date() } },
      select: { weekNo: true },
    }),
  ]);

  return json({
    studentId: student.id,
    skill: {
      code: skill.code,
      nameVi: skill.nameVi,
      nameEn: skill.nameEn,
      subject: skill.subject,
      strand: skill.strand,
      description: skill.description,
      expectedWeek: skill.expectedWeek,
      gradeLevel: skill.gradeLevel,
      confusableWith: skill.confusableWith,
      exerciseCount: skill.exerciseSkills.length,
    },
    currentWeek: week?.weekNo ?? null,
    current: history.current
      ? {
          mastery: Math.round(history.current.mastery * 10) / 10,
          confidence: Math.round(history.current.confidence * 100) / 100,
          evidenceCount: history.current.evidenceCount,
          status: history.current.status,
          trend14d: history.current.trend14d,
          nextReviewAt: history.current.nextReviewAt?.toISOString() ?? null,
          intervalDays: history.current.intervalDays,
        }
      : null,
    remediation: track
      ? { rung: track.rung, errorCode: track.errorCode, startedAt: track.startedAt.toISOString() }
      : null,
    prerequisites: skill.prerequisites.map((p) => {
      const m = prerequisiteMastery.find((row) => row.skillId === p.prerequisite.id);
      return {
        code: p.prerequisite.code,
        nameVi: p.prerequisite.nameVi,
        mastery: Math.round(m?.mastery ?? 0),
        status: m?.status ?? "NOT_STARTED",
      };
    }),
    history: history.history
      .map((h) => ({
        at: h.at.toISOString(),
        masteryAfter: Math.round(h.masteryAfter * 10) / 10,
        masteryBefore: Math.round(h.masteryBefore * 10) / 10,
        cause: h.cause,
      }))
      .reverse(),
    evidence: evidence.rows.map((r) => ({
      id: r.id,
      observedAt: r.observedAt.toISOString(),
      source: r.source,
      outcome: r.outcome,
      score: r.score,
      errorCode: r.errorCode,
      errorNameVi: r.errorNameVi,
      note: r.note,
      questionText: r.intake?.questionText ?? r.attempt?.promptText ?? null,
      studentAnswer: r.intake?.studentAnswer ?? null,
      blankReason: r.intake?.blankReason ?? null,
      photoKey: r.intake?.fileKey ?? r.attempt?.photoKey ?? null,
      intakeResultId: r.intake?.resultId ?? null,
    })),
    evidenceTotal: evidence.total,
  });
});
