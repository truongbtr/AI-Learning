import { validatePassword } from "@mtct/core";
import { prisma } from "@mtct/db";
import { z } from "zod";
import { unstable_update } from "@/auth";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { hashSecret, verifySecret } from "@/lib/auth/password";
import { getSessionUser } from "@/lib/auth/session";

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1).max(200),
});

const ISSUE_MESSAGE = {
  TOO_SHORT: "Mật khẩu mới phải có ít nhất 10 ký tự.",
  TOO_COMMON: "Mật khẩu này quá phổ biến, chọn mật khẩu khác nhé.",
  NO_VARIETY: "Mật khẩu cần có chữ và số hoặc ký hiệu.",
} as const;

/** POST /api/auth/change-password — adults only; clears mustChangePassword (docs/12 §3). */
export const POST = handle(async (request: Request) => {
  // Allowed even while mustChangePassword is true (proxy lets this path through).
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "Chưa đăng nhập");
  if (user.role === "CHILD") throw new ApiError(403, "Tài khoản của con không có mật khẩu");

  const { currentPassword, newPassword } = await parseBody(request, bodySchema);
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true, isActive: true },
  });
  if (!row?.isActive) throw new ApiError(401, "Tài khoản không khả dụng");
  if (!(await verifySecret(row.passwordHash, currentPassword))) {
    throw new ApiError(400, "Mật khẩu hiện tại không đúng.");
  }
  if (currentPassword === newPassword)
    throw new ApiError(400, "Mật khẩu mới phải khác mật khẩu hiện tại.");
  const issues = validatePassword(newPassword);
  if (issues.length) throw new ApiError(400, ISSUE_MESSAGE[issues[0]!]);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashSecret(newPassword),
      mustChangePassword: false,
      failedCount: 0,
      lockedUntil: null,
    },
  });
  await prisma.auditLog.create({
    data: { userId: user.id, action: "PASSWORD_CHANGED", target: user.id },
  });
  // Refresh the JWT cookie so proxy.ts stops redirecting to /change-password immediately.
  await unstable_update({ mustChangePassword: false } as never);
  return json({ ok: true });
});
