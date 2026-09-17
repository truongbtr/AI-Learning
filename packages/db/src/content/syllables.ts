/**
 * Importing the syllable dictionary of pha 12 (content/lexicon/viet.json → `Syllable`).
 *
 * SAFETY CONTRACT — like the word importer, this module only writes content: `Syllable` and
 * `ContentBatch`. It never touches `LexemeProgress`, which is the child's own memory of each
 * syllable (ADR-22), nor any other learning table. A syllable that leaves the file is switched
 * off, never deleted, so a progress row pointing at it keeps its meaning.
 *
 * Rows arrive as plain data: the Zod schema lives in the ESM package @mtct/content and this
 * package is built to CommonJS, so it must not import it at runtime.
 */
import { Prisma, type PrismaClient } from "../../generated/client";

type Db = PrismaClient;

export interface SyllableRow {
  stableId: string;
  text: string;
  onset: string;
  rime: string;
  tone: string;
  picture: unknown | null;
  meaning: string;
  skillCode: string;
  lessonUnitCode: string;
  week: number;
  everyday: boolean;
  /** A given name: the games write it with a capital ("Thy"). */
  properName: boolean;
  position: number;
}

export interface SyllableImportResult {
  created: number;
  updated: number;
  unchanged: number;
  /** Syllables no longer in the file: switched off, their progress rows left alone. */
  retired: number;
  revived: number;
  skipped: { stableId: string; reason: string }[];
  batchId: string | null;
}

export interface SyllableImportOptions {
  dryRun?: boolean;
  sourceDir: string;
  note?: string;
  runBy?: string;
}

type Stored = Omit<SyllableRow, "stableId" | "skillCode"> & { skillId: string };

function same(a: SyllableRow, skillId: string, b: Stored): boolean {
  return (
    a.text === b.text &&
    a.onset === b.onset &&
    a.rime === b.rime &&
    a.tone === b.tone &&
    a.meaning === b.meaning &&
    a.lessonUnitCode === b.lessonUnitCode &&
    a.week === b.week &&
    a.everyday === b.everyday &&
    a.properName === b.properName &&
    a.position === b.position &&
    skillId === b.skillId &&
    JSON.stringify(a.picture ?? null) === JSON.stringify(b.picture ?? null)
  );
}

export async function importSyllables(
  db: Db,
  rows: SyllableRow[],
  opts: SyllableImportOptions,
): Promise<SyllableImportResult> {
  const result: SyllableImportResult = {
    created: 0,
    updated: 0,
    unchanged: 0,
    retired: 0,
    revived: 0,
    skipped: [],
    batchId: null,
  };

  const skillIds = new Map(
    (
      await db.skill.findMany({
        where: { code: { in: [...new Set(rows.map((r) => r.skillCode))] } },
        select: { id: true, code: true },
      })
    ).map((s) => [s.code, s.id]),
  );
  const existing = new Map(
    (await db.syllable.findMany({ where: { stableId: { in: rows.map((r) => r.stableId) } } })).map(
      (s) => [s.stableId, s],
    ),
  );
  const keep = new Set(rows.map((r) => r.stableId));
  const retireCandidates = await db.syllable.findMany({
    where: { isActive: true, stableId: { notIn: [...keep] } },
    select: { id: true },
  });

  for (const row of rows) {
    const skillId = skillIds.get(row.skillCode);
    if (!skillId) {
      result.skipped.push({ stableId: row.stableId, reason: `unknown skill ${row.skillCode}` });
      continue;
    }
    const known = existing.get(row.stableId);
    if (known?.isActive && same(row, skillId, known as unknown as Stored)) {
      result.unchanged++;
      continue;
    }
    if (known && !known.isActive) result.revived++;
    else if (known) result.updated++;
    else result.created++;
    if (opts.dryRun) continue;

    const data = {
      text: row.text,
      onset: row.onset,
      rime: row.rime,
      tone: row.tone,
      // a picture removed from the file has to go from the row too, not just be left alone
      picture: row.picture == null ? Prisma.DbNull : (row.picture as Prisma.InputJsonValue),
      meaning: row.meaning,
      skillId,
      lessonUnitCode: row.lessonUnitCode,
      week: row.week,
      everyday: row.everyday,
      properName: row.properName,
      position: row.position,
    };
    await db.syllable.upsert({
      where: { stableId: row.stableId },
      create: { stableId: row.stableId, ...data },
      update: { ...data, isActive: true },
    });
  }

  result.retired = retireCandidates.length;
  if (opts.dryRun) return result;
  if (retireCandidates.length > 0) {
    await db.syllable.updateMany({
      where: { id: { in: retireCandidates.map((s) => s.id) } },
      data: { isActive: false },
    });
  }

  const batch = await db.contentBatch.create({
    data: {
      kind: "LEXICON",
      sourceDir: opts.sourceDir,
      fileCount: 1,
      created: result.created,
      updated: result.updated + result.revived,
      retired: result.retired,
      runBy: opts.runBy ?? "claude-code",
      note: opts.note ?? "Kho tiếng Xưởng Tiếng (content/lexicon/viet.json)",
    },
  });
  result.batchId = batch.id;
  await db.syllable.updateMany({
    where: { stableId: { in: [...keep] } },
    data: { batchId: batch.id },
  });
  return result;
}
