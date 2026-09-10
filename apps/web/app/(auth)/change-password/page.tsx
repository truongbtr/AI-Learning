import { redirect } from "next/navigation";
import { signOutAction } from "@/lib/auth/actions";
import { getSessionUser, homeFor } from "@/lib/auth/session";
import { ChangePasswordForm } from "./change-password-form";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "CHILD") redirect("/kid/home");
  const home = homeFor({ role: user.role, mustChangePassword: false });

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow">
        <h1 className="text-xl font-semibold">Đổi mật khẩu</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user.mustChangePassword
            ? "Đây là lần đăng nhập đầu (hoặc admin vừa đặt lại mật khẩu). Hãy đặt mật khẩu mới trước khi dùng tiếp."
            : `Tài khoản: ${user.username}`}
        </p>
        <div className="mt-5">
          <ChangePasswordForm homeHref={home} />
        </div>
        <form action={signOutAction} className="mt-4 text-right">
          <button type="submit" className="text-sm text-muted-foreground underline">
            Đăng xuất
          </button>
        </form>
      </div>
    </main>
  );
}
