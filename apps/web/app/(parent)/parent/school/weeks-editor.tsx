"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * The 35 weeks, and the two things a family changes about them (P12, FR-PAR-06): which ones are
 * holidays, and a note about why.
 *
 * `Skill.expectedWeek` counts against this list, so marking Tết as a holiday is how a family says
 * "the class did not move that week" — without it every skill silently looks a fortnight late in
 * February.
 */

export interface WeekRow {
  id: string;
  weekNo: number;
  dateFrom: string;
  dateTo: string;
  term: number;
  isHoliday: boolean;
  note: string | null;
  isCurrent: boolean;
}

export function WeeksEditor({ initial }: { initial: WeekRow[] }) {
  const router = useRouter();
  const [weeks, setWeeks] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const patch = async (weekId: string, edit: { isHoliday?: boolean; note?: string | null }) => {
    setBusy(weekId);
    setError(null);
    try {
      const res = await fetch("/api/school-year", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekId, ...edit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Không lưu được");
      setWeeks((prev) => prev.map((w) => (w.id === weekId ? { ...w, ...data.week } : w)));
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const holidays = weeks.filter((w) => w.isHoliday).length;

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <CardTitle>35 tuần của năm học</CardTitle>
        <CardDescription>
          Đánh dấu tuần nghỉ để lộ trình mong đợi không tính nhầm ({holidays} tuần đang là nghỉ).
          Đổi ngày bắt đầu ở thẻ trên sẽ tính lại toàn bộ danh sách này.
        </CardDescription>
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger-600">
          {error}
        </p>
      ) : null}
      <ul className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3" data-testid="school-weeks">
        {weeks.map((w) => (
          <li
            key={w.id}
            className={cn(
              "flex items-center gap-2 rounded-control border px-2.5 py-2 text-sm",
              w.isCurrent ? "border-brand-400 bg-brand-50" : "border-ink-100",
              w.isHoliday && "bg-ink-50 text-ink-400",
              busy === w.id && "opacity-60",
            )}
          >
            <span className="w-16 shrink-0 font-semibold text-ink-700">Tuần {w.weekNo}</span>
            <span className="min-w-0 flex-1 truncate text-xs text-ink-500">
              {w.dateFrom} → {w.dateTo}
              {w.isCurrent ? <strong className="ml-1 text-brand-700">· tuần này</strong> : null}
              {w.note ? <span className="ml-1">· {w.note}</span> : null}
            </span>
            <label className="flex shrink-0 items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={w.isHoliday}
                disabled={busy === w.id}
                onChange={(e) => patch(w.id, { isHoliday: e.target.checked })}
                data-testid={`holiday-${w.weekNo}`}
                className="h-4 w-4"
              />
              nghỉ
            </label>
          </li>
        ))}
      </ul>
    </Card>
  );
}
