"use client";

import { CalendarCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

/**
 * docs/11 §5 step 1: the system works out when the school year really started, and a parent
 * confirms it once. Nothing moves until they do — `expectedWeek` for every skill is measured
 * against these weeks, so a silent change would silently re-label how far along a child is.
 */

export interface Proposal {
  current: { weekOneFrom: string | null; weeks: number };
  guess: {
    weekOneMonday: string;
    firstTeachingDay: string;
    from: { date: string; lessonNumber: number };
    teachingDays: number;
    agreeing: number;
    disagreeing: { date: string; lessonNumber: number; weekOneMonday: string }[];
  } | null;
  sightings: { date: string; lessonNumber: number; lessonRefText: string }[];
  changed: boolean;
}

export function SchoolYearCard({ proposal }: { proposal: Proposal }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chosen, setChosen] = useState(proposal.guess?.weekOneMonday ?? "");

  const apply = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/school-year", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startMonday: chosen }),
      });
      const data = (await res.json()) as { from?: string; weeks?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Không đặt lại được lịch");
      setDone(`Đã đặt tuần 1 từ ${data.from} (${data.weeks} tuần).`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <CardTitle>Ngày bắt đầu năm học</CardTitle>
        <CardDescription>
          Suy ra từ chuỗi bài Tiếng Việt trong nhật ký lớp: mỗi buổi học một bài, trừ cuối tuần và
          ngày lễ.
        </CardDescription>
      </div>

      <p className="text-sm text-ink-700">
        Đang dùng: <strong>{proposal.current.weekOneFrom ?? "chưa có"}</strong> ·{" "}
        {proposal.current.weeks} tuần
      </p>

      {proposal.guess ? (
        <>
          <div className="rounded-control border border-brand-200 bg-brand-50 p-3 text-sm text-brand-800">
            <p>
              Hệ thống đề nghị tuần 1 bắt đầu <strong>{proposal.guess.weekOneMonday}</strong> — buổi
              học đầu tiên {proposal.guess.firstTeachingDay}.
            </p>
            <p className="mt-1">
              Căn cứ: ngày {proposal.guess.from.date} lớp học bài {proposal.guess.from.lessonNumber}{" "}
              → đếm ngược {proposal.guess.teachingDays} buổi học.
              {proposal.guess.agreeing > 1
                ? ` ${proposal.guess.agreeing} ngày khác cũng khớp.`
                : ""}
            </p>
            {proposal.guess.disagreeing.length > 0 ? (
              <p className="mt-1 text-warning-700">
                {proposal.guess.disagreeing.length} ngày không khớp (
                {proposal.guess.disagreeing
                  .map((d) => `${d.date}: bài ${d.lessonNumber} → ${d.weekOneMonday}`)
                  .join("; ")}
                ) — có thể lớp học dồn hoặc ôn lại.
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-ink-700">
              Đặt tuần 1 từ (thứ Hai)
              <input
                type="date"
                value={chosen}
                onChange={(e) => setChosen(e.target.value)}
                className="h-11 rounded-control border border-ink-200 bg-white px-3 text-sm"
              />
            </label>
            <Button onClick={apply} disabled={busy || !chosen} data-testid="apply-school-year">
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarCheck className="h-4 w-4" />
              )}
              Xác nhận và đặt lại 35 tuần
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm text-ink-500">
          Chưa đủ dữ liệu. Dán vài ngày nhật ký lớp có “Bài &lt;số&gt;” môn Tiếng Việt rồi quay lại.
        </p>
      )}

      {done ? <p className="text-sm font-semibold text-success-700">{done}</p> : null}
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger-600">
          {error}
        </p>
      ) : null}

      {proposal.sightings.length > 0 ? (
        <details className="text-sm text-ink-600">
          <summary className="cursor-pointer">Các mốc bài đã thấy trong nhật ký</summary>
          <ul className="mt-1 list-disc pl-5">
            {proposal.sightings.map((s) => (
              <li key={`${s.date}-${s.lessonNumber}`}>
                {s.date}: bài {s.lessonNumber} — {s.lessonRefText}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </Card>
  );
}
