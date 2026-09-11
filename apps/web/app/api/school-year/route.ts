import { applySchoolYearStart, prisma, proposeSchoolYearStart } from "@mtct/db";
import { z } from "zod";
import { handle, json, parseBody } from "@/lib/api";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const applySchema = z.object({
  startMonday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/** GET /api/school-year — what the diary says the school year's first Monday was (docs/11 §5). */
export const GET = handle(async () => {
  await requireRole("PARENT", "ADMIN");
  return json(await proposeSchoolYearStart(prisma));
});

/**
 * POST /api/school-year — a parent confirms the date, and the 35 weeks move.
 *
 * Deliberately a separate, explicit step: `expectedWeek` for every skill is measured against these
 * weeks, so moving them silently would quietly re-label how far behind or ahead a child is.
 */
export const POST = handle(async (request: Request) => {
  const user = await requireRole("PARENT", "ADMIN");
  const { startMonday } = await parseBody(request, applySchema);
  const applied = await applySchoolYearStart(prisma, new Date(`${startMonday}T00:00:00Z`), user.id);
  return json(applied);
});
