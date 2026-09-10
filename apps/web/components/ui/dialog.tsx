"use client";

import { X } from "lucide-react";
import type * as React from "react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Modal on top of the native <dialog> element (no extra dependency). */
export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: native <dialog> already closes on Escape
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-[min(92vw,40rem)] rounded-xl border bg-card p-0 text-card-foreground shadow-xl backdrop:bg-black/40",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b px-5 py-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 hover:bg-accent"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{open ? children : null}</div>
    </dialog>
  );
}
