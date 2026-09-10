import { prisma } from "@mtct/db";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { guardPage } from "@/lib/auth/session";
import { avatarEmoji } from "@/lib/avatars";

export const dynamic = "force-dynamic";

/** P2 placeholder (phase 5). Lists only active children linked through StudentGuardian. */
export default async function ParentHomePage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const user = await guardPage("parent");
  const { denied } = await searchParams;
  const students = await prisma.student.findMany({
    where: {
      user: { isActive: true },
      ...(user.role === "ADMIN" ? {} : { guardians: { some: { userId: user.id } } }),
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, nickname: true, avatarKey: true, className: true, mascot: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Tổng quan", "Các con"]}
        title="Các con"
        description="Chọn một bé để xem hồ sơ năng lực, xu hướng và những điều cần chú ý (pha 5)."
      />
      {denied ? (
        <p
          role="alert"
          className="rounded-control border border-warning-100 bg-warning-50 px-4 py-3 text-sm font-medium text-warning-700"
        >
          Bạn chưa được gắn với bé đó. Nhờ admin gắn trong Quản lý người dùng.
        </p>
      ) : null}
      {students.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-500">
            Chưa có con nào được gắn với tài khoản này. Nhờ admin gắn trong Quản lý người dùng.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {students.map((s) => (
            <Link key={s.id} href={`/parent/${s.id}`} className="group">
              <Card className="flex items-center gap-4 transition-shadow group-hover:shadow-card-hover">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-3xl">
                  {avatarEmoji(s.avatarKey)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold text-ink-900">
                    {s.nickname}
                  </span>
                  <span className="block text-sm text-ink-400">
                    Lớp {s.className} · mascot {s.mascot === "OWL" ? "Cú" : "Rô-bốt"}
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 text-ink-300 transition-transform group-hover:translate-x-0.5" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
