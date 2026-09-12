/**
 * `pnpm db:clean-test-parents [--apply]` — docs/08 pha 8 việc 0.2.
 *
 * Same shape as `clean-test-students`: prints what it would do and stops. Deleting needs `--apply`
 * spelled out, and an account still linked to Mai Thy or Chí Thanh is kept and reported even if
 * its username looks like a test account.
 */

import { prisma } from "../index";
import { cleanTestParents, type ParentVerdict } from "../maintenance/test-parents";
import { parseArgs } from "./args";

const LABEL: Record<ParentVerdict, string> = {
  DELETE: "xoá",
  KEEP_LINKED_REAL: "GIỮ — còn nối tới hồ sơ thật của con",
  KEEP_HAS_CHILDREN: "giữ — còn nối tới hồ sơ khác",
  KEEP_UNRECOGNISED: "giữ — không nhận ra",
};

async function main() {
  const args = parseArgs();
  const apply = args.flags.has("apply");

  const result = await cleanTestParents(prisma, { apply });
  const order: ParentVerdict[] = [
    "KEEP_LINKED_REAL",
    "KEEP_HAS_CHILDREN",
    "KEEP_UNRECOGNISED",
    "DELETE",
  ];

  for (const verdict of order) {
    const rows = result.audits.filter((a) => a.verdict === verdict);
    if (rows.length === 0) continue;
    console.log(`\n${LABEL[verdict]} (${rows.length}):`);
    for (const row of rows)
      console.log(
        `  ${row.username.padEnd(14)} ${(row.isActive ? "bật" : "tắt").padEnd(4)} ${row.why}`,
      );
  }

  const toDelete = result.audits.filter((a) => a.verdict === "DELETE").length;
  console.log(
    `\ntổng ${result.audits.length} tài khoản phụ huynh: ${toDelete} xoá được, ${result.audits.length - toDelete} giữ lại.`,
  );

  if (!apply) {
    console.log("\nchưa xoá gì (chế độ thử). Thêm --apply để xoá thật.");
    return;
  }
  console.log(`\nđã xoá ${result.deleted} tài khoản.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
