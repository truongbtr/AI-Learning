import { prisma } from "@mtct/db";
import { ApiError, handle } from "@/lib/api";
import { requireStudentAccess, requireUser } from "@/lib/auth/session";
import { fileStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";

const CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  mp3: "audio/mpeg",
  webm: "video/webm",
  mp4: "video/mp4",
};

/**
 * GET /api/files/<key> — a stored file, but only to someone allowed to see that child's things.
 *
 * Photos of schoolwork have a child's name and handwriting on them, so the key alone is never
 * enough: the row that owns the file is looked up and the caller is checked against it. Keys that
 * belong to nothing (a stray path, a guess) are 404, never served.
 */
export const GET = handle(
  async (_request: Request, ctx: { params: Promise<{ key: string[] }> }) => {
    const user = await requireUser();
    const { key: parts } = await ctx.params;
    const key = parts.map((p) => decodeURIComponent(p)).join("/");
    if (key.includes("..") || key.includes("\\")) throw new ApiError(400, "Đường dẫn không hợp lệ");

    const owner = await ownerOf(key);
    if (!owner) throw new ApiError(404, "Không tìm thấy tệp");
    if (owner !== "PUBLIC_TO_ADULTS") await requireStudentAccess(owner);
    else if (user.role === "CHILD") throw new ApiError(403, "Không có quyền");

    const storage = fileStorage();
    if (!(await storage.exists(key))) throw new ApiError(404, "Không tìm thấy tệp");
    const bytes = await storage.get(key);
    const ext = key.split(".").pop()?.toLowerCase() ?? "";
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": CONTENT_TYPE[ext] ?? "application/octet-stream",
        "Content-Length": String(bytes.byteLength),
        // Private: a CDN or a shared proxy must never keep a child's schoolwork.
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": "inline",
      },
    });
  },
);

/** Which child a stored key belongs to, from the row that references it. */
async function ownerOf(key: string): Promise<string | "PUBLIC_TO_ADULTS" | null> {
  if (key.startsWith("intake/") || key.startsWith("intake-original/")) {
    const job = await prisma.intakeJob.findFirst({
      where: { files: { array_contains: [{ key }] } },
      select: { studentId: true },
    });
    if (job?.studentId) return job.studentId;
    const byOriginal = await prisma.intakeJob.findFirst({
      where: { files: { array_contains: [{ originalKey: key }] } },
      select: { studentId: true },
    });
    return byOriginal?.studentId ?? null;
  }
  if (key.startsWith("attempts/")) {
    const attempt = await prisma.attempt.findFirst({
      where: { response: { path: ["last", "photoKey"], equals: key } },
      select: { session: { select: { studentId: true } } },
    });
    return attempt?.session.studentId ?? null;
  }
  if (key.startsWith("homework/")) {
    const homework = await prisma.homework.findFirst({
      where: { artifactKey: key },
      select: { studentId: true },
    });
    return homework?.studentId ?? null;
  }
  return null;
}
