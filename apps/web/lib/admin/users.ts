import { prisma } from "@mtct/db";

/** Row shape shared by the admin page and GET /api/admin/users. Never includes hashes. */
export interface AdminUserRow {
  id: string;
  username: string;
  displayName: string;
  avatarKey: string | null;
  email: string | null;
  role: "ADMIN" | "PARENT" | "CHILD";
  isActive: boolean;
  mustChangePassword: boolean;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  pictureSetKey: string | null;
  student: { id: string; nickname: string; slug: string } | null;
  guardianOf: { studentId: string; nickname: string; relation: string }[];
}

export interface StudentOption {
  id: string;
  nickname: string;
  slug: string;
  guardianUserIds: string[];
}

export async function listUsersForAdmin(): Promise<AdminUserRow[]> {
  const rows = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarKey: true,
      email: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      lockedUntil: true,
      lastLoginAt: true,
      createdAt: true,
      pictureSetKey: true,
      student: { select: { id: true, nickname: true, slug: true } },
      guardianOf: {
        select: { studentId: true, relation: true, student: { select: { nickname: true } } },
      },
    },
  });
  return rows.map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarKey: u.avatarKey,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    mustChangePassword: u.mustChangePassword,
    lockedUntil: u.lockedUntil && u.lockedUntil > new Date() ? u.lockedUntil.toISOString() : null,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    pictureSetKey: u.pictureSetKey,
    student: u.student,
    guardianOf: u.guardianOf.map((g) => ({
      studentId: g.studentId,
      nickname: g.student.nickname,
      relation: g.relation,
    })),
  }));
}

export async function listStudentsForAdmin(): Promise<StudentOption[]> {
  const rows = await prisma.student.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, nickname: true, slug: true, guardians: { select: { userId: true } } },
  });
  return rows.map((s) => ({
    id: s.id,
    nickname: s.nickname,
    slug: s.slug,
    guardianUserIds: s.guardians.map((g) => g.userId),
  }));
}
