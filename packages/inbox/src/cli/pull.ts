/**
 * `pnpm inbox:pull [--limit 20] [--kind PHOTO_INTAKE]` (docs/13 §2).
 * Writes every PENDING item to inbox/<date>/<id>/context.json and marks it PULLED.
 */
import { prisma } from "@mtct/db";
import type { InboxKind } from "../schemas";
import { pullPending } from "../service";
import { parseArgs } from "./args";

const args = parseArgs();

async function main() {
  const result = await pullPending(prisma, {
    limit: args.values.get("limit") ? Number(args.values.get("limit")) : undefined,
    kind: args.values.get("kind") as InboxKind | undefined,
    includePulled: args.flags.has("again"),
  });
  if (result.items.length === 0) {
    console.log("Hàng chờ trống — không có việc nào cần Claude Code.");
    return;
  }
  console.log(`${result.items.length} việc đã xuất ra ${result.dir}`);
  for (const item of result.items) console.log(`  ${item.kind.padEnd(18)} ${item.path}`);
  console.log("\nĐọc context.json, viết result.json, rồi: pnpm inbox:validate && pnpm inbox:push");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
