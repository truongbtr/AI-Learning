import {
  chatBatchCards,
  diaryTonight,
  homeworkForToday,
  inboxCounts,
  prisma,
  shouldNudgeForDiary,
  studentOverview,
  visibleStudents,
} from "@mtct/db";
import { Inbox } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { ChatBatchCards } from "@/components/parent/chat-batch-card";
import { ChildCard } from "@/components/parent/child-card";
import { DiaryTonightCard } from "@/components/parent/diary-tonight-card";
import { Card, CardTitle } from "@/components/ui/card";
import { guardPage } from "@/lib/auth/session";
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

/**
 * P2 — tổng quan hai bé (docs/06 §2.1, FR-PAR-01).
 *
 * Reading order is deliberate. The class diary comes first, because it is the twenty seconds that
 * makes tonight's session and tomorrow's photo reading work (docs/08 pha 5 việc 6). Then a card
 * per child, stacked rather than in columns — docs/00 §6 forbids putting the two side by side to
 * be compared. Then everything waiting on a grown-up.
 */
export default async function ParentHomePage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const user = await guardPage("parent");
  const { denied } = await searchParams;
  const students = await visibleStudents(prisma, {
    userId: user.id,
    isAdmin: user.role === "ADMIN",
  });

  const overviews = await Promise.all(students.map((s) => studentOverview(prisma, s.id)));
  const className = students[0]?.className ?? "1B3";
  const tonight = await diaryTonight(prisma, {
    className,
    studentIds: students.map((s) => s.id),
  });

  const now = new Date();
  const nudge = shouldNudgeForDiary({
    hasDiaryToday: tonight.lessons.length > 0,
    weekday: now.getDay(),
    hour: now.getHours(),
    today: tonight.date,
  });

  const counts = await inboxCounts(
    prisma,
    user.role === "ADMIN" ? null : students.map((s) => s.id),
  );

  // What Claude chat sent in from the phone tonight, with the undo on it (docs/13 §7.3), and any
  // card an ops request left behind (docs/14 §4).
  const batches = await chatBatchCards(prisma, {
    studentIds: user.role === "ADMIN" ? null : students.map((s) => s.id),
  });
  const notices = await prisma.parentNotice.findMany({
    where: {
      dismissedAt: null,
      OR: [{ studentId: null }, { studentId: { in: students.map((s) => s.id) } }],
    },
    orderBy: { createdAt: "desc" },
    take: 4,
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
        description="Mỗi con số ở đây bấm được xuống đúng câu con đã làm, đúng ảnh bài vở."
      />
      {denied ? (
        <p
          role="alert"
          className="rounded-control border border-warning-100 bg-warning-50 px-4 py-3 text-sm font-medium text-warning-700"
        >
          Bạn chưa được gắn với bé đó. Nhờ admin gắn trong Quản lý người dùng.
        </p>
      ) : null}

      {notices.length > 0 ? (
        <div className="flex flex-col gap-2" data-testid="parent-notices">
          {notices.map((notice) => (
            <Card
              key={notice.id}
              className={
                notice.tone === "warn"
                  ? "border-warning-200 bg-warning-50"
                  : "border-brand-200 bg-brand-50/40"
              }
            >
              <CardTitle>{notice.title}</CardTitle>
              {notice.body ? <p className="mt-1 text-sm text-ink-600">{notice.body}</p> : null}
            </Card>
          ))}
        </div>
      ) : null}

      <ChatBatchCards
        cards={batches.map((b) => ({
          ...b,
          appliedAt: b.appliedAt.toISOString(),
          undoneAt: b.undoneAt?.toISOString() ?? null,
        }))}
      />

      <DiaryTonightCard
        className={className}
        nudge={nudge}
        initial={{
          ...tonight,
          confirmedAt: tonight.confirmedAt?.toISOString() ?? null,
        }}
      />

      {students.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-500">
            Chưa có con nào được gắn với tài khoản này. Nhờ admin gắn trong Quản lý người dùng.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {overviews.map((overview) =>
            overview ? <ChildCard key={overview.student.id} overview={overview} /> : null,
          )}
        </div>
      )}

      {counts.total > 0 ? (
        <Link href="/parent/inbox" className="group">
          <Card className="flex items-center gap-3 border-brand-200 bg-brand-50/40 transition-shadow group-hover:shadow-card-hover">
            <Inbox className="h-5 w-5 shrink-0 text-brand-600" aria-hidden />
            <span className="min-w-0 flex-1 text-sm text-ink-700">
              <strong className="font-bold text-ink-900">{counts.total} việc chờ ba mẹ</strong> —{" "}
              {counts.toReview} ảnh đã đọc xong chờ duyệt · {counts.inQueue} đang chờ đọc ·{" "}
              {counts.waitingToGrade} bài mở chờ chấm
            </span>
          </Card>
        </Link>
      ) : null}

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
