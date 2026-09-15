import { markCitySeen, prisma } from "@mtct/db";
import { handle, json, parseBody } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";
import { citySeenSchema } from "@/lib/kid/city-schemas";

export const dynamic = "force-dynamic";

/** POST /api/kid/city/seen — celebrations played; the server snapshots the city it computes itself. */
export const POST = handle(async (request: Request) => {
  const body = await parseBody(request, citySeenSchema);
  const { student } = await requireStudentAccess(body.studentId);
  await markCitySeen(prisma, student.id, body.city);
  return json({ ok: true });
});
