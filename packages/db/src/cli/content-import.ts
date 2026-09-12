/**
 * `pnpm content:import [--dir content/exercises/vmath] [--dry-run] [--no-tts] [--tts-pace 3300] [--note "..."]`
 * (docs/10 sec. 5 step 4).
 *
 * 1. validates everything first — a dirty bank is never imported;
 * 2. upserts lessons and exercises by `code` / `stableId` (only content tables, docs/10 sec. 11);
 * 3. pre-generates the prompt mp3 into FILE_ROOT/tts when a TTS key is configured (ADR-11);
 * 4. writes a `ContentBatch` so /admin/content can review exactly this run.
 *
 * With no TTS key step 3 is skipped and the import still succeeds.
 *
 * It lives in @mtct/db rather than @mtct/content so the workspace graph stays acyclic: the schemas
 * and loaders are in @mtct/content, every Prisma call is here.
 */
import {
  contentDir,
  lessonToRow,
  loadExercisePacks,
  loadLessons,
  packToRows,
  resolveContentDir,
  runContentValidation,
  ttsLinesOf,
} from "@mtct/content";
import { LocalFileStorage } from "@mtct/core/storage";
import { pregenerateAudio, ttsConfigFromEnv } from "@mtct/core/tts";
import { importExercises, importLessons } from "../content/import";
import { prisma } from "../index";
import { readTtsUsage, recordTtsUsage, summariseTtsUsage } from "../ops/tts-usage";
import { parseArgs } from "./args";

const args = parseArgs();
const dryRun = args.flags.has("dry-run");
const dirArg = args.values.get("dir");
const note = args.values.get("note");
const skipTts = args.flags.has("no-tts");
/** `--tts-pace 3300` — ms between two synthesis requests; the free Azure tier needs about that. */
const pacing = Number.parseInt(args.values.get("tts-pace") ?? "", 10);

async function main() {
  const validation = runContentValidation({ quiet: true });
  if (validation.errors > 0) {
    console.error(
      `content:import refused: ${validation.errors} validation error(s). Run "pnpm content:validate".`,
    );
    process.exit(1);
  }

  const sourceDir = dirArg ?? "content/";
  const scoped = Boolean(dirArg);
  const wantsLessons = !scoped || dirArg?.includes("lessons");
  const wantsExercises = !scoped || dirArg?.includes("exercises");

  // --- Lessons (docs/10 §4.1) -------------------------------------------------------------
  const lessons = wantsLessons
    ? loadLessons(resolveContentDir(scoped ? dirArg : undefined, contentDir("lessons")))
    : [];
  if (lessons.length > 0) {
    const result = await importLessons(
      prisma,
      lessons.map((l) => lessonToRow(l.lesson)),
      { dryRun, sourceDir, note },
    );
    console.log(
      `lessons: ${result.created} new, ${result.updated} updated, ${result.unchanged} unchanged` +
        (result.skipped.length ? ` (${result.skipped.length} skipped)` : ""),
    );
    for (const s of result.skipped) console.warn(`  WARN ${s.code}: ${s.reason}`);
  }

  // --- Exercises (docs/10 §4.2) -----------------------------------------------------------
  const packs = wantsExercises
    ? loadExercisePacks(resolveContentDir(scoped ? dirArg : undefined, contentDir("exercises")))
    : [];
  if (packs.length === 0) {
    if (lessons.length === 0)
      console.log("nothing to import (no lessons and no *.pack.json found)");
    return;
  }

  const rows = packs.flatMap(({ name, pack }) => packToRows(pack, name));
  const result = await importExercises(prisma, rows, {
    dryRun,
    sourceDir,
    note,
    // A scoped import must not retire the exercises of the skills it did not look at.
    retireMissing: true,
  });
  console.log(
    `exercises: ${result.created} new, ${result.updated} updated, ${result.revived} revived, ` +
      `${result.unchanged} unchanged, ${result.retired} retired` +
      (result.batchId ? ` — batch ${result.batchId}` : ""),
  );
  for (const s of result.skipped) console.warn(`  WARN ${s.stableId}: ${s.reason}`);

  if (dryRun) {
    const changes = result.plan;
    if (changes.length === 0) console.log("dry-run: 0 changes");
    else {
      console.log(`dry-run: ${changes.length} change(s)`);
      for (const c of changes.slice(0, 50)) console.log(`  ${c.action.padEnd(6)} ${c.stableId}`);
      if (changes.length > 50) console.log(`  … and ${changes.length - 50} more`);
    }
    return;
  }

  // --- TTS pre-generation (ADR-11 muc 3) --------------------------------------------------
  if (skipTts) {
    console.log("tts: skipped (--no-tts)");
    return;
  }
  const cfg = ttsConfigFromEnv();
  const lines = packs.flatMap(({ pack }) => pack.exercises.flatMap((ex) => ttsLinesOf(ex)));
  const storage = new LocalFileStorage(process.env.FILE_ROOT ?? "./data/files");
  // Generating the whole bank takes the best part of an hour on the free tier, so say where it is.
  const startedAt = Date.now();
  let lastLog = 0;
  const audio = await pregenerateAudio(lines, cfg, storage, {
    pacingMs: Number.isFinite(pacing) ? pacing : undefined,
    onProgress: ({ done, total, waitedMs }) => {
      if (done !== total && done - lastLog < 25) return;
      lastLog = done;
      const mins = (Date.now() - startedAt) / 60_000;
      const left = done > 0 ? (mins / done) * (total - done) : 0;
      console.log(
        `tts: ${done}/${total} câu — ${mins.toFixed(0)} phút, còn khoảng ${left.toFixed(0)} phút` +
          (waitedMs > 0 ? ` (chờ hạn mức ${(waitedMs / 1000).toFixed(0)} giây)` : ""),
      );
    },
  });
  // The bill, counted where it is incurred (docs/08 pha 8, tiêu chí 5). `generated` is the number
  // of lines that actually went to Azure; cached ones cost nothing. Characters, because that is
  // the unit the free F0 tier is measured in.
  if (audio.generated > 0) {
    const generatedChars = lines.slice(0, audio.generated).reduce((n, l) => n + l.text.length, 0);
    await recordTtsUsage(prisma, generatedChars, cfg.provider);
    const usage = summariseTtsUsage(await readTtsUsage(prisma));
    console.log(
      `tts: tháng ${usage.month} đã dùng ${usage.chars.toLocaleString("vi-VN")}/${usage.limit.toLocaleString("vi-VN")} ký tự ` +
        `(${Math.round(usage.fraction * 100)}% hạn mức miễn phí F0)` +
        (usage.level !== "ok" ? " — sắp hết, xem /admin/health" : ""),
    );
  }

  if (audio.requested > 0 && audio.skipped === audio.requested) {
    console.log(
      `tts: skipped ${audio.requested} line(s) — no TTS_API_KEY, the app will use Web Speech`,
    );
  } else {
    console.log(
      `tts: ${audio.generated} generated, ${audio.cached} already cached, ` +
        `${audio.skipped} skipped, ${audio.failed.length} failed`,
    );
    // A free plan runs out fast; stopping there is expected, not a broken import (ADR-11 muc 2).
    if (audio.quotaReached)
      console.log(
        `tts: nhà cung cấp báo hết hạn mức — còn ${audio.remaining} câu chưa có mp3. ` +
          "Chạy lại `pnpm content:import` ngày mai để sinh tiếp; con vẫn học được bằng giọng máy.",
      );
  }
  for (const f of audio.failed.slice(0, 5)) console.warn(`  WARN tts "${f.text}": ${f.error}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
