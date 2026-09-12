"use client";

import { Baby, Camera, Inbox, NotebookText, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * The phone layout of docs/06 §2: bottom tabs, and the floating "Chụp bài vở" button that is
 * always one thumb away.
 *
 * Four tabs, chosen by what a parent does standing in a kitchen at nine at night rather than by
 * the shape of the menu: the children, tonight's class diary, the approval inbox, and the school
 * calendar. Everything else is reachable from those and does not deserve a thumb-sized target.
 *
 * The camera is a floating action button rather than a fifth tab because it is the one action
 * that must not depend on where in the app you happen to be (docs/06 §2, "ưu tiên hành động 1
 * chạm từ điện thoại").
 */

const TABS = [
  { href: "/parent", label: "Các con", icon: Baby, exact: true },
  { href: "/parent/diary", label: "Nhật ký", icon: NotebookText },
  { href: "/parent/inbox", label: "Chờ duyệt", icon: Inbox, badge: "inbox" as const },
  { href: "/parent/school", label: "Năm học", icon: Settings },
];

export function BottomTabs({ badges }: { badges?: Partial<Record<"inbox", number>> }) {
  const pathname = usePathname();
  // The child's world has its own full-screen chrome; the grown-up bar must not float over it.
  if (pathname.startsWith("/kid")) return null;

  return (
    <>
      {/* Room for the bar plus the home indicator, so nothing sits under the last card. */}
      <div className="h-[calc(4.5rem+env(safe-area-inset-bottom))] lg:hidden" aria-hidden />

      <Link
        href="/parent/intake/new"
        data-testid="fab-camera"
        aria-label="Chụp bài vở"
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-popover transition-transform active:scale-95 lg:hidden"
      >
        <Camera className="h-6 w-6" />
      </Link>

      <nav
        aria-label="Thanh dưới"
        data-testid="bottom-tabs"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="flex">
          {TABS.map((tab) => {
            const active = tab.exact
              ? pathname === tab.href
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            const count = tab.badge ? (badges?.[tab.badge] ?? 0) : 0;
            return (
              <li key={tab.href} className="flex-1">
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  // 64px tall: the same thumb rule the child's world uses (docs/06 §1).
                  className={cn(
                    "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors",
                    active ? "text-brand-700" : "text-ink-400",
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                  {count > 0 ? (
                    <span className="absolute right-[22%] top-2 rounded-full bg-warning-500 px-1.5 text-[10px] font-bold text-white">
                      {count}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
