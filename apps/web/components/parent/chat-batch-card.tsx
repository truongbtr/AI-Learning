"use client";

import type { ChatBatchCard as Card_ } from "@mtct/db";
import { Camera, Check, NotebookText, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardDescription, CardTitle } from "@/components/ui/card";

/**
 * The card that appears on the dashboard after an evening of photos (docs/13 §7.3).
 *
 * It is the price of applying without asking. Three things have to be on it within one glance —
 * **what was read**, **what it changed**, **what it was not sure about** — and the undo has to be a
 * single tap with no confirmation dialog, because a dialog is how a parent learns to stop reading.
 * Undoing is itself reversible in the only way that matters: send the photos again.
 */
export function ChatBatchCards({ cards }: { cards: SerializedCard[] }) {
  if (cards.length === 0) return null;
  return (
    <div className="flex flex-col gap-3" data-testid="chat-batches">
      {cards.map((card) => (
        <ChatBatchRow key={card.id} card={card} />
      ))}
    </div>
  );
}

/** The card as it crosses the server/client boundary: dates as strings. */
export type SerializedCard = Omit<Card_, "appliedAt" | "undoneAt"> & {
  appliedAt: string;
  undoneAt: string | null;
};

function ChatBatchRow({ card }: { card: SerializedCard }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [undone, setUndone] = useState(card.undoneAt !== null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const undo = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/parent/chat-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: card.id }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Không hoàn tác được");
      setUndone(true);
      setMessage(data.message ?? "Đã hoàn tác.");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const when = new Date(card.appliedAt).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const isDiary = card.kind === "DIARY";

  return (
    <Card
      className={`flex flex-col gap-3 ${undone ? "border-ink-100 bg-ink-50/60" : "border-brand-200 bg-brand-50/40"}`}
      data-testid={`chat-batch-${card.id}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {isDiary ? (
          <NotebookText className="h-5 w-5 shrink-0 text-brand-600" aria-hidden />
        ) : (
          <Camera className="h-5 w-5 shrink-0 text-brand-600" aria-hidden />
        )}
        <CardTitle className="min-w-0 flex-1">
          {isDiary
            ? "Nhật ký lớp gửi từ điện thoại"
            : `Ảnh bài vở${card.nickname ? ` của ${card.nickname}` : ""} — đọc lúc ${when}`}
        </CardTitle>
        {undone ? (
          <Badge tone="neutral" dot>
            đã hoàn tác
          </Badge>
        ) : card.status === "HELD" ? (
          <Badge tone="warning" dot>
            chờ ba mẹ xem
          </Badge>
        ) : card.status === "PARTIAL" ? (
          <Badge tone="warning" dot>
            còn {card.heldCount} câu chờ
          </Badge>
        ) : (
          <Badge tone="success" dot>
            đã ghi nhận
          </Badge>
        )}
      </div>

      <CardDescription>
        {isDiary
          ? card.summary
          : [
              card.photoCount > 0 ? `${card.photoCount} ảnh` : null,
              `${card.itemCount} câu`,
              undone ? "0 bằng chứng" : `${card.evidenceCount} bằng chứng`,
              card.summary || null,
            ]
              .filter(Boolean)
              .join(" · ")}
      </CardDescription>

      {!undone && card.moved.length > 0 ? (
        <ul className="flex flex-col gap-1 text-sm text-ink-700">
          {card.moved.map((m) => (
            <li key={m.skillCode} className="flex items-baseline gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-600" aria-hidden />
              <span className="min-w-0 flex-1">
                {m.nameVi || m.skillCode}{" "}
                <span className="text-ink-400">
                  {Math.round(m.before)} →{" "}
                  <strong className="text-ink-700">{Math.round(m.after)}</strong>
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {card.heldReasons.length > 0 && !undone ? (
        <div className="rounded-control border border-warning-100 bg-warning-50 px-3 py-2">
          <p className="text-xs font-semibold text-warning-800">Chưa dám tự ghi:</p>
          <ul className="mt-1 flex list-disc flex-col gap-0.5 pl-4 text-xs text-warning-700">
            {card.heldReasons.slice(0, 4).map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          {card.reviewHref ? (
            <Link
              href={card.reviewHref}
              className="mt-2 inline-block text-xs font-semibold text-brand-700 underline-offset-2 hover:underline"
            >
              Mở trang duyệt →
            </Link>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm font-medium text-danger-600">
          {error}
        </p>
      ) : null}
      {message && undone ? <p className="text-sm text-ink-500">{message}</p> : null}

      {card.canUndo && !undone ? (
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            loading={busy}
            data-testid="undo-batch"
          >
            <Undo2 className="h-4 w-4" aria-hidden /> Hoàn tác lô này
          </Button>
          <span className="text-xs text-ink-400">
            Gỡ hết bằng chứng của lô và tính lại điểm kỹ năng.
          </span>
        </div>
      ) : null}
    </Card>
  );
}
