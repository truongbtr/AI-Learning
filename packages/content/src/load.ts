import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { type ErrorTaxonomyFile, parseErrorTaxonomy } from "./error-taxonomy";
import { type LessonUnitsFile, parseLessonUnits } from "./lesson-units";
import { contentDir } from "./paths";
import { parseSkillMap, type SkillMapFile } from "./skill-map";

export interface NamedSkillMap {
  name: string;
  map: SkillMapFile;
}
export interface NamedLessonUnits {
  name: string;
  units: LessonUnitsFile;
}

function jsonFiles(dir: string, suffix = ".json"): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(suffix) && !f.endsWith(".schema.json"))
    .sort();
}

/** content/skill-map/<subject>.json */
export function loadSkillMaps(dir = contentDir("skill-map")): NamedSkillMap[] {
  return jsonFiles(dir).map((name) => ({
    name: `skill-map/${name}`,
    map: parseSkillMap(JSON.parse(readFileSync(join(dir, name), "utf8"))),
  }));
}

/** content/lessons/<subject>/*.units.json (recursive one level) */
export function loadLessonUnitFiles(dir = contentDir("lessons")): NamedLessonUnits[] {
  if (!existsSync(dir)) return [];
  const out: NamedLessonUnits[] = [];
  for (const sub of readdirSync(dir, { withFileTypes: true })) {
    if (!sub.isDirectory()) continue;
    for (const name of jsonFiles(join(dir, sub.name), ".units.json")) {
      out.push({
        name: `lessons/${sub.name}/${name}`,
        units: parseLessonUnits(JSON.parse(readFileSync(join(dir, sub.name, name), "utf8"))),
      });
    }
  }
  return out;
}

/** content/error-taxonomy.json (null when absent) */
export function loadErrorTaxonomy(
  file = contentDir("error-taxonomy.json"),
): ErrorTaxonomyFile | null {
  if (!existsSync(file)) return null;
  return parseErrorTaxonomy(JSON.parse(readFileSync(file, "utf8")));
}
