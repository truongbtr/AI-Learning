import { getPictureSet, pinToSecret, validatePassword, validatePin } from "@mtct/core";
import { prisma } from "@mtct/db";
import { resetCredentialSchema } from "@/lib/admin/schemas";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { hashSecret } from "@/lib/auth/password";
import { requireRole } from "@/lib/auth/session";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/admin/users/:id/reset-credential — new temp password (adults) or new picture pin (child). */
export const POST = handle(async (request: Request, ctx: Ctx) => {
  const admin = await requireRole("ADMIN");
  const { id } = await ctx.params;
  const input = await parseBody(request, resetCredentialSchema);
  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, pictureSetKey: true },
  });
  if (!target) throw new ApiError(404, "Không tìm thấy tài khoản");

  if ("pin" in input) {
    if (target.role !== "CHILD") throw new ApiError(400, "Mã hình chỉ dành cho tài khoản con");
    const set = getPictureSet(input.pictureSetKey ?? target.pictureSetKey);
    if (validatePin(input.pin, set).length) throw new ApiError(400, "Mã hình không hợp lệ");
    await prisma.user.update({
      where: { id },
      data: {
        picturePinHash: await hashSecret(pinToSecret(input.pin)),
        pictureSetKey: set.key,
        failedCount: 0,
        lockedUntil: null,
      },
    });
  } else {
    if (target.role === "CHILD")
      throw new ApiError(400, "Tài khoản con dùng mã hình, không có mật khẩu");
    if (validatePassword(input.password).length) {
      throw new ApiError(400, "Mật khẩu tạm phải ≥ 10 ký tự, có chữ và số, không quá phổ biến");
    }
    await prisma.user.update({
      where: { id },
      data: {
        passwordHash: await hashSecret(input.password),
        mustChangePassword: true, // forced change at next login (docs/12 §5)
        failedCount: 0,
        lockedUntil: null,
      },
    });
  }
  await prisma.auditLog.create({
    data: { userId: admin.id, action: "CREDENTIAL_RESET", target: id },
  });
  return json({ ok: true });
});
