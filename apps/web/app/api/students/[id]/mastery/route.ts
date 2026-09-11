import { getStudentMastery, prisma } from "@mtct/db";
import { handle, json } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";
import { subjectSchema } from "@/lib/mastery/schemas";

export const dynamic = "force-dynamic";

/**
 * GET /api/students/:id/mastery[?subject=VMATH] — mastery of every active skill for one child
 * (docs/08 pha 1 việc 3). Authorization is checked against the database, never the client:
 * CHILD only itself, PARENT only linked children, ADMIN everything.
 */
export const GET = handle(async (request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const { student } = await requireStudentAccess(id);
  const raw = new URL(request.url).searchParams.get("subject");
  const subject = raw ? subjectSchema.parse(raw) : null;

  const items = await getStudentMastery(prisma, student.id, { subject });
  const bySubject: Record<
    string,
    { total: number; byStatus: Record<string, number>; avgMastery: number }
  > = {};
  for (const item of items) {
    bySubject[item.subject] ??= { total: 0, byStatus: {}, avgMastery: 0 };
    const s = bySubject[item.subject]!;
    s.total++;
    s.byStatus[item.status] = (s.byStatus[item.status] ?? 0) + 1;
    s.avgMastery += item.mastery;
  }
  for (const s of Object.values(bySubject)) {
    s.avgMastery = s.total ? Math.round((s.avgMastery / s.total) * 10) / 10 : 0;
  }

  return json({
    studentId: student.id,
    nickname: student.nickname,
    subject,
    count: items.length,
    summary: bySubject,
    items: items.map((i) => ({
      skillId: i.skillId,
      code: i.code,
      subject: i.subject,
      strand: i.strand,
      nameVi: i.nameVi,
      nameEn: i.nameEn,
      gradeLevel: i.gradeLevel,
      expectedWeek: i.expectedWeek,
      mastery: Math.round(i.mastery * 10) / 10,
      confidence: Math.round(i.confidence * 100) / 100,
      evidenceCount: i.evidenceCount,
      trend14d: i.trend14d,
      status: i.status,
      lastEvidenceAt: i.lastEvidenceAt?.toISOString() ?? null,
      nextReviewAt: i.nextReviewAt?.toISOString() ?? null,
      intervalDays: i.intervalDays,
    })),
  });
});
