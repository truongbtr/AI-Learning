"use client";

import { X } from "lucide-react";
import type * as React from "react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Modal on top of the native <dialog> element (MEDIFA ONE `Modal` look, no extra dependency). */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
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
        "m-auto w-[min(92vw,40rem)] animate-scale-in rounded-card border border-ink-100 bg-white p-0 text-ink-800 shadow-popover backdrop:bg-ink-900/40",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-4">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-ink-900">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-ink-400">{description}</p> : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-control p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="thin-scrollbar max-h-[75vh] overflow-y-auto px-6 py-5">
        {open ? children : null}
      </div>
    </dialog>
  );
}
