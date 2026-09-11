/**
 * `pnpm inbox:validate [--dir inbox/2026-09-11]` (docs/13 §2).
 * Checks every result.json against the schema its context.json asked for. Exit 1 on any error.
 */
import { inboxRoot, validateInbox } from "../service";
import { parseArgs } from "./args";

const args = parseArgs();
const { ok, issues } = validateInbox(args.values.get("dir") ?? inboxRoot());

for (const issue of issues)
  console[issue.level === "error" ? "error" : "warn"](
    `${issue.level === "error" ? "ERR " : "WARN"} ${issue.id}: ${issue.message}`,
  );
const errors = issues.filter((i) => i.level === "error").length;
console.log(
  `inbox:validate — ${ok.length} sẵn sàng đẩy, ${issues.filter((i) => i.level === "warn").length} chưa có result.json, ${errors} lỗi`,
);
process.exit(errors ? 1 : 0);
