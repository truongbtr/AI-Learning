/**
 * `pnpm db:school-year [--start 2026-08-24] [--apply]` — docs/08 pha 5 việc 0.1.
 *
 * The seed built 35 weeks from a guess. The class diary knows better: on 10/09/2026 the class was
 * on Tiếng Việt lesson 13, and Tiếng Việt 1 teaches one lesson a teaching day, so counting back
 * thirteen teaching days (no weekends, no 02/09) lands on Monday 24/08/2026 — the date the owner
 * confirmed on 12/09/2026.
 *
 * Every `Skill.expectedWeek` is read against these weeks, so moving them re-labels how far along
 * both children are. That is why `--apply` is a separate flag: without it this only prints.
 */
import { parseIsoDate } from "@mtct/core";
import { applySchoolYearStart, proposeSchoolYearStart } from "../diary/school-year";
import { prisma } from "../index";
import { parseArgs } from "./args";

/** The date the owner confirmed (docs/TIEN-DO pha 4 §4, docs/08 pha 5 việc 0). */
export const CONFIRMED_SCHOOL_YEAR_START = "2026-08-24";

async function main() {
  const args = parseArgs();
  const start = parseIsoDate(args.values.get("start") ?? CONFIRMED_SCHOOL_YEAR_START);
  const apply = args.flags.has("apply");

  const proposal = await proposeSchoolYearStart(prisma);
  console.log(
    `đang dùng:  tuần 1 từ ${proposal.current.weekOneFrom ?? "chưa có"} (${proposal.current.weeks} tuần)`,
  );
  console.log(`sẽ đặt:     tuần 1 từ ${start.toISOString().slice(0, 10)} (35 tuần)`);
  if (proposal.guess)
    console.log(
      `nhật ký lớp suy ra: ${proposal.guess.weekOneMonday} — từ ngày ${proposal.guess.from.date} bài ${proposal.guess.from.lessonNumber}, đếm ngược ${proposal.guess.teachingDays} buổi`,
    );

  if (!apply) {
    console.log("\nchưa đổi gì. Thêm --apply để ghi vào DB (hoặc bấm nút trên /parent/school).");
    return;
  }

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
  if (!admin) throw new Error("no ADMIN user to record the confirmation against");
  const result = await applySchoolYearStart(prisma, start, admin.id);
  console.log(`\nđã đặt ${result.weeks} tuần cho ${result.schoolYear}, tuần 1 từ ${result.from}.`);

  const weeks = await prisma.schoolWeek.findMany({ orderBy: { weekNo: "asc" }, take: 3 });
  for (const w of weeks)
    console.log(
      `  tuần ${w.weekNo}: ${w.dateFrom.toISOString().slice(0, 10)} → ${w.dateTo.toISOString().slice(0, 10)} (học kỳ ${w.term})`,
    );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
