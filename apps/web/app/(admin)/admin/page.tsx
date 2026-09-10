import { prisma } from "@mtct/db";
import { Activity, Baby, KeyRound, ShieldAlert, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { KpiCard } from "@/components/admin/kpi-card";
import { PageHeader } from "@/components/admin/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { avatarEmoji } from "@/lib/avatars";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const WORKER_STALE_MS = 6 * 60 * 1000;
const RESULT_LABEL: Record<string, string> = {
  OK: "Thành công",
  WRONG_PASSWORD: "Sai mật khẩu/mã",
  LOCKED: "Bị khoá",
  NO_SUCH_USER: "Không tồn tại",
  DISABLED: "Tài khoản tắt",
};

/** Admin dashboard (MEDIFA ONE dashboard layout): KPIs, things to do, recent logins. */
export default async function AdminDashboardPage() {
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [users, students, logins7d, failed7d, needAttention, recent, ping] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], where: { isActive: true }, _count: { _all: true } }),
    prisma.student.count({ where: { user: { isActive: true } } }),
    prisma.loginAudit.count({ where: { at: { gte: since7d }, result: "OK" } }),
    prisma.loginAudit.count({ where: { at: { gte: since7d }, result: { not: "OK" } } }),
    prisma.user.findMany({
      where: {
        isActive: true,
        OR: [{ mustChangePassword: true }, { lockedUntil: { gt: new Date() } }],
      },
      select: {
        id: true,
        displayName: true,
        role: true,
        mustChangePassword: true,
        lockedUntil: true,
      },
      orderBy: { displayName: "asc" },
    }),
    prisma.loginAudit.findMany({
      take: 8,
      orderBy: { at: "desc" },
      select: {
        id: true,
        at: true,
        usernameTried: true,
        result: true,
        user: { select: { displayName: true, avatarKey: true } },
      },
    }),
    prisma.setting.findUnique({ where: { key: "worker.lastPing" } }),
  ]);
  const count = (role: "ADMIN" | "PARENT" | "CHILD") =>
    users.find((u) => u.role === role)?._count._all ?? 0;
  const lastPing = (ping?.value as { at?: string } | null)?.at ?? null;
  const workerOk = lastPing ? Date.now() - new Date(lastPing).getTime() <= WORKER_STALE_MS : false;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Tổng quan"]}
        title="Bảng điều khiển"
        description="Tình trạng hệ thống gia đình: tài khoản, đăng nhập 7 ngày qua và việc cần làm."
        actions={
          <Link href="/admin/users" className={buttonVariants({ variant: "default" })}>
            Quản lý người dùng
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Con đang học"
          value={students}
          caption={`${count("CHILD")} tài khoản con đang bật`}
          icon={<Baby className="h-6 w-6" />}
        />
        <KpiCard
          label="Phụ huynh & quản trị"
          value={count("PARENT") + count("ADMIN")}
          caption={`${count("PARENT")} phụ huynh · ${count("ADMIN")} quản trị`}
          icon={<Users className="h-6 w-6" />}
        />
        <KpiCard
          label="Đăng nhập 7 ngày"
          value={logins7d}
          caption={failed7d > 0 ? `${failed7d} lần thất bại` : "Không có lần thất bại"}
          icon={<UserRound className="h-6 w-6" />}
          tone={failed7d > 10 ? "warning" : "brand"}
        />
        <KpiCard
          label="Worker"
          value={workerOk ? "Đang chạy" : "Ngừng"}
          caption={lastPing ? `Ping cuối ${formatDateTime(lastPing)}` : "Chưa có ping"}
          icon={<Activity className="h-6 w-6" />}
          tone={workerOk ? "success" : "danger"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Việc cần làm</CardTitle>
              <CardDescription>
                Tài khoản đang bị khoá hoặc chưa đổi mật khẩu lần đầu.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {needAttention.length === 0 ? (
              <p className="rounded-control bg-success-50 px-4 py-3 text-sm font-medium text-success-700">
                Không có việc nào. Mọi tài khoản đều ổn.
              </p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {needAttention.map((u) => (
                  <li key={u.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning-50 text-warning-600">
                      {u.lockedUntil ? (
                        <ShieldAlert className="h-4 w-4" />
                      ) : (
                        <KeyRound className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900">{u.displayName}</p>
                      <p className="text-xs text-ink-400">
                        {u.lockedUntil
                          ? `Khoá tới ${formatDateTime(u.lockedUntil)}`
                          : "Chưa đổi mật khẩu lần đầu"}
                      </p>
                    </div>
                    <Link
                      href="/admin/users"
                      className="text-xs font-semibold text-brand-700 hover:underline"
                    >
                      Xử lý
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card flush className="lg:col-span-3">
          <div className="border-b border-ink-100 px-5 py-4">
            <CardTitle>Đăng nhập gần đây</CardTitle>
            <CardDescription>8 lần gần nhất, mọi vai trò.</CardDescription>
          </div>
          {recent.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-400">Chưa có lần đăng nhập nào.</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Ai</TH>
                  <TH>Kết quả</TH>
                  <TH>Thời điểm</TH>
                </TR>
              </THead>
              <TBody>
                {recent.map((r) => (
                  <TR key={r.id}>
                    <TD>
                      <span className="flex items-center gap-2">
                        <span className="text-xl">{avatarEmoji(r.user?.avatarKey)}</span>
                        <span className="font-medium text-ink-900">
                          {r.user?.displayName ?? r.usernameTried}
                        </span>
                      </span>
                    </TD>
                    <TD>
                      <Badge tone={r.result === "OK" ? "success" : "warning"} dot>
                        {RESULT_LABEL[r.result] ?? r.result}
                      </Badge>
                    </TD>
                    <TD className="whitespace-nowrap text-xs text-ink-500">
                      {formatDateTime(r.at)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
