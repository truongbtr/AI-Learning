import {
  currentSchoolWeek,
  getStudentMastery,
  prisma,
  SUBJECT_LABEL,
  SUBJECT_ORDER,
} from "@mtct/db";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { PrintButton } from "@/components/parent/print-button";
import { type HeatmapSkill, SkillHeatmap, StatusLegend } from "@/components/parent/skill-heatmap";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { guardPage, requireStudentAccess } from "@/lib/auth/session";
import { subjectSchema } from "@/lib/mastery/schemas";

export const dynamic = "force-dynamic";

/**
 * P4 — bản đồ năng lực (FR-PAR-02, docs/08 pha 5 việc 2).
 *
 * Every skill in the map, grouped by subject and strand, in teaching order, coloured by status; a
 * tap opens the drawer with the history, the evidence and the "Luyện hôm nay" button. The whole
 * page prints as a PDF from the browser's own dialog — see `PrintButton` for why that is the
 * right amount of machinery for a family server.
 */
export default async function SkillsPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ subject?: string; status?: string }>;
}) {
  await guardPage("parent");
  const { studentId } = await params;
  let nickname = "";
  try {
    nickname = (await requireStudentAccess(studentId)).student.nickname;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    if (err instanceof ApiError && err.status === 403) redirect("/parent?denied=1");
    throw err;
  }

  const { subject: rawSubject, status: rawStatus } = await searchParams;
  const subject = rawSubject ? subjectSchema.safeParse(rawSubject).data : undefined;
  const status = rawStatus ?? undefined;

  const [items, currentWeek] = await Promise.all([
    getStudentMastery(prisma, studentId, { subject: subject ?? null }),
    currentSchoolWeek(prisma, new Date()),
  ]);
  const filtered = status ? items.filter((i) => i.status === status) : items;

  const counts: Record<string, number> = {};
  for (const item of items) counts[item.status] = (counts[item.status] ?? 0) + 1;

  // Grouped the way the curriculum is written: subject, then strand, then teaching order.
  const groups = new Map<
    string,
    { subject: string; subjectLabel: string; strand: string; skills: HeatmapSkill[] }
  >();
  for (const item of filtered) {
    const key = `${item.subject}::${item.strand}`;
    const group = groups.get(key) ?? {
      subject: item.subject,
      subjectLabel: SUBJECT_LABEL[item.subject],
      strand: item.strand,
      skills: [],
    };
    group.skills.push({
      code: item.code,
      nameVi: item.nameVi,
      strand: item.strand,
      subject: item.subject,
      mastery: item.mastery,
      status: item.status,
      evidenceCount: item.evidenceCount,
      expectedWeek: item.expectedWeek,
      trend14d: item.trend14d,
    });
    groups.set(key, group);
  }
  const strands = [...groups.values()].sort(
    (a, b) =>
      SUBJECT_ORDER.indexOf(a.subject as never) - SUBJECT_ORDER.indexOf(b.subject as never) ||
      a.strand.localeCompare(b.strand),
  );

  const behind = items.filter(
    (i) =>
      currentWeek != null &&
      i.expectedWeek != null &&
      i.expectedWeek <= currentWeek &&
      i.evidenceCount === 0,
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Tổng quan", "Các con", nickname, "Bản đồ năng lực"]}
        title="Bản đồ năng lực"
        description={
          currentWeek
            ? `Tuần ${currentWeek} của năm học. Ô viền xanh: lớp đã học mà ${nickname} chưa có bằng chứng nào.`
            : "Chưa đặt lịch năm học nên chưa so được với lộ trình mong đợi."
        }
        actions={<PrintButton label="Xuất PDF" />}
      />

      <Card className="flex flex-col gap-3 print:border-0 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>
              {subject ? SUBJECT_LABEL[subject] : "Cả sáu môn"}
              {status ? ` · lọc theo trạng thái` : ""}
            </CardTitle>
            <CardDescription>
              {filtered.length} kỹ năng
              {behind > 0 ? ` · ${behind} kỹ năng lớp đã học mà chưa có bằng chứng` : ""}
            </CardDescription>
          </div>
          <StatusLegend counts={counts} />
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-ink-500">Không có kỹ năng nào khớp bộ lọc.</p>
        ) : (
          <SkillHeatmap
            studentId={studentId}
            nickname={nickname}
            strands={strands}
            currentWeek={currentWeek}
          />
        )}
      </Card>
    </div>
  );
}
