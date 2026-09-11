import { homeworkForToday, prisma } from "@mtct/db";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { guardPage } from "@/lib/auth/session";
import { avatarEmoji } from "@/lib/avatars";
import { HomeworkCard, type HomeworkRow } from "./homework-card";
import { QuickNoteCard } from "./quick-note-card";

export const dynamic = "force-dynamic";

const REMINDER_LABEL: Record<string, string> = {
  UNIFORM: "Đồng phục",
  BRING: "Mang theo",
  EVENT: "Sự kiện",
  SCHEDULE: "Lịch học",
  OTHER: "Nhắc nhở",
};

/** P2 placeholder (phase 5). Lists only active children linked through StudentGuardian. */
export default async function ParentHomePage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const user = await guardPage("parent");
  const { denied } = await searchParams;
  const students = await prisma.student.findMany({
    where: {
      user: { isActive: true },
      ...(user.role === "ADMIN" ? {} : { guardians: { some: { userId: user.id } } }),
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, nickname: true, avatarKey: true, className: true, mascot: true },
  });

  // What the teacher set, and the non-school notes that only a grown-up should see (docs/11 §6.2).
  const homework: HomeworkRow[] = [];
  for (const student of students) {
    for (const h of await homeworkForToday(prisma, student.id)) {
      homework.push({
        id: h.id,
        nickname: student.nickname,
        text: h.text,
        taskType: h.taskType,
        status: h.status,
        progress: h.progress,
        repeatCount: h.repeatCount,
        optional: h.optional,
        submitTo: h.submitTo,
        artifactKey: h.artifactKey,
        inApp: h.inApp,
      });
    }
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reminders = await prisma.classReminder.findMany({
    where: {
      forDate: { gte: new Date(today.getTime() - 86_400_000) },
      diary: { className: { in: students.map((s) => s.className) } },
    },
    orderBy: { forDate: "asc" },
    take: 6,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Tổng quan", "Các con"]}
        title="Các con"
        description="Chọn một bé để xem hồ sơ năng lực, xu hướng và những điều cần chú ý (pha 5)."
      />
      {denied ? (
        <p
          role="alert"
          className="rounded-control border border-warning-100 bg-warning-50 px-4 py-3 text-sm font-medium text-warning-700"
        >
          Bạn chưa được gắn với bé đó. Nhờ admin gắn trong Quản lý người dùng.
        </p>
      ) : null}
      {students.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-500">
            Chưa có con nào được gắn với tài khoản này. Nhờ admin gắn trong Quản lý người dùng.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {students.map((s) => (
            <Link key={s.id} href={`/parent/${s.id}`} className="group">
              <Card className="flex items-center gap-4 transition-shadow group-hover:shadow-card-hover">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-3xl">
                  {avatarEmoji(s.avatarKey)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold text-ink-900">
                    {s.nickname}
                  </span>
                  <span className="block text-sm text-ink-400">
                    Lớp {s.className} · mascot {s.mascot === "OWL" ? "Cú" : "Rô-bốt"}
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 text-ink-300 transition-transform group-hover:translate-x-0.5" />
              </Card>
            </Link>
          ))}
        </div>
      )}

      <HomeworkCard rows={homework} />
      {reminders.length > 0 ? (
        <Card className="flex flex-col gap-2 border-warning-200 bg-warning-50">
          <CardTitle>Cô nhắc</CardTitle>
          <ul className="flex flex-col gap-1 text-sm text-warning-800" data-testid="reminders">
            {reminders.map((r) => (
              <li key={r.id}>
                <strong>{REMINDER_LABEL[r.kind] ?? "Nhắc"}:</strong> {r.text}
                {r.forDate ? (
                  <span className="text-warning-600">
                    {" "}
                    ({r.forDate.toISOString().slice(0, 10)})
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="text-xs text-warning-700">
            Những lời nhắc này không hiện cho con — chỉ ba mẹ thấy (docs/11 §6.2).
          </p>
        </Card>
      ) : null}
      <QuickNoteCard students={students.map((s) => ({ id: s.id, nickname: s.nickname }))} />
    </div>
  );
}
