"use client";

import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

/**
 * The 20-second job of docs/07 §5: paste tonight's Edi Parent post.
 *
 * The result appears immediately — no AI, no waiting (docs/13 §4) — so a parent can see at once
 * whether it was read correctly, and tonight's quest already knows what the class did today.
 */

interface Lesson {
  subjectLabel: string;
  subject: string | null;
  lessonRefText: string;
  pages: number[];
  contentNote: string | null;
}
interface Homework {
  subjectLabel: string;
  taskType: string;
  text: string;
  repeatCount: number | null;
  optional: boolean;
  submitTo: string | null;
}
interface Reminder {
  kind: string;
  text: string;
}
interface Parsed {
  diaryId: string;
  lessons: Lesson[];
  homework: Homework[];
  reminders: Reminder[];
  unmatched: string[];
  queuedForReading: boolean;
  confidence: number;
  homeworkRows: number;
}

const TASK_LABEL: Record<string, string> = {
  READ_ALOUD: "Đọc to",
  WRITE: "Viết",
  WORKSHEET: "Phiếu bài tập",
  VIDEO_SUBMIT: "Quay video nộp cô",
  ONLINE_APP: "Làm trên app",
  BRING_ITEM: "Mang đồ",
  OTHER: "Việc khác",
};

const REMINDER_LABEL: Record<string, string> = {
  UNIFORM: "Đồng phục",
  BRING: "Mang theo",
  EVENT: "Sự kiện",
  SCHEDULE: "Lịch học",
  OTHER: "Nhắc nhở",
};

export function DiaryForm({ className }: { className: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ className, date, text }),
      });
      const data = (await res.json()) as Parsed & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Không lưu được nhật ký");
      setParsed(data);
      setConfirmed(false);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!parsed) return;
    await fetch("/api/diary", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diaryId: parsed.diaryId }),
    });
    setConfirmed(true);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-ink-700">
            Ngày
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 rounded-control border border-ink-200 bg-white px-3 text-sm"
            />
          </label>
          <p className="text-sm text-ink-500">Lớp {className}</p>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium text-ink-700">
          Nhật ký lớp hôm nay
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            data-testid="diary-text"
            placeholder={"Dán nguyên bài đăng của cô trên Edi Parent vào đây…"}
            className="rounded-control border border-ink-200 bg-white p-3 font-mono text-sm"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={save}
            disabled={busy || text.trim().length < 10}
            data-testid="diary-save"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Đọc và lưu
          </Button>
          <p className="self-center text-xs text-ink-500">
            Dán trùng ngày sẽ cập nhật bản cũ, không tạo thêm.
          </p>
        </div>
        {error ? (
          <p role="alert" className="text-sm font-medium text-danger-600">
            {error}
          </p>
        ) : null}
      </Card>

      {parsed ? (
        <Card className="flex flex-col gap-4" data-testid="diary-result">
          <div>
            <CardTitle>Hệ thống đọc được</CardTitle>
            <CardDescription>
              {parsed.lessons.length} mục đã học · {parsed.homework.length} bài cô giao ·{" "}
              {parsed.reminders.length} lời nhắc · đọc hiểu {Math.round(parsed.confidence * 100)}%
              {parsed.homeworkRows > 0 ? ` · tạo ${parsed.homeworkRows} việc cho các con` : ""}
            </CardDescription>
          </div>

          <section className="flex flex-col gap-1.5">
            <h3 className="text-sm font-bold text-ink-900">Hôm nay lớp học</h3>
            <ul className="flex flex-col gap-1 text-sm text-ink-700" data-testid="diary-lessons">
              {parsed.lessons.map((l) => (
                <li key={`${l.subjectLabel}-${l.lessonRefText}`}>
                  <strong>{l.subjectLabel}:</strong> {l.lessonRefText}
                  {l.pages.length ? ` (trang ${l.pages.join(", ")})` : ""}
                  {l.contentNote ? <span className="text-ink-500"> — {l.contentNote}</span> : null}
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-1.5">
            <h3 className="text-sm font-bold text-ink-900">Cô giao</h3>
            <ul className="flex flex-col gap-1 text-sm text-ink-700" data-testid="diary-homework">
              {parsed.homework.map((h) => (
                <li key={h.text}>
                  <span className="rounded-control bg-surface-muted px-1.5 py-0.5 text-xs">
                    {TASK_LABEL[h.taskType] ?? h.taskType}
                  </span>{" "}
                  {h.text}
                  {h.repeatCount ? <strong> ({h.repeatCount} lần)</strong> : null}
                  {h.optional ? <em className="text-ink-500"> — cô khuyến khích</em> : null}
                  {h.submitTo ? <span className="text-ink-500"> · nộp ở {h.submitTo}</span> : null}
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-1.5">
            <h3 className="text-sm font-bold text-ink-900">Nhắc ba mẹ</h3>
            <ul className="flex flex-col gap-1 text-sm text-ink-700" data-testid="diary-reminders">
              {parsed.reminders.map((r) => (
                <li key={r.text}>
                  <strong>{REMINDER_LABEL[r.kind] ?? r.kind}:</strong> {r.text}
                </li>
              ))}
              {parsed.reminders.length === 0 ? <li className="text-ink-500">Không có.</li> : null}
            </ul>
          </section>

          {parsed.unmatched.length > 0 ? (
            <section className="rounded-control border border-warning-200 bg-warning-50 p-3">
              <p className="text-sm font-semibold text-warning-700">
                {parsed.unmatched.length} dòng chưa đọc được bằng mẫu
                {parsed.queuedForReading ? " — đã đưa vào hàng chờ AI, mai sẽ có." : "."}
              </p>
              <ul className="mt-1 list-disc pl-5 text-sm text-warning-700">
                {parsed.unmatched.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <div>
            <Button
              variant={confirmed ? "secondary" : "default"}
              onClick={confirm}
              disabled={confirmed}
            >
              <Check className="h-4 w-4" /> {confirmed ? "Đã xác nhận" : "Đúng rồi"}
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
