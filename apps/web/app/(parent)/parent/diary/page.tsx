import { currentLessons, lessonChoices, prisma } from "@mtct/db";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { guardPage } from "@/lib/auth/session";
import { DiaryForm } from "./diary-form";
import { LessonPicker, type PickerSubject } from "./lesson-picker";

export const dynamic = "force-dynamic";

/** The subjects a parent can point at a lesson, in the order they matter at home. */
const PICKER_SUBJECTS = [
  ["EMATH", "English Maths"],
  ["VMATH", "Toán"],
  ["VIET", "Tiếng Việt"],
  ["ESL", "ESL"],
  ["ENL", "ENL"],
  ["ESCI", "English Science"],
] as const;

const TASK_LABEL: Record<string, string> = {
  READ_ALOUD: "Đọc to",
  WRITE: "Viết",
  WORKSHEET: "Phiếu bài tập",
  VIDEO_SUBMIT: "Quay video",
  ONLINE_APP: "Làm trên app",
  BRING_ITEM: "Mang đồ",
  OTHER: "Việc khác",
};

/** FR-INT-06 — nạp nhật ký lớp hằng ngày; xem lại 7 ngày gần nhất. */
export default async function DiaryPage() {
  await guardPage("parent");
  const student = await prisma.student.findFirst({
    select: { className: true },
    orderBy: { createdAt: "asc" },
  });
  const className = student?.className ?? "1B3";

  const recent = await prisma.classDiary.findMany({
    where: { className },
    orderBy: { date: "desc" },
    take: 7,
    include: {
      lessons: { select: { subjectLabel: true, lessonRefText: true, skillCodes: true } },
      homeworks: {
        select: {
          text: true,
          taskType: true,
          status: true,
          student: { select: { nickname: true } },
        },
      },
      reminders: { select: { kind: true, text: true } },
    },
  });

  // "Hôm nay lớp học bài nào?": the lessons of each subject and where the class was last seen
  const current = await currentLessons(prisma, className);
  const pickerSubjects: PickerSubject[] = [];
  for (const [subject, label] of PICKER_SUBJECTS) {
    const lessons = await lessonChoices(prisma, subject);
    if (lessons.length === 0) continue;
    const seen = current.find((c) => c.subject === subject);
    pickerSubjects.push({
      subject,
      label,
      lessons,
      current:
        seen?.code && seen.title
          ? {
              code: seen.code,
              title: seen.title,
              date: seen.date.toISOString(),
              source: seen.source,
            }
          : null,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Nạp dữ liệu", "Nhật ký lớp"]}
        title="Nhật ký lớp"
        description="Dán bài đăng của cô mỗi tối — đây là nguồn dữ liệu rẻ nhất và đúng nhất của cả hệ thống (docs/11)."
      />
      <DiaryForm className={className} />
      <LessonPicker subjects={pickerSubjects} className={className} />

      <Card className="flex flex-col gap-3">
        <div>
          <CardTitle>7 ngày gần nhất</CardTitle>
          <CardDescription>
            Daily Quest lấy “bài đang học” từ 3 ngày gần nhất ở đây.
          </CardDescription>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-ink-500">Chưa có nhật ký nào.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {recent.map((d) => (
              <li key={d.id} className="rounded-control border border-ink-100 p-3">
                <p className="text-sm font-bold text-ink-900">
                  {d.date.toISOString().slice(0, 10)}
                  {d.confirmedAt ? (
                    <span className="ml-2 text-xs font-medium text-success-600">đã xác nhận</span>
                  ) : null}
                </p>
                <ul className="mt-1 text-sm text-ink-700">
                  {d.lessons.map((l) => (
                    <li key={`${d.id}-${l.lessonRefText}`}>
                      <strong>{l.subjectLabel}:</strong> {l.lessonRefText}
                      {l.skillCodes.length > 0 ? (
                        <span className="text-ink-400"> · {l.skillCodes.join(", ")}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {d.homeworks.length > 0 ? (
                  <ul className="mt-1 text-sm text-ink-600">
                    {d.homeworks.map((h) => (
                      <li key={`${d.id}-${h.student.nickname}-${h.text}`}>
                        <span className="rounded bg-surface-muted px-1 text-xs">
                          {TASK_LABEL[h.taskType] ?? h.taskType}
                        </span>{" "}
                        {h.student.nickname}: {h.text.slice(0, 80)}
                        {h.status === "DONE" ? (
                          <span className="ml-1 text-success-600">✓</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {d.reminders.map((r) => (
                  <p key={`${d.id}-${r.text}`} className="mt-1 text-sm text-warning-700">
                    {r.text}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
