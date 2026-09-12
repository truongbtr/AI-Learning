"use client";

import { Check, ClipboardPaste, NotebookPen, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * The twenty seconds that make everything else work (docs/07 §5, docs/08 pha 5 việc 6).
 *
 * It sits on the dashboard rather than behind a menu item, because a habit behind a menu item is
 * not a habit. Three things earn their place here:
 *
 *  - **Paste, don't type.** One button reads the clipboard; on a phone that is the whole
 *    interaction, thumb only, no keyboard. Typing still works for a laptop with no clipboard
 *    permission.
 *  - **Show what it bought, immediately.** The moment it saves, the card says what the class did
 *    today and which skills that puts into tonight's quest for each child. The phase-4 eval is the
 *    argument: full-text search alone found the right skill a third of the time, and the diary
 *    rescued most of the misses (`docs/eval/intake-v1.md` §2).
 *  - **Ask once.** The nudge appears on a school evening when nothing has been pasted, and one tap
 *    puts it away until tomorrow. It never appears at the weekend.
 */

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "chưa có bằng chứng",
  LEARNING: "đang học",
  NEEDS_PRACTICE: "cần củng cố",
  SOLID: "đã vững",
  MASTERED: "thành thạo",
};

const TASK_LABEL: Record<string, string> = {
  READ_ALOUD: "Đọc to",
  WRITE: "Viết",
  WORKSHEET: "Phiếu bài tập",
  VIDEO_SUBMIT: "Quay video",
  ONLINE_APP: "Làm trên app",
  BRING_ITEM: "Mang đồ",
  OTHER: "Việc khác",
};

export interface TonightPayload {
  date: string;
  diaryId: string | null;
  confirmedAt: string | null;
  lessons: { subjectLabel: string; lessonRefText: string; pages: number[]; skillCodes: string[] }[];
  children: {
    studentId: string;
    nickname: string;
    skills: { code: string; nameVi: string; mastery: number; status: string; isNew: boolean }[];
    homework: { id: string; text: string; taskType: string; inApp: boolean }[];
  }[];
}

const DISMISS_KEY = "mtct.diary-nudge-dismissed";

export function DiaryTonightCard({
  className,
  initial,
  /** Server-rendered so the nudge does not flash in and out on a slow phone. */
  nudge,
}: {
  className: string;
  initial: TonightPayload;
  nudge: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tonight, setTonight] = useState<TonightPayload>(initial);
  const [justSaved, setJustSaved] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [open, setOpen] = useState(!initial.diaryId);

  const today = initial.date;
  useEffect(() => {
    // Read on the client only: the nudge's "once" is per browser, and the server has no business
    // storing whether a parent waved a card away.
    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === today);
    } catch {
      setDismissed(false);
    }
  }, [today]);

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, today);
    } catch {
      /* private mode: the nudge simply comes back next reload */
    }
  };

  const pasteFromClipboard = async () => {
    setError(null);
    try {
      const clip = await navigator.clipboard.readText();
      if (clip.trim().length < 10) {
        setError("Bảng nhớ tạm chưa có bài đăng nào. Sao chép bài của cô rồi bấm lại nhé.");
        return;
      }
      setText(clip);
      await save(clip);
    } catch {
      setError("Trình duyệt chưa cho đọc bảng nhớ tạm — dán tay vào ô bên dưới cũng được.");
      setOpen(true);
    }
  };

  const save = async (value?: string) => {
    const body = (value ?? text).trim();
    if (body.length < 10) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ className, date: today, text: body }),
      });
      const data = (await res.json()) as { tonight?: TonightPayload; error?: string };
      if (!res.ok || !data.tonight) throw new Error(data.error ?? "Không lưu được nhật ký");
      setTonight(data.tonight);
      setJustSaved(true);
      setOpen(false);
      setText("");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const has = tonight.lessons.length > 0;
  const showNudge = nudge && !dismissed && !has;

  return (
    <Card
      data-testid="diary-tonight"
      className={cn(
        "flex flex-col gap-4",
        showNudge && "border-warning-200 bg-warning-50/60",
        justSaved && "border-success-200",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2">
            <NotebookPen className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
            Nhật ký lớp hôm nay
          </CardTitle>
          <CardDescription>
            {has
              ? `Đã có nhật ký ngày ${today}. Tối nay con luyện đúng bài lớp vừa học.`
              : "Dán bài đăng của cô — 20 giây, và tối nay Daily Quest bám đúng bài sáng nay."}
          </CardDescription>
        </div>
        {showNudge ? (
          <button
            type="button"
            onClick={dismiss}
            aria-label="Ẩn nhắc nhở hôm nay"
            className="rounded-control p-1.5 text-warning-700 hover:bg-warning-100"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {showNudge ? (
        <p
          data-testid="diary-nudge"
          className="rounded-control bg-white/70 px-3 py-2 text-sm font-medium text-warning-800"
        >
          Hôm nay chưa có nhật ký lớp. Không có nó thì tối nay phiên học đoán theo thời khoá biểu,
          và ảnh bài vở khó gắn đúng kỹ năng hơn.
        </p>
      ) : null}

      {/* Thumb-sized, first in the tab order, and the only thing needed on a phone. */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={pasteFromClipboard}
          loading={busy}
          size="lg"
          className="min-w-[13rem] flex-1 sm:flex-none"
          data-testid="diary-paste"
        >
          <ClipboardPaste className="h-5 w-5" />
          {has ? "Dán bản mới, ghi đè" : "Dán từ bảng nhớ tạm"}
        </Button>
        <Button variant="outline" size="lg" onClick={() => setOpen((v) => !v)}>
          {open ? "Ẩn ô nhập" : "Gõ / dán tay"}
        </Button>
      </div>

      {open ? (
        <div className="flex flex-col gap-2">
          <label className="sr-only" htmlFor="diary-paste-area">
            Nhật ký lớp hôm nay
          </label>
          <textarea
            id="diary-paste-area"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            data-testid="diary-text"
            placeholder="Dán nguyên bài đăng của cô trên Edi Parent vào đây…"
            className="rounded-control border border-ink-200 bg-white p-3 font-mono text-sm"
          />
          <div>
            <Button
              onClick={() => save()}
              loading={busy}
              disabled={text.trim().length < 10}
              data-testid="diary-save"
            >
              Đọc và lưu
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm font-medium text-danger-600">
          {error}
        </p>
      ) : null}

      {has ? (
        <div className="flex flex-col gap-3" data-testid="diary-tonight-result">
          {justSaved ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-success-700">
              <Check className="h-4 w-4" /> Đã lưu. Đây là những gì 20 giây vừa rồi làm được:
            </p>
          ) : null}

          <section className="rounded-control border border-ink-100 bg-surface-muted/60 p-3">
            <h3 className="text-sm font-bold text-ink-900">Hôm nay lớp học</h3>
            <ul
              className="mt-1 flex flex-col gap-1 text-sm text-ink-700"
              data-testid="tonight-lessons"
            >
              {tonight.lessons.map((l) => (
                <li key={`${l.subjectLabel}-${l.lessonRefText}`}>
                  <strong>{l.subjectLabel}:</strong> {l.lessonRefText}
                  {l.pages.length ? (
                    <span className="text-ink-400"> · trang {l.pages.join(", ")}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>

          {tonight.children.map((child) => (
            <section
              key={child.studentId}
              className="rounded-control border border-brand-100 bg-brand-50/50 p-3"
            >
              <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
                <Sparkles className="h-4 w-4 text-brand-500" aria-hidden />
                Tối nay {child.nickname} luyện
              </h3>
              {child.skills.length === 0 ? (
                <p className="mt-1 text-sm text-ink-500">
                  Bài hôm nay chưa gắn được kỹ năng nào — phiên tối nay theo thời khoá biểu như cũ.
                </p>
              ) : (
                <ul
                  className="mt-1.5 flex flex-wrap gap-1.5"
                  data-testid={`tonight-skills-${child.studentId}`}
                >
                  {child.skills.slice(0, 6).map((s) => (
                    <li
                      key={s.code}
                      className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink-700 ring-1 ring-inset ring-brand-200"
                      title={s.code}
                    >
                      {s.nameVi}
                      <span className="ml-1 font-normal text-ink-400">
                        {s.isNew
                          ? "bài mới"
                          : `${s.mastery}/100 · ${STATUS_LABEL[s.status] ?? s.status}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {child.homework.length > 0 ? (
                <ul className="mt-2 flex flex-col gap-1 text-sm text-ink-700">
                  {child.homework.map((h) => (
                    <li key={h.id}>
                      <span className="rounded bg-white px-1.5 py-0.5 text-xs font-semibold text-ink-600">
                        {TASK_LABEL[h.taskType] ?? h.taskType}
                      </span>{" "}
                      {h.text}
                      {h.inApp ? (
                        <span className="text-brand-600"> · thành trạm đầu bản đồ</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
