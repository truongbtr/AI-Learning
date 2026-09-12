"use client";

import { Check, Gift, KeyRound, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * P13 — cài đặt bé (docs/06 §2.1).
 *
 * Every control says what it changes for the child, because none of them is obvious from its own
 * label: fifteen minutes is not a preference, it is the number of exercises tonight; the mascot is
 * which world the child plays in; the picture code is how they get in at all.
 */

const MASCOTS = [
  { value: "OWL", label: "Bạn Cú", world: "Vườn Kỳ Diệu (hồng / tím)" },
  { value: "ROBOT", label: "Bạn Rô-bốt", world: "Thành phố Robot (xanh / cam)" },
] as const;

export interface SettingsData {
  studentId: string;
  nickname: string;
  mascot: string;
  interests: string[];
  dailyMinutes: number;
  suggestedTime: string | null;
  difficultyBias: number;
  pictureSetKey: string;
  pictureSets: {
    key: string;
    nameVi: string;
    pictures: { key: string; emoji: string; labelVi: string }[];
  }[];
  rewardGoal: { id: string; title: string; starsNeeded: number; starsSpent: number } | null;
  starBalance: number;
}

export function SettingsClient({ data }: { data: SettingsData }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [minutes, setMinutes] = useState(data.dailyMinutes);
  const [time, setTime] = useState(data.suggestedTime ?? "");
  const [bias, setBias] = useState(data.difficultyBias);
  const [mascot, setMascot] = useState(data.mascot);
  const [interests, setInterests] = useState(data.interests.join(", "));

  const [setKey, setSetKey] = useState(data.pictureSetKey);
  const [pin, setPin] = useState<string[]>([]);

  const [goalTitle, setGoalTitle] = useState(data.rewardGoal?.title ?? "");
  const [goalStars, setGoalStars] = useState(data.rewardGoal?.starsNeeded ?? 100);

  const send = async (body: unknown, key: string, message: string) => {
    setBusy(key);
    setError(null);
    setSaved(null);
    try {
      const res = await fetch(`/api/students/${data.studentId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Không lưu được");
      setSaved(message);
      router.refresh();
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const pictures = data.pictureSets.find((s) => s.key === setKey)?.pictures ?? [];
  const exercises = Math.max(8, Math.min(15, Math.round(minutes / 1.3)));

  return (
    <div className="flex flex-col gap-5">
      {saved ? (
        <p
          data-testid="settings-saved"
          className="rounded-control border border-success-100 bg-success-50 px-3 py-2 text-sm font-medium text-success-800"
        >
          {saved}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger-600">
          {error}
        </p>
      ) : null}

      <Card className="flex flex-col gap-4">
        <div>
          <CardTitle>Phiên học hằng ngày</CardTitle>
          <CardDescription>
            Thời lượng quyết định số bài trong Daily Quest (docs/04 §4): khoảng 1,3 phút một bài, ít
            nhất 8, nhiều nhất 15.
          </CardDescription>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-700">
          Thời lượng: <strong>{minutes} phút</strong> → khoảng{" "}
          <strong data-testid="exercise-preview">{exercises} bài</strong>
          <input
            type="range"
            min={10}
            max={25}
            step={1}
            value={minutes}
            data-testid="daily-minutes"
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="h-2 w-full max-w-md"
          />
        </label>

        <div className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-ink-700">
            Giờ học gợi ý
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-11 w-40 rounded-control border border-ink-200 bg-white px-3 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-ink-700">
            Độ khó
            <select
              value={String(bias)}
              onChange={(e) => setBias(Number(e.target.value))}
              className="h-11 rounded-control border border-ink-200 bg-white px-3 text-sm"
            >
              <option value="-1">Nhẹ hơn một bậc</option>
              <option value="-0.5">Nhẹ hơn một chút</option>
              <option value="0">Theo năng lực</option>
              <option value="0.5">Khó hơn một chút</option>
              <option value="1">Khó hơn một bậc</option>
            </select>
          </label>
        </div>

        <div>
          <Button
            loading={busy === "settings"}
            onClick={() =>
              send(
                {
                  kind: "settings",
                  dailyMinutes: minutes,
                  suggestedTime: time || null,
                  difficultyBias: bias,
                },
                "settings",
                `Đã lưu. Phiên kế tiếp của ${data.nickname} sẽ có khoảng ${exercises} bài.`,
              )
            }
          >
            <Check className="h-4 w-4" /> Lưu phiên học
          </Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <CardTitle>Mascot & sở thích</CardTitle>
          <CardDescription>
            Mascot quyết định luôn thế giới con chơi trong đó; sở thích đi vào ngữ cảnh của bài
            luyện (docs/04 §6).
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {MASCOTS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMascot(m.value)}
              data-testid={`mascot-${m.value}`}
              className={cn(
                "flex-1 rounded-control border p-3 text-left text-sm transition-colors",
                mascot === m.value
                  ? "border-brand-400 bg-brand-50"
                  : "border-ink-100 hover:border-ink-200",
              )}
            >
              <span className="block font-bold text-ink-900">{m.label}</span>
              <span className="block text-xs text-ink-500">{m.world}</span>
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium text-ink-700">
          Sở thích (cách nhau bằng dấu phẩy, tối đa 6)
          <input
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="rô-bốt, khủng long, vườn hoa"
            className="h-11 rounded-control border border-ink-200 bg-white px-3 text-sm"
          />
        </label>
        <div>
          <Button
            loading={busy === "world"}
            onClick={() =>
              send(
                {
                  kind: "settings",
                  mascot,
                  interests: interests
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .slice(0, 6),
                },
                "world",
                "Đã lưu mascot và sở thích.",
              )
            }
          >
            <Sparkles className="h-4 w-4" /> Lưu thế giới của con
          </Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <CardTitle>Mã 4 hình</CardTitle>
          <CardDescription>
            Con đăng nhập bằng cách chạm 4 hình <strong>theo đúng thứ tự</strong>. Đổi ở đây là lần
            sau con dùng mã mới ngay.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
            Bộ hình
            <select
              value={setKey}
              onChange={(e) => {
                setSetKey(e.target.value);
                setPin([]);
              }}
              className="h-11 rounded-control border border-ink-200 bg-white px-3 text-sm"
            >
              {data.pictureSets.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.nameVi}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm text-ink-500" data-testid="pin-progress">
            Đã chọn {pin.length}/4
            {pin.length > 0
              ? `: ${pin.map((k) => pictures.find((p) => p.key === k)?.emoji).join(" ")}`
              : ""}
          </p>
          {pin.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setPin([])}>
              Chọn lại
            </Button>
          ) : null}
        </div>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
          {pictures.map((p) => (
            <button
              key={p.key}
              type="button"
              aria-label={p.labelVi}
              data-testid={`pin-${p.key}`}
              disabled={pin.length >= 4}
              onClick={() => setPin((prev) => (prev.length < 4 ? [...prev, p.key] : prev))}
              className="flex h-14 items-center justify-center rounded-control border border-ink-100 text-2xl transition-colors hover:border-brand-300 hover:bg-brand-50 disabled:opacity-40"
            >
              {p.emoji}
            </button>
          ))}
        </div>
        <div>
          <Button
            loading={busy === "pin"}
            disabled={pin.length !== 4}
            data-testid="save-pin"
            onClick={async () => {
              if (
                await send(
                  { kind: "pictureCode", pictureSetKey: setKey, pin },
                  "pin",
                  `Đã đổi mã hình của ${data.nickname}.`,
                )
              )
                setPin([]);
            }}
          >
            <KeyRound className="h-4 w-4" /> Đặt mã mới
          </Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <CardTitle>Phần thưởng đời thực</CardTitle>
          <CardDescription>
            Một mục tiêu tại một thời điểm (FR-LRN-06). Thanh tiến trình hiện trong bộ sưu tập của
            con — {data.nickname} đang có <strong>{data.starBalance} sao</strong>.
          </CardDescription>
        </div>
        {data.rewardGoal ? (
          <p className="rounded-control bg-surface-muted px-3 py-2 text-sm text-ink-700">
            Đang đặt: <strong>{data.rewardGoal.title}</strong> — {data.rewardGoal.starsNeeded} sao (
            {Math.min(100, Math.round((data.starBalance / data.rewardGoal.starsNeeded) * 100))}%)
          </p>
        ) : null}
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-ink-700">
            Phần thưởng
            <input
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="Đi công viên nước"
              className="h-11 rounded-control border border-ink-200 bg-white px-3 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-ink-700">
            Cần bao nhiêu sao
            <input
              type="number"
              min={10}
              max={2000}
              value={goalStars}
              onChange={(e) => setGoalStars(Number(e.target.value))}
              className="h-11 w-32 rounded-control border border-ink-200 bg-white px-3 text-sm"
            />
          </label>
          <Button
            loading={busy === "goal"}
            disabled={goalTitle.trim().length < 2}
            onClick={() =>
              send(
                { kind: "rewardGoal", title: goalTitle.trim(), starsNeeded: goalStars },
                "goal",
                "Đã đặt phần thưởng. Con thấy thanh tiến trình ngay lần mở tiếp theo.",
              )
            }
          >
            <Gift className="h-4 w-4" /> Đặt mục tiêu
          </Button>
          {data.rewardGoal ? (
            <Button
              variant="ghost"
              loading={busy === "cancel"}
              onClick={() =>
                send(
                  { kind: "cancelRewardGoal", goalId: data.rewardGoal?.id },
                  "cancel",
                  "Đã bỏ mục tiêu.",
                )
              }
            >
              Bỏ mục tiêu
            </Button>
          ) : null}
        </div>
      </Card>

      {busy ? (
        <p className="flex items-center gap-2 text-sm text-ink-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang lưu…
        </p>
      ) : null}
    </div>
  );
}
