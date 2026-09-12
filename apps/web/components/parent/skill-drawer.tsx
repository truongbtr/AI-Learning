"use client";

import { Dumbbell, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/utils";

/**
 * The skill drawer of FR-PAR-02: history, the evidence behind it, and the button that turns
 * looking into doing.
 *
 * The evidence list is the reason this drawer exists. A number saying 43/100 is an opinion until
 * a parent can see the six questions it was computed from — including the photograph of the page
 * their child wrote on, which phase 4 put in the database.
 */

interface SkillDetail {
  skill: {
    code: string;
    nameVi: string;
    nameEn: string;
    subject: string;
    strand: string;
    description: string;
    expectedWeek: number | null;
    exerciseCount: number;
  };
  currentWeek: number | null;
  current: {
    mastery: number;
    confidence: number;
    evidenceCount: number;
    status: string;
    trend14d: number;
    nextReviewAt: string | null;
  } | null;
  remediation: { rung: number; errorCode: string | null; startedAt: string } | null;
  prerequisites: { code: string; nameVi: string; mastery: number; status: string }[];
  history: { at: string; masteryAfter: number; cause: string }[];
  evidence: {
    id: string;
    observedAt: string;
    source: string;
    outcome: string;
    score: number;
    errorNameVi: string | null;
    questionText: string | null;
    studentAnswer: string | null;
    blankReason: string | null;
    photoKey: string | null;
    intakeResultId: string | null;
  }[];
  evidenceTotal: number;
}

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Chưa có bằng chứng",
  LEARNING: "Đang học",
  NEEDS_PRACTICE: "Cần củng cố",
  SOLID: "Đã vững",
  MASTERED: "Thành thạo",
};

const SOURCE_LABEL: Record<string, string> = {
  EXERCISE: "bài luyện",
  INTAKE_PHOTO: "ảnh bài vở",
  INTAKE_TEACHER_NOTE: "nhận xét của cô",
  HOMEWORK: "bài cô giao",
  EXTERNAL_REPORT: "NAVIO / Kids A-Z",
  PARENT_NOTE: "ba mẹ ghi",
  PARENT_OVERRIDE: "ba mẹ đặt tay",
  VOICE_TUTOR: "gia sư giọng nói",
};

const OUTCOME_LABEL: Record<string, string> = {
  CORRECT: "làm được",
  PARTIAL: "gần đúng",
  INCORRECT: "chưa được",
  OBSERVED: "ghi nhận",
};

const BLANK_LABEL: Record<string, string> = {
  NOT_FINISHED: "con chưa làm xong",
  DOES_NOT_KNOW: "con chưa biết làm",
};

export function SkillDrawer({
  studentId,
  nickname,
  skillCode,
  onClose,
}: {
  studentId: string;
  nickname: string;
  skillCode: string | null;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<SkillDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [practising, setPractising] = useState(false);
  const [practised, setPractised] = useState<{ sessionId: string; skills: string[] } | null>(null);

  useEffect(() => {
    if (!skillCode) return;
    setDetail(null);
    setPractised(null);
    setError(null);
    setLoading(true);
    fetch(`/api/students/${studentId}/skill-detail?skill=${encodeURIComponent(skillCode)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Không tải được kỹ năng");
        setDetail(data as SkillDetail);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [skillCode, studentId]);

  const practiseToday = async () => {
    if (!skillCode) return;
    setPractising(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions/targeted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, skillCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Không tạo được phiên luyện");
      setPractised({ sessionId: data.sessionId, skills: data.skillCodes ?? [] });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPractising(false);
    }
  };

  const peak = Math.max(100, ...(detail?.history.map((h) => h.masteryAfter) ?? [0]));

  return (
    <Dialog
      open={Boolean(skillCode)}
      onClose={onClose}
      title={detail?.skill.nameVi ?? skillCode ?? ""}
      description={detail ? `${detail.skill.nameEn} · ${detail.skill.code}` : undefined}
      className="w-[min(94vw,44rem)]"
    >
      {loading ? (
        <p className="flex items-center gap-2 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mb-3 text-sm font-medium text-danger-600">
          {error}
        </p>
      ) : null}

      {detail ? (
        <div className="flex flex-col gap-5">
          <section className="flex flex-wrap items-end gap-x-6 gap-y-2">
            <div>
              <p className="text-xs font-medium text-ink-500">Hiện tại</p>
              <p className="text-2xl font-bold tabular-nums text-ink-900">
                {detail.current ? Math.round(detail.current.mastery) : 0}
                <span className="text-base font-medium text-ink-400">/100</span>
              </p>
              <p className="text-xs text-ink-400">
                {STATUS_LABEL[detail.current?.status ?? "NOT_STARTED"]} ·{" "}
                {detail.current?.evidenceCount ?? 0} bằng chứng
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-500">Lộ trình mong đợi</p>
              <p className="text-sm font-semibold text-ink-800" data-testid="expected-week">
                {detail.skill.expectedWeek
                  ? `Lớp học tuần ${detail.skill.expectedWeek}`
                  : "Không gắn tuần cụ thể"}
              </p>
              <p className="text-xs text-ink-400">
                {detail.currentWeek == null
                  ? "chưa biết đang tuần mấy"
                  : detail.skill.expectedWeek == null
                    ? `đang tuần ${detail.currentWeek}`
                    : detail.skill.expectedWeek > detail.currentWeek
                      ? `còn ${detail.skill.expectedWeek - detail.currentWeek} tuần nữa lớp mới học`
                      : (detail.current?.evidenceCount ?? 0) === 0
                        ? "lớp đã học mà con chưa có bằng chứng nào"
                        : "đúng nhịp lớp"}
              </p>
            </div>
            {detail.remediation ? (
              <div>
                <p className="text-xs font-medium text-ink-500">Thang rèn</p>
                <p className="text-sm font-semibold text-warning-700">
                  bậc {detail.remediation.rung}/6
                </p>
                <p className="text-xs text-ink-400">
                  từ {formatDateTime(detail.remediation.startedAt)}
                </p>
              </div>
            ) : null}
          </section>

          {detail.skill.description ? (
            <p className="rounded-control bg-surface-muted px-3 py-2 text-sm text-ink-600">
              {detail.skill.description}
            </p>
          ) : null}

          {/* "Luyện hôm nay" — the button that turns a chart into an evening. */}
          <section className="flex flex-col gap-2 rounded-control border border-brand-200 bg-brand-50/50 p-3">
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={practiseToday} loading={practising} data-testid="practise-today">
                <Dumbbell className="h-4 w-4" /> Luyện hôm nay
              </Button>
              <p className="text-xs text-ink-500">
                Tạo một phiên riêng cho {nickname} chỉ gồm kỹ năng này
                {detail.prerequisites.some((p) => p.mastery < 60)
                  ? " và tiên quyết chưa vững của nó"
                  : ""}
                . Nhiệm vụ hôm nay của con không đổi.
              </p>
            </div>
            {practised ? (
              <p className="text-sm font-semibold text-success-700" data-testid="practise-created">
                Đã tạo phiên luyện gồm {practised.skills.length} kỹ năng:{" "}
                {practised.skills.join(", ")}. Con mở "Góc của con" là thấy.
              </p>
            ) : null}
            {detail.skill.exerciseCount < 10 ? (
              <p className="text-xs text-warning-700">
                Ngân hàng chỉ còn {detail.skill.exerciseCount} bài đã phát hành cho kỹ năng này.
              </p>
            ) : null}
          </section>

          {detail.prerequisites.length > 0 ? (
            <section>
              <h3 className="mb-1.5 text-sm font-bold text-ink-900">Tiên quyết</h3>
              <ul className="flex flex-wrap gap-1.5 text-xs">
                {detail.prerequisites.map((p) => (
                  <li
                    key={p.code}
                    className={`rounded-full px-2.5 py-1 font-semibold ring-1 ring-inset ${
                      p.mastery < 60
                        ? "bg-warning-50 text-warning-700 ring-warning-200"
                        : "bg-success-50 text-success-700 ring-success-200"
                    }`}
                  >
                    {p.nameVi} · {p.mastery}/100
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {detail.history.length > 0 ? (
            <section>
              <h3 className="mb-1.5 text-sm font-bold text-ink-900">
                Lịch sử ({detail.history.length} lần đổi)
              </h3>
              <div className="flex h-20 items-end gap-0.5" aria-hidden>
                {detail.history.map((h) => (
                  <span
                    key={`${h.at}-${h.masteryAfter}`}
                    title={`${formatDateTime(h.at)} · ${h.masteryAfter}/100 · ${h.cause}`}
                    style={{ height: `${Math.max(4, (h.masteryAfter / peak) * 100)}%` }}
                    className="min-w-[3px] flex-1 rounded-sm bg-brand-300"
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-ink-400">
                {formatDateTime(detail.history[0]?.at)} →{" "}
                {formatDateTime(detail.history.at(-1)?.at)}
              </p>
            </section>
          ) : null}

          <section>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-ink-900">
                Bằng chứng ({detail.evidenceTotal})
              </h3>
              <Link
                href={`/parent/${studentId}/evidence?skill=${detail.skill.code}`}
                className="text-xs font-semibold text-brand-700 hover:underline"
              >
                Xem tất cả
              </Link>
            </div>
            {detail.evidence.length === 0 ? (
              <p className="text-sm text-ink-500">
                Chưa có bằng chứng nào. Chụp bài vở của con hoặc cho con luyện một phiên là có.
              </p>
            ) : (
              <ul className="flex flex-col gap-2" data-testid="drawer-evidence">
                {detail.evidence.map((e) => (
                  <li
                    key={e.id}
                    className="flex gap-3 rounded-control border border-ink-100 p-2.5 text-sm"
                  >
                    {e.photoKey ? (
                      <a
                        href={filesHref(e.photoKey)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
                      >
                        {/* biome-ignore lint/performance/noImgElement: guarded API route, not a static asset */}
                        <img
                          src={filesHref(e.photoKey)}
                          alt="Ảnh bài vở"
                          loading="lazy"
                          className="h-16 w-16 rounded-control border border-ink-100 object-cover"
                        />
                      </a>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-ink-800">
                        {e.questionText || "(không có đề bài)"}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {OUTCOME_LABEL[e.outcome] ?? e.outcome} ·{" "}
                        {SOURCE_LABEL[e.source] ?? e.source}
                        {e.studentAnswer ? ` · con viết "${e.studentAnswer}"` : ""}
                        {e.blankReason ? ` · ${BLANK_LABEL[e.blankReason]}` : ""}
                        {e.errorNameVi ? ` · ${e.errorNameVi}` : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-400">
                        {formatDateTime(e.observedAt)}
                        {e.intakeResultId ? (
                          <>
                            {" · "}
                            <Link
                              href={`/parent/intake/${e.intakeResultId}`}
                              className="inline-flex items-center gap-1 text-brand-700 hover:underline"
                            >
                              mở lô ảnh <ExternalLink className="h-3 w-3" />
                            </Link>
                          </>
                        ) : null}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </Dialog>
  );
}

function filesHref(key: string): string {
  return `/api/files/${key.split("/").map(encodeURIComponent).join("/")}`;
}
