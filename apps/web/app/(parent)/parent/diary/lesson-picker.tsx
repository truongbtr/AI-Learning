"use client";

import { Check, ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

/**
 * "Hôm nay lớp học bài nào?" — the one tap that tells tonight's session where the class is.
 *
 * The teacher's Edi Parent post is the usual source, but it never mentions English Maths, so that
 * subject ran on the estimated week alone (owner, 18/09/2026). Here the parent picks the lesson
 * from the book itself; the row it writes is the same one a pasted post writes, and a later paste
 * does not wipe it.
 */

export interface PickerLesson {
  code: string;
  title: string;
  pageFrom: number | null;
  pageTo: number | null;
  weekFrom: number | null;
}

export interface PickerSubject {
  subject: string;
  label: string;
  lessons: PickerLesson[];
  /** What the class was last recorded on, if anything. */
  current: { code: string; title: string; date: string; source: "POST" | "PARENT" } | null;
}

const pages = (l: PickerLesson) =>
  l.pageFrom
    ? ` · tr.${l.pageFrom}${l.pageTo && l.pageTo !== l.pageFrom ? `–${l.pageTo}` : ""}`
    : "";

export function LessonPicker({
  subjects,
  className,
}: {
  subjects: PickerSubject[];
  className: string;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState(subjects[0]?.subject ?? "EMATH");
  const chosen = subjects.find((s) => s.subject === subject) ?? subjects[0];
  const [code, setCode] = useState(chosen?.current?.code ?? chosen?.lessons[0]?.code ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // the lesson after the one the class is on — the "sang bài kế tiếp" shortcut
  const next = useMemo(() => {
    if (!chosen?.current) return null;
    const at = chosen.lessons.findIndex((l) => l.code === chosen.current?.code);
    return at >= 0 ? (chosen.lessons[at + 1] ?? null) : null;
  }, [chosen]);

  const pick = (nextSubject: string) => {
    const s = subjects.find((x) => x.subject === nextSubject);
    setSubject(nextSubject);
    setCode(s?.current?.code ?? s?.lessons[0]?.code ?? "");
    setSaved(null);
    setError(null);
  };

  const save = async (unitCode: string) => {
    if (!unitCode) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/diary", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ className, subject, unitCode }),
      });
      const body = (await res.json()) as { title?: string; error?: string };
      if (!res.ok) throw new Error(body.error ?? "Chưa lưu được");
      setCode(unitCode);
      setSaved(body.title ?? unitCode);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa lưu được");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div>
        <CardTitle>Hôm nay lớp học bài nào?</CardTitle>
        <CardDescription>
          Dùng khi bài đăng của cô không nhắc tới môn đó — English Maths chẳng hạn. Một chạm là
          phiên tối nay của hai bé bám theo đúng bài này.
        </CardDescription>
      </div>

      <div className="flex flex-wrap gap-2" data-testid="lesson-subjects">
        {subjects.map((s) => (
          <button
            key={s.subject}
            type="button"
            onClick={() => pick(s.subject)}
            className={`rounded-full border px-4 py-2 font-medium text-sm transition-colors ${
              s.subject === subject
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-ink-200 text-ink-600 hover:bg-ink-50"
            }`}
            data-testid="lesson-subject"
            data-active={s.subject === subject ? "true" : undefined}
          >
            {s.label}
          </button>
        ))}
      </div>

      {chosen ? (
        <>
          <p className="text-ink-600 text-sm" data-testid="lesson-current">
            {chosen.current ? (
              <>
                Đang ghi nhận: <b>{chosen.current.title}</b>{" "}
                <span className="text-ink-400">
                  ({new Date(chosen.current.date).toLocaleDateString("vi-VN")},{" "}
                  {chosen.current.source === "PARENT" ? "ba mẹ nhập" : "từ bài đăng của cô"})
                </span>
              </>
            ) : (
              <>Chưa có ghi nhận nào cho môn này — hệ thống đang đoán theo tuần.</>
            )}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setSaved(null);
              }}
              className="min-w-[320px] flex-1 rounded-lg border border-ink-200 px-3 py-2 text-sm"
              data-testid="lesson-select"
            >
              {chosen.lessons.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.weekFrom ? `Tuần ${l.weekFrom} · ` : ""}
                  {l.title}
                  {pages(l)}
                </option>
              ))}
            </select>
            <Button
              onClick={() => void save(code)}
              disabled={saving || !code}
              data-testid="lesson-save"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Lớp đang học bài này
            </Button>
            {next ? (
              <Button
                variant="outline"
                onClick={() => void save(next.code)}
                disabled={saving}
                data-testid="lesson-next"
              >
                <ChevronRight className="size-4" />
                Sang bài kế tiếp: {next.title}
              </Button>
            ) : null}
          </div>

          {saved ? (
            <p className="text-emerald-700 text-sm" data-testid="lesson-saved">
              Đã ghi: hôm nay lớp học <b>{saved}</b>.
            </p>
          ) : null}
          {error ? <p className="text-amber-700 text-sm">{error}</p> : null}
        </>
      ) : null}
    </Card>
  );
}
