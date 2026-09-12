import { confirmClassDiary, diaryTonight, prisma, saveClassDiary } from "@mtct/db";
import { z } from "zod";
import { handle, json, parseBody } from "@/lib/api";
import { guardianStudentIds, requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const saveSchema = z.object({
  className: z.string().min(1).max(20).default("1B3"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  text: z.string().min(10).max(8000),
});

const confirmSchema = z.object({ diaryId: z.string().min(1) });

/** Children this adult may see; ADMIN sees the whole class. */
async function childrenOf(
  user: { id: string; role: string },
  className: string,
): Promise<string[]> {
  if (user.role === "ADMIN") {
    const rows = await prisma.student.findMany({
      where: { className, user: { isActive: true } },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((r) => r.id);
  }
  return guardianStudentIds(user.id);
}

/**
 * POST /api/diary (FR-INT-06) — the parent pastes tonight's Edi Parent post.
 *
 * Read by patterns here and now, with no AI in the loop (ADR-10, docs/13 §4), so the Daily Quest
 * planned at four in the morning already knows what the class did today. Lines the patterns cannot
 * place go to the queue and come back tomorrow; everything else is on screen in a second.
 *
 * The response carries `tonight`: what the class did and which skills that puts into each child's
 * quest this evening. Twenty seconds of typing has to show what it bought, or the habit dies
 * (docs/08 pha 5 việc 6).
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
  const tonight = await diaryTonight(prisma, {
    className: body.className,
    studentIds: await childrenOf(user, body.className),
    date: new Date(`${body.date}T00:00:00Z`),
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
    tonight,
  });
});

/** GET /api/diary?className=1B3[&date=…] — today's diary and what it means for tonight. */
export const GET = handle(async (request: Request) => {
  const user = await requireRole("PARENT", "ADMIN");
  const params = new URL(request.url).searchParams;
  const className = params.get("className") ?? "1B3";
  const date = params.get("date");
  return json(
    await diaryTonight(prisma, {
      className,
      studentIds: await childrenOf(user, className),
      date: date ? new Date(`${date}T00:00:00Z`) : new Date(),
    }),
  );
});

/** PATCH /api/diary — "đúng rồi": the one tap that confirms what the pattern reader made of it. */
export const PATCH = handle(async (request: Request) => {
  const user = await requireRole("PARENT", "ADMIN");
  const { diaryId } = await parseBody(request, confirmSchema);
  await confirmClassDiary(prisma, diaryId, user.id);
  return json({ ok: true });
});
