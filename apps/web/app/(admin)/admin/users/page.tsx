import { PageHeader } from "@/components/admin/page-header";
import { listStudentsForAdmin, listUsersForAdmin } from "@/lib/admin/users";
import { guardPage } from "@/lib/auth/session";
import { UsersAdmin } from "./users-admin";

export const dynamic = "force-dynamic";

/** FR-ADM-06: one table, five operations (docs/12 §5). */
export default async function AdminUsersPage() {
  const me = await guardPage("admin");
  const [users, students] = await Promise.all([listUsersForAdmin(), listStudentsForAdmin()]);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Hệ thống", "Người dùng"]}
        title="Người dùng"
        description="Tạo tài khoản, gắn phụ huynh với con, đặt lại mật khẩu hoặc mã hình, bật-tắt và xem nhật ký đăng nhập. Không có đăng ký công khai."
      />
      <UsersAdmin users={users} students={students} currentUserId={me.id} />
    </div>
  );
}
