/**
 * `pnpm db:export-student -- --student thy [--out <file.json>]` — FR-ADM-03, docs/08 pha 8 việc 2.
 *
 * Everything the system knows about one child, as one JSON file written for a person to read:
 * skill codes and names rather than internal ids, dates as YYYY-MM-DD, the question next to the
 * answer. The photographs themselves stay in the file backup; the JSON records where they are.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../index";
import { exportStudent, StudentNotFound } from "../maintenance/export-student";
import { fromRepoRoot, parseArgs } from "./args";

async function main() {
  const args = parseArgs();
  const slug = args.values.get("student") ?? args.rest[0];
  if (!slug) {
    console.error("Thiếu --student. Ví dụ: pnpm db:export-student -- --student thy");
    process.exitCode = 1;
    return;
  }

  const data = await exportStudent(prisma, slug);
  const stamp = new Date().toISOString().slice(0, 10);
  const out = fromRepoRoot(
    args.values.get("out") ?? join("_xuat-du-lieu", `${slug}-${stamp}.json`),
  );

  const { mkdirSync } = await import("node:fs");
  mkdirSync(join(out, ".."), { recursive: true });
  writeFileSync(out, `${JSON.stringify(data, null, 2)}\n`, "utf8");

  console.log(`Đã xuất dữ liệu của "${data.student.nickname}" (${slug}):`);
  for (const [key, value] of Object.entries(data.counts))
    console.log(`  ${key.padEnd(12)} ${value}`);
  console.log(`\n→ ${out}`);
  console.log(
    "Ảnh bài vở KHÔNG nằm trong file này — chúng ở FILE_ROOT (và trong bản sao lưu /out/files).",
  );
}

main()
  .catch((err) => {
    console.error(err instanceof StudentNotFound ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
