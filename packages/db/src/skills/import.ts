/**
 * Content importers for the skill map (docs/08 phase 1 item 1, docs/10 sec. 8).
 * Only touch Skill / SkillPrerequisite / Material / LessonUnit / LessonUnitSkill / ErrorCode /
 * ContentBatch. NEVER Evidence, SkillMastery, Session, Attempt. Idempotent: upsert by `code`;
 * a skill missing from the files is retired (isActive=false), never deleted.
 *
 * Types come from @mtct/content as `import type` only, so the CommonJS dist has no runtime
 * dependency on that ESM package; callers (seed, admin import) pass parsed files in.
 */
import type { ErrorTaxonomyFile, LessonUnitsFile, SkillDef, SkillMapFile } from "@mtct/content";
import type { PrismaClient, SkillSource } from "../../generated/client";

type Db = PrismaClient;

export interface ImportCounts {
  created: number;
  updated: number;
  retired: number;
}

function lessonRefs(skill: Pick<SkillDef, "lessonRef">): string[] {
  if (!skill.lessonRef) return [];
  return Array.isArray(skill.lessonRef) ? skill.lessonRef : [skill.lessonRef];
}

export interface ImportSkillOptions {
  /** Deactivate SEED skills that are no longer in the files (default true for the seed). */
  retireMissing?: boolean;
  source?: SkillSource;
  sourceDir?: string;
  note?: string;
}

export async function importSkillMaps(
  db: Db,
  maps: SkillMapFile[],
  opts: ImportSkillOptions = {},
): Promise<ImportCounts & { prerequisites: number; total: number }> {
  const source = opts.source ?? "SEED";
  const defs = maps.flatMap((m) => m.skills.map((s) => ({ ...s, subject: m.subject })));
  const codes = defs.map((d) => d.code);
  const existing = new Set(
    (await db.skill.findMany({ where: { code: { in: codes } }, select: { code: true } })).map(
      (r) => r.code,
    ),
  );
  let created = 0;
  let updated = 0;
  for (const d of defs) {
    const data = {
      subject: d.subject,
      strand: d.strand,
      nameVi: d.nameVi,
      nameEn: d.nameEn,
      description: d.description,
      standardRef: d.standardRef ?? null,
      gradeLevel: d.gradeLevel,
      order: d.order ?? 0,
      expectedWeek: d.expectedWeek ?? null,
      exerciseTypes: d.exerciseTypes,
      difficultyMin: d.difficultyRange[0],
      difficultyMax: d.difficultyRange[1],
      relatedSkillCodes: d.relatedSkillCodes,
      confusableWith: d.confusableWith,
      isActive: true,
      source,
    };
    await db.skill.upsert({
      where: { code: d.code },
      create: { code: d.code, ...data },
      update: data,
    });
    if (existing.has(d.code)) updated++;
    else created++;
  }

  // Prerequisites: replace the set per skill.
  const idByCode = new Map(
    (
      await db.skill.findMany({ where: { code: { in: codes } }, select: { id: true, code: true } })
    ).map((r) => [r.code, r.id] as const),
  );
  let prerequisites = 0;
  for (const d of defs) {
    const skillId = idByCode.get(d.code);
    if (!skillId) continue;
    const wanted = d.prerequisites.map((p) => idByCode.get(p)).filter((x): x is string => !!x);
    await db.skillPrerequisite.deleteMany({
      where: { skillId, prerequisiteId: { notIn: wanted.length ? wanted : ["-"] } },
    });
    for (const prerequisiteId of wanted) {
      await db.skillPrerequisite.upsert({
        where: { skillId_prerequisiteId: { skillId, prerequisiteId } },
        create: { skillId, prerequisiteId, strength: 1 },
        update: {},
      });
      prerequisites++;
    }
  }

  let retired = 0;
  if (opts.retireMissing ?? true) {
    const r = await db.skill.updateMany({
      where: { source: "SEED", isActive: true, code: { notIn: codes } },
      data: { isActive: false },
    });
    retired = r.count;
  }

  await db.contentBatch.create({
    data: {
      kind: "SKILL_MAP",
      sourceDir: opts.sourceDir ?? "content/skill-map",
      fileCount: maps.length,
      created,
      updated,
      retired,
      runBy: source === "ADMIN" ? "admin" : "claude-code",
      note: opts.note ?? null,
    },
  });
  return { created, updated, retired, prerequisites, total: defs.length };
}

/** Skill.lessonRef -> LessonUnitSkill (run after both skills and units exist). */
export async function linkSkillLessonRefs(db: Db, maps: SkillMapFile[]): Promise<number> {
  const defs = maps.flatMap((m) => m.skills);
  const refs = new Set(defs.flatMap((d) => lessonRefs(d)));
  const unitIdByCode = new Map(
    (
      await db.lessonUnit.findMany({
        where: { code: { in: [...refs] } },
        select: { id: true, code: true },
      })
    ).map((u) => [u.code, u.id] as const),
  );
  const skillIdByCode = new Map(
    (
      await db.skill.findMany({
        where: { code: { in: defs.map((d) => d.code) } },
        select: { id: true, code: true },
      })
    ).map((s) => [s.code, s.id] as const),
  );
  let links = 0;
  for (const d of defs) {
    const skillId = skillIdByCode.get(d.code);
    if (!skillId) continue;
    for (const ref of lessonRefs(d)) {
      const unitId = unitIdByCode.get(ref);
      if (!unitId) continue;
      await db.lessonUnitSkill.upsert({
        where: { unitId_skillId: { unitId, skillId } },
        create: { unitId, skillId, weight: 1 },
        update: {},
      });
      links++;
    }
  }
  return links;
}

export async function importLessonUnits(
  db: Db,
  files: LessonUnitsFile[],
  opts: { sourceDir?: string; note?: string } = {},
): Promise<ImportCounts & { materials: number; links: number }> {
  let created = 0;
  let updated = 0;
  let materials = 0;
  let links = 0;
  for (const file of files) {
    const m = file.material;
    const found = await db.material.findFirst({ where: { title: m.title }, select: { id: true } });
    const materialData = {
      title: m.title,
      subject: m.subject,
      kind: m.kind,
      term: m.term ?? null,
      pageCount: m.pageCount ?? null,
      files: m.file ? [{ key: m.file, note: "sach giao khoa/ (not in git)" }] : [],
    };
    const material = found
      ? await db.material.update({ where: { id: found.id }, data: materialData })
      : await db.material.create({ data: materialData });
    materials++;

    const codes = file.units.map((u) => u.code);
    const existing = new Set(
      (
        await db.lessonUnit.findMany({ where: { code: { in: codes } }, select: { code: true } })
      ).map((r) => r.code),
    );
    const skillIdByCode = new Map(
      (
        await db.skill.findMany({
          where: {
            code: { in: [...new Set(file.units.flatMap((u) => u.skills.map((s) => s.code)))] },
          },
          select: { id: true, code: true },
        })
      ).map((s) => [s.code, s.id] as const),
    );
    for (const u of file.units) {
      const data = {
        materialId: material.id,
        title: u.title,
        subject: m.subject,
        pageFrom: u.pageFrom ?? null,
        pageTo: u.pageTo ?? null,
        weekFrom: u.weekFrom ?? null,
        weekTo: u.weekTo ?? null,
        // Skeleton only: objectives/vocabulary/contentText arrive with content:import (phase 2/6).
        concepts: [u.kind, ...(u.topic ? [u.topic] : [])],
      };
      const unit = await db.lessonUnit.upsert({
        where: { code: u.code },
        create: { code: u.code, ...data, isApproved: false },
        update: data,
      });
      if (existing.has(u.code)) updated++;
      else created++;
      for (const s of u.skills) {
        const skillId = skillIdByCode.get(s.code);
        if (!skillId) continue;
        await db.lessonUnitSkill.upsert({
          where: { unitId_skillId: { unitId: unit.id, skillId } },
          create: { unitId: unit.id, skillId, weight: s.weight },
          update: { weight: s.weight },
        });
        links++;
      }
    }
  }
  await db.contentBatch.create({
    data: {
      kind: "LESSONS",
      sourceDir: opts.sourceDir ?? "content/lessons",
      fileCount: files.length,
      created,
      updated,
      retired: 0,
      note: opts.note ?? "lesson-unit skeletons (phase 1)",
    },
  });
  return { created, updated, retired: 0, materials, links };
}

export async function importErrorCodes(db: Db, file: ErrorTaxonomyFile): Promise<ImportCounts> {
  const codes = file.codes.map((c) => c.code);
  const existing = new Set(
    (await db.errorCode.findMany({ where: { code: { in: codes } }, select: { code: true } })).map(
      (r) => r.code,
    ),
  );
  let created = 0;
  let updated = 0;
  for (const c of file.codes) {
    const data = {
      subject: c.subject,
      group: c.group,
      nameVi: c.nameVi,
      description: c.description,
      detection: c.detection,
      remediation: c.remediation,
      remediationSkills: c.remediationSkills,
      lessonRefs: c.lessonRefs,
      behavioural: c.behavioural,
      isActive: true,
    };
    await db.errorCode.upsert({
      where: { code: c.code },
      create: { code: c.code, ...data },
      update: data,
    });
    if (existing.has(c.code)) updated++;
    else created++;
  }
  const r = await db.errorCode.updateMany({
    where: { source: "SEED", isActive: true, code: { notIn: codes } },
    data: { isActive: false },
  });
  return { created, updated, retired: r.count };
}
