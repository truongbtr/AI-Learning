/**
 * `pnpm content:validate` — validates every content/ source: timetable (phase 0), skill map +
 * lesson units + error taxonomy (phase 1). Lessons / exercises arrive in phase 2 (docs/10).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { contentDir } from "../paths";
import { parseTimetable } from "../timetable";
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
console.log("(lessons content / exercises validators: phase 2)");
process.exit(errors ? 1 : 0);
