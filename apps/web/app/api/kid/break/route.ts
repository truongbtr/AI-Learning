import { awardStars, prisma, STARS, starBalance } from "@mtct/db";
import { z } from "zod";
import { handle, json, parseBody } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const schema = z.object({ studentId: z.string().min(1), sessionId: z.string().min(1) });

/**
 * POST /api/kid/break — the child stood up and moved for thirty seconds (docs/06 §1.8b item 3).
 * Worth one star, once per session: a second call returns the same balance and adds nothing.
 */
export const POST = handle(async (request: Request) => {
  const body = await parseBody(request, schema);
  const { student } = await requireStudentAccess(body.studentId);
  const awarded = await awardStars(prisma, student.id, STARS.movementBreak, "movement_break", {
    type: "Session",
    id: body.sessionId,
  });
  return json({ starsAwarded: awarded, starsTotal: await starBalance(prisma, student.id) });
});
