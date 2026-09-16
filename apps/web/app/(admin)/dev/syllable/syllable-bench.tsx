"use client";

import { SYLLABLE_GAME_NAMES, type SyllableGameId } from "@mtct/core";
import Link from "next/link";
import { useState } from "react";
import { SyllableStation } from "@/components/kid/syllable/station";
import type { SyllableRound } from "@/components/kid/syllable/types";

/**
 * The bench itself: one game with the syllables asked for. It plays `offline` — nothing is sent,
 * so a parent trying a game never moves a child's syllables.
 */
export function SyllableBench({
  game,
  games,
  tieng,
  missing,
  round,
}: {
  game: SyllableGameId;
  games: string[];
  tieng: string;
  missing: string[];
  round: SyllableRound | null;
}) {
  const [run, setRun] = useState(0);
  return (
    <div className="flex flex-col gap-4">
      <nav className="flex flex-wrap gap-2">
        {games.map((g) => (
          <Link
            key={g}
            href={`/dev/syllable?game=${g}&tieng=${encodeURIComponent(tieng)}`}
            className={`rounded-full border px-4 py-2 font-semibold text-sm ${
              g === game ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300"
            }`}
          >
            {SYLLABLE_GAME_NAMES[g as SyllableGameId]}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          className="rounded-full border border-slate-300 px-4 py-2 font-semibold text-sm"
        >
          Chơi lại
        </button>
      </nav>
      {missing.length > 0 ? (
        <p className="text-slate-600 text-sm">
          Không có trong kho tiếng: {missing.join(", ")} — kiểm tra content/lexicon/viet.json.
        </p>
      ) : null}
      <div className="flex min-h-[560px] items-center justify-center rounded-3xl bg-[#FFF8EC] p-6">
        {round ? (
          <SyllableStation
            key={`${game}-${run}`}
            sessionId="bench"
            order={0}
            station={{ games: [round.game], rounds: [round] }}
            mascot="robot"
            onFinished={() => {}}
            offline
          />
        ) : (
          <p className="font-semibold text-slate-600">
            Chưa có kho tiếng — chạy <code>pnpm content:import</code> trước.
          </p>
        )}
      </div>
    </div>
  );
}
