import { commitEvidence, MasteryServiceError, prisma } from "@mtct/db";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { requireInternalCaller } from "@/lib/auth/internal";
import { evidenceInputSchema } from "@/lib/mastery/schemas";

export const dynamic = "force-dynamic";

/**
 * POST /api/evidence — INTERNAL (docs/08 pha 1 việc 3). Only an ADMIN session or the worker with
 * `Authorization: Bearer $INTERNAL_API_TOKEN` may call; CHILD and PARENT get 403 so a child can
 * never write its own mastery. An `errorCode` outside content/error-taxonomy.json is 400 and
 * nothing is written.
 */
export const POST = handle(async (request: Request) => {
  const caller = await requireInternalCaller(request);
  const input = await parseBody(request, evidenceInputSchema);

  try {
    const result = await commitEvidence(prisma, {
      ...input,
      errorCode: input.errorCode ?? null,
      note: input.note ?? null,
      attemptId: input.attemptId ?? null,
      intakeItemId: input.intakeItemId ?? null,
      createdById: caller.kind === "admin" ? caller.userId : null,
    });
    return json(
      {
        evidenceId: result.evidenceId,
        skill: result.skill,
        mastery: {
          before: Math.round(result.before.mastery * 10) / 10,
          after: Math.round(result.after.mastery * 10) / 10,
          confidence: Math.round(result.after.confidence * 100) / 100,
          status: result.after.status,
          evidenceCount: result.after.evidenceCount,
          nextReviewAt: result.after.nextReviewAt?.toISOString() ?? null,
        },
        errorStat: result.errorStat,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof MasteryServiceError) {
      throw new ApiError(err.code === "UNKNOWN_ERROR_CODE" ? 400 : 404, err.message);
    }
    throw err;
  }
});
