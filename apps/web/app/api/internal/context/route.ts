import { buildChatContext, prisma } from "@mtct/db";
import { ApiError, json } from "@/lib/api";
import { internalHandler } from "@/lib/internal/guard";
import { isoDate, studentKey } from "@/lib/internal/schemas";

export const dynamic = "force-dynamic";

/**
 * `GET /api/internal/context?student=thy&date=2026-09-12` (docs/13 §7.4).
 *
 * The first call of the evening, and the one that decides whether the rest is worth anything: the
 * `intake-v1` eval read 33% of labels correctly when the reader invented skill codes and 77.8% when
 * it picked from the list this returns. It also hands back a `contextId` — proof the list was read,
 * and the only way the server can later tell a skill it offered from one something made up.
 */
export const GET = internalHandler("/api/internal/context", async (request) => {
  const params = new URL(request.url).searchParams;
  const student = studentKey.parse(params.get("student") ?? "");
  const rawDate = params.get("date");
  const date = rawDate ? isoDate.parse(rawDate) : null;
  const terms = (params.get("q") ?? "")
    .split("|")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 4);

  const context = await buildChatContext(prisma, {
    student,
    date: date ? new Date(`${date}T00:00:00+07:00`) : null,
    terms,
  });
  if (!context)
    throw new ApiError(404, `Không có bé nào tên gọi "${student}" (dùng thy hoặc thanh)`);

  return {
    response: json(context),
    studentId: null,
    note: `ngữ cảnh cho ${context.student.nickname} ngày ${context.date}: ${context.skillCandidates.length} kỹ năng ứng viên, ${context.errorCodes.length} mã lỗi`,
  };
});
