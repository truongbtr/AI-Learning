import { PICTURE_SETS } from "@mtct/core";
import { prisma } from "@mtct/db";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { ApiError } from "@/lib/api";
import { guardPage, requireStudentAccess } from "@/lib/auth/session";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

/** P13 — cài đặt bé (docs/06 §2.1). */
export default async function StudentSettingsPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  await guardPage("parent");
  const { studentId } = await params;
  try {
    await requireStudentAccess(studentId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    if (err instanceof ApiError && err.status === 403) redirect("/parent?denied=1");
    throw err;
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      nickname: true,
      mascot: true,
      interests: true,
      settings: true,
      user: { select: { pictureSetKey: true } },
      rewardGoals: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, title: true, starsNeeded: true, starsSpent: true },
      },
    },
  });
  if (!student) notFound();

  const settings = (student.settings ?? {}) as {
    dailyMinutes?: number;
    suggestedTime?: string | null;
    difficultyBias?: number;
  };
  const stars = await prisma.starLedger.aggregate({
    where: { studentId },
    _sum: { delta: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Tổng quan", "Các con", student.nickname, "Cài đặt"]}
        title={`Cài đặt của ${student.nickname}`}
        description="Mỗi mục ở đây đổi một thứ con nhìn thấy ngay tối nay."
      />
      <SettingsClient
        data={{
          studentId,
          nickname: student.nickname,
          mascot: String(student.mascot),
          interests: student.interests,
          dailyMinutes: settings.dailyMinutes ?? 15,
          suggestedTime: settings.suggestedTime ?? null,
          difficultyBias: settings.difficultyBias ?? 0,
          pictureSetKey: student.user.pictureSetKey ?? "animals",
          pictureSets: PICTURE_SETS.map((s) => ({
            key: s.key,
            nameVi: s.nameVi,
            pictures: s.pictures.map((p) => ({
              key: p.key,
              emoji: p.emoji,
              labelVi: p.labelVi,
            })),
          })),
          rewardGoal: student.rewardGoals[0] ?? null,
          starBalance: stars._sum.delta ?? 0,
        }}
      />
    </div>
  );
}
