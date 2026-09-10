"use client";

import { getPictureSet, PIN_LENGTH } from "@mtct/core";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * 9-12 picture grid; the child taps 4 in order (docs/12 §4). Touch targets >= 64 px, text >= 22 px.
 * Used by kid login (big) and by admin when setting a pin (compact).
 */
export function PicturePinGrid({
  setKey,
  onComplete,
  onChange,
  size = "big",
  disabled,
  resetToken,
}: {
  setKey: string | null | undefined;
  onComplete?: (keys: string[]) => void;
  onChange?: (keys: string[]) => void;
  size?: "big" | "compact";
  disabled?: boolean;
  /** change this value to clear the selection from the outside */
  resetToken?: number;
}) {
  const set = getPictureSet(setKey);
  const [picked, setPicked] = useState<string[]>([]);
  const [lastReset, setLastReset] = useState(resetToken);
  if (resetToken !== lastReset) {
    setLastReset(resetToken);
    setPicked([]);
  }

  function tap(key: string) {
    if (disabled || picked.length >= PIN_LENGTH) return;
    const next = [...picked, key];
    setPicked(next);
    onChange?.(next);
    if (next.length === PIN_LENGTH) onComplete?.(next);
  }

  function clear() {
    setPicked([]);
    onChange?.([]);
  }

  const big = size === "big";
  return (
    <div className="space-y-3">
      <output className="flex items-center justify-center gap-2" aria-label="Đã chọn">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => {
          const key = picked[i];
          const pic = set.pictures.find((p) => p.key === key);
          return (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length slots
              key={i}
              className={cn(
                "flex items-center justify-center rounded-2xl border-4 bg-white",
                big ? "h-16 w-16 text-4xl" : "h-12 w-12 text-2xl",
                pic ? "border-amber-400" : "border-dashed border-slate-300",
              )}
            >
              {pic ? pic.emoji : ""}
            </div>
          );
        })}
      </output>
      <div
        className={cn(
          "grid gap-3",
          big ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-4 sm:grid-cols-6",
        )}
      >
        {set.pictures.map((p) => (
          <button
            type="button"
            key={p.key}
            onClick={() => tap(p.key)}
            disabled={disabled}
            aria-label={p.labelVi}
            className={cn(
              "flex flex-col items-center justify-center rounded-2xl border-4 border-white bg-white/90 shadow-md transition-transform active:scale-95 disabled:opacity-60",
              big ? "min-h-24 text-5xl" : "min-h-16 text-3xl",
            )}
          >
            <span>{p.emoji}</span>
            {big ? (
              <span className="mt-1 text-lg font-bold text-slate-600">{p.labelVi}</span>
            ) : null}
          </button>
        ))}
      </div>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={clear}
          disabled={disabled || picked.length === 0}
          className={cn(
            "rounded-full bg-slate-200 px-6 font-bold text-slate-700 disabled:opacity-40",
            big ? "min-h-16 text-2xl" : "min-h-10 text-sm",
          )}
        >
          Xoá
        </button>
      </div>
    </div>
  );
}
