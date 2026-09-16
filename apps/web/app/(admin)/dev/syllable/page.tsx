import {
  buildRound,
  type GameSyllable,
  pairRound,
  SYLLABLE_GAMES,
  type SyllableGameId,
  seededRng,
  toneRound,
  trainRound,
} from "@mtct/core";
import { prisma, syllableDictionary, syllablePieces } from "@mtct/db";
import { PageHeader } from "@/components/admin/page-header";
import type { SyllableRound } from "@/components/kid/syllable/types";
import { guardPage } from "@/lib/auth/session";
import { SyllableBench } from "./syllable-bench";

export const dynamic = "force-dynamic";

/** The syllables the bench opens with: the owner's five rhythm samples plus the family. */
const DEFAULT_SYLLABLES = ["bà", "anh", "quyển", "mẹ", "nghé", "cá"];

/**
 * /dev/syllable — any Xưởng Tiếng game, on demand, with syllables of your choosing (pha 12).
 *
 * The planner decides which game a child gets and when; this bench shows any of the six right
 * away, so a parent can look at a game before a child meets it and the acceptance test can hold
 * the spelling rhythm to `cadence()` on exactly the syllables it names
 * (`?game=build&tieng=anh,quyển`). Nothing here writes to the database.
 */
export default async function DevSyllablePage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string; tieng?: string; seed?: string }>;
}) {
  await guardPage("admin");
  const params = await searchParams;
  const game: SyllableGameId = (SYLLABLE_GAMES as readonly string[]).includes(params.game ?? "")
    ? (params.game as SyllableGameId)
    : "build";
  const wanted = (params.tieng ?? DEFAULT_SYLLABLES.join(","))
    .split(",")
    .map((t) => t.trim().normalize("NFC"))
    .filter(Boolean)
    .slice(0, 8);

  const dictionary = await syllableDictionary(prisma);
  const byText = new Map(dictionary.map((s) => [s.text, s]));
  const chosen = wanted.flatMap((t) => {
    const s = byText.get(t);
    return s ? [s as GameSyllable] : [];
  });
  const rng = seededRng(Number(params.seed ?? 7));
  const pieces = await syllablePieces(prisma);

  let round: SyllableRound | null = null;
  if (chosen.length > 0) {
    if (game === "build" || game === "split")
      round = { game, items: buildRound(chosen, pieces, { rng, split: game === "split" }) };
    else if (game === "pair") round = { game, items: pairRound(chosen, rng) };
    else if (game === "tone") round = { game, items: toneRound(chosen, dictionary, { rng }) };
    else if (game === "train")
      round = { game, cars: trainRound(dictionary, { rng, onsets: pieces.onsets }) };
    else round = { game: "read", items: chosen };
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Nội dung", "Xưởng Tiếng"]}
        title="Xưởng Tiếng (/dev/syllable)"
        description="Sáu trò đánh vần của pha 12, chơi thử với tiếng thật — không ghi gì vào dữ liệu học. Đổi trò bằng ?game=build|split|tone|pair|train|read, đổi tiếng bằng ?tieng=bà,anh,quyển."
      />
      <SyllableBench
        game={game}
        games={[...SYLLABLE_GAMES]}
        tieng={wanted.join(",")}
        missing={wanted.filter((t) => !byText.has(t))}
        round={round}
      />
    </div>
  );
}
