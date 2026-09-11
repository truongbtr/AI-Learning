"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * FR-PAR-08 — a letter into the child's mailbox, or the one-tap "Khen" that drops a big gold star
 * on the child's screen (docs/06 §1.8c items 5 and 10).
 *
 * A letter arrives the next morning, on the map, and the mascot reads it out loud. Nothing here is
 * generated: what the parent types is exactly what the child hears.
 */
export function SendMailCard({ studentId, nickname }: { studentId: string; nickname: string }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(kind: "letter" | "praise") {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const res = await fetch("/api/parent/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, kind, text: kind === "letter" ? text : undefined }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Không gửi được");
      }
      setDone(
        kind === "praise"
          ? `Đã gửi một ngôi sao vàng cho ${nickname}.`
          : `Thư sẽ đến hộp thư của ${nickname} sáng mai.`,
      );
      if (kind === "letter") setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không gửi được");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Gửi thư &amp; khen con</CardTitle>
          <CardDescription>
            Thư đến hộp thư của con sáng hôm sau, bạn mascot đọc to. Nút "Khen" gửi ngay một ngôi
            sao vàng lớn.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <label className="text-sm font-medium text-ink-700" htmlFor="kid-mail">
          Lời nhắn cho {nickname} (tối đa 200 chữ)
        </label>
        <textarea
          id="kid-mail"
          value={text}
          maxLength={200}
          rows={3}
          onChange={(e) => setText(e.target.value)}
          placeholder="Hôm nay ba thấy con học rất chăm…"
          className="rounded-control border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => send("letter")} disabled={busy || text.trim().length === 0}>
            Gửi thư
          </Button>
          <Button variant="secondary" onClick={() => send("praise")} disabled={busy}>
            ⭐ Khen con
          </Button>
          {done ? <span className="text-sm font-medium text-success-700">{done}</span> : null}
          {error ? (
            <span role="alert" className="text-sm font-medium text-danger-600">
              {error}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
