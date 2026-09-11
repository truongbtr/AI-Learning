import { roleAllowsArea } from "@mtct/core";
import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Route-level authorization (docs/02 §6): first line of defence; every handler/page checks again.
 * Runs on the Node runtime (Next 16 proxy). Uses only the JWT — no DB here.
 */
const { auth } = NextAuth(authConfig);

function homeFor(role: string, mustChange: boolean): string {
  if (mustChange) return "/change-password";
  if (role === "ADMIN") return "/admin/users";
  if (role === "PARENT") return "/parent";
  return "/kid/home";
}

function isAuthJsInternal(path: string): boolean {
  return path.startsWith("/api/auth/") && path !== "/api/auth/change-password";
}

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const user = req.auth?.user;
  const isApi = pathname.startsWith("/api/");

  // Internal endpoint for the worker: it authenticates with a bearer token, not a cookie, so the
  // session check here would reject it. The handler itself demands an ADMIN session or that token
  // (lib/auth/internal.ts) — CHILD and PARENT are refused there.
  if (pathname === "/api/evidence") return NextResponse.next();

  // Public: login page, Auth.js endpoints, health.
  if (pathname === "/login" || isAuthJsInternal(pathname) || pathname === "/api/health") {
    if (user && pathname === "/login") {
      return NextResponse.redirect(
        new URL(homeFor(user.role, user.mustChangePassword), req.nextUrl),
      );
    }
    return NextResponse.next();
  }

  if (!user) {
    if (isApi) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    const login = new URL("/login", req.nextUrl);
    if (pathname !== "/") login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  // Forced password change: nothing else is reachable until done (docs/12 §3).
  if (user.mustChangePassword && pathname !== "/change-password") {
    if (isApi && pathname !== "/api/auth/change-password") {
      return NextResponse.json({ error: "Phải đổi mật khẩu trước" }, { status: 403 });
    }
    if (!isApi) return NextResponse.redirect(new URL("/change-password", req.nextUrl));
  }

  const area = pathname.startsWith("/kid")
    ? "kid"
    : pathname.startsWith("/parent")
      ? "parent"
      : pathname.startsWith("/admin") ||
          pathname.startsWith("/api/admin") ||
          // /dev/kit renders any ExerciseSpec, answer key included — ADMIN only.
          pathname.startsWith("/dev")
        ? "admin"
        : null;
  if (area && !roleAllowsArea(user.role, area)) {
    if (isApi) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    return NextResponse.redirect(new URL(homeFor(user.role, user.mustChangePassword), req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|fonts/|art/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|json|lottie|mp3|woff2?)$).*)",
  ],
};
