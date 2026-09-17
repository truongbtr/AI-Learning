import { adminDashboard, prisma } from "@mtct/db";
import { AlertTriangle, BookOpen, CalendarDays, Flame, Target, Timer } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

/**
 * `/admin` — "kết quả học tập của các con" on one page (owner, 18/09/2026).
 *
 * Written to be read in a minute before bed: what each child did today, how much of it was right,
 * what is slipping, and which mistake keeps coming back — side by side, because the two children
 * are in the same class and the interesting thing is usually the difference.
 *
 * Nothing here is new data. It is the parent overview (docs/06 §2.1) plus the three numbers that
 * only make sense when the evening is over.
 */
const SUBJECT_LABEL: Record<string, string> = {
  VIET: "Tiếng Việt",
  VMATH: "Toán",
  ESL: "ESL",
  ENL: "ENL",
  EMATH: "English Maths",
  ESCI: "English Science",
};

const pct = (v: number | null) => (v == null ? "—" : `${Math.round(v * 100)}%`);

/** Green when it is going well, amber when it wants a look, never red at a child's numbers. */
function tone(value: number | null, good: number, fair: number): string {
  if (value == null) return "text-ink-400";
  if (value >= good) return "text-success-600";
  return value >= fair ? "text-warning-600" : "text-ink-700";
}

function Bar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
      <div
        className="h-full rounded-full bg-brand-500"
        style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export default async function AdminHomePage() {
  const data = await adminDashboard(prisma);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Kết quả học tập"]}
        title="Hai bé học thế nào rồi"
        description={`Số liệu lúc ${data.generatedAt.toLocaleString("vi-VN")}${
          data.currentWeek ? ` · tuần học thứ ${data.currentWeek}` : ""
        }. Bấm vào tên bé để xem chi tiết.`}
      />

      {data.classNow.length > 0 ? (
        <Card className="flex flex-col gap-2 p-5">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-brand-600" />
            <CardTitle>Lớp đang học tới đâu</CardTitle>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-ink-700 text-sm">
            {data.classNow.map((c) => (
              <li key={c.subject}>
                <b>{SUBJECT_LABEL[c.subject] ?? c.subject}:</b> {c.title ?? "—"}{" "}
                <span className="text-ink-400">
                  ({c.date.toLocaleDateString("vi-VN")}
                  {c.source === "PARENT" ? ", ba mẹ nhập" : ""})
                </span>
              </li>
            ))}
          </ul>
          <CardDescription>
            Sửa ở{" "}
            <Link href="/parent/diary" className="underline">
              Nhật ký lớp
            </Link>{" "}
            — phiên tối nay bám theo đây.
          </CardDescription>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        {data.children.map((child) => {
          const o = child.overview;
          const behind = o.subjects.reduce((n, s) => n + s.behind, 0);
          return (
            <Card key={o.student.id} className="flex flex-col gap-4 p-5" data-testid="child-card">
              <div className="flex items-baseline justify-between gap-3">
                <Link
                  href={`/parent/${o.student.id}`}
                  className="font-bold text-ink-900 text-xl underline-offset-4 hover:underline"
                >
                  {o.student.nickname}
                </Link>
                <span className="text-ink-500 text-sm">lớp {o.student.className}</span>
              </div>

              {/* tối nay và bảy ngày qua */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-ink-500 text-xs">Hôm nay</p>
                  <p className="font-bold text-ink-900 text-lg" data-testid="today-answered">
                    {child.today.answered} câu
                  </p>
                  <p className={`text-sm ${tone(child.today.accuracy, 0.8, 0.6)}`}>
                    đúng {pct(child.today.accuracy)}
                  </p>
                </div>
                <div>
                  <p className="text-ink-500 text-xs">7 ngày</p>
                  <p className="font-bold text-ink-900 text-lg">{child.week.answered} câu</p>
                  <p className={`text-sm ${tone(child.week.accuracy, 0.8, 0.6)}`}>
                    đúng {pct(child.week.accuracy)}
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1 text-ink-500 text-xs">
                    <Timer className="size-3" /> Thời gian
                  </p>
                  <p className="font-bold text-ink-900 text-lg">{child.week.minutes} phút</p>
                  <p className="text-ink-500 text-sm">{child.week.sessions} phiên / tuần</p>
                </div>
                <div>
                  <p className="flex items-center gap-1 text-ink-500 text-xs">
                    <Flame className="size-3" /> Chuỗi ngày
                  </p>
                  <p className="font-bold text-ink-900 text-lg">{o.streak.current}</p>
                  <p className="text-ink-500 text-sm">dài nhất {o.streak.longest}</p>
                </div>
              </div>

              {/* từng môn */}
              <div className="flex flex-col gap-2">
                <CardTitle className="text-sm">Sáu môn</CardTitle>
                {o.subjects.map((s) => (
                  <div key={s.subject} className="flex items-center gap-3 text-sm">
                    <span className="w-28 shrink-0 text-ink-600">{s.labelVi}</span>
                    <Bar value={s.avgMastery} />
                    <span className="w-10 shrink-0 text-right font-medium text-ink-800">
                      {Math.round(s.avgMastery)}
                    </span>
                    <span className="w-24 shrink-0 text-ink-400 text-xs">
                      {s.solid} vững · {s.needsPractice} cần luyện
                    </span>
                  </div>
                ))}
                {behind > 0 ? (
                  <p className="flex items-center gap-1 text-warning-600 text-xs">
                    <CalendarDays className="size-3" />
                    {behind} kỹ năng lớp đã học mà con chưa có bằng chứng nào
                  </p>
                ) : null}
              </div>

              {/* đang yếu nhất */}
              <div className="flex flex-col gap-1">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Target className="size-4 text-brand-600" /> Yếu nhất lúc này
                </CardTitle>
                {child.weakest.length === 0 ? (
                  <p className="text-ink-500 text-sm">Chưa đủ dữ liệu.</p>
                ) : (
                  <ul className="flex flex-col gap-1 text-sm" data-testid="weakest">
                    {child.weakest.map((w) => (
                      <li key={w.code} className="flex items-baseline justify-between gap-2">
                        <span className="text-ink-700">
                          {w.nameVi}{" "}
                          <span className="text-ink-400 text-xs">
                            {SUBJECT_LABEL[w.subject] ?? w.subject}
                          </span>
                        </span>
                        <span className="shrink-0 text-ink-500">
                          {w.mastery}/100
                          {w.daysSince != null && w.daysSince > 6 ? (
                            <span className="text-warning-600"> · {w.daysSince} ngày chưa gặp</span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* lỗi lặp lại */}
              <div className="flex flex-col gap-1">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="size-4 text-warning-600" /> Lỗi hay gặp (7 ngày)
                </CardTitle>
                {child.errors.length === 0 ? (
                  <p className="text-ink-500 text-sm">Tuần này chưa có lỗi nào lặp lại.</p>
                ) : (
                  <ul className="flex flex-col gap-1 text-sm" data-testid="errors">
                    {child.errors.map((e) => (
                      <li key={e.code} className="text-ink-700">
                        <b>{e.nameVi}</b> · {e.count7d} lần
                        {e.remediation ? (
                          <span className="text-ink-400"> — {e.remediation}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {(child.photosWaiting > 0 || child.homeworkPending > 0) && (
                <p className="text-ink-600 text-sm">
                  {child.photosWaiting > 0 ? (
                    <>
                      <Link href="/admin/inbox" className="underline">
                        {child.photosWaiting} lô ảnh
                      </Link>{" "}
                      đang chờ đọc/duyệt.{" "}
                    </>
                  ) : null}
                  {child.homeworkPending > 0 ? (
                    <>{child.homeworkPending} bài cô giao chưa xong.</>
                  ) : null}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
