import { buyCollectible, CollectionError, collectionFor, placeCollectible, prisma } from "@mtct/db";
import { z } from "zod";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const buySchema = z.object({
  studentId: z.string().min(1),
  code: z.string().trim().min(1).max(60),
});

const placeSchema = buySchema.extend({
  placement: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }).nullable(),
});

/** GET /api/kid/collection?studentId=… — K7: what there is, what the child owns, the star purse. */
export const GET = handle(async (request: Request) => {
  const studentId = new URL(request.url).searchParams.get("studentId");
  if (!studentId) throw new ApiError(400, "Thiếu studentId");
  const { student } = await requireStudentAccess(studentId);
  return json(await collectionFor(prisma, student.id));
});

/** POST — buying with stars. The ledger keeps the receipt, so a parent can see every purchase. */
export const POST = handle(async (request: Request) => {
  const body = await parseBody(request, buySchema);
  const { student } = await requireStudentAccess(body.studentId);
  try {
    return json(await buyCollectible(prisma, student.id, body.code), { status: 201 });
  } catch (err) {
    if (err instanceof CollectionError) {
      throw new ApiError(err.code === "NOT_FOUND" ? 404 : 400, err.message);
    }
    throw err;
  }
});

/** PATCH — putting an item somewhere in the world (percentages of the scene, not pixels). */
export const PATCH = handle(async (request: Request) => {
  const body = await parseBody(request, placeSchema);
  const { student } = await requireStudentAccess(body.studentId);
  try {
    await placeCollectible(prisma, student.id, body.code, body.placement);
    return json({ ok: true });
  } catch (err) {
    if (err instanceof CollectionError) throw new ApiError(404, err.message);
    throw err;
  }
});
