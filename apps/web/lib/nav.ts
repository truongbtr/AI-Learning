import type { Role } from "@mtct/core";

/**
 * Single place that declares the adult-area menu (MEDIFA ONE `lib/nav.ts` convention).
 * Add a section here when a new area ships — never edit the Sidebar for that.
 */
export type NavIcon = "dashboard" | "users" | "health" | "children" | "kid" | "help";

export interface NavItem {
  label: string;
  href: string;
  roles?: Role[];
}

export interface NavSection {
  id: string;
  /** Small uppercase group title shown above the first section of a group. */
  group: string;
  label: string;
  href: string;
  icon: NavIcon;
  /** Who sees it; undefined = every signed-in adult. */
  roles?: Role[];
  /** Opens the child's world in a new tab (kid screens have no way back to the dashboard). */
  external?: boolean;
  children?: NavItem[];
}

export const navSections: NavSection[] = [
  {
    id: "dashboard",
    group: "Tổng quan",
    label: "Bảng điều khiển",
    href: "/admin",
    icon: "dashboard",
    roles: ["ADMIN"],
  },
  {
    id: "children",
    group: "Tổng quan",
    label: "Các con",
    href: "/parent",
    icon: "children",
  },
  {
    id: "users",
    group: "Hệ thống",
    label: "Người dùng",
    href: "/admin/users",
    icon: "users",
    roles: ["ADMIN"],
  },
  {
    id: "health",
    group: "Hệ thống",
    label: "Sức khoẻ hệ thống",
    href: "/admin/health",
    icon: "health",
    roles: ["ADMIN"],
  },
  {
    id: "kid",
    group: "Góc của con",
    label: "Xem thử góc của con",
    href: "/kid/home",
    icon: "kid",
    external: true,
  },
];

export function visibleSections(role: Role): NavSection[] {
  return navSections.filter((s) => !s.roles || s.roles.includes(role));
}

/** Exact match for the root of an area, prefix match for everything else. */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/admin" || href === "/parent") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
