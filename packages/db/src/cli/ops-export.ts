/**
 * `pnpm ops:export` — chụp lại trạng thái vận hành ra `ops/state/<ngày>/` (docs/14 §3).
 *
 * Chạy tay bất cứ lúc nào; máy tự chạy 04:30 mỗi đêm sau `planner.daily`. In ra đúng những gì đã
 * ghi, vì người chạy lệnh này thường đang muốn biết **có số liệu để đọc chưa**.
 */

import { prisma } from "../index";
import { exportOpsState, MAX_DAY_BYTES, recordOpsExport } from "../ops/export";
import { fromRepoRoot, parseArgs } from "./args";

const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

async function main() {
  const args = parseArgs();
  const root = args.values.get("root")
    ? fromRepoRoot(args.values.get("root") as string)
    : undefined;
  const now = new Date();

  const result = await exportOpsState(prisma, {
    root,
    now,
    skipLatest: args.flags.has("no-latest"),
  });
  await recordOpsExport(prisma, result, now);

  if (args.flags.has("json")) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`Đã ghi ${result.files.length} file vào ${result.dir}\n`);
  for (const file of result.files)
    console.log(
      `  ${file.name.padEnd(24)} ${String(file.rows).padStart(7)} dòng  ${kb(file.bytes)}`,
    );
  console.log(
    `\nTổng ${kb(result.totalBytes)} (mức trần ${Math.round(MAX_DAY_BYTES / 1024 / 1024)} MB/ngày).`,
  );
  if (result.pruned.length > 0)
    console.log(`Đã xoá ${result.pruned.length} ngày cũ hơn 90 ngày: ${result.pruned.join(", ")}`);
  for (const warning of result.warnings) console.log(`!!  ${warning}`);
  console.log("\nĐọc trước: ops/state/SUMMARY.md · ops/context/HIEN-TRANG.md");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
