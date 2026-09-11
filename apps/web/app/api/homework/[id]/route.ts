import { randomUUID } from "node:crypto";
import { attachHomeworkArtifact, markHomeworkRound, prisma, setHomeworkStatus } from "@mtct/db";
import { z } from "zod";
import { ApiError, handle, json } from "@/lib/api";
import { requireStudentAccess, requireUser } from "@/lib/auth/session";
import { fileStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  action: z.enum(["round", "status"]),
  round: z.number().int().min(1).max(20).optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE", "SKIPPED"]).optional(),
});

const VIDEO_TYPES: Record<string, string> = {
  "video/webm": "webm",
  "video/mp4": "mp4",
};

/**
 * POST /api/homework/<id> — one more round of reading done, or a grown-up ticking off a task
 * that happens away from the screen (FR-LRN-07).
 */
export const POST = handle(async (request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const homework = await prisma.homework.findUnique({
    where: { id },
    select: { id: true, studentId: true, taskType: true },
  });
  if (!homework) throw new ApiError(404, "Không tìm thấy bài cô giao");
  await requireStudentAccess(homework.studentId);

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    // "Quay cho cô": the video is stored for a parent to upload to Teams. The app never submits it
    // anywhere on its own (docs/11 §6.2).
    const form = await request.formData();
    const file = form.get("video");
    if (!(file instanceof File)) throw new ApiError(400, "Thiếu video");
    const ext = VIDEO_TYPES[file.type];
    if (!ext) throw new ApiError(415, "Chỉ nhận video WEBM hoặc MP4");
    if (file.size > 80 * 1024 * 1024) throw new ApiError(413, "Video dài quá, quay ngắn hơn nhé");
    const key = `homework/${homework.studentId}/${homework.id}-${randomUUID()}.${ext}`;
    await fileStorage().put(key, new Uint8Array(await file.arrayBuffer()), file.type);
    await attachHomeworkArtifact(prisma, {
      homeworkId: homework.id,
      studentId: homework.studentId,
      artifactKey: key,
    });
    return json({ artifactKey: key, downloadUrl: `/api/files/${key}` }, { status: 201 });
  }

  const body = bodySchema.parse(await request.json().catch(() => ({})));
  if (body.action === "round") {
    const progress = await markHomeworkRound(prisma, {
      homeworkId: homework.id,
      studentId: homework.studentId,
      round: body.round,
    });
    return json(progress);
  }
  // Only a grown-up decides a task is done or skipped without doing it in the app.
  if (user.role === "CHILD") throw new ApiError(403, "Không có quyền");
  const updated = await setHomeworkStatus(prisma, {
    homeworkId: homework.id,
    studentId: homework.studentId,
    status: body.status ?? "DONE",
  });
  return json(updated);
});
