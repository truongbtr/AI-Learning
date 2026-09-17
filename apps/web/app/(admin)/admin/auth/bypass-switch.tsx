"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface State {
  on: boolean;
  until?: string;
  as?: string;
}

const HOURS = [1, 4, 8, 24];

/**
 * The switch itself. Off is one tap; on asks for how long first, because the only safe version of
 * this feature is one that closes itself (docs/12 §7).
 */
export function BypassSwitch({ initial }: { initial: State }) {
  const router = useRouter();
  const [state, setState] = useState<State>(initial);
  const [hours, setHours] = useState(4);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function flip(enabled: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth-bypass", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          enabled ? { enabled, hours, note: "bật từ trang quản trị" } : { enabled },
        ),
      });
      const data = (await res.json()) as State & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Không đổi được");
      setState(data);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4" data-testid="bypass-switch">
      {state.on ? (
        <>
          <p className="text-ink-800">
            Đang <b>TẮT đăng nhập</b>. Mọi người vào thẳng trang quản trị với tài khoản{" "}
            <b>{state.as}</b>, tới{" "}
            <b>{state.until ? new Date(state.until).toLocaleString("vi-VN") : "—"}</b> thì tự bật
            lại.
          </p>
          <div>
            <Button onClick={() => flip(false)} disabled={busy} data-testid="bypass-off">
              Bật lại đăng nhập ngay
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-ink-800">
            Đang <b>yêu cầu đăng nhập</b> như bình thường.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-ink-600 text-sm">Tắt trong</span>
            {HOURS.map((h) => (
              <button
                type="button"
                key={h}
                onClick={() => setHours(h)}
                className={`min-h-11 rounded-xl border px-3 text-sm ${
                  hours === h
                    ? "border-brand-500 bg-brand-50 font-semibold text-brand-700"
                    : "border-ink-200 text-ink-700"
                }`}
              >
                {h} giờ
              </button>
            ))}
            <Button
              variant="destructive"
              onClick={() => flip(true)}
              disabled={busy}
              data-testid="bypass-on"
            >
              Tắt đăng nhập
            </Button>
          </div>
        </>
      )}
      {error ? <p className="text-danger-600 text-sm">{error}</p> : null}
    </div>
  );
}
