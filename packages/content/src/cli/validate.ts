/**
 * `pnpm content:validate` — validates every content/ source: timetable (phase 0), skill map +
 * lesson units + error taxonomy (phase 1), lessons + exercise bank (phase 2, docs/10 §4 and §6).
 * Exits 1 on any error so it can gate `content:import`.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { contentDir } from "../paths";
import { parseTimetable } from "../timetable";
import { runContentValidation } from "../validate-content";
import { runSkillsValidation } from "./validate-skills";

let errors = 0;
const dir = contentDir("timetable");
for (const name of readdirSync(dir).filter((f) => f.endsWith(".json") && !f.includes("schema"))) {
  const file = join(dir, name);
  try {
    const parsed = parseTimetable(JSON.parse(readFileSync(file, "utf8")));
    console.log(
      `OK  timetable/${name}: ${parsed.className} ${parsed.schoolYear}, ${parsed.slots.length} slots`,
    );
  } catch (err) {
    errors++;
    console.error(`ERR timetable/${name}: ${(err as Error).message}`);
  }
}
errors += runSkillsValidation();
errors += runContentValidation().errors;

console.log(errors === 0 ? "content:validate — clean" : `content:validate — ${errors} error(s)`);
process.exit(errors ? 1 : 0);
