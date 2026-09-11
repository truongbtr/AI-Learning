import type * as React from "react";
import { cn } from "@/lib/utils";

/** Input base (shadcn/ui): 44px control, hairline border, neutral focus ring. */
export const inputBaseClass =
  "h-11 w-full rounded-control border border-ink-200 bg-white px-3.5 text-sm text-ink-800 shadow-control transition-colors placeholder:text-ink-300 focus:border-ink-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBaseClass, className)} {...props} />;
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(inputBaseClass, "pr-9", className)} {...props} />;
}

/** Label wrapping its control (accessible name = label text only; the hint sits outside). */
export function Field({
  label,
  children,
  hint,
  error,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string | null;
}) {
  return (
    <div className="space-y-1.5">
      {/* biome-ignore lint/a11y/noLabelWithoutControl: the control is passed as children */}
      <label className="block space-y-1.5">
        <span className="block text-sm font-semibold text-ink-700">{label}</span>
        {children}
      </label>
      {error ? (
        <p className="text-xs font-medium text-danger-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}
