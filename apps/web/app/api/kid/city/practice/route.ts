import { CityError, prisma, startCityPractice } from "@mtct/db";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";
import { cityPracticeSchema } from "@/lib/kid/city-schemas";

export const dynamic = "force-dynamic";

/**
 * POST /api/kid/city/practice — tapping scaffolding opens a short TARGETED session on that skill
 * (Pha 10 §1.6). Open to the child, unlike /api/sessions/targeted, because the server only allows
 * a building the city itself shows as waiting (ADR-21); the child cannot pick an easy skill.
 */
export const POST = handle(async (request: Request) => {
  const body = await parseBody(request, cityPracticeSchema);
  const { student } = await requireStudentAccess(body.studentId);
  try {
    const result = await startCityPractice(prisma, student.id, body.city, body.skillId);
    return json(result, { status: result.created ? 201 : 200 });
  } catch (err) {
    if (err instanceof CityError) {
      throw new ApiError(err.code === "SKILL_NOT_IN_CITY" ? 404 : 409, err.message);
    }
    throw err;
  }
});
