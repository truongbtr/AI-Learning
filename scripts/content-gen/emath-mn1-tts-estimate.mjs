/**
 * Pha 13 — how many English TTS characters the new EMATH exercises will cost (en-US-AnaNeural).
 *
 * Counts the spoken lines (prompts with tts, listenTargets) of every EMATH exercise, minus the lines
 * the bank already had at `BASE` (those mp3 exist on production). Same dedupe as
 * `pregenerateAudio`: one mp3 per distinct text. Placeholder lines ({ban}) are never pre-generated.
 *
 *   node scripts/content-gen/emath-mn1-tts-estimate.mjs [BASE=e6ffcbb]
 */
import { execSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";

const BASE = process.argv[2] ?? "e6ffcbb";
const DIR = "content/exercises/emath";
const LIMIT = 500_000; // Azure F0, characters a month
const BATCH = 50_000; // the phase brief: split the run above this

const linesOf = (pack) =>
  pack.exercises.flatMap((ex) => {
    const out = [];
    if (ex.prompt.tts !== false) out.push(ex.prompt.text.trim());
    if (ex.listenTarget) out.push(ex.listenTarget.text.trim());
    return out.filter((t) => !/\{(ten|vat|ban)\}/.test(t));
  });

const before = new Set();
for (const f of readdirSync(DIR)) {
  let json;
  try {
    json = execSync(`git show ${BASE}:${DIR}/${f}`, { encoding: "utf8", stdio: "pipe" });
  } catch {
    continue; // a pack that did not exist yet
  }
  for (const l of linesOf(JSON.parse(json))) before.add(l);
}

const fresh = new Map();
for (const f of readdirSync(DIR)) {
  const pack = JSON.parse(readFileSync(`${DIR}/${f}`, "utf8"));
  for (const l of linesOf(pack)) if (!before.has(l)) fresh.set(l, f);
}
const chars = [...fresh.keys()].reduce((n, l) => n + l.length, 0);
const byPack = {};
for (const [l, f] of fresh) byPack[f] = (byPack[f] ?? 0) + l.length;

console.log(
  `câu mới cần mp3 (en-US-AnaNeural): ${fresh.size}, ${chars.toLocaleString("vi-VN")} ký tự`,
);
for (const [f, n] of Object.entries(byPack).sort((a, b) => b[1] - a[1]))
  console.log(`  ${f.padEnd(40)} ${n.toLocaleString("vi-VN")}`);
console.log(
  `hạn mức Azure F0: ${LIMIT.toLocaleString("vi-VN")} ký tự/tháng — pha này ≈ ${((chars / LIMIT) * 100).toFixed(1)}%; ` +
    (chars > BATCH
      ? `vượt ${BATCH.toLocaleString("vi-VN")}: chia đợt.`
      : `dưới ${BATCH.toLocaleString("vi-VN")}: một đợt.`),
);
