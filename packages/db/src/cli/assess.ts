/**
 * `pnpm db:assess [--student thy] [--round 1|2|3] [--force] [--status]` — docs/04 §10, pha 8 việc 4.
 *
 * Dựng phiên chẩn đoán đầu vào cho một bé (hoặc cả hai nếu không truyền `--student`).
 *
 * Thường **không cần chạy tay**: bé mới chưa có bằng chứng nào thì `planDailyQuest` tự trả về phiên
 * chẩn đoán trong ba tối đầu, nên con chỉ bấm "Học ngay" như mọi hôm. Lệnh này để bàn giao: xem
 * trước ba tối đầu có ra bài không, và ra bài của mạch nào.
 */

import { prisma } from "../index";
import { assessmentState, planAssessment } from "../session/assess";
import { parseArgs } from "./args";

async function main() {
  const args = parseArgs();
  const only = args.values.get("student");
  const roundArg = args.values.get("round");
  const round = roundArg ? Number(roundArg) - 1 : undefined;
  const force = args.flags.has("force");
  const statusOnly = args.flags.has("status");
  const date = args.values.get("date")
    ? new Date(`${args.values.get("date")}T08:00:00+07:00`)
    : new Date();

  const students = await prisma.student.findMany({
    where: { isActive: true, ...(only ? { slug: only } : {}) },
    select: { id: true, slug: true, nickname: true, mascot: true },
    orderBy: { slug: "asc" },
  });
  if (students.length === 0) {
    console.error(only ? `Không có bé nào slug = ${only}` : "Không có hồ sơ bé nào đang bật");
    process.exitCode = 1;
    return;
  }

  for (const student of students) {
    const state = await assessmentState(prisma, student.id);
    console.log(`\n── ${student.nickname} (${student.slug}) ─────────────────────────`);
    console.log(`   ${state.why}`);
    if (statusOnly) continue;
    if (state.nextRound === null && round === undefined && !force) {
      console.log("   → không cần dựng thêm phiên chẩn đoán nào.");
      continue;
    }

    try {
      const built = await planAssessment(prisma, student.id, date, { round, force });
      console.log(`   phiên ${built.created ? "vừa dựng" : "đã có sẵn"}: ${built.sessionId}`);
      for (const line of built.log) console.log(`   · ${line}`);
      console.log("   các trạm:");
      for (const slot of built.slots)
        console.log(
          `     ${String(slot.order).padStart(2)}. ${slot.skillCode.padEnd(26)} độ khó ${slot.difficulty}` +
            (slot.exerciseId ? "" : `  ← CHƯA CÓ BÀI (${slot.missing ?? "?"})`),
        );
      const empty = built.slots.filter((s) => !s.exerciseId).length;
      if (empty > 0)
        console.log(
          `   ${empty} trạm chưa có bài — ghi vào danh sách pha 6, con vẫn làm được các trạm còn lại.`,
        );
    } catch (err) {
      console.error(`   LỖI: ${err instanceof Error ? err.message : err}`);
      process.exitCode = 1;
    }
  }

  console.log(
    "\nBa tối đầu con chỉ cần bấm “Học ngay” như mọi hôm — phiên chẩn đoán chính là nhiệm vụ hôm đó.",
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
