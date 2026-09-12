/**
 * `pnpm db:usage` — chi phí và sức khoẻ hệ thống, đọc từ dòng lệnh (docs/08 pha 8 việc 3).
 *
 * Cùng số liệu với `/admin/health` và `GET /api/health`. Có bản dòng lệnh vì đúng lúc cần nhất —
 * web không vào được — thì trang web không giúp được gì.
 */

import { prisma } from "../index";
import { healthReport } from "../ops/health";
import { parseArgs } from "./args";

const mark = (ok: boolean) => (ok ? "OK  " : "!!  ");
const n = (value: number) => value.toLocaleString("vi-VN");

async function main() {
  const args = parseArgs();
  const h = await healthReport(prisma);

  if (args.flags.has("json")) {
    console.log(JSON.stringify(h, null, 2));
    return;
  }

  console.log(`Trạng thái chung: ${h.status.toUpperCase()}  (${h.time})\n`);
  console.log(
    `${mark(h.db.ok)}cơ sở dữ liệu   ${h.db.ok ? "nối được" : "KHÔNG NỐI ĐƯỢC"} · ${h.db.migrations} migration · ${h.db.sizeMb ?? "?"} MB`,
  );
  console.log(
    `${mark(h.worker.ok)}worker          ${
      h.worker.ageSeconds === null ? "chưa ping lần nào" : `ping cuối cách ${h.worker.ageSeconds}s`
    }`,
  );
  console.log(
    `${mark(h.jobs.ok)}việc nền        ${h.jobs.failed24h} hỏng trong 24h · ${h.jobs.stuckActive} treo` +
      (h.jobs.byQueue.length
        ? `\n                  ${h.jobs.byQueue.map((q) => `${q.queue}: ${q.failed}`).join(" · ")}`
        : ""),
  );
  console.log(
    `${mark(h.disk.ok)}ổ đĩa           còn ${h.disk.freeGb ?? "?"} GB / ${h.disk.totalGb ?? "?"} GB (cảnh báo dưới ${h.disk.warnBelowGb} GB)`,
  );
  console.log(
    `${mark(h.backup.ok)}sao lưu         ${
      h.backup.latest
        ? `${h.backup.latest} — ${h.backup.ageHours} giờ trước, ${h.backup.sizeMb} MB, giữ ${h.backup.count} bản`
        : `CHƯA CÓ BẢN NÀO (${h.backup.dir ?? "chưa đặt BACKUP_DIR"})`
    }`,
  );
  console.log(
    `${mark(h.tts.ok)}giọng đọc       tháng ${h.tts.month}: ${n(h.tts.chars)} / ${n(h.tts.limit)} ký tự ` +
      `(${Math.round(h.tts.fraction * 100)}% hạn mức miễn phí F0) · ${n(h.tts.calls)} lần gọi`,
  );
  console.log(
    `    hàng chờ        ${h.queueWaiting.toRead} việc chờ Claude Code · ${h.queueWaiting.toReview} lô ảnh chờ ba mẹ duyệt`,
  );

  if (h.tts.months.length > 1) {
    console.log("\nGiọng đọc theo tháng:");
    for (const m of h.tts.months)
      console.log(
        `  ${m.month}  ${n(m.chars).padStart(9)} ký tự  ${n(m.calls).padStart(5)} lần  ${Math.round((m.chars / h.tts.limit) * 100)}%`,
      );
  }

  console.log(
    "\nApp không gọi API LLM nào (ADR-9, ADR-10) — Azure Speech là dịch vụ trả phí duy nhất, và bậc F0 miễn phí.",
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
