"use client";

import {
  Activity,
  Baby,
  BookOpen,
  ExternalLink,
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  Network,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { isActivePath, type NavIcon, type NavSection } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

const ICONS: Record<NavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  users: Users,
  health: Activity,
  children: Baby,
  skills: Network,
  content: BookOpen,
  inbox: Inbox,
  kid: Sparkles,
  help: Sparkles,
};

/**
 * Sidebar (docs/06 §2): fixed 240px on lg+, slide-in drawer below. Sections come from lib/nav.ts;
 * the active row gets a neutral tint — no brand colour from another project (ADR-11).
 */
export function Sidebar({
  open,
  onClose,
  sections,
}: {
  open: boolean;
  onClose: () => void;
  sections: NavSection[];
}) {
  const pathname = usePathname();
  const homeHref = sections[0]?.href ?? "/parent";

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-ink-900/40 lg:hidden"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-ink-100 bg-white transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link href={homeHref} onClick={onClose} aria-label="Về trang chính">
            <Logo />
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng menu"
            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-5 h-px bg-ink-100" />

        <nav
          aria-label="Điều hướng chính"
          className="thin-scrollbar flex-1 overflow-y-auto px-3 py-4"
        >
          <ul className="flex flex-col gap-1">
            {sections.map((section, index) => {
              const Icon = ICONS[section.icon];
              const active = isActivePath(pathname, section.href);
              const showGroup = index === 0 || sections[index - 1]?.group !== section.group;
              const rowClass = cn(
                "group flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-ink-100 text-ink-900"
                  : "text-ink-500 hover:bg-ink-50 hover:text-ink-800",
              );
              return (
                <Fragment key={section.id}>
                  {showGroup ? (
                    <li
                      className={cn(
                        "px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-300",
                        index > 0 && "pt-4",
                      )}
                    >
                      {section.group}
                    </li>
                  ) : null}
                  <li>
                    {section.external ? (
                      <a
                        href={section.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onClose}
                        className={rowClass}
                      >
                        <Icon className="h-5 w-5 text-ink-400" />
                        <span className="truncate">{section.label}</span>
                        <ExternalLink className="ml-auto h-4 w-4 text-ink-300" aria-hidden />
                        <span className="sr-only">(mở tab mới)</span>
                      </a>
                    ) : (
                      <Link
                        href={section.href}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className={rowClass}
                      >
                        <Icon className={cn("h-5 w-5", active ? "text-ink-700" : "text-ink-400")} />
                        <span className="truncate">{section.label}</span>
                      </Link>
                    )}
                  </li>
                </Fragment>
              );
            })}
          </ul>
        </nav>

        <div className="m-3 rounded-card border border-ink-100 bg-ink-50 p-4">
          <p className="text-sm font-bold text-ink-800">Máy chủ tại nhà</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-500">
            Dữ liệu của con không rời khỏi gia đình. Không có đăng ký công khai.
          </p>
        </div>
      </aside>
    </>
  );
}
