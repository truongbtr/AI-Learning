/**
 * `pnpm content:validate` — phase 0 validates content/timetable/*.json only.
 * Lessons / exercises / skill-map validators arrive in phase 1-2 (docs/10).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { contentDir } from "../paths";
import { parseTimetable } from "../timetable";

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
console.log("(skill-map / lessons / exercises validators: phase 1-2)");
process.exit(errors ? 1 : 0);
