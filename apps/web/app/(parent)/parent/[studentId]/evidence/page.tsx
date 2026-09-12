import { listEvidence, prisma, SUBJECT_LABEL } from "@mtct/db";
import { Camera, FileText, Mic, NotebookPen, PencilLine, UserCheck } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { Badge, Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { guardPage, requireStudentAccess } from "@/lib/auth/session";
import { evidenceQueryFrom } from "@/lib/parent/schemas";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DAY_MS = 86_400_000;

/**
 * Where every number on the dashboard lands (docs/08 pha 5, tiêu chí 1).
 *
 * One page, one shape of row, all the filters the tiles are labelled with. A row is not a summary:
 * it is the question the child answered or the line read off a photo, with the photo beside it.
 * If a figure on P2 or P3 cannot be reproduced by opening this page with its filters, the figure
 * is wrong — and that is the point of building only one of these.
 */

const SOURCE_LABEL: Record<string, { label: string; icon: React.ReactNode }> = {
  EXERCISE: { label: "Bài luyện trong app", icon: <PencilLine className="h-3.5 w-3.5" /> },
  INTAKE_PHOTO: { label: "Ảnh bài vở", icon: <Camera className="h-3.5 w-3.5" /> },
  INTAKE_TEACHER_NOTE: { label: "Nhận xét của cô", icon: <NotebookPen className="h-3.5 w-3.5" /> },
  HOMEWORK: { label: "Bài cô giao", icon: <FileText className="h-3.5 w-3.5" /> },
  EXTERNAL_REPORT: { label: "NAVIO / Kids A-Z", icon: <FileText className="h-3.5 w-3.5" /> },
  PARENT_NOTE: { label: "Ba mẹ ghi lại", icon: <UserCheck className="h-3.5 w-3.5" /> },
  PARENT_OVERRIDE: { label: "Ba mẹ đặt tay", icon: <UserCheck className="h-3.5 w-3.5" /> },
  VOICE_TUTOR: { label: "Gia sư giọng nói", icon: <Mic className="h-3.5 w-3.5" /> },
};

const OUTCOME: Record<string, { label: string; tone: "success" | "warning" | "neutral" }> = {
  CORRECT: { label: "làm được", tone: "success" },
  PARTIAL: { label: "gần đúng", tone: "warning" },
  INCORRECT: { label: "chưa được", tone: "warning" },
  OBSERVED: { label: "ghi nhận", tone: "neutral" },
};

const BLANK_LABEL: Record<string, string> = {
  NOT_FINISHED: "con chưa làm xong",
  DOES_NOT_KNOW: "con chưa biết làm",
};

export default async function EvidencePage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
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

  const q = evidenceQueryFrom(await searchParams);
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = q.days ? new Date(to.getTime() - (q.days - 1) * DAY_MS) : null;
  if (from) from.setHours(0, 0, 0, 0);

  const [page, skill, errorCode] = await Promise.all([
    listEvidence(prisma, studentId, {
      subject: q.subject ?? null,
      skillCode: q.skill ?? null,
      errorCode: q.error ?? null,
      source: q.source ?? null,
      outcome: q.outcome ?? null,
      from,
      to: q.days ? to : null,
      limit: q.limit ?? 100,
    }),
    q.skill
      ? prisma.skill.findUnique({ where: { code: q.skill }, select: { nameVi: true } })
      : null,
    q.error
      ? prisma.errorCode.findUnique({ where: { code: q.error }, select: { nameVi: true } })
      : null,
  ]);

  const filters = [
    q.subject ? SUBJECT_LABEL[q.subject] : null,
    skill ? `kỹ năng: ${skill.nameVi}` : null,
    errorCode ? `lỗi: ${errorCode.nameVi}` : null,
    q.source ? SOURCE_LABEL[q.source]?.label : null,
    q.outcome ? OUTCOME[q.outcome]?.label : null,
    q.days ? `${q.days} ngày gần nhất` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Tổng quan", "Các con", nickname, "Bằng chứng"]}
        title="Bằng chứng"
        description={
          filters.length > 0
            ? `Đang lọc: ${filters.join(" · ")}`
            : "Mọi thứ hệ thống biết về con, theo thứ tự mới nhất."
        }
        actions={
          filters.length > 0 ? (
            <Link
              href={`/parent/${studentId}/evidence`}
              className="text-sm font-semibold text-brand-700 hover:underline"
            >
              Bỏ lọc
            </Link>
          ) : null
        }
      />

      <p className="text-sm text-ink-500" data-testid="evidence-total">
        <strong className="font-bold text-ink-900">{page.total}</strong> bằng chứng khớp bộ lọc
        {page.rows.length < page.total ? ` · đang hiện ${page.rows.length}` : ""}
      </p>

      {page.rows.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-500">
            Không có bằng chứng nào khớp. Thử bỏ bớt bộ lọc, hoặc chụp bài vở của con để có thêm.
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2" data-testid="evidence-rows">
          {page.rows.map((row) => {
            const source = SOURCE_LABEL[row.source];
            const outcome = OUTCOME[row.outcome] ?? OUTCOME.OBSERVED;
            return (
              <li key={row.id}>
                <Card className="flex flex-col gap-2.5" data-testid="evidence-row">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge tone={outcome?.tone ?? "neutral"} dot>
                      {outcome?.label}
                    </Badge>
                    <span className="inline-flex items-center gap-1.5 text-ink-500">
                      {source?.icon}
                      {source?.label ?? row.source}
                    </span>
                    <Link
                      href={`/parent/${studentId}/skills?skill=${row.skill.code}`}
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      {row.skill.nameVi}
                    </Link>
                    {row.errorNameVi ? (
                      <Link
                        href={`/parent/${studentId}/evidence?error=${row.errorCode}&days=30`}
                        className="rounded-full bg-warning-50 px-2 py-0.5 font-semibold text-warning-700 hover:bg-warning-100"
                      >
                        {row.errorNameVi}
                      </Link>
                    ) : null}
                    <span className="ml-auto text-ink-400">{formatDateTime(row.observedAt)}</span>
                  </div>

                  {row.attempt ? (
                    <div className="text-sm text-ink-700">
                      <p className="font-medium">{row.attempt.promptText || "(không có đề bài)"}</p>
                      <p className="mt-0.5 text-xs text-ink-400">
                        {row.attempt.exerciseType} · bài {row.attempt.order} trong phiên{" "}
                        {row.attempt.sessionDate.toISOString().slice(0, 10)} · {row.attempt.tries}{" "}
                        lượt thử · {row.attempt.hintsUsed} gợi ý
                      </p>
                      {row.attempt.photoKey ? (
                        <EvidencePhoto keyName={row.attempt.photoKey} alt="Ảnh bài con chụp" />
                      ) : null}
                    </div>
                  ) : null}

                  {row.intake ? (
                    <div className="text-sm text-ink-700">
                      <p className="font-medium">
                        Câu {row.intake.index + 1}: {row.intake.questionText || "(không có đề)"}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        Con viết: <strong>{row.intake.studentAnswer ?? "để trống"}</strong>
                        {row.intake.expectedAnswer ? ` · đáp án: ${row.intake.expectedAnswer}` : ""}
                        {row.intake.blankReason
                          ? ` · ${BLANK_LABEL[row.intake.blankReason] ?? row.intake.blankReason}`
                          : ""}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-3">
                        {row.intake.fileKey ? (
                          <EvidencePhoto keyName={row.intake.fileKey} alt="Ảnh bài vở" />
                        ) : null}
                        <Link
                          href={`/parent/intake/${row.intake.resultId}`}
                          className="text-xs font-semibold text-brand-700 hover:underline"
                        >
                          Mở lại lô ảnh này
                        </Link>
                      </div>
                    </div>
                  ) : null}

                  {!row.attempt && !row.intake ? (
                    <p className="text-sm text-ink-600">{row.note ?? "Ghi nhận trực tiếp."}</p>
                  ) : null}

                  <p className="text-xs text-ink-400">
                    Điểm {Math.round(row.score * 100)}% · trọng số {row.weight} · độ khó{" "}
                    {row.difficulty}
                    {row.note ? ` · ${row.note}` : ""}
                  </p>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** The photo itself, served through the guarded file route — never a public URL. */
function EvidencePhoto({ keyName, alt }: { keyName: string; alt: string }) {
  const href = `/api/files/${keyName.split("/").map(encodeURIComponent).join("/")}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-block">
      {/* biome-ignore lint/performance/noImgElement: a guarded API route, not an optimisable asset */}
      <img
        src={href}
        alt={alt}
        loading="lazy"
        className="h-24 w-auto rounded-control border border-ink-100 object-cover"
      />
    </a>
  );
}
