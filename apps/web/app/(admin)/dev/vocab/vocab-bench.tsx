"use client";

import Link from "next/link";
import { useState } from "react";
import { BuildWordGame } from "@/components/kid/vocab/build-word";
import { ListenTouchGame } from "@/components/kid/vocab/listen-touch";
import { MarketGame } from "@/components/kid/vocab/market";
import { MatchPairsGame } from "@/components/kid/vocab/match-pairs";
import { SayItGame } from "@/components/kid/vocab/say-it";
import { GAME_NAMES, type VocabGameId, type VocabWord } from "@/components/kid/vocab/types";
import { WhatVanishedGame } from "@/components/kid/vocab/what-vanished";

/**
 * The bench itself: a game, the words it is playing with, and a log of what it reported. Nothing
 * is sent to the server from here — a parent looking at a game must not move a child's words.
 */
export function VocabBench({
  game,
  games,
  skillCode,
  words,
}: {
  game: VocabGameId;
  games: string[];
  skillCode: string;
  words: VocabWord[];
}) {
  const [log, setLog] = useState<string[]>([]);
  const [round, setRound] = useState(0);

  const onMeeting = ({ wordId, correct }: { wordId: string; correct: boolean }) => {
    const word = words.find((w) => w.wordId === wordId);
    setLog((l) =>
      [`${word?.en ?? wordId}: ${correct ? "nhận ra" : "gặp lại mai"}`, ...l].slice(0, 12),
    );
  };

  const props = { words, onMeeting, onDone: () => setRound((r) => r + 1) };
  const body = () => {
    switch (game) {
      case "match-pairs":
        return <MatchPairsGame {...props} />;
      case "what-vanished":
        return <WhatVanishedGame {...props} />;
      case "market":
        return <MarketGame {...props} />;
      case "build-word":
        return <BuildWordGame {...props} />;
      case "say-it":
        return <SayItGame {...props} />;
      default:
        return <ListenTouchGame {...props} />;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex flex-wrap gap-2">
        {games.map((g) => (
          <Link
            key={g}
            href={`/dev/vocab?game=${g}&skill=${skillCode}`}
            className={`rounded-full border px-4 py-2 font-semibold text-sm ${
              g === game ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300"
            }`}
          >
            {GAME_NAMES[g as VocabGameId]}
          </Link>
        ))}
      </nav>

      <div
        className="flex min-h-[520px] items-center justify-center rounded-3xl bg-[#FFF8EC] p-6"
        data-testid="vocab-station"
        data-game={game}
      >
        {words.length === 0 ? (
          <p className="font-semibold text-slate-600">
            Chưa có từ nào cho {skillCode} — chạy <code>pnpm content:import</code> trước.
          </p>
        ) : (
          <div key={`${game}-${round}`} className="w-full">
            {body()}
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900">Đã báo về (chỉ hiển thị, không ghi DB)</h2>
        <ul className="mt-2 flex flex-col gap-1 text-slate-600 text-sm">
          {log.length === 0 ? <li>Chưa có lần gặp nào.</li> : null}
          {log.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
