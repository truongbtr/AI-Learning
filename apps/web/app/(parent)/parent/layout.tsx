import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/actions";
import { guardPage } from "@/lib/auth/session";

/** Parent area: PARENT or ADMIN. Checked again here besides proxy.ts. */
export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const user = await guardPage("parent");
  return (
    <div className="min-h-dvh bg-muted/40">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/parent" className="font-semibold">
              Bảng điều khiển ba mẹ
            </Link>
            {user.role === "ADMIN" ? (
              <Link href="/admin/users" className="text-muted-foreground hover:text-foreground">
                Quản trị
              </Link>
            ) : null}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{user.displayName}</span>
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm">
                Đăng xuất
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
