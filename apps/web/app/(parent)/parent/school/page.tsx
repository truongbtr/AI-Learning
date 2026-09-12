import { getTimetable, listSchoolWeeks, prisma, proposeSchoolYearStart } from "@mtct/db";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { guardPage } from "@/lib/auth/session";
import { SchoolYearCard } from "./school-year-card";
import { TimetableEditor } from "./timetable-editor";
import { WeeksEditor } from "./weeks-editor";

export const dynamic = "force-dynamic";

/**
 * P12 — thời khoá biểu & năm học (docs/06 §2.1, FR-PAR-06).
 *
 * Three things, in the order they matter: when the year really started (every `expectedWeek` is
 * measured against it), which core subject each period is (the planner weights tonight by it), and
 * which weeks are holidays (so nobody is "behind" because of Tết).
 */
export default async function SchoolPage() {
  const user = await guardPage("parent");
  const student = await prisma.student.findFirst({
    where: {
      user: { isActive: true },
      ...(user.role === "ADMIN" ? {} : { guardians: { some: { userId: user.id } } }),
    },
    orderBy: { createdAt: "asc" },
    select: { className: true },
  });
  const className = student?.className ?? "1B3";

  const [proposal, timetable, weeks] = await Promise.all([
    proposeSchoolYearStart(prisma),
    getTimetable(prisma, className),
    listSchoolWeeks(prisma),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Hệ thống", "Năm học"]}
        title="Thời khoá biểu & năm học"
        description="Lịch 35 tuần là thước đo “đúng tiến độ hay chậm” của mọi kỹ năng; thời khoá biểu quyết định môn ưu tiên của phiên học tối nay."
      />
      <SchoolYearCard proposal={proposal} />
      {timetable ? (
        <TimetableEditor initial={timetable} />
      ) : (
        <Card>
          <p className="text-sm text-ink-500">
            Chưa có thời khoá biểu cho lớp {className}. Chạy <code>pnpm db:seed</code> để nạp bảng
            của lớp 1B3 từ <code>content/timetable/1B3-2026.json</code>.
          </p>
        </Card>
      )}
      <WeeksEditor initial={weeks} />
    </div>
  );
}
