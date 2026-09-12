/**
 * `pnpm db:trial [--days 14] [--to 2026-09-26] [--json]` — docs/08 pha 8, tiêu chí 1.
 *
 * Con số thật của hai tuần chạy thật: mỗi bé học mấy ngày, mấy phút, bỏ dở mấy phiên, và ngày nào
 * **tự làm được 10 phút không cần ba mẹ**.
 *
 * Đọc kỹ dòng cuối: máy chỉ thấy được hai dấu vết của việc ba mẹ giúp (ba mẹ sửa nhãn, ba mẹ chấm
 * bài nói/viết). Việc ba mẹ ngồi cạnh đọc hộ đề thì máy **không** thấy — chỗ đó là việc của
 * `docs/nhat-ky-chay-that.md`.
 */

import { prisma } from "../index";
import { trialReport } from "../ops/trial";
import { parseArgs } from "./args";

const WEEKDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

async function main() {
  const args = parseArgs();
  const days = Number(args.values.get("days") ?? 14);
  const toArg = args.values.get("to");
  const report = await trialReport(prisma, {
    days,
    to: toArg ? new Date(`${toArg}T23:59:00+07:00`) : undefined,
    slugs: args.values.get("student")?.split(","),
  });

  if (args.flags.has("json")) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(
    `HAI TUẦN CHẠY THẬT — ${report.from} → ${report.to} (${days} ngày)\n` +
      `Tiêu chí: mỗi bé tự học ≥ ${report.minMinutes} phút/ngày, không cần trợ giúp, ≥ ${report.requiredDays}/${days} ngày.\n`,
  );

  for (const child of report.children) {
    console.log(`── ${child.nickname} (${child.slug}) ───────────────────────────────`);
    console.log("   ngày        thứ  phiên  bỏ dở  phút  câu  sao  ba mẹ giúp  đạt");
    for (const d of child.days) {
      const weekday = WEEKDAY[new Date(`${d.day}T00:00:00Z`).getUTCDay()] as string;
      console.log(
        `   ${d.day}  ${weekday}  ` +
          `${String(d.sessions).padStart(5)}  ${String(d.abandoned).padStart(5)}  ` +
          `${String(d.minutes).padStart(4)}  ${String(d.attempts).padStart(3)}  ${String(d.stars).padStart(3)}  ` +
          `${(d.parentHelped ? "có" : "—").padStart(10)}  ${d.qualifies ? "✓" : "·"}`,
      );
    }
    console.log(
      `   TỔNG: học ${child.daysLearnt}/${days} ngày · ${child.totalMinutes} phút · ` +
        `${child.totalAttempts} câu · bỏ dở ${child.abandoned} phiên · ba mẹ giúp ${child.daysWithHelp} ngày`,
    );
    console.log(
      `   ĐẠT TIÊU CHÍ: ${child.daysQualifying}/${days} ngày ` +
        `→ ${child.meetsCriterion ? "ĐẠT" : `CHƯA ĐẠT (cần ${report.requiredDays})`}\n`,
    );
  }

  console.log(
    report.children.length === 0
      ? "Không có hồ sơ bé nào đang bật."
      : `KẾT LUẬN: ${report.meetsCriterion ? "ĐẠT — cả hai bé" : "CHƯA ĐẠT"}`,
  );
  console.log(
    "\nLưu ý cách đo: “phút” đếm từ khoảng cách giữa các câu trả lời (tối đa 3 phút mỗi câu), không\n" +
      "phải đồng hồ treo tường — iPad để quên trên bàn không thành giờ học. Cột “ba mẹ giúp” chỉ thấy\n" +
      "được hai việc: ba mẹ sửa nhãn, và ba mẹ chấm bài nói/viết. Ba mẹ ngồi cạnh đọc hộ đề thì máy\n" +
      "không biết — ghi vào docs/nhat-ky-chay-that.md, và đối chiếu hai bên khi chốt.",
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
