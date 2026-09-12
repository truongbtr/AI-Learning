import { chatBatchBelongsTo, prisma, undoChatBatch } from "@mtct/db";
import { z } from "zod";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { guardianStudentIds, requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const schema = z.object({ batchId: z.string().min(1).max(40) });

/**
 * `POST /api/parent/chat-batch` — "Hoàn tác lô này" (docs/13 §7.3).
 *
 * The button that makes applying straight away acceptable, so it has to be genuinely one tap and it
 * has to be honest: the evidence of that batch is deleted and every mastery it touched is rebuilt
 * from what is left (`undoChatBatch`), not nudged back by a guess.
 *
 * A parent may only undo a batch belonging to a child they are attached to, checked in the database
 * — never from anything the client sent (docs/12 §4).
 */
export const POST = handle(async (request: Request) => {
  const user = await requireRole("PARENT", "ADMIN");
  const { batchId } = await parseBody(request, schema);
  const scope = user.role === "ADMIN" ? null : await guardianStudentIds(user.id);
  if (!(await chatBatchBelongsTo(prisma, batchId, scope)))
    throw new ApiError(404, "Không tìm thấy lô này của con bạn");

  const result = await undoChatBatch(prisma, batchId, { byUserId: user.id });
  return json({
    ...result,
    message: result.alreadyUndone
      ? "Lô này đã được hoàn tác trước đó."
      : `Đã gỡ ${result.evidenceRemoved} bằng chứng và tính lại ${result.skillsRecomputed} kỹ năng.`,
  });
});
