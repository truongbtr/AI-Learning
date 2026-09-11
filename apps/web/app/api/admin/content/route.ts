import { prisma } from "@mtct/db";
import { z } from "zod";
import { listBatches, listExercises } from "@/lib/admin/content";
import { handle, json, parseBody } from "@/lib/api";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** GET /api/admin/content?batch=&skill=&status=&type=&flag= — batches + the matching exercises. */
export const GET = handle(async (request: Request) => {
  await requireRole("ADMIN");
  const p = new URL(request.url).searchParams;
  const batchId = p.get("batch");
  const [batches, items] = await Promise.all([
    listBatches(),
    listExercises({
      batchId,
      skillCode: p.get("skill"),
      status: p.get("status") as "DRAFT" | null,
      type: p.get("type"),
      flag: p.get("flag") as "BAD" | null,
      limit: Number(p.get("limit") ?? 200) || 200,
    }),
  ]);
  return json({ batches, items, count: items.length });
});

const Action = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("flag"),
    stableId: z.string(),
    flag: z.enum(["OK", "GOOD", "BAD", "UNREVIEWED"]),
  }),
  z.object({ action: z.literal("publish"), batchId: z.string() }),
  z.object({ action: z.literal("unpublish"), batchId: z.string() }),
  z.object({ action: z.literal("publishOne"), stableId: z.string() }),
]);

/**
 * POST /api/admin/content — review actions of FR-ADM-05: flag an exercise GOOD/BAD, publish or
 * unpublish a whole batch. Publishing skips anything flagged BAD; unpublishing pulls a batch back
 * to DRAFT, which is how a bad import is undone.
 */
export const POST = handle(async (request: Request) => {
  const user = await requireRole("ADMIN");
  const body = await parseBody(request, Action);

  if (body.action === "flag") {
    const updated = await prisma.exercise.update({
      where: { stableId: body.stableId },
      data: {
        qualityFlag: body.flag,
        // A BAD exercise must leave the bank immediately (FR-ADM-05 AC).
        ...(body.flag === "BAD" ? { status: "DRAFT" as const } : {}),
      },
      select: { stableId: true, status: true, qualityFlag: true },
    });
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CONTENT_FLAG",
        target: body.stableId,
        detail: { flag: body.flag },
      },
    });
    return json(updated);
  }

  if (body.action === "publishOne") {
    const updated = await prisma.exercise.updateMany({
      where: { stableId: body.stableId, qualityFlag: { not: "BAD" } },
      data: { status: "PUBLISHED" },
    });
    return json({ published: updated.count });
  }

  const publish = body.action === "publish";
  const { count } = await prisma.exercise.updateMany({
    where: publish
      ? { batchId: body.batchId, status: "DRAFT", qualityFlag: { not: "BAD" } }
      : { batchId: body.batchId, status: "PUBLISHED" },
    data: { status: publish ? "PUBLISHED" : "DRAFT" },
  });
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: publish ? "CONTENT_PUBLISH" : "CONTENT_UNPUBLISH",
      target: body.batchId,
      detail: { count },
    },
  });
  return json({ [publish ? "published" : "unpublished"]: count });
});
