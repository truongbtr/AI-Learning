import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/actions";
import { guardPage } from "@/lib/auth/session";

/** Admin area: ADMIN only. Checked again here besides proxy.ts. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await guardPage("admin");
  return (
    <div className="min-h-dvh bg-muted/40">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <nav className="flex items-center gap-4 text-sm">
            <span className="font-semibold">Quản trị</span>
            <Link href="/admin/users" className="text-muted-foreground hover:text-foreground">
              Người dùng
            </Link>
            <Link href="/parent" className="text-muted-foreground hover:text-foreground">
              Bảng điều khiển ba mẹ
            </Link>
            <Link href="/kid/home" className="text-muted-foreground hover:text-foreground">
              Xem thử góc của con
            </Link>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{user.displayName}</span>
            <Link href="/change-password" className="text-muted-foreground underline">
              Đổi mật khẩu
            </Link>
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm">
                Đăng xuất
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
