import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Page header: breadcrumb, title, description, actions on the right (docs/06 §2). */
export function PageHeader({
  breadcrumb,
  title,
  description,
  actions,
  className,
}: {
  breadcrumb?: string[];
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 ? (
          <nav
            aria-label="Đường dẫn"
            className="mb-1 flex items-center gap-1.5 text-xs text-ink-400"
          >
            {breadcrumb.map((item, index) => (
              <span key={item} className="flex items-center gap-1.5">
                {index > 0 ? <span className="text-ink-300">/</span> : null}
                <span className={index === breadcrumb.length - 1 ? "text-ink-500" : undefined}>
                  {item}
                </span>
              </span>
            ))}
          </nav>
        ) : null}
        <h1 className="text-display-sm font-semibold tracking-tight text-ink-900">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-ink-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
