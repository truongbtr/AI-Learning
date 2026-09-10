/**
 * `pnpm skills:validate` (docs/08 phase 1 item 1): checks content/skill-map/*.json,
 * content/lessons/** /*.units.json and content/error-taxonomy.json together.
 * Exit 1 on any error. Also run by `pnpm content:validate`.
 */
import { validateErrorTaxonomy } from "../error-taxonomy";
import { validateLessonUnits } from "../lesson-units";
import { loadErrorTaxonomy, loadLessonUnitFiles, loadSkillMaps } from "../load";
import { validateSkillMaps } from "../skill-map";

export function runSkillsValidation(): number {
  let errors = 0;
  let maps: ReturnType<typeof loadSkillMaps> = [];
  let unitFiles: ReturnType<typeof loadLessonUnitFiles> = [];
  try {
    maps = loadSkillMaps();
    unitFiles = loadLessonUnitFiles();
  } catch (err) {
    console.error(`ERR ${(err as Error).message}`);
    return 1;
  }
  if (maps.length === 0) {
    console.error("ERR no skill-map files found in content/skill-map/");
    return 1;
  }

  const lessonCodes = new Set(unitFiles.flatMap((f) => f.units.units.map((u) => u.code)));
  const result = validateSkillMaps(maps, lessonCodes);
  for (const issue of result.issues) {
    const tag = issue.level === "error" ? "ERR " : "WARN";
    console[issue.level === "error" ? "error" : "warn"](
      `${tag} ${issue.file}${issue.code ? ` [${issue.code}]` : ""}: ${issue.message}`,
    );
  }
  errors += result.errors.length;

  const skillCodes = new Set(maps.flatMap((m) => m.map.skills.map((s) => s.code)));
  const unitIssues = validateLessonUnits(unitFiles, skillCodes);
  for (const i of unitIssues)
    console.error(`ERR ${i.file}${i.code ? ` [${i.code}]` : ""}: ${i.message}`);
  errors += unitIssues.length;

  let taxonomy = null;
  try {
    taxonomy = loadErrorTaxonomy();
  } catch (err) {
    console.error(`ERR ${(err as Error).message}`);
    errors++;
  }
  if (taxonomy) {
    const tIssues = validateErrorTaxonomy(taxonomy, skillCodes);
    for (const msg of tIssues) console.error(`ERR error-taxonomy.json: ${msg}`);
    errors += tIssues.length;
  } else {
    console.warn("WARN content/error-taxonomy.json missing");
  }

  const unitCount = unitFiles.reduce((n, f) => n + f.units.units.length, 0);
  console.log(
    `skills: ${result.total} total ${JSON.stringify(result.bySubject)}; lesson units: ${unitCount} in ${unitFiles.length} files; error codes: ${taxonomy?.codes.length ?? 0}`,
  );
  console.log(
    errors
      ? `FAILED with ${errors} error(s)`
      : "OK  skill map, lesson units and error taxonomy are consistent",
  );
  return errors ? 1 : 0;
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("cli/validate-skills.ts")) {
  process.exit(runSkillsValidation());
}
