import { prisma } from "@mtct/db";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { guardPage } from "@/lib/auth/session";
import { avatarEmoji } from "@/lib/avatars";

export const dynamic = "force-dynamic";

/** P2 placeholder (phase 5). Lists only active children linked through StudentGuardian. */
export default async function ParentHomePage() {
  const user = await guardPage("parent");
  const students = await prisma.student.findMany({
    where: {
      user: { isActive: true },
      ...(user.role === "ADMIN" ? {} : { guardians: { some: { userId: user.id } } }),
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, nickname: true, avatarKey: true, className: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Các con</h1>
      {students.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Chưa có con nào được gắn với tài khoản này. Nhờ admin gắn trong Quản lý người dùng.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {students.map((s) => (
            <Link key={s.id} href={`/parent/${s.id}`}>
              <Card className="transition-colors hover:bg-accent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span className="text-3xl">{avatarEmoji(s.avatarKey)}</span>
                    {s.nickname}
                  </CardTitle>
                  <CardDescription>Lớp {s.className}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        Tổng quan, bản đồ năng lực và báo cáo tuần sẽ có ở pha 5.
      </p>
    </div>
  );
}
