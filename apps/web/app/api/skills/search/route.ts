import { prisma, searchSkills } from "@mtct/db";
import { handle, json } from "@/lib/api";
import { requireRole } from "@/lib/auth/session";
import { skillSearchQuerySchema } from "@/lib/mastery/schemas";

export const dynamic = "force-dynamic";

/**
 * GET /api/skills/search?q=đọc từ có sh[&subject=ESL][&limit=10] — Postgres full-text + unaccent
 * (docs/08 pha 1 việc 5, ADR-12). Adults only: it feeds the diary reader and the intake review
 * screen, never a child screen.
 */
export const GET = handle(async (request: Request) => {
  await requireRole("ADMIN", "PARENT");
  const params = new URL(request.url).searchParams;
  const { q, subject, limit } = skillSearchQuerySchema.parse({
    q: params.get("q") ?? "",
    subject: params.get("subject") ?? undefined,
    limit: params.get("limit") ?? undefined,
  });

  const hits = await searchSkills(prisma, q, { subject: subject ?? null, limit });
  return json({
    q,
    subject: subject ?? null,
    count: hits.length,
    items: hits.map((h) => ({
      id: h.id,
      code: h.code,
      subject: h.subject,
      strand: h.strand,
      nameVi: h.nameVi,
      nameEn: h.nameEn,
      expectedWeek: h.expectedWeek,
      score: Math.round(h.rank * 1000) / 1000,
      matchedAllWords: h.full,
    })),
  });
});
