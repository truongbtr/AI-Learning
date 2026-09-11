import type { IntakeFileRef } from "@mtct/core";
import { filesOf, prisma } from "@mtct/db";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { guardPage, requireStudentAccess } from "@/lib/auth/session";
import { ReviewClient, type ReviewItem } from "./review-client";

export const dynamic = "force-dynamic";

const DOC_LABEL: Record<string, string> = {
  WORKBOOK: "Vở bài tập",
  TEST: "Bài kiểm tra",
  WORKSHEET: "Phiếu bài tập",
  TEACHER_NOTE: "Nhận xét của cô",
  CLASS_DIARY: "Nhật ký lớp",
  NAVIO_REPORT: "Báo cáo NAVIO",
  KIDSAZ_REPORT: "Báo cáo Kids A-Z",
  OTHER: "Khác",
};

/** P6 — duyệt kết quả đọc ảnh (docs/06 §2.1, FR-INT-02). */
export default async function ReviewIntakePage({ params }: { params: Promise<{ id: string }> }) {
  await guardPage("parent");
  const { id } = await params;
  const result = await prisma.intakeResult.findUnique({
    where: { id },
    include: {
      items: { orderBy: { index: "asc" } },
      job: { include: { student: { select: { id: true, nickname: true } } } },
    },
  });
  if (!result) notFound();
  const studentId = result.job.student?.id;
  if (!studentId) notFound();
  try {
    await requireStudentAccess(studentId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) redirect("/parent?denied=1");
    throw err;
  }

  const files = filesOf(result.job).map((f: IntakeFileRef) => ({
    key: f.key,
    url: `/api/files/${f.key}`,
    duplicateOf: f.duplicateOf ?? null,
    page: f.page,
  }));

  const items: ReviewItem[] = result.items.map((i) => ({
    id: i.id,
    index: i.index,
    questionText: i.questionText,
    studentAnswer: i.studentAnswer,
    expectedAnswer: i.expectedAnswer,
    outcome: i.outcome,
    blankReason: i.blankReason,
    errorCode: i.errorCode,
    skillCodes: i.skillCodes,
    skillCodesFinal: i.skillCodesFinal,
    bbox: (i.bbox as ReviewItem["bbox"]) ?? null,
    fileIndex: i.fileIndex,
  }));

  const raw = (result.rawExtraction ?? {}) as {
    externals?: { platform: string; metric: string; value: string }[];
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Nạp dữ liệu", "Hộp thư duyệt", result.job.student?.nickname ?? "Duyệt ảnh"]}
        title="Duyệt kết quả đọc ảnh"
        description="Sửa từng dòng nếu máy đọc chưa đúng, rồi bấm Duyệt tất cả — chỉ khi đó bằng chứng mới vào hồ sơ của con."
      />
      {result.reviewedAt ? (
        <Card className="border-success-200 bg-success-50">
          <p className="text-sm font-semibold text-success-700">
            Ảnh này đã được duyệt lúc {result.reviewedAt.toLocaleString("vi-VN")}.
          </p>
        </Card>
      ) : null}
      <ReviewClient
        resultId={result.id}
        studentNickname={result.job.student?.nickname ?? ""}
        summary={result.summary}
        docType={DOC_LABEL[result.docType] ?? result.docType}
        teacherComment={result.teacherComment}
        confidence={result.confidence}
        files={files}
        items={items}
        externals={raw.externals ?? []}
      />
    </div>
  );
}
