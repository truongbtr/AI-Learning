"use client";

import { useState } from "react";
import { ExerciseRenderer } from "./exercise";
import type { ClientSpec, FeedbackState } from "./exercise/types";
import { WorldBackground } from "./world-background";

/**
 * "Show me this exercise the way the child will see it" — used by /admin/content (FR-ADM-05) and
 * by /dev/kit.
 *
 * Since phase 3 this is the real thing: the same `ExerciseRenderer` the child uses, on the real
 * world background. A preview that looked *like* the exercise would let a broken one through.
 * Nothing is marked here — there is no answer key on this side of the wire — so an answer just
 * lights up and the panel says what was sent.
 */
export type PreviewSpec = ClientSpec;

export function ExercisePreview({
  spec,
  nickname = "Thy",
  theme = "robot",
  className,
}: {
  spec: PreviewSpec;
  nickname?: string;
  theme?: "robot" | "garden";
  className?: string;
}) {
  const [sent, setSent] = useState<unknown>(null);
  const [hints, setHints] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState | undefined>();

  return (
    <div className={`overflow-hidden rounded-2xl border border-ink-100 ${className ?? ""}`}>
      <WorldBackground theme={theme} subject={spec.subject} at="day" className="min-h-[560px]">
        <div className="px-4 py-6 sm:px-8">
          <ExerciseRenderer
            key={`${spec.type}-${spec.prompt.text}`}
            spec={spec}
            vars={{ ten: nickname, vat: theme === "garden" ? "bông hoa" : "bánh răng", ban: "Cú" }}
            mascot={theme === "garden" ? "cu" : "robot"}
            disabled={false}
            feedback={feedback}
            onHint={() => setHints((h) => h + 1)}
            onSubmit={(response) => {
              setSent(response);
              setFeedback({ kind: "correct", tries: 1 });
              window.setTimeout(() => setFeedback(undefined), 1400);
            }}
          />
        </div>
      </WorldBackground>
      <div className="flex flex-wrap items-center gap-4 border-ink-100 border-t bg-white px-4 py-3 text-ink-500 text-sm">
        <span>
          Gợi ý đã mở: <b>{hints}</b>/{spec.hints.length}
        </span>
        <span className="truncate">
          Câu trả lời gửi đi:{" "}
          <code className="rounded bg-ink-50 px-1">
            {sent ? JSON.stringify(sent, (k, v) => (k === "at" ? undefined : v)) : "—"}
          </code>
        </span>
        <span className="text-ink-400">(Xem thử: không chấm — máy chủ mới giữ đáp án, ADR-14)</span>
      </div>
    </div>
  );
}
