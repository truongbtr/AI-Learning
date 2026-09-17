import { activeBypass, prisma } from "@mtct/db";
import { ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { BypassSwitch } from "./bypass-switch";

export const dynamic = "force-dynamic";

/**
 * `/admin/auth` — "tắt đăng nhập" while testing (owner, 18/09/2026), and everything that makes it
 * safe to have: the hour it closes by itself, who is being borrowed, and how to shut it from the
 * server when the browser is the thing that is broken.
 */
export default async function AuthSwitchPage() {
  await requireRole("ADMIN");
  const state = await activeBypass(prisma);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Quản trị", "Đăng nhập"]}
        title="Tắt đăng nhập để thử"
        description="Khi tắt, mở địa chỉ web là vào thẳng trang quản trị, không hỏi mật khẩu."
      />

      <Card className="flex flex-col gap-4 p-5">
        <BypassSwitch
          initial={
            state.on
              ? { on: true, until: state.until.toISOString(), as: state.user.displayName }
              : { on: false }
          }
        />
      </Card>

      <Card className="flex flex-col gap-2 p-5">
        <CardTitle className="flex items-center gap-2 text-warning-700">
          <ShieldAlert className="size-4" /> Nhớ giúp con
        </CardTitle>
        <CardDescription>
          Web này mở ra internet. Trong lúc tắt, <b>bất kỳ ai</b> biết địa chỉ đều xem được bài vở
          và số liệu của hai bé, nên chỉ tắt khi đang ngồi thử máy, và bật lại ngay khi xong. Công
          tắc luôn có hạn (tối đa 7 ngày) và tự bật lại; mỗi lần bật/tắt đều ghi vào nhật ký quản
          trị.
        </CardDescription>
        <CardDescription>
          Tắt được cả từ máy chủ, khi trang đăng nhập chính là chỗ đang hỏng:
          <br />
          <code className="text-ink-700">pnpm auth:bypass on --hours 4</code> ·{" "}
          <code className="text-ink-700">pnpm auth:bypass off</code> ·{" "}
          <code className="text-ink-700">pnpm auth:bypass status</code>
        </CardDescription>
      </Card>
    </div>
  );
}
