import type { SubjectCard } from "@mtct/db";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * A card per subject (FR-PAR-01, docs/06 §2.1 P3): where the child stands, how the fortnight went,
 * how much of it came from real evidence — and every one of those numbers is a link.
 *
 * The subjects are the six of `docs/05` §1, which are the five core areas of `docs/00` with the
 * two English skill maps (ESL and reading/writing ENL) kept apart, because their skills are.
 */

function TrendBadge({ value }: { value: number }) {
  const Icon = value > 1 ? TrendingUp : value < -1 ? TrendingDown : Minus;
  const tone = value > 1 ? "text-success-600" : value < -1 ? "text-warning-700" : "text-ink-400";
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", tone)}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {value > 0 ? `+${value}` : value === 0 ? "đi ngang" : value}
      <span className="font-normal text-ink-400">14 ngày</span>
    </span>
  );
}

export function SubjectCards({
  studentId,
  subjects,
}: {
  studentId: string;
  subjects: SubjectCard[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" data-testid="subject-cards">
      {subjects.map((s) => (
        <article
          key={s.subject}
          data-testid={`subject-${s.subject}`}
          className="flex flex-col gap-3 rounded-card border border-ink-100 bg-white p-4 shadow-card"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/parent/${studentId}/skills?subject=${s.subject}`}
                className="text-sm font-bold text-ink-900 hover:text-brand-700 hover:underline"
              >
                {s.labelVi}
              </Link>
              <p className="mt-0.5 text-xs text-ink-400">{s.total} kỹ năng trong bản đồ</p>
            </div>
            <TrendBadge value={s.trend14d} />
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tabular-nums text-ink-900">{s.avgMastery}</span>
            <span className="text-sm text-ink-400">/100 trung bình</span>
          </div>

          {/* Four counts, four filters. Nothing here is a number without a page behind it. */}
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            <Count
              href={`/parent/${studentId}/skills?subject=${s.subject}&status=SOLID`}
              label="đã vững"
              value={s.solid}
              tone="success"
            />
            <Count
              href={`/parent/${studentId}/skills?subject=${s.subject}&status=NEEDS_PRACTICE`}
              label="cần củng cố"
              value={s.needsPractice}
              tone="warning"
            />
            <Count
              href={`/parent/${studentId}/skills?subject=${s.subject}&status=LEARNING`}
              label="đang học"
              value={s.learning}
            />
            <Count
              href={`/parent/${studentId}/evidence?subject=${s.subject}&days=7`}
              label="bằng chứng 7 ngày"
              value={s.evidence7d}
            />
          </dl>

          {s.behind > 0 ? (
            <Link
              href={`/parent/${studentId}/skills?subject=${s.subject}&status=NOT_STARTED`}
              className="rounded-control bg-info-50 px-2.5 py-1.5 text-xs font-medium text-info-700 hover:bg-info-100"
            >
              {s.behind} kỹ năng lớp đã học nhưng chưa có bằng chứng nào của con
            </Link>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function Count({
  href,
  label,
  value,
  tone,
}: {
  href: string;
  label: string;
  value: number;
  tone?: "success" | "warning";
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <Link
        href={href}
        className={cn(
          "font-bold tabular-nums hover:underline",
          tone === "success"
            ? "text-success-700"
            : tone === "warning"
              ? "text-warning-700"
              : "text-ink-800",
        )}
      >
        {value}
      </Link>
      <dt className="text-ink-400">{label}</dt>
    </div>
  );
}
