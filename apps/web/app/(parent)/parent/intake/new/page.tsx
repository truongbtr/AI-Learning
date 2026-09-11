import { prisma } from "@mtct/db";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { guardPage } from "@/lib/auth/session";
import { IntakeForm } from "./intake-form";

export const dynamic = "force-dynamic";

/** P5 — nạp ảnh bài vở (docs/06 §2.1, FR-INT-01). */
export default async function NewIntakePage() {
  const user = await guardPage("parent");
  const students = await prisma.student.findMany({
    where: {
      user: { isActive: true },
      ...(user.role === "ADMIN" ? {} : { guardians: { some: { userId: user.id } } }),
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, nickname: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Nạp dữ liệu", "Chụp bài vở"]}
        title="Chụp bài vở"
        description="Vở bài tập, phiếu, bài kiểm tra, nhận xét của cô, màn hình Raz-Kids/NAVIO — 1 phút mỗi tối."
      />
      {students.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-500">
            Chưa có con nào được gắn với tài khoản này. Nhờ admin gắn trong Quản lý người dùng.
          </p>
        </Card>
      ) : (
        <IntakeForm students={students} defaultStudentId={students[0]?.id ?? ""} />
      )}
      <p className="text-sm text-ink-500">
        Ảnh đã gửi nằm ở{" "}
        <Link href="/parent/inbox" className="font-semibold text-brand-700 underline">
          Hộp thư duyệt
        </Link>
        .
      </p>
    </div>
  );
}
