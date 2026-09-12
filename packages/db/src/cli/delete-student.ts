/**
 * `pnpm db:delete-student -- --student <slug> [--apply] [--keep-login]` — FR-ADM-03, docs/08 pha 8.
 *
 * Erases one child: every piece of learning data, then the profile and the login.
 *
 * Two-step confirmation, as `docs/02` §6 requires, and the two steps are not "are you sure?" twice.
 * The first step is an **export**: the CLI writes the JSON of everything it is about to destroy
 * before it destroys anything, and prints where. The second is `--apply` plus typing the child's
 * nickname back. Nobody deletes a child's two years of work by pressing up-arrow and enter.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { prisma } from "../index";
import { exportStudent, StudentNotFound } from "../maintenance/export-student";
import { deleteForStudents } from "../maintenance/reset-learning";
import { fromRepoRoot, parseArgs } from "./args";

async function main() {
  const args = parseArgs();
  const slug = args.values.get("student") ?? args.rest[0];
  const apply = args.flags.has("apply");
  const keepLogin = args.flags.has("keep-login");
  if (!slug) {
    console.error("Thiếu --student. Ví dụ: pnpm db:delete-student -- --student thy");
    process.exitCode = 1;
    return;
  }

  const student = await prisma.student.findUnique({
    where: { slug },
    select: { id: true, nickname: true, fullName: true, userId: true },
  });
  if (!student) throw new StudentNotFound(`Không có bé nào slug = ${slug}`);

  // Step one: the copy. Always, even in dry-run — it is the thing that makes this reversible.
  const data = await exportStudent(prisma, slug);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const backup = fromRepoRoot(join("_xuat-du-lieu", `TRUOC-KHI-XOA-${slug}-${stamp}.json`));
  mkdirSync(join(backup, ".."), { recursive: true });
  writeFileSync(backup, `${JSON.stringify(data, null, 2)}\n`, "utf8");

  console.log(`Sắp xoá TOÀN BỘ dữ liệu của "${student.nickname}" (${slug}):`);
  for (const [key, value] of Object.entries(data.counts))
    console.log(`  ${key.padEnd(12)} ${value}`);
  console.log(`\nĐã lưu một bản sao trước khi xoá:\n  ${backup}`);
  console.log(
    keepLogin
      ? "\nGiữ lại hồ sơ và tài khoản đăng nhập — chỉ xoá dữ liệu học."
      : "\nXoá cả hồ sơ Student và tài khoản đăng nhập của bé.",
  );

  if (!apply) {
    console.log("\nchưa xoá gì (chế độ thử). Thêm --apply để xoá thật.");
    return;
  }

  // Step two: type the nickname. A flag is something you can repeat by accident; a name is not.
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const typed = await rl.question(`\nGõ đúng tên gọi ở nhà để xác nhận ("${student.nickname}"): `);
  rl.close();
  if (typed.trim() !== student.nickname) {
    console.log("Không khớp — không xoá gì cả.");
    process.exitCode = 1;
    return;
  }

  await deleteForStudents(prisma, [student.id]);
  if (!keepLogin) {
    // Deleting the user cascades the Student row, the guardian links and the trusted devices.
    await prisma.user.delete({ where: { id: student.userId } });
  }
  console.log(`\nĐã xoá. Ảnh bài vở trong FILE_ROOT KHÔNG tự mất — xoá tay nếu muốn:`);
  for (const job of data.intake) {
    const files = (job as { files?: unknown }).files;
    if (Array.isArray(files) && files.length) console.log(`  ${JSON.stringify(files)}`);
  }
}

main()
  .catch((err) => {
    console.error(err instanceof StudentNotFound ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
