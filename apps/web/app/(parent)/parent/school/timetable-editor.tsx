"use client";

import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * P12 — sửa thời khoá biểu (FR-PAR-06, docs/05 §2).
 *
 * The grid mirrors the sheet the school hands out, so a parent can check it against the paper on
 * the fridge line by line. What they change is the one thing the app needs and the paper does not
 * carry: which of the six core subjects a period belongs to. "Life+ (PTCN)" is a real period with
 * no skill map behind it, and saying so is a valid answer.
 *
 * The consequence is on the screen, because a screen with no visible consequence does not get
 * used: change a Tuesday and tomorrow's session leads with a different subject.
 */

const WEEKDAY_LABEL = ["", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6"];

const SUBJECT_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "— không tính năng lực —" },
  { value: "VIET", label: "Tiếng Việt" },
  { value: "VMATH", label: "Toán (VN)" },
  { value: "ESL", label: "ESL" },
  { value: "ENL", label: "ENL (đọc–viết)" },
  { value: "EMATH", label: "English Maths" },
  { value: "ESCI", label: "English Science" },
];

export interface TimetableData {
  className: string;
  schoolYear: string;
  validFrom: string;
  periods: { period: string; timeFrom: string; timeTo: string }[];
  slots: {
    weekday: number;
    period: string;
    subjectLabelVi: string;
    subject: string | null;
    isNative: boolean;
  }[];
}

export function TimetableEditor({ initial }: { initial: TimetableData }) {
  const router = useRouter();
  const [slots, setSlots] = useState(initial.slots);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const key = (weekday: number, period: string) => `${weekday}:${period}`;
  const at = (weekday: number, period: string) =>
    slots.find((s) => s.weekday === weekday && s.period === period);

  const setSubject = (weekday: number, period: string, subject: string) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.weekday === weekday && s.period === period ? { ...s, subject: subject || null } : s,
      ),
    );
    setDirty((prev) => new Set(prev).add(key(weekday, period)));
    setSaved(null);
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const changed = slots.filter((s) => dirty.has(key(s.weekday, s.period)));
      const res = await fetch("/api/timetable", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          className: initial.className,
          slots: changed.map((s) => ({
            weekday: s.weekday,
            period: s.period,
            subject: s.subject,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Không lưu được");
      setSaved(changed.length);
      setDirty(new Set());
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-3" data-testid="timetable-editor">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>
            Thời khoá biểu lớp {initial.className} · {initial.schoolYear}
          </CardTitle>
          <CardDescription>
            Chọn môn cốt lõi cho từng tiết. Phiên học tối nay ưu tiên môn lớp có tiết hôm nay
            (docs/05 §2) — đổi ở đây là ngày mai Daily Quest đổi môn ưu tiên.
          </CardDescription>
        </div>
        <Button
          onClick={save}
          loading={busy}
          disabled={dirty.size === 0}
          data-testid="save-timetable"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Lưu {dirty.size > 0 ? `${dirty.size} ô` : ""}
        </Button>
      </div>

      {saved !== null ? (
        <p className="text-sm font-semibold text-success-700" data-testid="timetable-saved">
          Đã lưu {saved} tiết. Phiên học ngày mai sẽ theo bảng mới.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger-600">
          {error}
        </p>
      ) : null}

      <div className="thin-scrollbar overflow-x-auto">
        <table className="w-full min-w-[46rem] border-separate border-spacing-1 text-sm">
          <thead>
            <tr>
              <th className="w-24 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400">
                Tiết
              </th>
              {[1, 2, 3, 4, 5].map((d) => (
                <th
                  key={d}
                  className="text-left text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400"
                >
                  {WEEKDAY_LABEL[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {initial.periods.map((p) => (
              <tr key={p.period}>
                <th className="whitespace-nowrap text-left align-top text-xs font-semibold text-ink-600">
                  {p.period}
                  <span className="block font-normal text-ink-400">
                    {p.timeFrom}–{p.timeTo}
                  </span>
                </th>
                {[1, 2, 3, 4, 5].map((d) => {
                  const slot = at(d, p.period);
                  const isDirty = dirty.has(key(d, p.period));
                  return (
                    <td key={d} className="align-top">
                      <div
                        className={cn(
                          "rounded-control border p-1.5",
                          isDirty ? "border-brand-400 bg-brand-50" : "border-ink-100",
                        )}
                      >
                        <p className="truncate text-xs text-ink-500" title={slot?.subjectLabelVi}>
                          {slot?.subjectLabelVi ?? "—"}
                        </p>
                        <select
                          aria-label={`Môn tiết ${p.period} ${WEEKDAY_LABEL[d]}`}
                          data-testid={`slot-${d}-${p.period}`}
                          value={slot?.subject ?? ""}
                          onChange={(e) => setSubject(d, p.period, e.target.value)}
                          className="mt-1 h-9 w-full rounded-control border border-ink-200 bg-white px-1.5 text-xs font-semibold text-ink-800"
                        >
                          {SUBJECT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
