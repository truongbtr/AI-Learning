import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** MEDIFA ONE `KpiCard`: icon tile + label + big value + optional caption. */
export function KpiCard({
  label,
  value,
  caption,
  icon,
  tone = "brand",
  className,
}: {
  label: string;
  value: string | number;
  caption?: string;
  icon: ReactNode;
  tone?: "brand" | "success" | "warning" | "danger";
  className?: string;
}) {
  const tile = {
    brand: "bg-brand-50 text-brand-600",
    success: "bg-success-50 text-success-600",
    warning: "bg-warning-50 text-warning-600",
    danger: "bg-danger-50 text-danger-600",
  }[tone];
  return (
    <article
      className={cn(
        "flex items-center gap-4 rounded-card border border-ink-100 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover",
        className,
      )}
    >
      <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", tile)}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-ink-400">{label}</p>
        <p className="mt-0.5 truncate text-xl font-extrabold text-ink-900">{value}</p>
        {caption ? <p className="mt-1 text-xs text-ink-400">{caption}</p> : null}
      </div>
    </article>
  );
}
