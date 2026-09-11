/**
 * `pnpm art:check` — measures content/art/ against the budget in STYLE.md §7 and docs/06 §1.8.
 *
 * A world layer that grows to a megabyte, or a mascot that quietly gains a blur filter, shows up
 * on an iPad as a dropped frame in the middle of a question. Cheaper to catch it here.
 * Exits 1 on any breach so it can gate a commit or CI.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ART = join(process.cwd(), "content", "art");
const LIMITS = [
  { match: /^worlds\//, label: "lớp nền thế giới", max: 40 * 1024 },
  { match: /^mascots\//, label: "trạng thái mascot", max: 25 * 1024 },
  { match: /^objects\/.*\.svg$/, label: "vật thể", max: 6 * 1024 },
  { match: /^effects\//, label: "hiệu ứng", max: 20 * 1024 },
  { match: /^avatars\//, label: "avatar", max: 12 * 1024 },
  { match: /^pictures\//, label: "tranh tuần", max: 30 * 1024 },
  { match: /^audio\//, label: "âm thanh", max: 120 * 1024 },
];
const TOTAL_MAX = 40 * 1024 * 1024;

function walk(dir, base = "") {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walk(join(dir, e.name), rel));
    else out.push({ rel, bytes: statSync(join(dir, e.name)).size });
  }
  return out;
}

if (!existsSync(ART)) {
  console.error("content/art/ chưa có — chạy `pnpm art:build` trước.");
  process.exit(1);
}

const files = walk(ART).filter((f) => !f.rel.startsWith("_"));
const problems = [];
let total = 0;
const byKind = new Map();
for (const f of files) {
  total += f.bytes;
  const rule = LIMITS.find((l) => l.match.test(f.rel));
  const kind = rule?.label ?? "khác";
  const acc = byKind.get(kind) ?? { n: 0, bytes: 0, max: 0 };
  acc.n++;
  acc.bytes += f.bytes;
  acc.max = Math.max(acc.max, f.bytes);
  byKind.set(kind, acc);
  if (rule && f.bytes > rule.max)
    problems.push(
      `${f.rel}: ${(f.bytes / 1024).toFixed(1)} KB > ${(rule.max / 1024).toFixed(0)} KB (${rule.label})`,
    );
}

// Two rules from STYLE.md that are about behaviour, not size.
for (const f of files.filter((x) => x.rel.endsWith(".svg"))) {
  const text = readFileSync(join(ART, f.rel), "utf8");
  if (/filter\s*=|feGaussianBlur/.test(text))
    problems.push(`${f.rel}: dùng filter/blur — STYLE.md §2 quy định bóng đổ là elip mềm`);
  if (/stroke="#000|fill="#000000"/.test(text))
    problems.push(`${f.rel}: có nét/màu đen tuyền — dùng màu mực #2B2B3A`);
}

const pad = (s, n) => String(s).padEnd(n);
console.log(`${pad("loại", 22)}${pad("số file", 9)}${pad("tổng", 11)}lớn nhất`);
for (const [kind, a] of [...byKind.entries()].sort())
  console.log(
    `${pad(kind, 22)}${pad(a.n, 9)}${pad(`${(a.bytes / 1024).toFixed(0)} KB`, 11)}${(a.max / 1024).toFixed(1)} KB`,
  );
console.log(
  `\ntổng content/art/: ${(total / 1024 / 1024).toFixed(2)} MB / ${(TOTAL_MAX / 1024 / 1024).toFixed(0)} MB`,
);

if (total > TOTAL_MAX) problems.push(`tổng ${(total / 1024 / 1024).toFixed(1)} MB vượt 40 MB`);
if (problems.length) {
  console.error(`\n${problems.length} vấn đề:`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log("art:check — trong ngân sách");
