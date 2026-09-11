import type { Role } from "@mtct/core";

/**
 * Single place that declares the adult-area menu (docs/06 §2.1-2.2).
 * Add a section here when a new area ships — never edit the Sidebar for that.
 */
export type NavIcon =
  | "dashboard"
  | "users"
  | "health"
  | "children"
  | "kid"
  | "help"
  | "skills"
  | "content"
  | "inbox"
  | "camera"
  | "diary"
  | "school";

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
  /** Key into the counts the layout passes down, drawn as a number beside the label. */
  badge?: "inbox";
  children?: NavItem[];
}

export const navSections: NavSection[] = [
  {
    id: "children",
    group: "Tổng quan",
    label: "Các con",
    href: "/parent",
    icon: "children",
  },
  {
    id: "intake",
    group: "Nạp dữ liệu",
    label: "Chụp bài vở",
    href: "/parent/intake/new",
    icon: "camera",
  },
  {
    id: "diary",
    group: "Nạp dữ liệu",
    label: "Nhật ký lớp",
    href: "/parent/diary",
    icon: "diary",
  },
  {
    id: "parent-inbox",
    group: "Nạp dữ liệu",
    label: "Hộp thư duyệt",
    href: "/parent/inbox",
    icon: "inbox",
    badge: "inbox",
  },
  {
    id: "skills",
    group: "Nội dung",
    label: "Bản đồ kỹ năng",
    href: "/admin/skills",
    icon: "skills",
    roles: ["ADMIN"],
  },
  {
    id: "content",
    group: "Nội dung",
    label: "Ngân hàng bài",
    href: "/admin/content",
    icon: "content",
    roles: ["ADMIN"],
  },
  {
    id: "inbox",
    group: "Nội dung",
    label: "Hàng chờ AI",
    href: "/admin/inbox",
    icon: "inbox",
    roles: ["ADMIN"],
  },
  {
    id: "devkit",
    group: "Nội dung",
    label: "Bộ dựng bài",
    href: "/dev/kit",
    icon: "help",
    roles: ["ADMIN"],
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
    id: "school",
    group: "Hệ thống",
    label: "Năm học",
    href: "/parent/school",
    icon: "school",
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
  if (href === "/parent") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
