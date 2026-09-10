import { listStudentsForAdmin, listUsersForAdmin } from "@/lib/admin/users";
import { guardPage } from "@/lib/auth/session";
import { UsersAdmin } from "./users-admin";

export const dynamic = "force-dynamic";

/** FR-ADM-06: one table, five operations (docs/12 §5). */
export default async function AdminUsersPage() {
  const me = await guardPage("admin");
  const [users, students] = await Promise.all([listUsersForAdmin(), listStudentsForAdmin()]);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Quản lý người dùng</h1>
        <p className="text-sm text-muted-foreground">
          Tạo tài khoản · gắn phụ huynh ↔ con · đặt lại mật khẩu / mã hình · bật-tắt · nhật ký đăng
          nhập. Không có đăng ký công khai.
        </p>
      </div>
      <UsersAdmin users={users} students={students} currentUserId={me.id} />
    </div>
  );
}
