import { prisma, worldRead } from "@mtct/db";
import { ApiError, handle, json } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** GET /api/kid/world?studentId=… — the six-city map: buildings, today's missions, wonder, news. */
export const GET = handle(async (request: Request) => {
  const studentId = new URL(request.url).searchParams.get("studentId");
  if (!studentId) throw new ApiError(400, "Thiếu studentId");
  const { student } = await requireStudentAccess(studentId);
  return json({ cities: await worldRead(prisma, student.id) });
});
