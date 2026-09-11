/**
 * `pnpm content:import-intake [--dir intake-inbox/thy/2026-09-20] [--dry-run]` (docs/10 §8).
 *
 * The bulk door for old paper: a folder of photographs and the reading Claude Code wrote beside
 * them becomes an `IntakeResult` waiting for a parent — the same queue, the same review screen,
 * the same rule that nothing becomes evidence until a grown-up says so.
 */
import { LocalFileStorage } from "@mtct/core/storage";
import { prisma } from "../index";
import { importIntakeBatches } from "../intake/import-batch";
import { fromRepoRoot, parseArgs } from "./args";

const args = parseArgs();

function root(): string {
  return process.env.INTAKE_INBOX_ROOT ?? "intake-inbox";
}

async function main(): Promise<void> {
  const result = await importIntakeBatches(prisma, {
    root: fromRepoRoot(root()),
    dir: args.values.get("dir") ? fromRepoRoot(args.values.get("dir") as string) : undefined,
    dryRun: args.flags.has("dry-run"),
    storage: new LocalFileStorage(fromRepoRoot(process.env.FILE_ROOT ?? "./data/files")),
  });

  if (result.batches.length === 0) {
    console.log(
      `Không thấy lô ảnh nào trong ${args.values.get("dir") ?? root()}.\n` +
        "Cấu trúc mong đợi: intake-inbox/<tên gọi ở nhà>/<ngày>/*.jpg + ket-qua.json",
    );
    return;
  }
  for (const batch of result.batches) {
    if (batch.skipped) {
      console.log(`bỏ qua  ${batch.dir} — ${batch.skipped}`);
      continue;
    }
    console.log(
      `${args.flags.has("dry-run") ? "sẽ nạp" : "đã nạp"}  ${batch.dir} → ${batch.nickname}: ` +
        `${batch.images} ảnh, ${batch.items} câu${batch.jobId ? ` (job ${batch.jobId})` : ""}`,
    );
  }
  console.log(
    `\ncontent:import-intake — ${result.imported} lô, ${result.skipped} lô chưa đọc.\n` +
      "Mở /parent/inbox để duyệt; chỉ khi ba mẹ duyệt thì mới thành bằng chứng của con.",
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
