import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";
import type { FileStorage, IntakeFileRef } from "@mtct/core";
import { INTAKE_MIME_EXT } from "@mtct/core";
import type { Prisma, PrismaClient } from "../../generated/client";

/**
 * `content:import-intake` — a whole shelf of old exercise books at once (docs/10 §8).
 *
 * The weekly rhythm goes through the phone (phase 4, FR-INT-01). This is for the other case: a
 * parent sitting at the computer with a term's worth of paper to catch up on. The pictures are
 * copied in from a folder, the reading beside them is what Claude Code wrote, and the result lands
 * in exactly the same place as a photo from the phone — `PENDING_REVIEW`, waiting for a parent.
 *
 *   intake-inbox/<nickname>/<date>/*.jpg
 *   intake-inbox/<nickname>/<date>/ket-qua.json     ← an IntakeExtraction, or a list of them
 */

type Db = PrismaClient;

const IMAGE_EXT = new Set(Object.values(INTAKE_MIME_EXT).map((e) => `.${e}`));
export const RESULT_FILENAMES = ["ket-qua.json", "result.json"];

export interface IntakeBatchFolder {
  dir: string;
  nickname: string;
  date: string | null;
  images: string[];
  resultFile: string | null;
}

/** Every `<nickname>/<date>/` folder under `root` that has pictures in it. */
export function findIntakeBatches(root: string): IntakeBatchFolder[] {
  if (!existsSync(root)) return [];
  const out: IntakeBatchFolder[] = [];
  const walk = (dir: string, nickname: string | null, date: string | null, depth: number) => {
    const entries = readdirSync(dir);
    const images = entries.filter((e) => IMAGE_EXT.has(extname(e).toLowerCase())).sort();
    const resultFile = RESULT_FILENAMES.map((n) => join(dir, n)).find((p) => existsSync(p)) ?? null;
    if (images.length > 0) {
      out.push({ dir, nickname: nickname ?? basename(dir), date, images, resultFile });
      return;
    }
    if (depth > 3) return;
    for (const entry of entries) {
      const child = join(dir, entry);
      if (!statSync(child).isDirectory()) continue;
      walk(child, nickname ?? entry, /^\d{4}-\d{2}-\d{2}$/.test(entry) ? entry : date, depth + 1);
    }
  };
  walk(root, null, null, 0);
  return out;
}

export interface ImportIntakeOptions {
  root: string;
  storage: FileStorage;
  /** Only look at this one folder. */
  dir?: string;
  dryRun?: boolean;
  /** Who the IntakeJob belongs to; defaults to the first ADMIN. */
  createdById?: string;
}

export interface ImportIntakeResult {
  batches: {
    dir: string;
    nickname: string;
    images: number;
    items: number;
    jobId?: string;
    resultId?: string;
    skipped?: string;
  }[];
  imported: number;
  skipped: number;
}

/**
 * Loads every batch that has a reading beside it. A folder with pictures but no `ket-qua.json` is
 * reported, not imported: it is a folder waiting to be read, and inventing an empty reading for it
 * would put a blank page in front of a parent to approve.
 */
export async function importIntakeBatches(
  db: Db,
  opts: ImportIntakeOptions,
): Promise<ImportIntakeResult> {
  const batches = opts.dir ? findIntakeBatches(opts.dir) : findIntakeBatches(opts.root);
  const out: ImportIntakeResult = { batches: [], imported: 0, skipped: 0 };
  const admin =
    opts.createdById ??
    (await db.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } }))?.id;

  for (const batch of batches) {
    if (!batch.resultFile) {
      out.batches.push({
        dir: batch.dir,
        nickname: batch.nickname,
        images: batch.images.length,
        items: 0,
        skipped: "chưa có ket-qua.json — Claude Code cần đọc ảnh trước",
      });
      out.skipped++;
      continue;
    }
    const student = await db.student.findFirst({
      where: {
        OR: [{ nickname: batch.nickname }, { slug: batch.nickname }, { id: batch.nickname }],
      },
      select: { id: true, nickname: true },
    });
    if (!student) {
      out.batches.push({
        dir: batch.dir,
        nickname: batch.nickname,
        images: batch.images.length,
        items: 0,
        skipped: `không có bé nào tên "${batch.nickname}"`,
      });
      out.skipped++;
      continue;
    }
    if (!admin) throw new Error("không có tài khoản ADMIN để đứng tên lô ảnh");

    const readings = asArray(JSON.parse(readFileSync(batch.resultFile, "utf8")));
    if (opts.dryRun) {
      out.batches.push({
        dir: batch.dir,
        nickname: student.nickname,
        images: batch.images.length,
        items: readings.reduce((n, r) => n + (r.items?.length ?? 0), 0),
      });
      out.imported++;
      continue;
    }

    // The pictures go into the same store as a photo from the phone, so P6 shows them the same way.
    const dateHint = batch.date ? new Date(`${batch.date}T00:00:00Z`) : null;
    const files: IntakeFileRef[] = [];
    for (const [index, name] of batch.images.entries()) {
      const bytes = new Uint8Array(readFileSync(join(batch.dir, name)));
      const ext = extname(name).toLowerCase().slice(1);
      const key = `intake-import/${student.id}/${batch.date ?? "cu"}/${String(index + 1).padStart(2, "0")}.${ext}`;
      const mime = Object.entries(INTAKE_MIME_EXT).find(([, e]) => e === ext)?.[0] ?? "image/jpeg";
      await opts.storage.put(key, bytes, mime);
      files.push({ key, originalKey: key, mime, bytes: bytes.byteLength });
    }

    const job = await db.intakeJob.create({
      data: {
        studentId: student.id,
        createdById: admin,
        kind: "PHOTO_BATCH",
        status: "PENDING_REVIEW",
        subjectHint: readings[0]?.subject ?? null,
        docTypeHint: readings[0]?.docType ?? null,
        dateHint,
        note: `content:import-intake · ${batch.dir}`,
        files: files as unknown as Prisma.InputJsonValue,
      },
    });

    let items = 0;
    let lastResultId = "";
    for (const reading of readings) {
      const result = await db.intakeResult.create({
        data: {
          jobId: job.id,
          docType: reading.docType ?? "WORKBOOK",
          subject: reading.subject ?? null,
          detectedStudent: reading.detectedStudent ?? null,
          summary: reading.summary ?? "",
          teacherComment: reading.teacherComment ?? null,
          rawExtraction: reading as unknown as Prisma.InputJsonValue,
          confidence: reading.confidence ?? 0.5,
        },
      });
      lastResultId = result.id;
      const rows = reading.items ?? [];
      if (rows.length > 0) {
        await db.intakeItem.createMany({
          data: rows.map((i, n) => ({
            resultId: result.id,
            index: i.index ?? n,
            questionText: i.questionText ?? "",
            studentAnswer: i.studentAnswer ?? null,
            expectedAnswer: i.expectedAnswer ?? null,
            outcome: i.outcome ?? "UNGRADED",
            blankReason: i.outcome === "BLANK" ? (i.blankReason ?? null) : null,
            errorCode: i.errorCode ?? null,
            skillCodes: i.skillCodes ?? [],
            bbox: i.bbox ? { x: i.bbox[0], y: i.bbox[1], w: i.bbox[2], h: i.bbox[3] } : undefined,
            fileIndex: i.fileIndex ?? 0,
          })),
          skipDuplicates: true,
        });
        items += rows.length;
      }
    }

    out.batches.push({
      dir: batch.dir,
      nickname: student.nickname,
      images: batch.images.length,
      items,
      jobId: job.id,
      resultId: lastResultId,
    });
    out.imported++;
  }
  return out;
}

interface RawReading {
  docType?:
    | "WORKBOOK"
    | "TEST"
    | "WORKSHEET"
    | "TEACHER_NOTE"
    | "CLASS_DIARY"
    | "NAVIO_REPORT"
    | "KIDSAZ_REPORT"
    | "OTHER";
  subject?: "ESL" | "ENL" | "EMATH" | "ESCI" | "VIET" | "VMATH" | null;
  detectedStudent?: string | null;
  summary?: string;
  teacherComment?: string | null;
  confidence?: number;
  items?: {
    index?: number;
    questionText?: string;
    studentAnswer?: string | null;
    expectedAnswer?: string | null;
    outcome?: "CORRECT" | "PARTIAL" | "INCORRECT" | "BLANK" | "UNGRADED";
    blankReason?: "NOT_FINISHED" | "DOES_NOT_KNOW" | null;
    errorCode?: string | null;
    skillCodes?: string[];
    bbox?: [number, number, number, number] | null;
    fileIndex?: number;
  }[];
}

function asArray(json: unknown): RawReading[] {
  if (Array.isArray(json)) return json as RawReading[];
  const one = json as { results?: RawReading[] };
  if (Array.isArray(one.results)) return one.results;
  return [json as RawReading];
}
