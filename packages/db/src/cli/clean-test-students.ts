/**
 * `pnpm db:clean-test-students [--dry-run] [--apply] [--with-orphan-parents]` — docs/08 pha 5
 * việc 0.2.
 *
 * Prints what it would do and stops. Deleting needs `--apply`, spelled out, because the rows it
 * touches are children's profiles: see `src/maintenance/test-students.ts` for the rule, which
 * keeps anything carrying a single piece of evidence.
 */

import { prisma } from "../index";
import { cleanTestStudents, type StudentAudit } from "../maintenance/test-students";
import { parseArgs } from "./args";

const LABEL: Record<StudentAudit["verdict"], string> = {
  DELETE: "xoá",
  KEEP_HAS_DATA: "GIỮ — có dữ liệu",
  KEEP_PROTECTED: "GIỮ — hồ sơ thật",
  KEEP_UNRECOGNISED: "giữ — không nhận ra",
};

async function main() {
  const args = parseArgs();
  const apply = args.flags.has("apply");
  const withOrphanParents = args.flags.has("with-orphan-parents");

  const result = await cleanTestStudents(prisma, { apply, withOrphanParents });
  const order: StudentAudit["verdict"][] = [
    "KEEP_PROTECTED",
    "KEEP_HAS_DATA",
    "KEEP_UNRECOGNISED",
    "DELETE",
  ];

  for (const verdict of order) {
    const rows = result.audits.filter((a) => a.verdict === verdict);
    if (rows.length === 0) continue;
    console.log(`\n${LABEL[verdict]} (${rows.length}):`);
    for (const row of rows)
      console.log(`  ${row.slug.padEnd(14)} ${row.nickname.padEnd(8)} ${row.why}`);
  }

  const toDelete = result.audits.filter((a) => a.verdict === "DELETE").length;
  const kept = result.audits.length - toDelete;
  console.log(
    `\ntổng ${result.audits.length} hồ sơ: ${toDelete} xoá được, ${kept} giữ lại (trong đó ${result.audits.filter((a) => a.verdict === "KEEP_HAS_DATA").length} vì có dữ liệu thật).`,
  );
  if (result.orphanParents.length > 0)
    console.log(
      `${result.orphanParents.length} tài khoản phụ huynh e2e sẽ không còn con nào: ${result.orphanParents.map((p) => p.username).join(", ")}${withOrphanParents ? "" : " — thêm --with-orphan-parents để xoá luôn"}`,
    );

  if (!apply) {
    console.log("\nchưa xoá gì (chế độ thử). Thêm --apply để xoá thật.");
    return;
  }
  console.log(
    `\nđã xoá ${result.deletedStudents} hồ sơ bé${result.deletedParents > 0 ? ` và ${result.deletedParents} tài khoản phụ huynh e2e` : ""}.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
