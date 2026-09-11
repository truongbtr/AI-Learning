import { choiceAt, chooseAt, prisma } from "@mtct/db";
import { z } from "zod";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { requireStudentAccess } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const schema = z.object({
  order: z.number().int().min(0).max(60),
  exerciseId: z.string().min(1),
});

/** GET /api/sessions/:id/choice?order=n — the two exercises this station offers. */
export const GET = handle(async (request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const row = await prisma.session.findUnique({ where: { id }, select: { studentId: true } });
  if (!row) throw new ApiError(404, "Không tìm thấy phiên học");
  await requireStudentAccess(row.studentId);
  const order = Number(new URL(request.url).searchParams.get("order") ?? "0");
  return json(await choiceAt(prisma, id, order));
});

/** POST — the child picked one of them; the station now points at that exercise. */
export const POST = handle(async (request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const row = await prisma.session.findUnique({ where: { id }, select: { studentId: true } });
  if (!row) throw new ApiError(404, "Không tìm thấy phiên học");
  await requireStudentAccess(row.studentId);
  const body = await parseBody(request, schema);
  const ok = await chooseAt(prisma, id, body.order, body.exerciseId);
  if (!ok) throw new ApiError(409, "Không đổi được bài ở trạm này");
  return json({ ok: true });
});
