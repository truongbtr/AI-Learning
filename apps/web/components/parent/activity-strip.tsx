import type { DayActivity } from "@mtct/db";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Seven days at a glance (FR-PAR-01). Not a chart — seven columns a parent can point at and say
 * "that Tuesday you did nothing", and each one opens that day's evidence.
 *
 * The weekend is drawn in a lighter tone rather than hidden: an empty Saturday is not a gap.
 */

const WEEKDAY = ["", "T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/** Height of the bar, capped so one heavy evening does not flatten the rest of the week. */
function barHeight(exercises: number): string {
  if (exercises <= 0) return "6%";
  return `${Math.min(100, 18 + exercises * 6)}%`;
}

export function ActivityStrip({ studentId, days }: { studentId: string; days: DayActivity[] }) {
  const today = days.at(-1)?.date;
  return (
    <div className="flex items-end gap-1.5" data-testid="activity-7d">
      {days.map((day) => {
        const weekend = day.weekday >= 6;
        const done = day.exercises > 0 || day.evidence > 0;
        const label = [
          `${day.date}`,
          `${day.exercises} bài`,
          `${day.minutes} phút`,
          `${day.evidence} bằng chứng`,
          day.photos > 0 ? `${day.photos} từ ảnh vở` : null,
        ]
          .filter(Boolean)
          .join(" · ");
        return (
          <Link
            key={day.date}
            href={`/parent/${studentId}/evidence?days=${daysAgo(day.date, today)}`}
            title={label}
            aria-label={label}
            className="group flex min-w-0 flex-1 flex-col items-center gap-1"
          >
            <span className="flex h-16 w-full items-end justify-center rounded-control bg-surface-muted p-1">
              <span
                style={{ height: barHeight(day.exercises) }}
                className={cn(
                  "w-full rounded-[4px] transition-colors",
                  done ? "bg-brand-400 group-hover:bg-brand-500" : "bg-ink-200",
                  day.photos > 0 && "bg-info-400 group-hover:bg-info-500",
                )}
              />
            </span>
            <span
              className={cn(
                "text-[11px] font-semibold",
                weekend ? "text-ink-300" : "text-ink-500",
                day.date === today && "text-ink-900",
              )}
            >
              {WEEKDAY[day.weekday]}
            </span>
            <span className="text-[11px] tabular-nums text-ink-400">{day.exercises || "·"}</span>
          </Link>
        );
      })}
    </div>
  );
}

/** How many days back from today this column is, as the evidence page's `days` window. */
function daysAgo(date: string, today?: string): number {
  if (!today) return 7;
  const diff = Math.round(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86_400_000,
  );
  return Math.max(1, diff + 1);
}
