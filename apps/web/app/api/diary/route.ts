import { confirmClassDiary, prisma, saveClassDiary } from "@mtct/db";
import { z } from "zod";
import { handle, json, parseBody } from "@/lib/api";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const saveSchema = z.object({
  className: z.string().min(1).max(20).default("1B3"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  text: z.string().min(10).max(8000),
});

const confirmSchema = z.object({ diaryId: z.string().min(1) });

/**
 * POST /api/diary (FR-INT-06) — the parent pastes tonight's Edi Parent post.
 *
 * Read by patterns here and now, with no AI in the loop (ADR-10, docs/13 §4), so the Daily Quest
 * planned at four in the morning already knows what the class did today. Lines the patterns cannot
 * place go to the queue and come back tomorrow; everything else is on screen in a second.
 */
export const POST = handle(async (request: Request) => {
  const user = await requireRole("PARENT", "ADMIN");
  const body = await parseBody(request, saveSchema);
  const result = await saveClassDiary(prisma, {
    className: body.className,
    date: new Date(`${body.date}T00:00:00Z`),
    rawText: body.text,
    createdById: user.id,
  });
  return json({
    diaryId: result.diaryId,
    lessons: result.parsed.taught,
    homework: result.parsed.homework,
    reminders: result.parsed.reminders,
    unmatched: result.unmatched,
    queuedForReading: result.queuedForReading,
    confidence: result.confidence,
    homeworkRows: result.homeworkPerStudent,
  });
});

/** PATCH /api/diary — "đúng rồi": the one tap that confirms what the pattern reader made of it. */
export const PATCH = handle(async (request: Request) => {
  const user = await requireRole("PARENT", "ADMIN");
  const { diaryId } = await parseBody(request, confirmSchema);
  await confirmClassDiary(prisma, diaryId, user.id);
  return json({ ok: true });
});
