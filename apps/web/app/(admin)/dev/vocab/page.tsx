import { prisma, wordsForStation } from "@mtct/db";
import { PageHeader } from "@/components/admin/page-header";
import type { VocabWord } from "@/components/kid/vocab/types";
import { guardPage } from "@/lib/auth/session";
import { VocabBench } from "./vocab-bench";

export const dynamic = "force-dynamic";

const GAMES = [
  "listen-touch",
  "match-pairs",
  "what-vanished",
  "market",
  "build-word",
  "say-it",
] as const;

/**
 * /dev/vocab — one vocabulary game, on demand (pha 11).
 *
 * The planner puts at most two vocabulary stations in an evening and picks the game itself, which
 * is right for a child and useless for looking at the six games. This bench renders any of them
 * with real words, so a parent can see what a station does before a child meets it — and so the
 * acceptance test can reach a game without waiting for the planner to choose one.
 *
 * Nothing here writes: the bench plays with words of the first child it finds and reports
 * meetings to the same API the real station uses only when opened with `?studentId=`.
 */
export default async function DevVocabPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string; skill?: string }>;
}) {
  await guardPage("admin");
  const params = await searchParams;
  const game = (GAMES as readonly string[]).includes(params.game ?? "")
    ? (params.game as (typeof GAMES)[number])
    : "listen-touch";
  const skillCode = params.skill ?? "ESL.VOC.FAMILY";

  const student = await prisma.student.findFirst({
    where: { isActive: true },
    select: { id: true, mascot: true },
    orderBy: { createdAt: "asc" },
  });
  const words = student
    ? await wordsForStation(prisma, student.id, { skillCodes: [skillCode], count: 6 })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Nội dung", "Trò chơi từ vựng"]}
        title="Bến Cảng Từ (/dev/vocab)"
        description="Sáu trò chơi từ vựng của pha 11, chơi thử với từ thật. Đổi trò bằng ?game=…, đổi chủ đề bằng ?skill=ESL.VOC.FOOD."
      />
      <VocabBench
        game={game}
        games={[...GAMES]}
        skillCode={skillCode}
        words={words as VocabWord[]}
        mascot={student?.mascot === "OWL" ? "cu" : "robot"}
      />
    </div>
  );
}
