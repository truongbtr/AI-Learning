/**
 * Content importer for lessons and the exercise bank (docs/10 sec. 4, sec. 11).
 *
 * SAFETY CONTRACT — this module only ever writes:
 *   Material, LessonUnit, LessonUnitSkill, Exercise, ExerciseSkill, ContentBatch.
 * It must NEVER read-modify-write a child's learning data: Evidence, SkillMastery, MasteryHistory,
 * Session, Attempt, ErrorStat, RemediationTrack. `content-import.test.ts` proves it by counting
 * those tables before and after an import.
 *
 * Idempotent: upsert by `Exercise.stableId` / `LessonUnit.code`. An exercise that disappears from
 * the files is RETIRED, never deleted, so the `Evidence` rows pointing at it keep their meaning.
 *
 * The rows come in as plain data: the Zod schemas and the ExerciseSpec builder live in the ESM
 * package @mtct/content, and this package is built to CommonJS, so it must not import it at
 * runtime (same rule as skills/import.ts).
 */
import type {
  AssetTheme,
  ExerciseStatus,
  ExerciseType,
  Language,
  PrismaClient,
  Subject,
} from "../../generated/client";

type Db = PrismaClient;

export interface ExerciseRow {
  stableId: string;
  type: ExerciseType;
  subject: Subject;
  language: Language;
  difficulty: number;
  /** ExerciseSpec (docs/04 §5) — no answerKey, no diagnosis, safe to send to the client. */
  spec: unknown;
  /** `{ value, errorTags }` — server-side only (see docs/adr/ADR-14). */
  answerKey: unknown;
  explanation: string;
  skillCodes: string[];
  lessonUnitCode: string | null;
  sourceRef: string | null;
  sourceFile: string;
  assetTheme: AssetTheme;
  targetsError: string | null;
  promptVersion: string;
  /** sha1 of the authored definition: tells "changed" from "same" without diffing JSON. */
  contentHash: string;
}

export interface LessonRow {
  code: string;
  subject: Subject;
  title: string;
  objectives: string[];
  vocabulary: string[];
  concepts: string[];
  sampleTasks: string[];
  contentText: string | null;
  pageFrom: number | null;
  pageTo: number | null;
  weekFrom: number | null;
  weekTo: number | null;
  materialTitle: string | null;
  skills: { code: string; weight: number }[];
}

export interface ImportOptions {
  /** Compute the plan and print it, write nothing. */
  dryRun?: boolean;
  sourceDir: string;
  note?: string;
  runBy?: string;
  /** Retire exercises of the imported skills that are no longer in the files (default true). */
  retireMissing?: boolean;
}

export interface ExerciseImportResult {
  created: number;
  updated: number;
  unchanged: number;
  retired: number;
  skipped: { stableId: string; reason: string }[];
  batchId: string | null;
  /** Filled in dry-run mode so the operator sees exactly what would change. */
  plan: { stableId: string; action: "create" | "update" | "retire" }[];
}

export interface LessonImportResult {
  created: number;
  updated: number;
  unchanged: number;
  skipped: { code: string; reason: string }[];
  batchId: string | null;
}

async function skillIdsByCode(db: Db, codes: string[]): Promise<Map<string, string>> {
  if (codes.length === 0) return new Map();
  const rows = await db.skill.findMany({
    where: { code: { in: [...new Set(codes)] } },
    select: { id: true, code: true },
  });
  return new Map(rows.map((r) => [r.code, r.id]));
}

async function unitIdsByCode(db: Db, codes: string[]): Promise<Map<string, string>> {
  const list = [...new Set(codes.filter(Boolean))];
  if (list.length === 0) return new Map();
  const rows = await db.lessonUnit.findMany({
    where: { code: { in: list } },
    select: { id: true, code: true },
  });
  return new Map(rows.map((r) => [r.code, r.id]));
}

/**
 * Imports one batch of exercise rows. `rows` may span several skills (one pack per skill);
 * only the skills present in `rows` are considered when retiring.
 */
export async function importExercises(
  db: Db,
  rows: ExerciseRow[],
  opts: ImportOptions,
): Promise<ExerciseImportResult> {
  const result: ExerciseImportResult = {
    created: 0,
    updated: 0,
    unchanged: 0,
    retired: 0,
    skipped: [],
    batchId: null,
    plan: [],
  };
  const skillMap = await skillIdsByCode(
    db,
    rows.flatMap((r) => r.skillCodes),
  );
  const unitMap = await unitIdsByCode(db, rows.map((r) => r.lessonUnitCode ?? "").filter(Boolean));

  const existing = new Map(
    (
      await db.exercise.findMany({
        where: { stableId: { in: rows.map((r) => r.stableId) } },
        select: { id: true, stableId: true, contentHash: true },
      })
    ).map((e) => [e.stableId, e]),
  );

  // Retire: anything currently attached to one of these skills but missing from the files.
  const touchedSkillIds = [...new Set(rows.flatMap((r) => r.skillCodes))]
    .map((c) => skillMap.get(c))
    .filter((id): id is string => Boolean(id));
  const keepIds = new Set(rows.map((r) => r.stableId));
  const retireCandidates =
    opts.retireMissing === false || touchedSkillIds.length === 0
      ? []
      : (
          await db.exercise.findMany({
            where: {
              status: { not: "RETIRED" },
              stableId: { notIn: [...keepIds] },
              skills: { some: { skillId: { in: touchedSkillIds } } },
            },
            select: { id: true, stableId: true },
          })
        ).map((e) => e);

  for (const row of rows) {
    const known = existing.get(row.stableId);
    if (!known) result.plan.push({ stableId: row.stableId, action: "create" });
    else if (known.contentHash !== row.contentHash)
      result.plan.push({ stableId: row.stableId, action: "update" });
  }
  for (const r of retireCandidates) result.plan.push({ stableId: r.stableId, action: "retire" });

  if (opts.dryRun) {
    for (const row of rows) {
      const known = existing.get(row.stableId);
      if (!known) result.created++;
      else if (known.contentHash !== row.contentHash) result.updated++;
      else result.unchanged++;
    }
    result.retired = retireCandidates.length;
    return result;
  }

  for (const row of rows) {
    const skillIds = row.skillCodes.map((c) => skillMap.get(c));
    if (skillIds.some((id) => !id)) {
      result.skipped.push({ stableId: row.stableId, reason: "unknown skill code" });
      continue;
    }
    const known = existing.get(row.stableId);
    if (known && known.contentHash === row.contentHash) {
      result.unchanged++;
      continue;
    }
    const data = {
      type: row.type,
      subject: row.subject,
      language: row.language,
      difficulty: row.difficulty,
      spec: row.spec as object,
      answerKey: row.answerKey as object,
      explanation: row.explanation,
      lessonUnitId: row.lessonUnitCode ? (unitMap.get(row.lessonUnitCode) ?? null) : null,
      generatedBy: "CLAUDE_CODE" as const,
      sourceFile: row.sourceFile,
      sourceRef: row.sourceRef,
      assetTheme: row.assetTheme,
      targetsError: row.targetsError,
      promptVersion: row.promptVersion,
      contentHash: row.contentHash,
    };
    // `status` and `qualityFlag` are NOT in `data`: editing the text of an exercise a parent has
    // already published must not silently unpublish it, and must not drop a BAD flag either.
    const saved = await db.exercise.upsert({
      where: { stableId: row.stableId },
      create: { stableId: row.stableId, ...data },
      update: data,
    });
    await db.exerciseSkill.deleteMany({ where: { exerciseId: saved.id } });
    await db.exerciseSkill.createMany({
      data: skillIds.map((id, i) => ({
        exerciseId: saved.id,
        skillId: id as string,
        weight: i === 0 ? 1 : 0.4,
      })),
      skipDuplicates: true,
    });
    if (known) result.updated++;
    else result.created++;
  }

  if (retireCandidates.length > 0) {
    const { count } = await db.exercise.updateMany({
      where: { id: { in: retireCandidates.map((r) => r.id) } },
      data: { status: "RETIRED" satisfies ExerciseStatus },
    });
    result.retired = count;
  }

  const batch = await db.contentBatch.create({
    data: {
      kind: "EXERCISES",
      sourceDir: opts.sourceDir,
      fileCount: new Set(rows.map((r) => r.sourceFile)).size,
      created: result.created,
      updated: result.updated,
      retired: result.retired,
      runBy: opts.runBy ?? "claude-code",
      note: opts.note,
    },
  });
  result.batchId = batch.id;
  // Tie the rows written by this run to the batch so /admin/content can review exactly them.
  const writtenIds = result.plan.filter((p) => p.action !== "retire").map((p) => p.stableId);
  if (writtenIds.length > 0)
    await db.exercise.updateMany({
      where: { stableId: { in: writtenIds } },
      data: { batchId: batch.id },
    });
  return result;
}

export async function importLessons(
  db: Db,
  rows: LessonRow[],
  opts: ImportOptions,
): Promise<LessonImportResult> {
  const result: LessonImportResult = {
    created: 0,
    updated: 0,
    unchanged: 0,
    skipped: [],
    batchId: null,
  };
  const skillMap = await skillIdsByCode(
    db,
    rows.flatMap((r) => r.skills.map((s) => s.code)),
  );
  const materialTitles = [...new Set(rows.map((r) => r.materialTitle).filter(Boolean))] as string[];
  const materials = materialTitles.length
    ? await db.material.findMany({
        where: { title: { in: materialTitles } },
        select: { id: true, title: true },
      })
    : [];
  const materialByTitle = new Map(materials.map((m) => [m.title, m.id]));

  for (const row of rows) {
    const existing = await db.lessonUnit.findUnique({
      where: { code: row.code },
      select: { id: true, title: true, objectives: true },
    });
    const data = {
      subject: row.subject,
      title: row.title,
      objectives: row.objectives,
      vocabulary: row.vocabulary,
      concepts: row.concepts,
      sampleTasks: row.sampleTasks,
      contentText: row.contentText,
      pageFrom: row.pageFrom,
      pageTo: row.pageTo,
      weekFrom: row.weekFrom,
      weekTo: row.weekTo,
      materialId: row.materialTitle ? (materialByTitle.get(row.materialTitle) ?? null) : undefined,
    };
    if (opts.dryRun) {
      if (!existing) result.created++;
      else if (existing.objectives.length === 0) result.updated++;
      else result.unchanged++;
      continue;
    }
    const saved = await db.lessonUnit.upsert({
      where: { code: row.code },
      create: { code: row.code, ...data },
      update: data,
    });
    const skillIds = row.skills
      .map((s) => ({ id: skillMap.get(s.code), weight: s.weight }))
      .filter((s): s is { id: string; weight: number } => Boolean(s.id));
    if (skillIds.length !== row.skills.length)
      result.skipped.push({ code: row.code, reason: "some skill codes do not exist" });
    await db.lessonUnitSkill.deleteMany({ where: { unitId: saved.id } });
    await db.lessonUnitSkill.createMany({
      data: skillIds.map((s) => ({ unitId: saved.id, skillId: s.id, weight: s.weight })),
      skipDuplicates: true,
    });
    if (existing) result.updated++;
    else result.created++;
  }

  if (!opts.dryRun && rows.length > 0) {
    const batch = await db.contentBatch.create({
      data: {
        kind: "LESSONS",
        sourceDir: opts.sourceDir,
        fileCount: rows.length,
        created: result.created,
        updated: result.updated,
        retired: 0,
        runBy: opts.runBy ?? "claude-code",
        note: opts.note,
      },
    });
    result.batchId = batch.id;
  }
  return result;
}

/** DRAFT → PUBLISHED for a whole batch (FR-ADM-05). BAD exercises stay out. */
export async function publishBatch(db: Db, batchId: string): Promise<number> {
  const { count } = await db.exercise.updateMany({
    where: { batchId, status: "DRAFT", qualityFlag: { not: "BAD" } },
    data: { status: "PUBLISHED" satisfies ExerciseStatus },
  });
  return count;
}

export async function unpublishBatch(db: Db, batchId: string): Promise<number> {
  const { count } = await db.exercise.updateMany({
    where: { batchId, status: "PUBLISHED" },
    data: { status: "DRAFT" satisfies ExerciseStatus },
  });
  return count;
}
