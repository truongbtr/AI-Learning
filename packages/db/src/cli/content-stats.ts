/**
 * `pnpm content:stats [--subject VMATH] [--skills CODE,CODE] [--all] [--json]` (docs/10 sec. 10).
 * Reads the DB and answers the only question that matters before a writing session:
 * which skill still needs exercises, of which type, at which difficulty.
 */
import { loadExercisePacks, MIN_EXERCISES_PER_SKILL, ttsLinesOf } from "@mtct/content";
import { LocalFileStorage } from "@mtct/core/storage";
import { missingAudio, ttsConfigFromEnv } from "@mtct/core/tts";
import { bankCoverage } from "../content/stats";
import { prisma } from "../index";
import { parseArgs } from "./args";

const args = parseArgs();
const subject = args.values.get("subject") as
  | "ESL"
  | "ENL"
  | "EMATH"
  | "ESCI"
  | "VIET"
  | "VMATH"
  | undefined;
const skillCodes = args.values
  .get("skills")
  ?.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** FR-ADM-05: fewer than 10 published exercises is "red" — the next writing batch starts there. */
const RED = 10;

function bar(cover: { published: number }): string {
  if (cover.published >= MIN_EXERCISES_PER_SKILL) return "OK ";
  if (cover.published < RED) return "RED";
  return "LOW";
}

async function main() {
  const coverage = await bankCoverage(prisma, {
    subject,
    skillCodes,
    includeEmpty: args.flags.has("all"),
  });
  if (args.flags.has("json")) {
    console.log(JSON.stringify(coverage, null, 2));
    return;
  }

  const { skills, totals } = coverage;
  if (skills.length === 0) {
    console.log("No skill has exercises yet. Write packs into content/exercises/<subject>/.");
    return;
  }

  console.log(
    "     skill                                      pub  draft  types missing        difficulty missing",
  );
  console.log("     ".padEnd(5) + "-".repeat(100));
  for (const s of skills) {
    console.log(
      `${bar(s)}  ${s.code.padEnd(42)} ${String(s.published).padStart(3)}  ` +
        `${String(s.draft).padStart(5)}  ${(s.missingTypes.join(",") || "-").padEnd(22)} ` +
        `${s.missingDifficulties.join(",") || "-"}`,
    );
  }
  console.log();
  console.log(
    `${skills.length} skill(s) with exercises · ${totals.published} PUBLISHED · ${totals.draft} DRAFT · ${totals.retired} RETIRED`,
  );
  console.log(`by subject:    ${JSON.stringify(totals.bySubject)}`);
  console.log(`by type:       ${JSON.stringify(totals.byType)}`);
  console.log(`by difficulty: ${JSON.stringify(totals.byDifficulty)}`);

  const short = skills.filter((s) => s.published < MIN_EXERCISES_PER_SKILL);
  const incomplete = skills.filter(
    (s) => s.missingTypes.length > 0 || s.missingDifficulties.length > 0,
  );
  console.log(
    short.length === 0
      ? `every skill has >= ${MIN_EXERCISES_PER_SKILL} published exercises`
      : `${short.length} skill(s) below ${MIN_EXERCISES_PER_SKILL} published: ${short.map((s) => s.code).join(", ")}`,
  );

  // Audio coverage (ADR-11 muc 2): how many prompts still have no mp3.
  const lines = loadExercisePacks().flatMap(({ pack }) =>
    pack.exercises.flatMap((ex) => ttsLinesOf(ex)),
  );
  const cfg = ttsConfigFromEnv();
  const storage = new LocalFileStorage(process.env.FILE_ROOT ?? "./data/files");
  const audio = await missingAudio(lines, cfg, storage);
  console.log(
    audio.enabled
      ? `audio: ${audio.total - audio.missing}/${audio.total} câu đã có mp3 (${cfg.provider})` +
          (audio.missing > 0 ? " — chạy lại `pnpm content:import` để sinh tiếp" : "")
      : `audio: chưa bật TTS cloud (TTS_PROVIDER=${cfg.provider}) — con nghe bằng giọng của máy`,
  );
  if (incomplete.length > 0)
    console.log(
      `${incomplete.length} skill(s) missing a type or a difficulty: ${incomplete.map((s) => s.code).join(", ")}`,
    );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
