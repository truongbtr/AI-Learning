import { prisma, studentOverview } from "@mtct/db";
import {
  CalendarClock,
  Camera,
  Flame,
  ListChecks,
  Map as MapIcon,
  Settings2,
  Star,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { ActivityStrip } from "@/components/parent/activity-strip";
import { AttentionList } from "@/components/parent/attention-list";
import { SubjectCards } from "@/components/parent/subject-cards";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { guardPage, requireStudentAccess } from "@/lib/auth/session";
import { SendMailCard } from "./send-mail-card";

export const dynamic = "force-dynamic";

/**
 * P3 — hồ sơ bé (docs/06 §2.1, FR-PAR-01): a card per subject, the fortnight's direction, seven
 * days of activity, and the three things worth five minutes tonight.
 *
 * Every figure on this page is a link into `/parent/<bé>/evidence`, filtered the way the figure
 * was counted. That is the whole contract of this phase: no number without a page behind it.
 */
export default async function StudentPage({ params }: { params: Promise<{ studentId: string }> }) {
  await guardPage("parent");
  const { studentId } = await params;
  try {
    await requireStudentAccess(studentId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    if (err instanceof ApiError && err.status === 403) redirect("/parent?denied=1");
    throw err;
  }

  const overview = await studentOverview(prisma, studentId);
  if (!overview) notFound();
  const { student, today, streak, attention, subjects, activity7d, totals, currentWeek } = overview;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Tổng quan", "Các con", student.nickname]}
        title={student.nickname}
        description={
          currentWeek
            ? `Lớp ${student.className} · tuần ${currentWeek} của năm học`
            : `Lớp ${student.className}`
        }
        actions={
          <>
            <Link href={`/parent/${studentId}/skills`}>
              <Button variant="outline">
                <MapIcon className="h-4 w-4" /> Bản đồ năng lực
              </Button>
            </Link>
            <Link href={`/parent/${studentId}/plan`}>
              <Button variant="outline">
                <ListChecks className="h-4 w-4" /> Kế hoạch
              </Button>
            </Link>
            <Link href={`/parent/${studentId}/settings`}>
              <Button variant="ghost" aria-label="Cài đặt của bé">
                <Settings2 className="h-4 w-4" /> Cài đặt
              </Button>
            </Link>
          </>
        }
      />

      {/* Four numbers, four links. */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatLink
          href={`/parent/${studentId}/evidence?days=1`}
          icon={<CalendarClock className="h-4 w-4" />}
          label="Hôm nay"
          value={today ? `${today.done}/${today.total} bài` : "chưa có phiên"}
          caption={today ? `${today.minutes} phút · ${today.starsEarned} sao` : undefined}
          testId="stat-today"
        />
        <StatLink
          href={`/parent/${studentId}/evidence?days=30`}
          icon={<Flame className="h-4 w-4" />}
          label="Đã học"
          value={`${streak.current} ngày`}
          caption={`dài nhất ${streak.longest} ngày`}
          testId="stat-streak"
        />
        <StatLink
          href={`/parent/${studentId}/evidence?days=7`}
          icon={<Star className="h-4 w-4" />}
          label="Bằng chứng 7 ngày"
          value={String(totals.evidence7d)}
          caption={`tổng ${totals.evidence} từ trước tới nay`}
          testId="stat-evidence7d"
        />
        <StatLink
          href={`/parent/${studentId}/evidence?source=INTAKE_PHOTO`}
          icon={<Camera className="h-4 w-4" />}
          label="Từ ảnh bài vở"
          value={String(totals.photos)}
          caption="bấm để xem lại từng ảnh"
          testId="stat-photos"
        />
      </div>

      <Card className="flex flex-col gap-3">
        <div>
          <CardTitle>3 điều cần chú ý</CardTitle>
          <CardDescription>
            Tính bằng quy tắc từ chính bằng chứng của con (docs/04 §11.5) — không phải AI viết. Bấm
            vào một dòng để xem đúng những câu đó.
          </CardDescription>
        </div>
        <AttentionList studentId={studentId} points={attention} />
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Hoạt động 7 ngày</CardTitle>
            <CardDescription>
              Cột xanh đậm là ngày có ảnh bài vở. Bấm một cột để xem bằng chứng ngày đó.
            </CardDescription>
          </div>
          <Link
            href={`/parent/${studentId}/evidence`}
            className="text-sm font-semibold text-brand-700 hover:underline"
          >
            Xem tất cả bằng chứng
          </Link>
        </div>
        <ActivityStrip studentId={studentId} days={activity7d} />
      </Card>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-bold text-ink-900">Các môn</h2>
          <p className="mt-0.5 text-sm text-ink-400">
            Sáu bản đồ kỹ năng của docs/05 §1 — năm môn cốt lõi, với ESL và phần đọc–viết tiếng Anh
            tách riêng vì hai bản đồ kỹ năng khác nhau.
          </p>
        </div>
        <SubjectCards studentId={studentId} subjects={subjects} />
      </section>

      <SendMailCard studentId={studentId} nickname={student.nickname} />
    </div>
  );
}

function StatLink({
  href,
  icon,
  label,
  value,
  caption,
  testId,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  caption?: string;
  testId: string;
}) {
  return (
    <Link href={href} className="group" data-testid={testId}>
      <article className="flex items-center gap-3 rounded-card border border-ink-100 bg-white p-4 shadow-card transition-colors group-hover:border-brand-300">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-600">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ink-500">{label}</p>
          <p className="mt-0.5 truncate text-lg font-bold text-ink-900">{value}</p>
          {caption ? <p className="mt-0.5 truncate text-xs text-ink-400">{caption}</p> : null}
        </div>
      </article>
    </Link>
  );
}
