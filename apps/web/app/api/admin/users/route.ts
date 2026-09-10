import { getPictureSet, pinToSecret, validatePassword, validatePin } from "@mtct/core";
import { Prisma, prisma } from "@mtct/db";
import { createUserSchema } from "@/lib/admin/schemas";
import { listUsersForAdmin } from "@/lib/admin/users";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { hashSecret } from "@/lib/auth/password";
import { requireRole } from "@/lib/auth/session";

/** GET /api/admin/users — the table for FR-ADM-06. */
export const GET = handle(async () => {
  await requireRole("ADMIN");
  return json({ items: await listUsersForAdmin() });
});

/** POST /api/admin/users — create PARENT/ADMIN (email + temp password) or CHILD (+ Student + pin). */
export const POST = handle(async (request: Request) => {
  const admin = await requireRole("ADMIN");
  const input = await parseBody(request, createUserSchema);

  try {
    if (input.role === "CHILD") {
      const set = getPictureSet(input.pictureSetKey);
      const pinIssues = validatePin(input.pin, set);
      if (pinIssues.length)
        throw new ApiError(400, "Mã hình không hợp lệ (4 hình thuộc bộ đã chọn)");
      const guardians = await prisma.user.findMany({
        where: { id: { in: input.guardianUserIds }, role: { in: ["PARENT", "ADMIN"] } },
        select: { id: true, role: true },
      });
      const slugBase = input.username;
      const user = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            username: input.username,
            displayName: input.displayName,
            avatarKey: input.avatarKey ?? null,
            role: "CHILD",
            picturePinHash: await hashSecret(pinToSecret(input.pin)),
            pictureSetKey: set.key,
            mustChangePassword: false,
            createdById: admin.id,
          },
        });
        await tx.student.create({
          data: {
            userId: created.id,
            slug: slugBase,
            fullName: input.student.fullName,
            nickname: input.student.nickname,
            avatarKey: input.avatarKey ?? null,
            birthDate: input.student.birthDate
              ? new Date(`${input.student.birthDate}T00:00:00Z`)
              : null,
            className: input.student.className,
            schoolYear: input.student.schoolYear,
            interests: input.student.interests,
            mascot: input.student.mascot,
            settings: {
              dailyMinutes: 15,
              suggestedTime: "19:30",
              voiceTutorEnabled: false,
              difficultyBias: 0,
            },
            guardians: {
              create: guardians.map((g) => ({
                userId: g.id,
                relation: g.role === "ADMIN" ? "ba" : "me",
              })),
            },
          },
        });
        return created;
      });
      await prisma.auditLog.create({
        data: { userId: admin.id, action: "USER_CREATED", target: user.id },
      });
      return json({ id: user.id }, { status: 201 });
    }

    const issues = validatePassword(input.password);
    if (issues.length)
      throw new ApiError(400, "Mật khẩu tạm phải ≥ 10 ký tự, có chữ và số, không quá phổ biến");
    const students = await prisma.student.findMany({
      where: { id: { in: input.guardianStudentIds } },
      select: { id: true },
    });
    const user = await prisma.user.create({
      data: {
        username: input.username,
        displayName: input.displayName,
        avatarKey: input.avatarKey ?? null,
        email: input.email,
        role: input.role,
        passwordHash: await hashSecret(input.password),
        mustChangePassword: true,
        createdById: admin.id,
        guardianOf: {
          create: students.map((s) => ({
            studentId: s.id,
            relation: input.role === "ADMIN" ? "ba" : "me",
          })),
        },
      },
    });
    await prisma.auditLog.create({
      data: { userId: admin.id, action: "USER_CREATED", target: user.id },
    });
    return json({ id: user.id }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ApiError(409, "Tên đăng nhập hoặc email đã tồn tại");
    }
    throw err;
  }
});
