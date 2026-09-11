"use client";

import { ChevronDown, KeyRound, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/lib/auth/actions";
import { avatarEmoji } from "@/lib/avatars";
import { cn } from "@/lib/utils";

export interface TopbarUser {
  displayName: string;
  roleLabel: string;
  avatarKey: string | null;
}

/** Sticky topbar: menu button on mobile, account panel on the right. */
export function Topbar({ onOpenSidebar, user }: { onOpenSidebar: () => void; user: TopbarUser }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-20 border-b border-ink-100 bg-surface-muted/85 backdrop-blur">
      <div ref={containerRef} className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Mở menu"
          className="rounded-control p-2 text-ink-500 hover:bg-white hover:text-ink-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="ml-auto relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="menu"
            className="flex items-center gap-2.5 rounded-control py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-white"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-100 text-xl">
              {avatarEmoji(user.avatarKey)}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold leading-tight text-ink-800">
                {user.displayName}
              </span>
              <span className="block text-xs text-ink-400">{user.roleLabel}</span>
            </span>
            <ChevronDown
              className={cn("h-4 w-4 text-ink-400 transition-transform", open && "rotate-180")}
            />
          </button>

          {open ? (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-60 animate-scale-in overflow-hidden rounded-card border border-ink-100 bg-white shadow-popover"
            >
              <div className="border-b border-ink-100 px-4 py-3 sm:hidden">
                <p className="text-sm font-bold text-ink-900">{user.displayName}</p>
                <p className="text-xs text-ink-400">{user.roleLabel}</p>
              </div>
              <Link
                href="/change-password"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
              >
                <KeyRound className="h-4 w-4 text-ink-400" />
                Đổi mật khẩu
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  role="menuitem"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-danger-600 hover:bg-danger-50"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
