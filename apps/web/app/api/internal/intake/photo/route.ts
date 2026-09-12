import { randomUUID } from "node:crypto";
import { INTAKE_MAX_UPLOAD_BYTES, INTAKE_MIME_EXT } from "@mtct/core";
import { prisma, saveChatPhoto } from "@mtct/db";
import { ApiError, json } from "@/lib/api";
import { internalHandler } from "@/lib/internal/guard";
import { chatPhotoFieldsSchema } from "@/lib/internal/schemas";
import { fileStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * `POST /api/internal/intake/photo` — one picture, `multipart/form-data`, returns a `photoId`
 * (docs/13 §7.1).
 *
 * One photo per call on purpose. The upload is the part that fails in a kitchen with one bar of
 * signal, and a failure that loses one picture out of five is a retry; a failure that loses the
 * whole evening is the owner giving up on the habit. The original bytes are stored once and never
 * touched again (docs/07 §1) — they are what a parent comes back to when they disagree with a label.
 */
export const POST = internalHandler("/api/internal/intake/photo", async (request) => {
  const form = await request.formData().catch(() => null);
  if (!form) throw new ApiError(400, "Cần gửi multipart/form-data với trường file");

  const fields = chatPhotoFieldsSchema.parse({
    student: form.get("student") || null,
    date: form.get("date") || null,
  });

  const upload = [form.get("file"), form.get("photo"), ...form.getAll("files")].find(
    (f): f is File => f instanceof File,
  );
  if (!upload) throw new ApiError(400, "Chưa có ảnh nào trong trường file");

  const ext = INTAKE_MIME_EXT[upload.type];
  if (!ext) throw new ApiError(415, "Chỉ nhận ảnh JPG, PNG, WEBP hoặc HEIC");
  if (upload.size > INTAKE_MAX_UPLOAD_BYTES)
    throw new ApiError(413, "Ảnh lớn quá (trên 12 MB) — chụp lại nhỏ hơn giúp mình nhé");

  const student = fields.student
    ? await prisma.student.findFirst({
        where: {
          isActive: true,
          OR: [
            { slug: fields.student.toLowerCase() },
            { nickname: { equals: fields.student, mode: "insensitive" } },
          ],
        },
        select: { id: true, nickname: true },
      })
    : null;
  if (fields.student && !student)
    throw new ApiError(404, `Không có bé nào tên gọi "${fields.student}"`);

  const day = fields.date ?? new Date().toISOString().slice(0, 10);
  const key = `intake-original/${day}/${randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await upload.arrayBuffer());
  await fileStorage().put(key, bytes, upload.type);

  const saved = await saveChatPhoto(prisma, {
    studentId: student?.id ?? null,
    key,
    mime: upload.type,
    bytes,
  });

  return {
    response: json(
      {
        photoId: saved.photoId,
        bytes: saved.bytes,
        sha256: saved.sha256,
        duplicate: saved.duplicate,
        next: "POST /api/internal/intake với photoIds: [photoId] và thân là IntakeExtraction",
      },
      { status: saved.duplicate ? 200 : 201 },
    ),
    studentId: student?.id ?? null,
    note: saved.duplicate
      ? `ảnh đã có rồi (${Math.round(saved.bytes / 1024)} KB) — dùng lại photoId cũ`
      : `nhận ảnh ${Math.round(saved.bytes / 1024)} KB${student ? ` của ${student.nickname}` : ""}`,
  };
});
