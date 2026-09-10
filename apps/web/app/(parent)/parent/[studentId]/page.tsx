import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { guardPage, requireStudentAccess } from "@/lib/auth/session";

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
    <Card>
      <CardHeader>
        <CardTitle>{student.nickname}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Hồ sơ năng lực, xu hướng và "3 điều cần chú ý" sẽ có ở pha 5. API kiểm thử:{" "}
        <code>GET /api/students/{studentId}/mastery</code>
      </CardContent>
    </Card>
  );
}
