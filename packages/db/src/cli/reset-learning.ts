/**
 * `pnpm db:reset-learning [--apply] [--student thy,thanh]` — docs/08 pha 8 việc 0.3.
 *
 * Clears the children's learning data so the real fortnight starts from nothing: the dev rows are
 * a day out (the timezone bug ADR-18 records) and, worse, they were produced by the end-to-end
 * suites rather than by a child. `src/maintenance/reset-learning.ts` explains the choice.
 *
 * Prints and stops unless `--apply` is spelled out. Content — the skill map, the 1,236 exercises,
 * the lesson units, the timetable — is never touched, and the counts are printed before and after
 * to prove it.
 */

import { prisma } from "../index";
import { resetLearningData } from "../maintenance/reset-learning";
import { parseArgs } from "./args";

async function main() {
  const args = parseArgs();
  const apply = args.flags.has("apply");
  const slugs = args.values
    .get("student")
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const result = await resetLearningData(prisma, { apply, studentSlugs: slugs });

  console.log(
    slugs?.length
      ? `Dữ liệu học của: ${slugs.join(", ")}`
      : "Dữ liệu học của TẤT CẢ các bé trong cơ sở dữ liệu này",
  );
  console.log("\nbảng dữ liệu học:");
  for (const row of result.before) {
    const after = result.after.find((a) => a.table === row.table)?.rows ?? 0;
    if (row.rows === 0 && after === 0) continue;
    console.log(`  ${row.table.padEnd(24)} ${String(row.rows).padStart(6)} → ${after}`);
  }

  console.log("\nnội dung (không bao giờ đụng tới):");
  for (const row of result.protectedBefore) {
    const after = result.protectedAfter.find((a) => a.table === row.table)?.rows ?? 0;
    const same = row.rows === after;
    console.log(
      `  ${row.table.padEnd(24)} ${String(row.rows).padStart(6)} → ${after} ${same ? "✓" : "!!! ĐÃ ĐỔI"}`,
    );
    if (!same) process.exitCode = 1;
  }

  if (!apply) {
    const total = result.before.reduce((n, t) => n + t.rows, 0);
    console.log(`\nchưa xoá gì (chế độ thử). ${total} dòng sẽ bị xoá. Thêm --apply để xoá thật.`);
    return;
  }
  console.log(`\nđã xoá ${result.deleted} dòng dữ liệu học.`);
  console.log(
    "Chạy pnpm db:seed để dựng lại badge/thú/tranh nếu cần, rồi bắt đầu phiên chẩn đoán.",
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
