import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

/** Wordmark for the adult area (MEDIFA ONE `Logo` layout: mark tile + two-line text). */
export function Logo({ className, markOnly = false }: { className?: string; markOnly?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-100 bg-brand-500 text-white shadow-control">
        <GraduationCap className="h-5 w-5" aria-hidden />
      </span>
      {markOnly ? null : (
        <span className="flex flex-col leading-none">
          <span className="font-kid text-[15px] font-extrabold tracking-tight text-brand-700">
            Thy &amp; Thanh
          </span>
          <span className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.22em] text-accent-500">
            Học cùng
          </span>
        </span>
      )}
    </span>
  );
}
