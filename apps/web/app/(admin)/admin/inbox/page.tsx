import { prisma } from "@mtct/db";
import { Inbox } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { guardPage } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  PHOTO_INTAKE: "Ảnh bài vở",
  DIARY_HARD: "Nhật ký lớp (phần khó)",
  WRITE_PHOTO_GRADE: "Chấm bài viết tay",
  SPEAK_GRADE: "Chấm bài đọc / nói",
  WEEKLY_REPORT: "Báo cáo tuần",
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Đang chờ",
  PULLED: "Đã lấy ra",
  DONE: "Xong",
  FAILED: "Lỗi",
};
const STATUS_TONE = {
  PENDING: "warning",
  PULLED: "info",
  DONE: "success",
  FAILED: "danger",
} as const;

/**
 * /admin/inbox (docs/13 §2): what is waiting for Claude Code, and what came back.
 * The page never processes anything — it only shows the queue and the exact commands to run.
 */
export default async function AdminInboxPage() {
  await guardPage("admin");
  const [counts, items] = await Promise.all([
    prisma.inboxItem.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.inboxItem.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      include: { student: { select: { nickname: true } } },
    }),
  ]);
  const count = (s: keyof typeof STATUS_TONE) =>
    counts.find((c) => c.status === s)?._count._all ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Nội dung", "Hàng chờ AI"]}
        title="Hàng chờ AI"
        description="Việc cần Claude Code đọc: ảnh bài vở, bài viết tay, bài đọc to, nhật ký lớp khó và báo cáo tuần. Ứng dụng không gọi API AI nào (ADR-10)."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Đang chờ"
          value={count("PENDING")}
          tone={count("PENDING") > 0 ? "warning" : "neutral"}
          icon={<Inbox className="h-5 w-5" />}
        />
        <Stat label="Đã lấy ra, chưa trả kết quả" value={count("PULLED")} />
        <Stat label="Đã nạp kết quả" value={count("DONE")} tone="success" />
        <Stat
          label="Lỗi"
          value={count("FAILED")}
          tone={count("FAILED") > 0 ? "danger" : "neutral"}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Cách xử lý</CardTitle>
            <CardDescription>Chạy từ PowerShell tại gốc repo, mất 3–10 phút.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-ink-600">
            <li>
              <code className="rounded bg-ink-100 px-1.5 py-0.5">pnpm inbox:pull</code> — xuất việc
              ra{" "}
              <code className="rounded bg-ink-100 px-1.5 py-0.5">
                inbox/&lt;ngày&gt;/&lt;id&gt;/context.json
              </code>
            </li>
            <li>
              Mở Claude Code, bảo “Xử lý hàng chờ AI” — nó đọc và viết{" "}
              <code className="rounded bg-ink-100 px-1.5 py-0.5">result.json</code>
            </li>
            <li>
              <code className="rounded bg-ink-100 px-1.5 py-0.5">
                pnpm inbox:validate &amp;&amp; pnpm inbox:push
              </code>
            </li>
            <li>Duyệt kết quả trong trang của ba mẹ trước khi thành bằng chứng của con.</li>
          </ol>
        </CardContent>
      </Card>

      <Card flush>
        <div className="border-b border-ink-100 px-5 py-4">
          <CardTitle>60 mục gần nhất</CardTitle>
          <CardDescription>Mới nhất ở trên.</CardDescription>
        </div>
        {items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-400">
            Hàng chờ trống. Ảnh bài vở và bài chờ chấm sẽ hiện ở đây.
          </p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Loại việc</TH>
                <TH>Của bé</TH>
                <TH>Trạng thái</TH>
                <TH>Tạo lúc</TH>
                <TH>Kết quả</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((item) => (
                <TR key={item.id}>
                  <TD className="font-medium text-ink-900">{KIND_LABEL[item.kind] ?? item.kind}</TD>
                  <TD>{item.student?.nickname ?? "—"}</TD>
                  <TD>
                    <Badge tone={STATUS_TONE[item.status as keyof typeof STATUS_TONE]} dot>
                      {STATUS_LABEL[item.status] ?? item.status}
                    </Badge>
                  </TD>
                  <TD className="whitespace-nowrap text-xs text-ink-500">
                    {formatDateTime(item.createdAt)}
                  </TD>
                  <TD className="text-xs text-ink-500">
                    {item.error ? (
                      <span className="text-danger-600">{item.error}</span>
                    ) : (
                      (item.resultRef ?? "—")
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
