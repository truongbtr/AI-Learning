/**
 * `intake.preprocess` — the only thing a machine does to a photo of schoolwork (ADR-10).
 *
 * Straighten it (phones write the rotation in EXIF rather than in the pixels), shrink it to a long
 * edge of 2000, lift the contrast a little so pencil on squared paper is readable, split a picture
 * of an open notebook into its two pages, and compress to under 1.5 MB. Then hash it, warn about a
 * page photographed twice this week, and hand the job to the AI queue.
 *
 * No reading, no grading, no AI. What the picture *says* is decided by Claude Code later
 * (docs/13 §2) and by a parent after that.
 *
 * Run by hand:  pnpm intake:run [--job <id>] [--all]
 */
import type { IntakeFileRef } from "@mtct/core";
import {
  DHASH_HEIGHT,
  DHASH_WIDTH,
  dHashFromGrey,
  findPageGutter,
  INTAKE_LONG_EDGE,
  INTAKE_TARGET_BYTES,
} from "@mtct/core";
import { type FileStorage, LocalFileStorage } from "@mtct/core/storage";
import type { PrismaClient } from "@mtct/db";
import { filesOf, findDuplicates } from "@mtct/db";
import type { Logger } from "pino";
import sharp, { type Sharp } from "sharp";

export const INTAKE_PREPROCESS_QUEUE = "intake.preprocess";
/** Every minute: a parent standing in the kitchen should not wait for a cron. */
export const INTAKE_PREPROCESS_CRON = "* * * * *";

export interface PreprocessResult {
  jobs: { jobId: string; files: number; split: number; duplicates: number; ms: number }[];
  failed: { jobId: string; error: string }[];
}

function storage(): FileStorage {
  return new LocalFileStorage(process.env.FILE_ROOT ?? "./data/files");
}

/** JPEG small enough for the queue; drops quality in steps rather than resolution. */
async function toJpeg(pipeline: Sharp): Promise<Buffer> {
  for (const quality of [80, 68, 56, 45]) {
    const buffer = await pipeline.clone().jpeg({ quality, mozjpeg: true }).toBuffer();
    if (buffer.byteLength <= INTAKE_TARGET_BYTES) return buffer;
  }
  return pipeline
    .clone()
    .resize({ width: 1400, withoutEnlargement: true })
    .jpeg({ quality: 45 })
    .toBuffer();
}

/** The dHash of docs/07 §2.2, from a 9 × 8 grey thumbnail. */
async function hashOf(buffer: Buffer): Promise<string> {
  const grey = await sharp(buffer)
    .greyscale()
    .resize(DHASH_WIDTH, DHASH_HEIGHT, { fit: "fill" })
    .raw()
    .toBuffer();
  return dHashFromGrey(grey);
}

/** Column brightness of a wide photo, to find the fold of an open notebook. */
async function columnBrightness(buffer: Buffer, width = 240): Promise<number[]> {
  const { data, info } = await sharp(buffer)
    .greyscale()
    .resize(width, 32, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const columns: number[] = [];
  for (let x = 0; x < info.width; x++) {
    let sum = 0;
    for (let y = 0; y < info.height; y++) sum += data[y * info.width + x] as number;
    columns.push(sum / info.height);
  }
  return columns;
}

interface Processed {
  buffer: Buffer;
  width: number;
  height: number;
  page?: 1 | 2;
}

/**
 * One uploaded picture → one or two pictures ready for the queue.
 * Exported so the tests can run it on a synthetic image without a database.
 */
export async function processPicture(original: Buffer): Promise<Processed[]> {
  const upright = sharp(original).rotate(); // EXIF orientation, baked into the pixels
  const meta = await upright.metadata();
  const aspectRatio = (meta.width ?? 1) / Math.max(1, meta.height ?? 1);

  const flat = await upright.jpeg({ quality: 92 }).toBuffer();
  const cut =
    aspectRatio >= 1.35 ? findPageGutter(await columnBrightness(flat), { aspectRatio }) : null;

  const pieces: { pipeline: Sharp; page?: 1 | 2 }[] = [];
  if (cut !== null && meta.width && meta.height) {
    // `cut` is measured on the 240-wide profile; scale it back to the real picture.
    const at = Math.round((cut / 240) * meta.width);
    const overlap = Math.round(meta.width * 0.01);
    const leftWidth = Math.max(1, Math.min(meta.width - 1, at + overlap));
    pieces.push({
      pipeline: sharp(flat).extract({ left: 0, top: 0, width: leftWidth, height: meta.height }),
      page: 1,
    });
    const rightLeft = Math.max(0, at - overlap);
    pieces.push({
      pipeline: sharp(flat).extract({
        left: rightLeft,
        top: 0,
        width: meta.width - rightLeft,
        height: meta.height,
      }),
      page: 2,
    });
  } else {
    pieces.push({ pipeline: sharp(flat) });
  }

  const out: Processed[] = [];
  for (const piece of pieces) {
    const prepared = piece.pipeline
      .resize({
        width: INTAKE_LONG_EDGE,
        height: INTAKE_LONG_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      // A gentle lift, not a threshold: pencil must stay grey, and a photo of a printed
      // worksheet must not turn into a page of black smudges.
      .normalise({ lower: 2, upper: 98 })
      .linear(1.06, -6);
    const buffer = await toJpeg(prepared);
    const info = await sharp(buffer).metadata();
    out.push({ buffer, width: info.width ?? 0, height: info.height ?? 0, page: piece.page });
  }
  return out;
}

export async function runIntakePreprocessJob(
  prisma: PrismaClient,
  log: Logger,
  opts: { jobId?: string; limit?: number } = {},
): Promise<PreprocessResult> {
  const files = storage();
  const jobs = await prisma.intakeJob.findMany({
    where: opts.jobId ? { id: opts.jobId } : { status: "QUEUED" },
    orderBy: { createdAt: "asc" },
    take: opts.limit ?? 20,
  });
  const result: PreprocessResult = { jobs: [], failed: [] };

  for (const job of jobs) {
    const started = Date.now();
    try {
      await prisma.intakeJob.update({ where: { id: job.id }, data: { status: "PROCESSING" } });
      const refs = filesOf(job);
      const processed: IntakeFileRef[] = [];
      let split = 0;
      let duplicates = 0;

      for (const [index, ref] of refs.entries()) {
        const original = Buffer.from(await files.get(ref.originalKey));
        const pictures = await processPicture(original);
        if (pictures.length > 1) split++;
        for (const [n, picture] of pictures.entries()) {
          const suffix = pictures.length > 1 ? `-p${n + 1}` : "";
          const key = `intake/${job.id}/${String(index + 1).padStart(2, "0")}${suffix}.jpg`;
          await files.put(key, new Uint8Array(picture.buffer), "image/jpeg");
          const pHash = await hashOf(picture.buffer);
          const seen = await findDuplicates(prisma, job.studentId, pHash, { exceptJobId: job.id });
          if (seen.length > 0) duplicates++;
          processed.push({
            key,
            originalKey: ref.originalKey,
            mime: "image/jpeg",
            bytes: picture.buffer.byteLength,
            width: picture.width,
            height: picture.height,
            pHash,
            ...(picture.page ? { page: picture.page } : {}),
            ...(seen[0] ? { duplicateOf: seen[0].key } : {}),
          });
        }
      }

      await prisma.intakeJob.update({
        where: { id: job.id },
        data: { files: processed as unknown as object, error: null },
      });
      await enqueueForReading(prisma, job.id);
      result.jobs.push({
        jobId: job.id,
        files: processed.length,
        split,
        duplicates,
        ms: Date.now() - started,
      });
      log.info(
        { jobId: job.id, files: processed.length, split, duplicates, ms: Date.now() - started },
        "intake preprocessed",
      );
    } catch (err) {
      const message = (err as Error).message;
      await prisma.intakeJob.update({
        where: { id: job.id },
        data: { status: "FAILED", error: message.slice(0, 500) },
      });
      result.failed.push({ jobId: job.id, error: message });
      log.error({ jobId: job.id, err }, "intake preprocessing failed");
    }
  }
  return result;
}

/**
 * Puts the job in the AI queue, once. A class-diary photo is a different kind of reading, but it
 * travels the same way (docs/11 §3 option 2).
 */
async function enqueueForReading(prisma: PrismaClient, jobId: string): Promise<void> {
  const job = await prisma.intakeJob.findUnique({ where: { id: jobId } });
  if (!job) return;
  const already = await prisma.inboxItem.findFirst({
    where: { payload: { path: ["jobId"], equals: jobId } },
    select: { id: true },
  });
  if (already) return;
  await prisma.inboxItem.create({
    data: {
      kind: "PHOTO_INTAKE",
      studentId: job.studentId,
      payload: {
        jobId,
        files: filesOf(job).map((f) => ({ key: f.key })),
        subject: job.subjectHint,
        docType: job.docTypeHint,
        date: (job.dateHint ?? job.createdAt).toISOString().slice(0, 10),
        note: job.note,
      } as object,
    },
  });
}
