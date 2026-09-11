import { prisma, searchSkills } from "@mtct/db";
import { listSkills, loadSkillTree } from "@/lib/admin/skills";
import { handle, json } from "@/lib/api";
import { requireRole } from "@/lib/auth/session";
import { subjectSchema } from "@/lib/mastery/schemas";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/skills?[q=][subject=][strand=][includeRetired=1] — the tree plus the matching
 * rows for /admin/skills (FR-CORE-03). ADMIN only (also enforced by proxy.ts for /api/admin/*).
 */
export const GET = handle(async (request: Request) => {
  await requireRole("ADMIN");
  const params = new URL(request.url).searchParams;
  const rawSubject = params.get("subject");
  const subject = rawSubject ? subjectSchema.parse(rawSubject) : null;
  const strand = params.get("strand")?.trim() || null;
  const q = params.get("q")?.trim() ?? "";
  const includeRetired = params.get("includeRetired") === "1";
  const limit = Math.min(Math.max(Number(params.get("limit") ?? 200) || 200, 1), 1000);

  const [tree, items] = await Promise.all([
    loadSkillTree(),
    (async () => {
      if (q.length > 0) {
        const hits = await searchSkills(prisma, q, {
          subject,
          limit,
          includeInactive: includeRetired,
        });
        if (hits.length === 0) return [];
        return listSkills({ codes: hits.map((h) => h.code), includeRetired, limit });
      }
      return listSkills({ subject, strand, includeRetired, limit });
    })(),
  ]);
  return json({ tree, q, subject, strand, includeRetired, count: items.length, items });
});
