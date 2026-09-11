import { randomUUID } from "node:crypto";
import {
  INTAKE_MAX_FILES,
  INTAKE_MAX_UPLOAD_BYTES,
  INTAKE_MIME_EXT,
  type IntakeFileRef,
} from "@mtct/core";
import { createIntakeJob, prisma } from "@mtct/db";
import { z } from "zod";
import { ApiError, handle, json } from "@/lib/api";
import { requireRole, requireStudentAccess } from "@/lib/auth/session";
import { fileStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";

const SUBJECTS = ["ESL", "ENL", "EMATH", "ESCI", "VIET", "VMATH"] as const;
const DOC_TYPES = [
  "WORKBOOK",
  "TEST",
  "WORKSHEET",
  "TEACHER_NOTE",
  "CLASS_DIARY",
  "NAVIO_REPORT",
  "KIDSAZ_REPORT",
  "OTHER",
] as const;

const fieldsSchema = z.object({
  studentId: z.string().min(1),
  subject: z.enum(SUBJECTS).nullable().optional(),
  docType: z.enum(DOC_TYPES).nullable().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  note: z.string().max(300).nullable().optional(),
});

/**
 * POST /api/intake (FR-INT-01) — the photos a parent took of today's schoolwork.
 *
 * The originals are stored exactly as they arrived and are never touched again: they are the
 * evidence a parent comes back to in a month's time. Everything else — straightening, shrinking,
 * the duplicate check, and the reading itself — happens later and elsewhere (ADR-10), so this
 * handler stays fast enough to run on a phone in a kitchen with one bar of signal.
 */
export const POST = handle(async (request: Request) => {
  const user = await requireRole("PARENT", "ADMIN");
  const form = await request.formData().catch(() => null);
  if (!form) throw new ApiError(400, "Cần gửi multipart/form-data");

  const fields = fieldsSchema.parse({
    studentId: form.get("studentId"),
    subject: form.get("subject") || null,
    docType: form.get("docType") || null,
    date: form.get("date") || null,
    note: form.get("note") || null,
  });
  // The link between this parent and this child is checked in the database, never assumed.
  const { student } = await requireStudentAccess(fields.studentId);

  const uploads = form.getAll("files").filter((f): f is File => f instanceof File);
  if (uploads.length === 0) throw new ApiError(400, "Chưa chọn ảnh nào");
  if (uploads.length > INTAKE_MAX_FILES)
    throw new ApiError(413, `Mỗi lần gửi tối đa ${INTAKE_MAX_FILES} ảnh`);

  const storage = fileStorage();
  const day = (fields.date ?? new Date().toISOString().slice(0, 10)).slice(0, 10);
  const files: IntakeFileRef[] = [];

  for (const upload of uploads) {
    const ext = INTAKE_MIME_EXT[upload.type];
    if (!ext) throw new ApiError(415, "Chỉ nhận ảnh JPG, PNG, WEBP hoặc HEIC");
    if (upload.size > INTAKE_MAX_UPLOAD_BYTES)
      throw new ApiError(413, "Ảnh lớn quá, chụp lại giúp mình nhé");
    const originalKey = `intake-original/${day}/${randomUUID()}.${ext}`;
    const bytes = new Uint8Array(await upload.arrayBuffer());
    await storage.put(originalKey, bytes, upload.type);
    files.push({
      key: originalKey,
      originalKey,
      mime: upload.type,
      bytes: bytes.byteLength,
      pending: true,
    });
  }

  const job = await createIntakeJob(prisma, {
    studentId: student.id,
    createdById: user.id,
    subjectHint: fields.subject ?? null,
    docTypeHint: fields.docType ?? null,
    dateHint: fields.date ? new Date(`${fields.date}T00:00:00`) : null,
    note: fields.note ?? null,
    files,
  });

  return json(
    {
      jobId: job.id,
      files: job.files,
      status: "QUEUED",
      message: "Đã nhận ảnh. Hệ thống đang chuẩn bị, kết quả sẽ vào hộp thư chờ ba mẹ duyệt.",
    },
    { status: 201 },
  );
});
