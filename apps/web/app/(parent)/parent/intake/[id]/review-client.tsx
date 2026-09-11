"use client";

import { Check, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * P6 — the screen where a photo becomes evidence (FR-INT-02, docs/06 §2.1).
 *
 * The picture on the left, what was read on the right, and a box drawn around the question the
 * parent is looking at. The one rule this screen exists to enforce is docs/07 §2.2: **a blank is
 * not a mistake.** Blanks are their own colour, they say which kind of blank they are, and the
 * parent changes that with a single tap.
 */

export type Outcome = "CORRECT" | "PARTIAL" | "INCORRECT" | "BLANK" | "UNGRADED";
export type BlankReason = "NOT_FINISHED" | "DOES_NOT_KNOW";

export interface ReviewItem {
  id: string;
  index: number;
  questionText: string;
  studentAnswer: string | null;
  expectedAnswer: string | null;
  outcome: Outcome;
  blankReason: BlankReason | null;
  errorCode: string | null;
  skillCodes: string[];
  skillCodesFinal: string[];
  bbox: { x: number; y: number; w: number; h: number } | null;
  fileIndex: number;
}

export interface ReviewFile {
  key: string;
  url: string;
  duplicateOf?: string | null;
  page?: number;
}

const OUTCOME_LABEL: Record<Outcome, string> = {
  CORRECT: "Đúng",
  PARTIAL: "Gần đúng",
  INCORRECT: "Chưa đúng",
  BLANK: "Để trống",
  UNGRADED: "Chưa chấm",
};

const OUTCOME_TONE: Record<Outcome, string> = {
  CORRECT: "bg-success-50 text-success-700 border-success-200",
  PARTIAL: "bg-warning-50 text-warning-700 border-warning-200",
  INCORRECT: "bg-danger-50 text-danger-600 border-danger-200",
  // Deliberately not red and not green: a blank is not a verdict about the child.
  BLANK: "bg-brand-50 text-brand-700 border-brand-200",
  UNGRADED: "bg-ink-100 text-ink-600 border-ink-200",
};

const BLANK_LABEL: Record<BlankReason, string> = {
  NOT_FINISHED: "Con chưa làm xong",
  DOES_NOT_KNOW: "Con chưa biết làm",
};

export function ReviewClient({
  resultId,
  studentNickname,
  summary,
  docType,
  teacherComment,
  confidence,
  files,
  items: initial,
  externals,
}: {
  resultId: string;
  studentNickname: string;
  summary: string;
  docType: string;
  teacherComment: string | null;
  confidence: number;
  files: ReviewFile[];
  items: ReviewItem[];
  externals: { platform: string; metric: string; value: string }[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [focused, setFocused] = useState<string | null>(initial[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shownFile = useMemo(() => {
    const item = items.find((i) => i.id === focused);
    return files[item?.fileIndex ?? 0] ?? files[0] ?? null;
  }, [files, items, focused]);

  const boxes = items.filter((i) => i.bbox && files[i.fileIndex]?.key === shownFile?.key);
  const blanks = items.filter((i) => i.outcome === "BLANK").length;

  const change = (id: string, patch: Partial<ReviewItem>) => {
    setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    setDirty((d) => new Set(d).add(id));
  };

  const send = async (action: "approve" | "reject") => {
    setBusy(true);
    setError(null);
    try {
      const edits = items
        .filter((i) => dirty.has(i.id))
        .map((i) => ({
          id: i.id,
          outcome: i.outcome,
          blankReason: i.outcome === "BLANK" ? i.blankReason : null,
          skillCodes: i.skillCodesFinal.length ? i.skillCodesFinal : i.skillCodes,
          errorCode: i.errorCode,
        }));
      const res = await fetch(`/api/intake/${resultId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, edits }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Không duyệt được");
      router.push("/parent/inbox");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-600">
          <span className="rounded-control bg-ink-100 px-2 py-1 font-semibold">{docType}</span>
          <span>{studentNickname}</span>
          <span className="text-ink-400">máy đọc chắc chắn {Math.round(confidence * 100)}%</span>
        </div>
        {shownFile?.duplicateOf ? (
          <p className="rounded-control border border-warning-200 bg-warning-50 px-3 py-2 text-sm text-warning-700">
            Ảnh này trông giống một ảnh đã nạp trong 7 ngày qua — có thể đã chụp hai lần.
          </p>
        ) : null}
        <div className="relative overflow-hidden rounded-control bg-ink-100">
          {shownFile ? (
            // biome-ignore lint/performance/noImgElement: served from /api/files with an auth check
            <img src={shownFile.url} alt="Ảnh bài vở của con" className="w-full" />
          ) : (
            <p className="p-6 text-sm text-ink-500">Ảnh chưa sẵn sàng.</p>
          )}
          {boxes.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setFocused(item.id)}
              aria-label={`Câu ${item.index + 1}`}
              className={`absolute border-2 transition-colors ${
                focused === item.id
                  ? "border-brand-500 bg-brand-500/15"
                  : "border-brand-300/70 bg-transparent hover:bg-brand-500/10"
              }`}
              style={{
                left: `${(item.bbox?.x ?? 0) * 100}%`,
                top: `${(item.bbox?.y ?? 0) * 100}%`,
                width: `${(item.bbox?.w ?? 0) * 100}%`,
                height: `${(item.bbox?.h ?? 0) * 100}%`,
              }}
            />
          ))}
        </div>
        {files.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <button
                type="button"
                key={f.key}
                onClick={() => {
                  const first = items.find((item) => item.fileIndex === i);
                  if (first) setFocused(first.id);
                }}
                className={`rounded-control border px-2 py-1 text-xs ${
                  shownFile?.key === f.key
                    ? "border-brand-400 bg-brand-50 text-brand-700"
                    : "border-ink-200 text-ink-600"
                }`}
              >
                Ảnh {i + 1}
                {f.page ? ` (trang ${f.page})` : ""}
              </button>
            ))}
          </div>
        ) : null}
        {teacherComment ? (
          <p className="rounded-control bg-surface-muted px-3 py-2 text-sm text-ink-700">
            <strong>Cô nhận xét:</strong> {teacherComment}
          </p>
        ) : null}
      </Card>

      <div className="flex flex-col gap-3">
        <Card className="flex flex-col gap-2">
          <p className="text-sm text-ink-700">{summary || "Không có tóm tắt."}</p>
          {blanks > 0 ? (
            <p className="rounded-control border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-700">
              {blanks} câu để trống. <strong>Để trống không phải là làm sai</strong> — chọn giúp
              “chưa làm xong” hay “chưa biết làm” để hệ thống hiểu đúng.
            </p>
          ) : null}
          {externals.length > 0 ? (
            <ul className="text-sm text-ink-700">
              {externals.map((e) => (
                <li key={`${e.platform}-${e.metric}`}>
                  <strong>{e.platform}</strong> · {e.metric}: {e.value}
                </li>
              ))}
            </ul>
          ) : null}
        </Card>

        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <Card
                className={`flex flex-col gap-2 ${focused === item.id ? "ring-2 ring-brand-300" : ""}`}
                onMouseEnter={() => setFocused(item.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900">
                      {item.index + 1}. {item.questionText || "(không đọc được đề)"}
                    </p>
                    <p className="text-sm text-ink-600">
                      Con viết: <strong>{item.studentAnswer || "—"}</strong>
                      {item.expectedAnswer ? (
                        <span className="text-ink-400"> · đáp án: {item.expectedAnswer}</span>
                      ) : null}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(["CORRECT", "PARTIAL", "INCORRECT", "BLANK"] as Outcome[]).map((o) => (
                    <button
                      type="button"
                      key={o}
                      onClick={() =>
                        change(item.id, {
                          outcome: o,
                          blankReason: o === "BLANK" ? (item.blankReason ?? "NOT_FINISHED") : null,
                        })
                      }
                      className={`rounded-control border px-2.5 py-1 text-xs font-semibold ${
                        item.outcome === o ? OUTCOME_TONE[o] : "border-ink-200 text-ink-500"
                      }`}
                    >
                      {OUTCOME_LABEL[o]}
                    </button>
                  ))}
                </div>

                {item.outcome === "BLANK" ? (
                  <div className="flex flex-wrap gap-1.5">
                    {(["NOT_FINISHED", "DOES_NOT_KNOW"] as BlankReason[]).map((r) => (
                      <button
                        type="button"
                        key={r}
                        data-testid={`blank-${r}`}
                        onClick={() => change(item.id, { blankReason: r })}
                        className={`rounded-control border px-2.5 py-1 text-xs ${
                          item.blankReason === r
                            ? "border-brand-400 bg-brand-50 font-semibold text-brand-700"
                            : "border-ink-200 text-ink-500"
                        }`}
                      >
                        {BLANK_LABEL[r]}
                      </button>
                    ))}
                  </div>
                ) : null}

                <SkillTags
                  codes={item.skillCodesFinal.length ? item.skillCodesFinal : item.skillCodes}
                  onChange={(codes) => change(item.id, { skillCodesFinal: codes })}
                />
                {item.errorCode ? (
                  <p className="text-xs text-ink-500">
                    Mã lỗi: <code className="rounded bg-surface-muted px-1">{item.errorCode}</code>
                    <button
                      type="button"
                      onClick={() => change(item.id, { errorCode: null })}
                      className="ml-2 underline"
                    >
                      bỏ
                    </button>
                  </p>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>

        {error ? (
          <p role="alert" className="text-sm font-medium text-danger-600">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button
            size="lg"
            onClick={() => send("approve")}
            disabled={busy}
            data-testid="approve-all"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Duyệt tất cả
          </Button>
          <Button size="lg" variant="outline" onClick={() => send("reject")} disabled={busy}>
            <X className="h-4 w-4" /> Bỏ qua ảnh này
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Skill codes, editable: type to search the skill map, tap to remove. */
function SkillTags({ codes, onChange }: { codes: string[]; onChange: (codes: string[]) => void }) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<{ code: string; nameVi: string }[]>([]);

  const search = async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) return setHits([]);
    const res = await fetch(`/api/skills/search?q=${encodeURIComponent(text)}&limit=5`);
    if (!res.ok) return setHits([]);
    const data = (await res.json()) as { items?: { code: string; nameVi: string }[] };
    setHits(data.items ?? []);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {codes.map((code) => (
          <span
            key={code}
            className="inline-flex items-center gap-1 rounded-control bg-surface-muted px-2 py-1 text-xs text-ink-700"
          >
            {code}
            <button
              type="button"
              aria-label={`Bỏ ${code}`}
              onClick={() => onChange(codes.filter((c) => c !== code))}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={query}
          onChange={(e) => void search(e.target.value)}
          placeholder="+ kỹ năng"
          className="h-7 w-32 rounded-control border border-ink-200 px-2 text-xs"
        />
      </div>
      {hits.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {hits.map((h) => (
            <li key={h.code}>
              <button
                type="button"
                onClick={() => {
                  onChange([...new Set([...codes, h.code])]);
                  setQuery("");
                  setHits([]);
                }}
                className="rounded-control border border-brand-200 bg-brand-50 px-2 py-1 text-xs text-brand-700"
              >
                {h.nameVi} <span className="text-brand-400">{h.code}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
