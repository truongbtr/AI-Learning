import { inboxCounts, prisma } from "@mtct/db";
import { Camera, ChevronRight } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { guardianStudentIds, guardPage } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * P7 — hộp thư duyệt (docs/06 §2.1).
 *
 * Three queues in one place, because to a parent they are all "things waiting for me": photos read
 * and waiting to be approved, photos still waiting to be read (the AI queue runs in batches —
 * docs/13 §3b), and open answers waiting to be marked.
 */
export default async function ParentInboxPage() {
  const user = await guardPage("parent");
  const studentIds = user.role === "ADMIN" ? null : await guardianStudentIds(user.id);
  const counts = await inboxCounts(prisma, studentIds);

  const toReview = await prisma.intakeResult.findMany({
    where: {
      reviewedAt: null,
      job: { ...(studentIds ? { studentId: { in: studentIds } } : {}) },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      job: { select: { student: { select: { nickname: true } }, createdAt: true } },
      items: { select: { outcome: true } },
    },
  });

  const waiting = await prisma.intakeJob.findMany({
    where: {
      status: { in: ["QUEUED", "PROCESSING"] },
      ...(studentIds ? { studentId: { in: studentIds } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { student: { select: { nickname: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Nạp dữ liệu", "Hộp thư duyệt"]}
        title="Hộp thư duyệt"
        description="Không có gì vào hồ sơ của con trước khi ba mẹ nhìn qua."
        actions={
          <Link href="/parent/intake/new">
            <Button>
              <Camera className="h-4 w-4" /> Chụp bài vở
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Chờ ba mẹ duyệt" value={String(counts.toReview)} />
        <Stat label="Đang chờ đọc (hàng chờ AI)" value={String(counts.inQueue)} />
        <Stat label="Bài mở chờ chấm" value={String(counts.waitingToGrade)} />
      </div>

      <Card className="flex flex-col gap-3">
        <div>
          <CardTitle>Đã đọc xong — chờ duyệt</CardTitle>
          <CardDescription>
            Mỗi mục là một ảnh đã được đọc; bấm vào để xem ảnh kèm kết quả và sửa từng dòng.
          </CardDescription>
        </div>
        {toReview.length === 0 ? (
          <p className="text-sm text-ink-500">Chưa có gì chờ duyệt.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {toReview.map((r) => {
              const blanks = r.items.filter((i) => i.outcome === "BLANK").length;
              return (
                <li key={r.id}>
                  <Link
                    href={`/parent/intake/${r.id}`}
                    className="flex items-center justify-between gap-3 rounded-control border border-ink-100 px-3 py-2 hover:border-brand-300"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink-900">
                        {r.job.student?.nickname ?? "?"} · {r.summary || r.docType}
                      </span>
                      <span className="block text-xs text-ink-500">
                        {r.items.length} câu
                        {blanks > 0 ? ` · ${blanks} câu để trống` : ""} ·{" "}
                        {formatDateTime(r.job.createdAt)}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-400" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <div>
          <CardTitle>Đang chờ đọc</CardTitle>
          <CardDescription>
            Ảnh đã nhận và đã được chuẩn bị. Kết quả đọc do Claude Code xử lý theo lô — app không
            gọi AI (ADR-10). Chạy: <code>pnpm inbox:pull</code> → đọc → <code>pnpm inbox:push</code>
            .
          </CardDescription>
        </div>
        {waiting.length === 0 ? (
          <p className="text-sm text-ink-500">Không còn ảnh nào đang chờ.</p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-sm text-ink-700">
            {waiting.map((job) => (
              <li key={job.id} className="flex items-center justify-between gap-3">
                <span>
                  {job.student?.nickname ?? "?"} · {Array.isArray(job.files) ? job.files.length : 0}{" "}
                  ảnh · {formatDateTime(job.createdAt)}
                </span>
                <span className="rounded-control bg-warning-50 px-2 py-0.5 text-xs text-warning-700">
                  {job.status === "QUEUED" ? "đang chuẩn bị ảnh" : "đã vào hàng chờ"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
