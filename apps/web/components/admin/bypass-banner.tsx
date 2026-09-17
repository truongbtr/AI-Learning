import { activeBypass, prisma } from "@mtct/db";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

/**
 * While "tắt đăng nhập" is on, every adult page says so — loudly, on every screen, with the hour it
 * closes by itself. A switch you can forget is the dangerous kind (docs/12 §7).
 */
export async function BypassBanner() {
  // Read straight from the database, not the ten-second cache: a banner that lies about the front
  // door being open is worse than one extra query per page.
  const state = await activeBypass(prisma);
  if (!state.on) return null;
  const until = state.until.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
  return (
    <div
      data-testid="bypass-banner"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 border-warning-300 border-b bg-warning-50 px-4 py-2 text-sm text-warning-900"
    >
      <ShieldAlert className="size-4 shrink-0" />
      <b>Đăng nhập đang TẮT.</b>
      <span>
        Ai mở địa chỉ này cũng vào thẳng trang quản trị với tài khoản{" "}
        <b>{state.user.displayName}</b>. Tự bật lại lúc {until}.
      </span>
      <Link href="/admin/auth" className="font-semibold underline">
        Bật lại ngay
      </Link>
    </div>
  );
}
