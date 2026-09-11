/**
 * `pnpm inbox:push [--dir inbox/2026-09-11] [--clean]` (docs/13 §2).
 * Loads validated results into the database, where a parent approves them (P6).
 */
import { prisma } from "@mtct/db";
import { pushResults } from "../push";
import { parseArgs } from "./args";

const args = parseArgs();

async function main() {
  const result = await pushResults(prisma, {
    root: args.values.get("dir"),
    clean: args.flags.has("clean"),
  });
  for (const f of result.failed) console.error(`ERR ${f.id}: ${f.error}`);
  for (const p of result.pushed) console.log(`OK  ${p.id} → ${p.ref}`);
  console.log(
    `inbox:push — ${result.pushed.length} đã nạp, ${result.planHints} gợi ý trọng tâm, ${result.failed.length} lỗi`,
  );
  if (result.pushed.length > 0)
    console.log("Mở /parent để duyệt kết quả trước khi thành bằng chứng của con.");
  if (result.failed.length > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
