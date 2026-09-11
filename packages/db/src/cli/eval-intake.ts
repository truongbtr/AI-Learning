/**
 * `pnpm eval:intake [--file docs/eval/intake-v1/cases.json] [--json]` — docs/04 §9, docs/08 pha 4
 * việc 6.
 *
 * Three numbers, each measuring something that can actually go wrong on a real evening:
 *
 *  1. **gắn kỹ năng** — given the text of a question, does the full-text search (which is what
 *     fills `skillCandidates` in `context.json`) offer the right skill? Top-1 and top-5, and then
 *     the number that actually matters: is the right skill anywhere in what the reader is handed —
 *     the candidates *plus* the skills the class is on this week. A reader picks from that list, so
 *     a skill that is in it can be chosen; one that is missing cannot be.
 *  2. **`BLANK` ≠ sai** — of the blank answers, how many does the rule of docs/07 §2.2 read as
 *     "ran out of time" rather than as a mistake? One wrong call here tells a parent their child
 *     failed a page they simply did not reach.
 *  3. **đúng/sai** — of the questions where the labelled set also carries a reading (`read`), how
 *     many outcomes match. Cases with no reading are counted as "chưa đo", never as a pass.
 *
 * The targets of docs/04 §9: ≥ 85% outcome, ≥ 80% skill top-1.
 */
import { readFileSync } from "node:fs";
import { prisma } from "../index";
import { inferBlankReasons } from "../intake/review";
import { searchSkills } from "../skills/search";
import { fromRepoRoot, parseArgs } from "./args";

const args = parseArgs();
const file = fromRepoRoot(args.values.get("file") ?? "docs/eval/intake-v1/cases.json");

type Outcome = "CORRECT" | "PARTIAL" | "INCORRECT" | "BLANK" | "UNGRADED";

interface Case {
  id: string;
  source?: string;
  docType?: string;
  subject?: "ESL" | "ENL" | "EMATH" | "ESCI" | "VIET" | "VMATH";
  questionText: string;
  truth: {
    outcome: Outcome;
    blankReason?: "NOT_FINISHED" | "DOES_NOT_KNOW";
    skillCodes: string[];
    external?: { platform: string; metric: string; value: string };
  };
  /** What a reader produced for this case, when the labelled set has a photo to read. */
  read?: {
    outcome?: Outcome;
    blankReason?: "NOT_FINISHED" | "DOES_NOT_KNOW";
    skillCodes?: string[];
  };
}

async function main(): Promise<void> {
  const data = JSON.parse(readFileSync(file, "utf8")) as { version: string; cases: Case[] };
  const rows: {
    id: string;
    top1: boolean;
    top5: boolean;
    covered: boolean;
    suggested: string;
    outcome: "khớp" | "lệch" | "chưa đo";
    blank: "khớp" | "lệch" | "—";
  }[] = [];

  // Exactly what `inbox:pull` puts in context.json beside the candidates (docs/13 §2).
  const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const currentSkills = new Set(
    (
      await prisma.diaryLesson.findMany({
        where: { diary: { date: { gte: since } } },
        select: { skillCodes: true },
      })
    ).flatMap((l) => l.skillCodes),
  );

  for (const testCase of data.cases) {
    const hits = await searchSkills(prisma, testCase.questionText, {
      subject: testCase.subject ?? null,
      limit: 5,
    });
    const wider = await searchSkills(prisma, testCase.questionText, {
      subject: testCase.subject ?? null,
      limit: 8,
    });
    const codes = hits.map((h) => h.code);
    const wanted = new Set(testCase.truth.skillCodes);
    const offered = new Set([...wider.map((h) => h.code), ...currentSkills]);
    rows.push({
      id: testCase.id,
      top1: Boolean(codes[0] && wanted.has(codes[0])),
      top5: codes.some((c) => wanted.has(c)),
      covered: [...wanted].some((c) => offered.has(c)),
      suggested: codes.slice(0, 3).join(", ") || "(không có)",
      outcome: testCase.read?.outcome
        ? testCase.read.outcome === testCase.truth.outcome
          ? "khớp"
          : "lệch"
        : "chưa đo",
      blank:
        testCase.truth.outcome !== "BLANK"
          ? "—"
          : (testCase.read?.blankReason ?? null) === null
            ? "—"
            : testCase.read?.blankReason === testCase.truth.blankReason
              ? "khớp"
              : "lệch",
    });
  }

  // The pure rule on its own, on the page docs/11 §9 describes: two answered, four blank to the end.
  const worksheet: Outcome[] = ["CORRECT", "CORRECT", "BLANK", "BLANK", "BLANK", "BLANK"];
  const reasons = inferBlankReasons(worksheet as never);
  const trailingRight = reasons.slice(2).every((r) => r === "NOT_FINISHED");

  const measured = rows.filter((r) => r.outcome !== "chưa đo");
  const summary = {
    version: data.version,
    cases: rows.length,
    skillTop1: pct(rows.filter((r) => r.top1).length, rows.length),
    skillTop5: pct(rows.filter((r) => r.top5).length, rows.length),
    skillOffered: pct(rows.filter((r) => r.covered).length, rows.length),
    outcomeMeasured: measured.length,
    outcomeMatch: measured.length
      ? pct(measured.filter((r) => r.outcome === "khớp").length, measured.length)
      : null,
    blankRuleOnWorksheet: trailingRight ? "đúng" : "SAI",
  };

  if (args.flags.has("json")) {
    console.log(JSON.stringify({ summary, rows }, null, 2));
    return;
  }

  console.log(`eval intake — ${data.version}, ${rows.length} ca\n`);
  console.log(
    "ca".padEnd(26),
    "top1",
    "top5",
    "có trong ngữ cảnh",
    "đúng/sai",
    "blank",
    "kỹ năng gợi ý",
  );
  for (const row of rows) {
    console.log(
      row.id.padEnd(26),
      row.top1 ? " ✓  " : " ·  ",
      row.top5 ? " ✓  " : " ·  ",
      row.covered ? "        ✓         " : "        ·         ",
      row.outcome.padEnd(8),
      row.blank.padEnd(5),
      row.suggested,
    );
  }
  console.log(
    `\ngắn kỹ năng: top-1 ${summary.skillTop1}%, top-5 ${summary.skillTop5}%, ` +
      `có trong ngữ cảnh đưa cho người đọc ${summary.skillOffered}% (mục tiêu top-1 ≥ 80%)`,
  );
  console.log(
    summary.outcomeMatch === null
      ? "đúng/sai: chưa đo — cần 20 ảnh mẫu của chủ dự án (docs/eval/intake-v1.md §5)"
      : `đúng/sai: ${summary.outcomeMatch}% trên ${summary.outcomeMeasured} ca (mục tiêu ≥ 85%)`,
  );
  console.log(`quy tắc BLANK trên phiếu docs/11 §9: ${summary.blankRuleOnWorksheet}`);
}

function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 1000) / 10;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
