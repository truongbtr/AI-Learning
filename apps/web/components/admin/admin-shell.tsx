"use client";

import { useState } from "react";
import type { NavSection } from "@/lib/nav";
import { Sidebar } from "./sidebar";
import { Topbar, type TopbarUser } from "./topbar";

/**
 * MEDIFA ONE `AdminShell`: shared frame for every adult page (admin + parent dashboard).
 * Desktop-first: fixed 264px sidebar from lg; drawer below.
 */
export function AdminShell({
  children,
  sections,
  user,
}: {
  children: React.ReactNode;
  sections: NavSection[];
  user: TopbarUser;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-dvh bg-surface-muted">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} sections={sections} />
      <div className="lg:pl-[264px]">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} user={user} />
        <main className="mx-auto w-full max-w-[1440px] px-4 pb-8 pt-6 sm:px-6">{children}</main>
        <footer className="px-4 pb-6 text-center text-xs text-ink-300 sm:px-6">
          Học cùng Mai Thy &amp; Chí Thanh · pha 0
        </footer>
      </div>
    </div>
  );
}
