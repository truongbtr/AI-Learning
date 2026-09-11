import { parseSkillMap, validateSkillMaps } from "@mtct/content";
import { importSkillMaps, prisma } from "@mtct/db";
import { csvToSkillMap, importSkillsSchema } from "@/lib/admin/skill-schemas";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/skills/import — JSON or CSV import for /admin/skills (FR-CORE-03), reusing the
 * phase-1 validator (packages/content) so admin imports and `pnpm skills:validate` agree.
 * `dryRun: true` (the default) only reports what would change. Existing LessonUnit codes are
 * accepted as `lessonRef`; unknown ones are an error, exactly as in the CLI.
 */
export const POST = handle(async (request: Request) => {
  const user = await requireRole("ADMIN");
  const input = await parseBody(request, importSkillsSchema);

  let map: ReturnType<typeof parseSkillMap>;
  try {
    const raw =
      input.format === "json"
        ? JSON.parse(input.text)
        : (() => {
            const csv = csvToSkillMap(input.text, input.subject);
            return { subject: csv.subject, strands: {}, skills: csv.skills };
          })();
    // CSV has no strand labels; fill them in from the codes so the file validates.
    if (input.format === "csv") {
      const strands: Record<string, string> = {};
      for (const s of (raw as { skills: { strand?: string }[] }).skills) {
        if (s.strand) strands[s.strand] = s.strand;
      }
      (raw as { strands: Record<string, string> }).strands = strands;
    }
    map = parseSkillMap(raw);
  } catch (err) {
    throw new ApiError(400, `Tệp không hợp lệ: ${(err as Error).message}`);
  }

  const lessonCodes = new Set(
    (await prisma.lessonUnit.findMany({ select: { code: true } })).map((u) => u.code),
  );
  const check = validateSkillMaps([{ name: `import.${input.format}`, map }], lessonCodes);
  // Per-subject minimum counts only apply to the full seed, not to a partial import.
  const errors = check.errors.filter((e) => !e.message.includes("need >="));
  if (errors.length > 0) {
    throw new ApiError(400, `Tệp có ${errors.length} lỗi`, {
      issues: errors.slice(0, 50).map((e) => ({ code: e.code ?? null, message: e.message })),
    });
  }

  const codes = map.skills.map((s) => s.code);
  const existing = await prisma.skill.findMany({
    where: { code: { in: codes } },
    select: { code: true },
  });
  const existingCodes = new Set(existing.map((e) => e.code));
  const plan = {
    subject: map.subject,
    total: codes.length,
    willCreate: codes.filter((c) => !existingCodes.has(c)),
    willUpdate: codes.filter((c) => existingCodes.has(c)),
  };
  if (input.dryRun) return json({ dryRun: true, plan });

  const result = await importSkillMaps(prisma, [map], {
    // A partial import must never retire the skills it does not mention.
    retireMissing: false,
    source: "ADMIN",
    sourceDir: `admin-import.${input.format}`,
    note: `admin import by ${user.username}`,
  });
  await prisma.auditLog.create({
    data: { userId: user.id, action: "SKILL_IMPORT", target: `${map.subject}:${result.total}` },
  });
  return json({ dryRun: false, plan, result });
});
