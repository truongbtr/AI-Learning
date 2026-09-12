import type { AttentionPoint } from "@mtct/core";
import { ArrowUpRight, Layers, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * "3 điều cần chú ý" (docs/04 §11.5, FR-PAR-01) — the four facts the document asks for, and a link
 * that opens the questions the child actually got wrong.
 *
 * The ranking and the wording come from `@mtct/core/attention`, computed by rule. There is no
 * score here and no colour scale: a parent should read three sentences, not decode a chart.
 */

const KIND_LABEL: Record<AttentionPoint["kind"], string> = {
  ERROR: "Lỗi lặp lại",
  BEHAVIOUR: "Thói quen làm bài",
  SKILL: "Kỹ năng",
  PREREQUISITE: "Gốc rễ",
};

/** Where the number goes when a parent taps it — always the same evidence list, pre-filtered. */
export function evidenceHref(studentId: string, point: AttentionPoint): string {
  const params = new URLSearchParams();
  if (point.errorCode) params.set("error", point.errorCode);
  else if (point.skillCode) params.set("skill", point.skillCode);
  params.set("days", "30");
  return `/parent/${studentId}/evidence?${params.toString()}`;
}

export function AttentionList({
  studentId,
  points,
  compact = false,
}: {
  studentId: string;
  points: AttentionPoint[];
  /** P2 shows the headline; P3 shows the whole thing including tonight's five minutes. */
  compact?: boolean;
}) {
  if (points.length === 0)
    return (
      <p className="text-sm text-ink-500">
        Chưa có gì phải chú ý — không có lỗi nào lặp lại và không kỹ năng nào đi xuống.
      </p>
    );

  return (
    <ol className="flex flex-col gap-2" data-testid="attention-points">
      {points.map((point, index) => (
        <li key={`${point.kind}-${point.errorCode ?? point.skillCode ?? index}`}>
          <Link
            href={evidenceHref(studentId, point)}
            className={cn(
              "group flex gap-3 rounded-control border border-ink-100 p-3 transition-colors hover:border-brand-300 hover:bg-brand-50/40",
              point.kind === "BEHAVIOUR" && "border-dashed",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                point.kind === "PREREQUISITE"
                  ? "bg-info-50 text-info-600"
                  : point.kind === "BEHAVIOUR"
                    ? "bg-ink-100 text-ink-500"
                    : "bg-warning-50 text-warning-600",
              )}
              aria-hidden
            >
              {point.kind === "PREREQUISITE" ? (
                <Layers className="h-4 w-4" />
              ) : (
                <TriangleAlert className="h-4 w-4" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-bold text-ink-900">{point.title}</span>
                <span className="text-xs font-semibold text-warning-700">{point.countLabel}</span>
              </span>
              <span className="mt-0.5 block text-xs text-ink-400">
                {KIND_LABEL[point.kind]}
                {point.rung
                  ? ` · đang rèn bậc ${point.rung}/6: ${point.rungLabel}`
                  : " · chưa vào thang rèn"}
              </span>
              {compact ? null : (
                <span className="mt-1.5 block rounded-control bg-surface-muted px-2.5 py-1.5 text-[13px] leading-relaxed text-ink-700">
                  <strong className="font-semibold">5 phút tối nay:</strong> {point.suggestion}
                </span>
              )}
            </span>
            <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </li>
      ))}
    </ol>
  );
}
