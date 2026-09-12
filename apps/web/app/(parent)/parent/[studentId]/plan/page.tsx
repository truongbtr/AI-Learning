import { listPlans, prisma } from "@mtct/db";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { ApiError } from "@/lib/api";
import { guardPage, requireStudentAccess } from "@/lib/auth/session";
import { PlanClient, type PlanView } from "./plan-client";

export const dynamic = "force-dynamic";

/** P9 — kế hoạch luyện & duyệt (docs/06 §2.1, FR-PAR-03). */
export default async function PlanPage({ params }: { params: Promise<{ studentId: string }> }) {
  await guardPage("parent");
  const { studentId } = await params;
  let nickname = "";
  try {
    nickname = (await requireStudentAccess(studentId)).student.nickname;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    if (err instanceof ApiError && err.status === 403) redirect("/parent?denied=1");
    throw err;
  }

  const [plans, queuedItem] = await Promise.all([
    listPlans(prisma, studentId),
    prisma.inboxItem.findFirst({
      where: { kind: "PLAN", studentId, status: { in: ["PENDING", "PULLED"] } },
      orderBy: { createdAt: "desc" },
      select: { status: true, payload: true },
    }),
  ]);

  const queued = queuedItem
    ? {
        weekStart: String((queuedItem.payload as { weekStart?: string })?.weekStart ?? "?"),
        status: queuedItem.status,
      }
    : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Tổng quan", "Các con", nickname, "Kế hoạch"]}
        title="Kế hoạch luyện"
        description="Đề xuất đi qua hàng chờ AI; ba mẹ sửa và duyệt. Chỉ kế hoạch đã duyệt mới lái phiên học của con."
      />
      <PlanClient
        studentId={studentId}
        nickname={nickname}
        queued={queued}
        initialPlans={
          plans.map((p) => ({
            ...p,
            approvedAt: p.approvedAt?.toISOString() ?? null,
          })) as PlanView[]
        }
      />
    </div>
  );
}
