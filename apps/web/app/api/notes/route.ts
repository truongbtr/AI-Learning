import { commitEvidence, prisma, searchSkills } from "@mtct/db";
import { z } from "zod";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { requireRole, requireStudentAccess } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const suggestSchema = z.object({
  studentId: z.string().min(1),
  text: z.string().min(4).max(300),
});

const saveSchema = suggestSchema.extend({
  skillCodes: z
    .array(z.string().regex(/^[A-Z]+\.[A-Z]+\.[A-Z0-9_]+$/))
    .min(1)
    .max(3),
  outcome: z.enum(["CORRECT", "PARTIAL", "INCORRECT", "OBSERVED"]).default("OBSERVED"),
});

/**
 * FR-INT-04 — the one-line note: "Hôm nay Mai Thy đọc *cat*, *bat* chưa được, hay nhầm b/d".
 *
 * The requirement says AI attaches the skill; under ADR-10 the app has no AI, so the phase-1
 * full-text search suggests and the parent taps one. Thirty seconds either way, and the parent
 * sees exactly which skill their sentence will move — which an AI guess never showed them.
 */
export const PUT = handle(async (request: Request) => {
  await requireRole("PARENT", "ADMIN");
  const body = await parseBody(request, suggestSchema);
  await requireStudentAccess(body.studentId);
  const hits = await searchSkills(prisma, body.text, { limit: 6 });
  return json({
    suggestions: hits.map((h) => ({
      code: h.code,
      nameVi: h.nameVi,
      subject: h.subject,
    })),
  });
});

/** POST /api/notes — saves the note as low-weight evidence (`PARENT_NOTE`, weight 0.5). */
export const POST = handle(async (request: Request) => {
  const user = await requireRole("PARENT", "ADMIN");
  const body = await parseBody(request, saveSchema);
  await requireStudentAccess(body.studentId);

  const written: string[] = [];
  for (const code of body.skillCodes) {
    const skill = await prisma.skill.findUnique({ where: { code }, select: { id: true } });
    if (!skill) throw new ApiError(400, `Không có kỹ năng ${code}`);
    const committed = await commitEvidence(prisma, {
      studentId: body.studentId,
      skillId: skill.id,
      source: "PARENT_NOTE",
      outcome: body.outcome,
      score: body.outcome === "CORRECT" ? 1 : body.outcome === "PARTIAL" ? 0.5 : 0,
      note: body.text,
      createdById: user.id,
    });
    written.push(committed.evidenceId);
  }
  return json({ evidenceIds: written }, { status: 201 });
});
