import { cityRead, prisma } from "@mtct/db";
import { ApiError, handle, json } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";
import { cityQuerySchema } from "@/lib/kid/city-schemas";

export const dynamic = "force-dynamic";

/**
 * GET /api/kid/city?studentId=…&city=viet — one subject city (Pha 10 việc 3): what to draw
 * (`view`, the @mtct/city contract), the HUD numbers, and the celebrations owed since the last visit.
 */
export const GET = handle(async (request: Request) => {
  const params = new URL(request.url).searchParams;
  const parsed = cityQuerySchema.safeParse({
    studentId: params.get("studentId"),
    city: params.get("city"),
  });
  if (!parsed.success) throw new ApiError(400, "Thiếu studentId hoặc thành phố không hợp lệ");
  const { student } = await requireStudentAccess(parsed.data.studentId);
  const { state, changes } = await cityRead(prisma, student.id, parsed.data.city);
  return json({ view: state.view, hud: state.hud, changes });
});
