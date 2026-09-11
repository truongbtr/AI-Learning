"use client";

import { Check, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

/**
 * The checklist half of FR-LRN-07: what the teacher set that happens away from the app — a paper
 * worksheet, something to bring tomorrow — plus the video the child recorded, ready for a parent
 * to upload to Teams. The app never submits anything to the school on its own (docs/11 §6.2).
 */

export interface HomeworkRow {
  id: string;
  nickname: string;
  text: string;
  taskType: string;
  status: string;
  progress: number;
  repeatCount: number | null;
  optional: boolean;
  submitTo: string | null;
  artifactKey: string | null;
  inApp: boolean;
}

const TASK_LABEL: Record<string, string> = {
  READ_ALOUD: "Đọc to",
  WRITE: "Viết",
  WORKSHEET: "Phiếu bài tập",
  VIDEO_SUBMIT: "Quay video",
  ONLINE_APP: "Làm trên app",
  BRING_ITEM: "Mang đồ",
  OTHER: "Việc khác",
};

export function HomeworkCard({ rows }: { rows: HomeworkRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const tick = async (id: string, status: "DONE" | "PENDING") => {
    setBusy(id);
    await fetch(`/api/homework/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", status }),
    });
    setBusy(null);
    router.refresh();
  };

  if (rows.length === 0) return null;

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <CardTitle>Bài cô giao hôm nay</CardTitle>
        <CardDescription>
          Việc con làm trong app tự đánh dấu xong; việc ngoài app thì ba mẹ tick.
        </CardDescription>
      </div>
      <ul className="flex flex-col gap-2">
        {rows.map((h) => (
          <li
            key={h.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-ink-100 px-3 py-2"
          >
            <span className="min-w-0 text-sm text-ink-800">
              <span className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">
                {TASK_LABEL[h.taskType] ?? h.taskType}
              </span>{" "}
              <strong>{h.nickname}</strong> · {h.text}
              {h.repeatCount ? (
                <span className="text-ink-500">
                  {" "}
                  ({h.progress}/{h.repeatCount})
                </span>
              ) : null}
              {h.optional ? <em className="text-ink-500"> — khuyến khích</em> : null}
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {h.artifactKey ? (
                <a
                  href={`/api/files/${h.artifactKey}`}
                  download
                  className="inline-flex items-center gap-1 rounded-control border border-ink-200 px-2 py-1 text-xs text-ink-700"
                >
                  <Download className="h-3 w-3" /> Tải video
                  {h.submitTo ? ` → ${h.submitTo}` : ""}
                </a>
              ) : null}
              {h.status === "DONE" ? (
                <button
                  type="button"
                  onClick={() => tick(h.id, "PENDING")}
                  disabled={busy === h.id}
                  className="inline-flex items-center gap-1 rounded-control bg-success-50 px-2 py-1 text-xs font-semibold text-success-700"
                >
                  <Check className="h-3 w-3" /> Xong
                </button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => tick(h.id, "DONE")}
                  disabled={busy === h.id}
                >
                  Đánh dấu xong
                </Button>
              )}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
