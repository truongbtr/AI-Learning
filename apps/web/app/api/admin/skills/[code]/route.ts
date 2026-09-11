import { prisma } from "@mtct/db";
import { patchSkillSchema } from "@/lib/admin/skill-schemas";
import { listSkills } from "@/lib/admin/skills";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/skills/:code — edit the Vietnamese/English name, description, expected week and
 * prerequisites, or hide a skill (FR-CORE-03: a skill that already has evidence may only be
 * hidden, never deleted — this route never deletes). Edited rows are marked `source = ADMIN` so a
 * later `pnpm db:seed` reports them and the owner can decide.
 */
export const PATCH = handle(
  async (request: Request, ctx: { params: Promise<{ code: string }> }) => {
    const user = await requireRole("ADMIN");
    const { code } = await ctx.params;
    const input = await parseBody(request, patchSkillSchema);

    const skill = await prisma.skill.findUnique({
      where: { code: decodeURIComponent(code) },
      select: { id: true, code: true },
    });
    if (!skill) throw new ApiError(404, "Không tìm thấy kỹ năng");

    if (input.prerequisites) {
      const found = await prisma.skill.findMany({
        where: { code: { in: input.prerequisites } },
        select: { id: true, code: true },
      });
      const missing = input.prerequisites.filter((c) => !found.some((f) => f.code === c));
      if (missing.length)
        throw new ApiError(400, `Tiên quyết không tồn tại: ${missing.join(", ")}`);
      if (found.some((f) => f.id === skill.id))
        throw new ApiError(400, "Kỹ năng không thể tự tiên quyết");
      // A cycle would break the planner: refuse anything that can reach this skill already.
      const reachable = await prerequisiteClosure(found.map((f) => f.id));
      if (reachable.has(skill.id)) throw new ApiError(400, "Tiên quyết tạo thành vòng lặp");

      await prisma.skillPrerequisite.deleteMany({ where: { skillId: skill.id } });
      for (const p of found) {
        await prisma.skillPrerequisite.create({
          data: { skillId: skill.id, prerequisiteId: p.id, strength: 1 },
        });
      }
    }

    const { prerequisites, ...fields } = input;
    if (Object.keys(fields).length > 0) {
      await prisma.skill.update({ where: { id: skill.id }, data: { ...fields, source: "ADMIN" } });
    }
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: input.isActive === false ? "SKILL_RETIRE" : "SKILL_UPDATE",
        target: skill.code,
      },
    });

    const [row] = await listSkills({ codes: [skill.code], includeRetired: true, limit: 1 });
    return json({ skill: row });
  },
);

/** Every skill reachable by following prerequisites upwards from `ids`. */
async function prerequisiteClosure(ids: string[]): Promise<Set<string>> {
  const seen = new Set(ids);
  let frontier = ids;
  for (let depth = 0; depth < 20 && frontier.length > 0; depth++) {
    const rows = await prisma.skillPrerequisite.findMany({
      where: { skillId: { in: frontier } },
      select: { prerequisiteId: true },
    });
    frontier = rows.map((r) => r.prerequisiteId).filter((id) => !seen.has(id));
    for (const id of frontier) seen.add(id);
  }
  return seen;
}
