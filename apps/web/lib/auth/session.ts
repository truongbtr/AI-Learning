import { type Area, canAccessStudent, type Role, roleAllowsArea } from "@mtct/core";
import { prisma } from "@mtct/db";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ApiError } from "@/lib/api";
import { bypassUser } from "@/lib/auth/bypass-gate";
import type { SessionUser } from "@/types/next-auth";

/**
 * Session user from the httpOnly cookie, or null.
 *
 * While "tắt đăng nhập" is on (docs/12 §7) a visitor with no cookie is handed the borrowed ADMIN
 * account instead, which is why every guard below — role, student, area — keeps working unchanged.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (session?.user) return session.user;
  return await bypassUser();
}

/** Where each role lands after login. */
export function homeFor(user: Pick<SessionUser, "role" | "mustChangePassword">): string {
  if (user.mustChangePassword) return "/change-password";
  switch (user.role) {
    case "ADMIN":
      return "/admin";
    case "PARENT":
      return "/parent";
    case "CHILD":
      return "/kid/home";
  }
}

// ---------- API helpers (throw ApiError) ----------

/** 401 when not logged in or the account was disabled meanwhile. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "Chưa đăng nhập");
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isActive: true, role: true, mustChangePassword: true },
  });
  if (!row?.isActive) throw new ApiError(401, "Tài khoản không khả dụng");
  return { ...user, role: row.role, mustChangePassword: row.mustChangePassword };
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new ApiError(403, "Không có quyền");
  return user;
}

/** Student ids the user may see: own (CHILD), linked (PARENT), all (ADMIN → not enumerated). */
export async function guardianStudentIds(userId: string): Promise<string[]> {
  const rows = await prisma.studentGuardian.findMany({
    where: { userId },
    select: { studentId: true },
  });
  return rows.map((r) => r.studentId);
}

/**
 * 403 unless the caller may access `studentId` (docs/02 §6). Checks the DB, never the client:
 * CHILD → Student.userId must equal the caller; PARENT → StudentGuardian link must exist.
 */
export async function requireStudentAccess(studentId: string) {
  const user = await requireUser();
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, userId: true, nickname: true, slug: true, isActive: true },
  });
  if (!student) throw new ApiError(404, "Không tìm thấy học sinh");
  const principal = {
    role: user.role,
    studentId: user.role === "CHILD" ? (student.userId === user.id ? student.id : null) : null,
    guardianStudentIds: user.role === "PARENT" ? await guardianStudentIds(user.id) : [],
  };
  if (!canAccessStudent(principal, student.id))
    throw new ApiError(403, "Không có quyền xem học sinh này");
  return { user, student };
}

// ---------- Page helpers (redirect) ----------

/** For server components: redirect to /login, /change-password or the user's home when not allowed. */
export async function guardPage(area: Area): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isActive: true, role: true, mustChangePassword: true },
  });
  if (!row?.isActive) redirect("/login");
  const fresh = { ...user, role: row.role, mustChangePassword: row.mustChangePassword };
  if (fresh.mustChangePassword) redirect("/change-password");
  if (!roleAllowsArea(fresh.role, area)) redirect(homeFor(fresh));
  return fresh;
}
