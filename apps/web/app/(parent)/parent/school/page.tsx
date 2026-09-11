import { prisma, proposeSchoolYearStart } from "@mtct/db";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { guardPage } from "@/lib/auth/session";
import { SchoolYearCard } from "./school-year-card";

export const dynamic = "force-dynamic";

/**
 * P12 — thời khoá biểu & năm học (docs/06 §2.1).
 * Phase 4 only builds the half docs/11 §5 needs: re-dating the school year from the class diary.
 * Editing the timetable itself is phase 5.
 */
export default async function SchoolPage() {
  await guardPage("parent");
  const proposal = await proposeSchoolYearStart(prisma);
  const weeks = await prisma.schoolWeek.findMany({ orderBy: { weekNo: "asc" }, take: 8 });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Hệ thống", "Năm học"]}
        title="Thời khoá biểu & năm học"
        description="Lịch 35 tuần là thước đo “đúng tiến độ hay chậm” của mọi kỹ năng."
      />
      <SchoolYearCard proposal={proposal} />
      <Card className="flex flex-col gap-2">
        <div>
          <CardTitle>8 tuần đầu</CardTitle>
          <CardDescription>Sửa thời khoá biểu và ngày nghỉ: pha 5.</CardDescription>
        </div>
        <ul className="text-sm text-ink-700">
          {weeks.map((w) => (
            <li key={w.id}>
              Tuần {w.weekNo}: {w.dateFrom.toISOString().slice(0, 10)} →{" "}
              {w.dateTo.toISOString().slice(0, 10)} (học kỳ {w.term})
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
