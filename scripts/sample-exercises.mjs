/**
 * Reproducible random sample for the rubric review (docs/10 §6).
 * Pool = every PUBLISHED exercise in content/exercises; order = sha256(seed + stableId).
 * QC can regenerate the exact same 20 with: node sample.mjs pha-2-dot-1
 *
 * `--only=<regex>` narrows the pool to the packs whose "<subject>/<file>" path matches — how a
 * later batch draws its twenty from its own packs instead of the whole bank:
 *   node scripts/sample-exercises.mjs pha-6a-dot-2 20 "" --only='^(esci|emath)/'
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const onlyArg = argv.find((a) => a.startsWith("--only="));
const positional = argv.filter((a) => !a.startsWith("--"));
const SEED = positional[0] || "pha-2-dot-1";
const N = Number(positional[1] ?? 20);
const only = onlyArg ? new RegExp(onlyArg.slice("--only=".length)) : null;
const root = join(fileURLToPath(new URL("..", import.meta.url)), "content", "exercises");
const all = [];
for (const sub of readdirSync(root))
  for (const f of readdirSync(join(root, sub))) {
    if (only && !only.test(`${sub}/${f}`)) continue;
    const p = JSON.parse(readFileSync(join(root, sub, f), "utf8"));
    for (const e of p.exercises) all.push({ pack: `${sub}/${f}`, skill: p.skillCode, ...e });
  }
all.sort((a, b) => a.id.localeCompare(b.id));
const keyed = all.map((x) => ({
  x,
  k: createHash("sha256")
    .update(SEED + x.id)
    .digest("hex"),
}));
keyed.sort((a, b) => a.k.localeCompare(b.k));
const sample = keyed.slice(0, N).map((r) => r.x);
console.log(`pool ${all.length} · seed "${SEED}" · ${N} drawn`);
for (const s of sample)
  console.log(`${s.id.padEnd(22)} ${s.skill.padEnd(30)} ${s.type.padEnd(14)} d${s.difficulty}`);
// Optional third argument: write the full exercises to a file for a close read.
const out = process.argv[4];
if (out) writeFileSync(out, JSON.stringify(sample, null, 2));
