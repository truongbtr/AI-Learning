/**
 * Importing the picture dictionary of pha 11 (content/lexicon/esl.json → `Word`).
 *
 * SAFETY CONTRACT — like the exercise importer, this module only writes content: `Word` and
 * `ContentBatch`. It never touches `LexemeProgress`, which is the child's own memory of a word
 * (ADR-22), nor any other learning table. A word that leaves the file is deactivated, never
 * deleted, so the progress rows pointing at it keep their meaning.
 *
 * The rows arrive as plain data: the Zod schema lives in the ESM package @mtct/content and this
 * package is built to CommonJS, so it must not import it at runtime.
 */
import type { PrismaClient } from "../../generated/client";

type Db = PrismaClient;

export interface WordRow {
  stableId: string;
  en: string;
  vi: string;
  skillCode: string;
  picture: unknown;
  phraseEn: string;
  phraseVi: string;
  unit: number | null;
}

export interface WordImportResult {
  created: number;
  updated: number;
  unchanged: number;
  /** Words no longer in the file: deactivated, and their progress rows left alone. */
  retired: number;
  revived: number;
  skipped: { stableId: string; reason: string }[];
  batchId: string | null;
}

export interface WordImportOptions {
  dryRun?: boolean;
  sourceDir: string;
  note?: string;
  runBy?: string;
}

function same(
  a: WordRow,
  b: {
    en: string;
    vi: string;
    phraseEn: string;
    phraseVi: string;
    unit: number | null;
    picture: unknown;
    skillId: string;
  },
  skillId: string,
): boolean {
  return (
    a.en === b.en &&
    a.vi === b.vi &&
    a.phraseEn === b.phraseEn &&
    a.phraseVi === b.phraseVi &&
    (a.unit ?? null) === (b.unit ?? null) &&
    skillId === b.skillId &&
    JSON.stringify(a.picture) === JSON.stringify(b.picture)
  );
}

export async function importWords(
  db: Db,
  rows: WordRow[],
  opts: WordImportOptions,
): Promise<WordImportResult> {
  const result: WordImportResult = {
    created: 0,
    updated: 0,
    unchanged: 0,
    retired: 0,
    revived: 0,
    skipped: [],
    batchId: null,
  };

  const skillRows = await db.skill.findMany({
    where: { code: { in: [...new Set(rows.map((r) => r.skillCode))] } },
    select: { id: true, code: true },
  });
  const skillIds = new Map(skillRows.map((s) => [s.code, s.id]));

  const existing = new Map(
    (
      await db.word.findMany({
        where: { stableId: { in: rows.map((r) => r.stableId) } },
      })
    ).map((w) => [w.stableId, w]),
  );

  const keep = new Set(rows.map((r) => r.stableId));
  const retireCandidates = await db.word.findMany({
    where: { isActive: true, stableId: { notIn: [...keep] } },
    select: { id: true, stableId: true },
  });

  for (const row of rows) {
    const skillId = skillIds.get(row.skillCode);
    if (!skillId) {
      result.skipped.push({ stableId: row.stableId, reason: "unknown skill code" });
      continue;
    }
    const known = existing.get(row.stableId);
    if (known && known.isActive && same(row, known, skillId)) {
      result.unchanged++;
      continue;
    }
    if (known && !known.isActive) result.revived++;
    else if (known) result.updated++;
    else result.created++;

    if (opts.dryRun) continue;
    await db.word.upsert({
      where: { stableId: row.stableId },
      create: {
        stableId: row.stableId,
        en: row.en,
        vi: row.vi,
        skillId,
        picture: row.picture as object,
        phraseEn: row.phraseEn,
        phraseVi: row.phraseVi,
        unit: row.unit,
      },
      update: {
        en: row.en,
        vi: row.vi,
        skillId,
        picture: row.picture as object,
        phraseEn: row.phraseEn,
        phraseVi: row.phraseVi,
        unit: row.unit,
        isActive: true,
      },
    });
  }

  result.retired = retireCandidates.length;
  if (!opts.dryRun && retireCandidates.length > 0) {
    await db.word.updateMany({
      where: { id: { in: retireCandidates.map((w) => w.id) } },
      data: { isActive: false },
    });
  }
  if (opts.dryRun) return result;

  const batch = await db.contentBatch.create({
    data: {
      kind: "LEXICON",
      sourceDir: opts.sourceDir,
      fileCount: 1,
      created: result.created,
      updated: result.updated + result.revived,
      retired: result.retired,
      runBy: opts.runBy ?? "claude-code",
      note: opts.note,
    },
  });
  result.batchId = batch.id;
  await db.word.updateMany({
    where: { stableId: { in: [...keep] } },
    data: { batchId: batch.id },
  });
  return result;
}
