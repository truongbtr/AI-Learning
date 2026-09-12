/**
 * `pnpm ops:apply` — đọc `ops/requests/*.json`, **in ra diff**, chờ người đồng ý, rồi mới áp
 * (docs/14 §4).
 *
 * Câu hỏi ở cuối là điểm quan trọng nhất của lệnh này: mọi thay đổi vào dữ liệu học đều có một
 * người nhìn thấy trước khi nó xảy ra. `--yes` bỏ qua câu hỏi, `--dry-run` chỉ in rồi dừng.
 */

import { createInterface } from "node:readline/promises";
import { prisma } from "../index";
import { applyOpsPlan, formatPlan, planOpsRequests } from "../ops/apply";
import { fromRepoRoot, parseArgs } from "./args";

async function confirm(question: string): Promise<boolean> {
  if (!process.stdin.isTTY) {
    console.log(`\n${question} — không có bàn phím (không phải TTY): dừng lại, chưa áp gì.`);
    console.log("Chạy lại kèm --yes nếu đã xem diff và đồng ý.");
    return false;
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question(`\n${question} [y/N] `)).trim().toLowerCase();
    return answer === "y" || answer === "yes" || answer === "c" || answer === "co";
  } finally {
    rl.close();
  }
}

async function main() {
  const args = parseArgs();
  const root = args.values.get("root")
    ? fromRepoRoot(args.values.get("root") as string)
    : undefined;
  const only = args.values.get("only");

  const plan = await planOpsRequests(prisma, { root, only });
  if (plan.files.length === 0) {
    console.log(`Không có yêu cầu nào trong ${plan.root}/requests/.`);
    console.log("Cách đặt một yêu cầu: docs/14 §4 (một file JSON, có reason và danh sách ops).");
    return;
  }

  console.log(formatPlan(plan));

  const applyCount = plan.files.filter(
    (f) => f.issues.length === 0 && f.changes.length > 0 && !f.changes.some((c) => c.blocked),
  ).length;
  const rejectCount = plan.files.length - applyCount;
  console.log(
    `${plan.files.length} yêu cầu: ${applyCount} áp được, ${rejectCount} sẽ sang ops/rejected/.`,
  );

  if (args.flags.has("dry-run")) {
    console.log("\n--dry-run: chưa đụng gì vào cơ sở dữ liệu.");
    return;
  }
  if (applyCount === 0) {
    console.log("\nKhông có gì để áp. Chuyển các yêu cầu bị từ chối sang ops/rejected/…");
  } else if (!args.flags.has("yes") && !(await confirm("Áp những thay đổi trên?"))) {
    console.log("Dừng lại, chưa đụng gì vào cơ sở dữ liệu.");
    return;
  }

  const result = await applyOpsPlan(prisma, plan);
  console.log("");
  for (const file of result.results)
    console.log(
      `  ${file.outcome === "applied" ? "đã áp " : "từ chối"} ${file.file} → ${file.movedTo}`,
    );
  console.log(
    `\n${result.applied} yêu cầu đã áp, ${result.rejected} bị từ chối. Một dòng đã ghi vào ops/CHANGELOG.md.`,
  );
  if (result.applied > 0)
    console.log("Đường lùi của từng thao tác nằm trong file kết quả ở ops/applied/.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
