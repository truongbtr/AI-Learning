"use client";

import { Check, GripVertical, Plus, Sparkles, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardDescription, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

/**
 * P9 — kế hoạch (FR-PAR-03, docs/08 pha 5 việc 3).
 *
 * The queue proposes; a parent decides. Three things follow from that and shape this screen:
 *
 *  - **The reason is next to the skill, always.** A parent approving a fortnight of their child's
 *    evenings should be able to disagree with a specific sentence, not with a list of codes.
 *  - **Editing is not approving.** Changing the order or dropping a skill saves and leaves the
 *    plan proposed; approving is a separate, deliberate button.
 *  - **Approving says what it will do.** "Từ mai, ít nhất một nửa số bài trong phiên sẽ thuộc kế
 *    hoạch này" — the promise the planner actually keeps (docs/08 pha 5, tiêu chí 3).
 */

export interface PlanItemView {
  id: string;
  skillCode: string;
  skillNameVi: string;
  subject: string;
  priority: number;
  reason: string | null;
  targetMastery: number;
  sessionsPlanned: number;
  sessionsDone: number;
  mastery: number;
  masteryStatus: string;
  exerciseCount: number;
}

export interface PlanView {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: string;
  rationale: string | null;
  createdBy: string;
  approvedAt: string | null;
  approvedBy: string | null;
  items: PlanItemView[];
}

const STATUS: Record<string, { label: string; tone: "brand" | "success" | "neutral" | "warning" }> =
  {
    PROPOSED: { label: "Đề xuất — chờ ba mẹ", tone: "warning" },
    APPROVED: { label: "Đã duyệt — đang lái phiên học", tone: "success" },
    ACTIVE: { label: "Đang chạy", tone: "success" },
    DONE: { label: "Đã xong", tone: "neutral" },
    REJECTED: { label: "Đã bỏ", tone: "neutral" },
  };

const MASTERY_LABEL: Record<string, string> = {
  NOT_STARTED: "chưa có bằng chứng",
  LEARNING: "đang học",
  NEEDS_PRACTICE: "cần củng cố",
  SOLID: "đã vững",
  MASTERED: "thành thạo",
};

export function PlanClient({
  studentId,
  nickname,
  initialPlans,
  queued,
}: {
  studentId: string;
  nickname: string;
  initialPlans: PlanView[];
  /** A PLAN task already waiting in the queue, if any. */
  queued: { weekStart: string; status: string } | null;
}) {
  const router = useRouter();
  const [plans, setPlans] = useState(initialPlans);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, PlanItemView[]>>({});

  const post = async (body: unknown, key: string) => {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch(`/api/students/${studentId}/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Không thực hiện được");
      return data;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setBusy(null);
    }
  };

  const refresh = async () => {
    const res = await fetch(`/api/students/${studentId}/plans`);
    if (res.ok) setPlans(((await res.json()) as { plans: PlanView[] }).plans);
    router.refresh();
  };

  const request = async () => {
    const data = await post({ action: "request", weeks: 1 }, "request");
    if (data)
      setNotice(
        `Đã xếp vào hàng chờ cho tuần ${data.weekStart}. Mở Claude Code và nói "Xử lý hàng chờ AI" — hoặc chạy: pnpm inbox:pull → pnpm inbox:push.`,
      );
    await refresh();
  };

  const itemsOf = (plan: PlanView) => draft[plan.id] ?? plan.items;

  const move = (plan: PlanView, index: number, by: number) => {
    const items = [...itemsOf(plan)];
    const to = index + by;
    if (to < 0 || to >= items.length) return;
    const [moved] = items.splice(index, 1);
    if (moved) items.splice(to, 0, moved);
    setDraft({
      ...draft,
      [plan.id]: items.map((i, n) => ({ ...i, priority: Math.min(5, n + 1) })),
    });
  };

  const drop = (plan: PlanView, code: string) => {
    const items = itemsOf(plan).filter((i) => i.skillCode !== code);
    setDraft({
      ...draft,
      [plan.id]: items.map((i, n) => ({ ...i, priority: Math.min(5, n + 1) })),
    });
  };

  const saveEdits = async (plan: PlanView) => {
    const items = itemsOf(plan);
    const data = await post(
      {
        action: "edit",
        planId: plan.id,
        items: items.map((i) => ({
          skillCode: i.skillCode,
          priority: i.priority,
          reason: i.reason,
          sessionsPlanned: i.sessionsPlanned,
          targetMastery: i.targetMastery,
        })),
      },
      `edit-${plan.id}`,
    );
    if (data) {
      setDraft({ ...draft, [plan.id]: undefined as never });
      setNotice("Đã lưu chỉnh sửa. Kế hoạch vẫn ở trạng thái chờ duyệt.");
      await refresh();
    }
  };

  const approve = async (plan: PlanView) => {
    const items = itemsOf(plan);
    // Save first when a parent edited and approved in one go: approving what is on screen.
    if (draft[plan.id]) await saveEdits(plan);
    const data = await post({ action: "approve", planId: plan.id }, `approve-${plan.id}`);
    if (data) {
      setNotice(
        `Đã duyệt. Từ phiên kế tiếp, ít nhất một nửa số bài của ${nickname} thuộc ${items.length} kỹ năng này.`,
      );
      await refresh();
    }
  };

  const reject = async (plan: PlanView) => {
    if (await post({ action: "reject", planId: plan.id }, `reject-${plan.id}`)) await refresh();
  };

  const proposed = plans.filter((p) => p.status === "PROPOSED");
  const rest = plans.filter((p) => p.status !== "PROPOSED");

  return (
    <div className="flex flex-col gap-5">
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger-600">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          data-testid="plan-notice"
          className="rounded-control border border-success-100 bg-success-50 px-3 py-2 text-sm font-medium text-success-800"
        >
          {notice}
        </p>
      ) : null}

      <Card className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <CardTitle>Đề xuất kế hoạch mới</CardTitle>
          <CardDescription>
            App không gọi AI (ADR-10). Bấm nút này để xếp một việc <code>PLAN</code> vào hàng chờ;
            Claude Code đọc snapshot năng lực, thời khoá biểu và bài lớp đang học rồi viết đề xuất
            về đây.
          </CardDescription>
        </div>
        <Button onClick={request} loading={busy === "request"} data-testid="request-plan">
          <Sparkles className="h-4 w-4" /> Nhờ Claude Code đề xuất
        </Button>
      </Card>

      {queued ? (
        <p className="rounded-control border border-info-100 bg-info-50 px-3 py-2 text-sm text-info-800">
          Đã có một việc <code>PLAN</code> cho tuần {queued.weekStart} trong hàng chờ (
          {queued.status === "PENDING" ? "chưa xuất ra đĩa" : "đã xuất, chờ đọc"}). Chạy{" "}
          <code>pnpm inbox:pull</code> rồi <code>pnpm inbox:push</code>.
        </p>
      ) : null}

      {proposed.length === 0 && rest.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-500">
            Chưa có kế hoạch nào. Không sao — planner vẫn chạy theo thời khoá biểu và bài lớp học
            hôm nay (FR-PAR-03).
          </p>
        </Card>
      ) : null}

      {[...proposed, ...rest].map((plan) => {
        const items = itemsOf(plan);
        const edited = Boolean(draft[plan.id]);
        const status = STATUS[plan.status] ?? STATUS.DONE;
        return (
          <Card key={plan.id} className="flex flex-col gap-3" data-testid={`plan-${plan.status}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle>
                  Tuần {plan.weekStart} → {plan.weekEnd}
                </CardTitle>
                <CardDescription>
                  {plan.createdBy === "AI" ? "Claude Code đề xuất qua hàng chờ" : "Ba mẹ tự soạn"}
                  {plan.approvedBy ? ` · ${plan.approvedBy} đã duyệt` : ""}
                  {plan.approvedAt ? ` ${formatDateTime(plan.approvedAt)}` : ""}
                </CardDescription>
              </div>
              <Badge tone={status?.tone ?? "neutral"} dot>
                {status?.label}
              </Badge>
            </div>

            {plan.rationale ? (
              <p className="rounded-control bg-surface-muted px-3 py-2 text-sm leading-relaxed text-ink-700">
                {plan.rationale}
              </p>
            ) : null}

            <ol className="flex flex-col gap-2" data-testid="plan-items">
              {items.map((item, index) => (
                <li
                  key={item.skillCode}
                  className="flex items-start gap-3 rounded-control border border-ink-100 p-3"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-100 text-xs font-bold text-ink-600">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink-900">
                      {item.skillNameVi}
                      <span className="ml-2 text-xs font-normal text-ink-400">
                        {item.mastery}/100 · {MASTERY_LABEL[item.masteryStatus]}
                      </span>
                    </p>
                    {item.reason ? (
                      <p className="mt-0.5 text-sm text-ink-600">{item.reason}</p>
                    ) : null}
                    <p className="mt-0.5 text-xs text-ink-400">
                      {item.skillCode} · mục tiêu {item.targetMastery}/100 · {item.sessionsPlanned}{" "}
                      phiên
                      {item.sessionsDone > 0 ? ` (đã ${item.sessionsDone})` : ""}
                      {item.exerciseCount < 10
                        ? ` · chỉ còn ${item.exerciseCount} bài trong ngân hàng`
                        : ""}
                    </p>
                  </div>
                  {plan.status === "PROPOSED" ? (
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        aria-label="Lên trên"
                        onClick={() => move(plan, index, -1)}
                        className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                      >
                        <GripVertical className="h-4 w-4 rotate-90" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Bỏ ${item.skillNameVi}`}
                        onClick={() => drop(plan, item.skillCode)}
                        className="rounded p-1 text-ink-400 hover:bg-danger-50 hover:text-danger-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>

            {plan.status === "PROPOSED" ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => approve(plan)}
                  loading={busy === `approve-${plan.id}`}
                  data-testid="approve-plan"
                >
                  <Check className="h-4 w-4" /> Duyệt kế hoạch
                </Button>
                {edited ? (
                  <Button
                    variant="outline"
                    onClick={() => saveEdits(plan)}
                    loading={busy === `edit-${plan.id}`}
                  >
                    <Plus className="h-4 w-4 rotate-45" /> Lưu chỉnh sửa
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  onClick={() => reject(plan)}
                  loading={busy === `reject-${plan.id}`}
                >
                  <X className="h-4 w-4" /> Bỏ
                </Button>
                <p className="text-xs text-ink-500">
                  Duyệt xong, từ phiên kế tiếp ít nhất một nửa số bài của {nickname} thuộc kế hoạch
                  này.
                </p>
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
