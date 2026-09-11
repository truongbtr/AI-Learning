/**
 * `pnpm content:export --skill VMATH.SO.CONG_PV_10 [--out path]` (docs/10 sec. 10).
 * Writes the DB rows of one skill back into a pack file, so a fix made in /admin/content can go
 * back into git. Prints to stdout with `--stdout`.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { contentDir, parseExercisePack } from "@mtct/content";
import { exportPack } from "../content/export";
import { prisma } from "../index";
import { parseArgs } from "./args";

const args = parseArgs();
const skill = args.values.get("skill") ?? args.rest[0];

async function main() {
  if (!skill) {
    console.error("content:export needs --skill <CODE>, e.g. --skill VMATH.SO.CONG_PV_10");
    process.exit(2);
  }
  const pack = await exportPack(prisma, skill);
  if (!pack) {
    console.error(`skill "${skill}" does not exist`);
    process.exit(1);
  }
  if (pack.exercises.length === 0) {
    console.error(`skill "${skill}" has no exercises in the database`);
    process.exit(1);
  }

  // Round-trip check: what we write back must pass the authoring schema.
  try {
    parseExercisePack(pack);
  } catch (err) {
    console.error(`export produced a file the validator rejects: ${(err as Error).message}`);
    process.exit(1);
  }

  const json = `${JSON.stringify(pack, null, 2)}\n`;
  if (args.flags.has("stdout")) {
    process.stdout.write(json);
    return;
  }
  const out =
    args.values.get("out") ??
    join(
      contentDir("exercises", pack.subject.toLowerCase()),
      `${skill.split(".").slice(1).join(".")}.pack.json`,
    );
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, json, "utf8");
  console.log(`wrote ${pack.exercises.length} exercises to ${out}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
