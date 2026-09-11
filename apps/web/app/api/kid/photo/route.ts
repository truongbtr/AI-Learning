import { randomUUID } from "node:crypto";
import { ApiError, handle, json } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { fileStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

/**
 * POST /api/kid/photo — the photo of a page of handwriting (docs/06 K9). Stored as a file and
 * answered with its key; the key then travels with the attempt, and the grading happens offline
 * through the queue (ADR-10). Images only, 8 MB at most, and never anything executable.
 */
export const POST = handle(async (request: Request) => {
  await requireUser();
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "Thiếu ảnh");
  const ext = TYPES[file.type];
  if (!ext) throw new ApiError(415, "Chỉ nhận ảnh JPG, PNG, WEBP hoặc HEIC");
  if (file.size > MAX_BYTES) throw new ApiError(413, "Ảnh lớn quá, chụp lại giúp mình nhé");

  const day = new Date().toISOString().slice(0, 10);
  const key = `attempts/${day}/${randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  await fileStorage().put(key, bytes, file.type);
  return json({ photoKey: key, size: bytes.byteLength }, { status: 201 });
});
