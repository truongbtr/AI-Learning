"use client";

import { Loader2, NotebookPen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

/**
 * FR-INT-04 — the one-line note a parent types in thirty seconds.
 *
 * "Hôm nay Mai Thy đọc *cat*, *bat* chưa được, hay nhầm b/d" is worth more than it looks: it is the
 * only channel for what happened away from the screen. The requirement has AI attaching the skill;
 * with no AI in the app (ADR-10) the full-text search suggests and the parent taps — which also
 * means the parent can see exactly which skill their sentence is about to move.
 */
export function QuickNoteCard({ students }: { students: { id: string; nickname: string }[] }) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [text, setText] = useState("");
  const [outcome, setOutcome] = useState<"CORRECT" | "PARTIAL" | "INCORRECT" | "OBSERVED">(
    "OBSERVED",
  );
  const [suggestions, setSuggestions] = useState<{ code: string; nameVi: string }[]>([]);
  const [chosen, setChosen] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggest = async () => {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, text }),
      });
      const data = (await res.json()) as {
        suggestions?: { code: string; nameVi: string }[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Không tìm được kỹ năng");
      setSuggestions(data.suggestions ?? []);
      setChosen(data.suggestions?.[0] ? [data.suggestions[0].code] : []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, text, skillCodes: chosen, outcome }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Không lưu được ghi chú");
      setSaved(true);
      setText("");
      setSuggestions([]);
      setChosen([]);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (students.length === 0) return null;

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <CardTitle>Ghi chú nhanh</CardTitle>
        <CardDescription>
          Một dòng về chuyện xảy ra ngoài màn hình. Trọng số thấp, nhưng planner vẫn nghe.
        </CardDescription>
      </div>
      <div className="flex flex-wrap gap-2">
        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="h-11 rounded-control border border-ink-200 bg-white px-3 text-sm"
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nickname}
            </option>
          ))}
        </select>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={300}
          data-testid="quick-note"
          placeholder="Hôm nay con đọc cat, bat chưa được, hay nhầm b/d"
          className="h-11 min-w-0 flex-1 rounded-control border border-ink-200 bg-white px-3 text-sm"
        />
        <Button variant="outline" onClick={suggest} disabled={busy || text.trim().length < 4}>
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <NotebookPen className="h-4 w-4" />
          )}
          Tìm kỹ năng
        </Button>
      </div>

      {suggestions.length > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                type="button"
                key={s.code}
                onClick={() =>
                  setChosen((list) =>
                    list.includes(s.code)
                      ? list.filter((c) => c !== s.code)
                      : [...list, s.code].slice(0, 3),
                  )
                }
                className={`rounded-control border px-2.5 py-1 text-xs ${
                  chosen.includes(s.code)
                    ? "border-brand-400 bg-brand-50 font-semibold text-brand-700"
                    : "border-ink-200 text-ink-600"
                }`}
              >
                {s.nameVi}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as typeof outcome)}
              className="h-10 rounded-control border border-ink-200 bg-white px-3 text-sm"
            >
              <option value="OBSERVED">Chỉ ghi nhận</option>
              <option value="CORRECT">Con làm được</option>
              <option value="PARTIAL">Con làm được một phần</option>
              <option value="INCORRECT">Con chưa làm được</option>
            </select>
            <Button onClick={save} disabled={busy || chosen.length === 0}>
              Lưu ghi chú
            </Button>
          </div>
        </div>
      ) : null}

      {saved ? <p className="text-sm font-semibold text-success-700">Đã lưu ghi chú.</p> : null}
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger-600">
          {error}
        </p>
      ) : null}
    </Card>
  );
}
