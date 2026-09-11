import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { guardPage, requireStudentAccess } from "@/lib/auth/session";
import { SendMailCard } from "./send-mail-card";

export const dynamic = "force-dynamic";

/** P3 placeholder (phase 5); the access check is the real thing (docs/02 §6). */
export default async function StudentPage({ params }: { params: Promise<{ studentId: string }> }) {
  await guardPage("parent");
  const { studentId } = await params;
  let student: { nickname: string; slug: string };
  try {
    student = (await requireStudentAccess(studentId)).student;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    if (err instanceof ApiError && err.status === 403) redirect("/parent?denied=1");
    throw err;
  }
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Tổng quan", "Các con", student.nickname]}
        title={student.nickname}
      />
      <SendMailCard studentId={studentId} nickname={student.nickname} />
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Hồ sơ năng lực</CardTitle>
            <CardDescription>Có ở pha 5 cùng xu hướng và "3 điều cần chú ý".</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-ink-500">
          API kiểm thử quyền truy cập:{" "}
          <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">
            GET /api/students/{studentId}/mastery
          </code>
        </CardContent>
      </Card>
    </div>
  );
}
