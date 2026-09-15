import { CityError, choosePlotBuild, prisma } from "@mtct/db";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";
import { cityPlotSchema } from "@/lib/kid/city-schemas";

export const dynamic = "force-dynamic";

/**
 * POST /api/kid/city/plot — the kid chooses what to build on an unlocked plot (docs/06 §1.8b "quyền
 * chọn"). Nothing is bought: land opens from stars earned, the choice costs nothing and can change.
 */
export const POST = handle(async (request: Request) => {
  const body = await parseBody(request, cityPlotSchema);
  const { student } = await requireStudentAccess(body.studentId);
  try {
    const state = await choosePlotBuild(prisma, student.id, body.city, body.plot, body.build);
    return json({ view: state.view, hud: state.hud });
  } catch (err) {
    if (err instanceof CityError) throw new ApiError(409, err.message);
    throw err;
  }
});
