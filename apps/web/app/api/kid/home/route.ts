import { kidHome, prisma } from "@mtct/db";
import { ApiError, handle, json } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/kid/home?studentId=… — everything K2 draws (docs/06 §1.2): the world, the mascot's
 * line, today's quest, the star pocket, the streak, this week's egg and picture, the letters box.
 * One call, because a six-year-old should not watch three spinners.
 */
export const GET = handle(async (request: Request) => {
  const studentId = new URL(request.url).searchParams.get("studentId");
  if (!studentId) throw new ApiError(400, "Thiếu studentId");
  const { student } = await requireStudentAccess(studentId);
  const home = await kidHome(prisma, student.id);
  if (!home) throw new ApiError(404, "Không tìm thấy học sinh");
  return json(home);
});
