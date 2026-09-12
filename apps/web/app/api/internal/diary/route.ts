import { applyChatDiary, prisma } from "@mtct/db";
import { ApiError, json } from "@/lib/api";
import { internalHandler } from "@/lib/internal/guard";
import { chatDiarySchema } from "@/lib/internal/schemas";

export const dynamic = "force-dynamic";

/**
 * `POST /api/internal/diary` — tonight's Edi Parent post, pasted from the phone (docs/13 §7.1).
 *
 * It goes through the pattern reader, not through any AI (ADR-10, docs/13 §4): `- <Môn>: <Tên bài>`
 * has a fixed shape, so the Daily Quest planned at four in the morning already knows what the class
 * did today. Lines the patterns cannot place are queued for a reader and come back tomorrow — the
 * reply names them, so the owner can see what was not understood instead of assuming it all was.
 */
export const POST = internalHandler("/api/internal/diary", async (request) => {
  const raw = await request.json().catch(() => {
    throw new ApiError(400, "Thân yêu cầu phải là JSON: { text, date?, className? }");
  });
  const parsed = chatDiarySchema.safeParse(raw);
  if (!parsed.success)
    throw new ApiError(
      400,
      "Thân yêu cầu không hợp lệ",
      parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    );
  const body = parsed.data;

  const saved = await applyChatDiary(prisma, {
    className: body.className,
    date: body.date ? new Date(`${body.date}T00:00:00+07:00`) : null,
    text: body.text,
  });

  const message = [
    `Đã đọc nhật ký lớp ${body.className} ngày ${saved.date}:`,
    `${saved.lessons} bài học, ${saved.homework} việc cô giao, ${saved.reminders} lời nhắc.`,
    saved.queuedForReading
      ? `${saved.unmatched.length} dòng chưa đọc được bằng mẫu — đã vào hàng chờ, mai có.`
      : "Mọi dòng đều đọc được.",
  ].join(" ");

  return {
    response: json({ ...saved, message }, { status: 201 }),
    batchId: saved.batchId,
    note: `nhật ký ${body.className} ${saved.date}: ${saved.lessons} bài, ${saved.homework} việc cô giao`,
  };
});
