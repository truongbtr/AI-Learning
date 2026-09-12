import { getPictureSet, pinToSecret, validatePin } from "@mtct/core";
import { prisma } from "@mtct/db";
import { z } from "zod";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { hashSecret } from "@/lib/auth/password";
import { requireStudentAccess } from "@/lib/auth/session";
import {
  pictureCodeSchema,
  rewardGoalSchema,
  studentSettingsSchema,
} from "@/lib/parent/settings-schema";

export const dynamic = "force-dynamic";

const bodySchema = z.union([
  z.object({ kind: z.literal("settings") }).and(studentSettingsSchema),
  z.object({ kind: z.literal("pictureCode") }).and(pictureCodeSchema),
  z.object({ kind: z.literal("rewardGoal") }).and(rewardGoalSchema),
  z.object({ kind: z.literal("cancelRewardGoal"), goalId: z.string().min(1) }),
]);

/**
 * PATCH /api/students/:id/settings — P13 (docs/06 §2.1 P13, FR-LRN-06).
 *
 * A grown-up's screen: a CHILD may not lengthen their own session, change their own picture code
 * or set their own reward. Everything is checked against the database on the way in — the client
 * never says who it is (docs/02 §6).
 */
export const PATCH = handle(async (request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const { user, student } = await requireStudentAccess(id);
  if (user.role === "CHILD") throw new ApiError(403, "Không có quyền");
  const body = await parseBody(request, bodySchema);

  if (body.kind === "settings") {
    const row = await prisma.student.findUniqueOrThrow({
      where: { id: student.id },
      select: { settings: true },
    });
    const settings = { ...((row.settings ?? {}) as Record<string, unknown>) };
    for (const key of ["dailyMinutes", "suggestedTime", "difficultyBias"] as const)
      if (body[key] !== undefined) settings[key] = body[key];

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: {
        settings: settings as never,
        ...(body.mascot ? { mascot: body.mascot } : {}),
        ...(body.interests ? { interests: body.interests } : {}),
        ...(body.avatarKey === undefined ? {} : { avatarKey: body.avatarKey }),
      },
      select: { mascot: true, interests: true, avatarKey: true, settings: true },
    });
    return json({ ok: true, student: updated });
  }

  if (body.kind === "pictureCode") {
    const child = await prisma.student.findUniqueOrThrow({
      where: { id: student.id },
      select: { userId: true, user: { select: { pictureSetKey: true } } },
    });
    const set = getPictureSet(body.pictureSetKey ?? child.user.pictureSetKey);
    if (validatePin(body.pin, set).length > 0) throw new ApiError(400, "Mã hình không hợp lệ");
    await prisma.user.update({
      where: { id: child.userId },
      data: {
        picturePinHash: await hashSecret(pinToSecret(body.pin)),
        pictureSetKey: set.key,
        failedCount: 0,
        lockedUntil: null,
      },
    });
    await prisma.auditLog.create({
      data: { userId: user.id, action: "CREDENTIAL_RESET", target: child.userId },
    });
    return json({ ok: true, pictureSetKey: set.key });
  }

  if (body.kind === "cancelRewardGoal") {
    await prisma.rewardGoal.updateMany({
      where: { id: body.goalId, studentId: student.id },
      data: { status: "CANCELLED" },
    });
    return json({ ok: true });
  }

  // One live goal at a time: two bars racing each other is two ways to disappoint a child.
  await prisma.rewardGoal.updateMany({
    where: { studentId: student.id, status: "ACTIVE" },
    data: { status: "CANCELLED" },
  });
  const goal = await prisma.rewardGoal.create({
    data: { studentId: student.id, title: body.title, starsNeeded: body.starsNeeded },
  });
  return json({ ok: true, goal });
});
