import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatTone = "neutral" | "success" | "warning" | "danger";

/**
 * Small stat tile for the adult area (docs/06 §2): label, big value, caption.
 * Neutral by default; a tone only marks something the parent must act on.
 */
export function Stat({
  label,
  value,
  caption,
  icon,
  tone = "neutral",
  className,
}: {
  label: string;
  value: string | number;
  caption?: string;
  icon?: ReactNode;
  tone?: StatTone;
  className?: string;
}) {
  const tile = {
    neutral: "bg-ink-100 text-ink-600",
    success: "bg-success-50 text-success-600",
    warning: "bg-warning-50 text-warning-600",
    danger: "bg-danger-50 text-danger-600",
  }[tone];
  return (
    <article
      className={cn(
        "flex items-center gap-3 rounded-card border border-ink-100 bg-white p-4 shadow-card",
        className,
      )}
    >
      {icon ? (
        <span
          className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", tile)}
        >
          {icon}
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-ink-500">{label}</p>
        <p className="mt-0.5 truncate text-lg font-bold text-ink-900">{value}</p>
        {caption ? <p className="mt-0.5 truncate text-xs text-ink-400">{caption}</p> : null}
      </div>
    </article>
  );
}
