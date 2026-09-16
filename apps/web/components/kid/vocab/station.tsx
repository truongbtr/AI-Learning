"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mascot } from "../mascot";
import { playSound } from "../sound";
import { SPRING } from "../tokens";
import { useSpeak } from "../use-speak";
import { BuildWordGame } from "./build-word";
import { ListenTouchGame } from "./listen-touch";
import { MarketGame } from "./market";
import { MatchPairsGame } from "./match-pairs";
import { SayItGame } from "./say-it";
import { GAME_NAMES, type VocabGameId, type VocabWord } from "./types";
import { WhatVanishedGame } from "./what-vanished";

/**
 * One vocabulary station (Bến Cảng Từ), in either world: a short game over the words that are due
 * tonight, and one line of praise at the end.
 *
 * Every meeting is sent as it happens rather than at the end, so a child who wanders off mid-game
 * keeps the words they met. The server is the only place that decides what a meeting does to the
 * Leitner ladder (ADR-22); this screen never sees a box number.
 */
export function VocabStation({
  sessionId,
  order,
  game,
  words,
  mascot,
  onFinished,
  onStars,
}: {
  sessionId: string;
  order: number;
  game: VocabGameId;
  words: VocabWord[];
  mascot: "robot" | "cu";
  onFinished: () => void;
  /** The pocket total after the station's star. */
  onStars?: (total: number) => void;
}) {
  const { speak } = useSpeak();
  const [state, setState] = useState<"intro" | "playing" | "done">("intro");
  const [promoted, setPromoted] = useState(0);
  const sent = useRef(new Set<string>());

  const title = GAME_NAMES[game];

  useEffect(() => {
    const id = window.setTimeout(() => {
      void speak(title, { lang: "vi-VN" });
      setState("playing");
    }, 1200);
    return () => window.clearTimeout(id);
  }, [title, speak]);

  const onMeeting = useCallback(
    ({ wordId, correct }: { wordId: string; correct: boolean }) => {
      // Same word, same game, twice in a round: the server would only count the first anyway.
      const key = `${wordId}:${sent.current.size}`;
      sent.current.add(key);
      void fetch("/api/kid/vocab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, order, wordId, correct, game }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { promoted?: boolean } | null) => {
          if (data?.promoted) setPromoted((n) => n + 1);
        })
        .catch(() => {
          /* a word that did not reach the server is a word met again tomorrow — never a blocker */
        });
    },
    [sessionId, order, game],
  );

  const onDone = useCallback(() => {
    playSound("xong-phien");
    setState("done");
    // One star for the work, like any other station (ADR-16) — the server keys it to the station,
    // so a reload cannot pay twice.
    void fetch("/api/kid/vocab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, order, game, done: true }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { starsTotal?: number } | null) => {
        if (typeof data?.starsTotal === "number") onStars?.(data.starsTotal);
      })
      .catch(() => {});
    window.setTimeout(onFinished, 1800);
  }, [onFinished, sessionId, order, game, onStars]);

  const body = useMemo(() => {
    const props = { words, onMeeting, onDone };
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
  }, [game, words, onMeeting, onDone]);

  if (words.length === 0) {
    onFinished();
    return null;
  }

  return (
    <div
      className="flex w-full flex-col items-center justify-center gap-5"
      data-testid="vocab-station"
      data-game={game}
    >
      {state === "intro" ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={SPRING.pop}
          className="flex flex-col items-center gap-3"
        >
          <Mascot name={mascot} state="greet" size={140} />
          <span className="font-extrabold text-[30px] text-[#2B2B3A]">{title}</span>
        </motion.div>
      ) : null}

      {state === "playing" ? body : null}

      {state === "done" ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING.pop}
          className="flex flex-col items-center gap-3"
        >
          <Mascot name={mascot} state="cheer" size={150} />
          <span className="font-extrabold text-[30px] text-[#2B2B3A]">Xong bến cảng rồi!</span>
          {promoted > 0 ? (
            <span className="font-bold text-[22px] text-[#6B6B7B]">
              {promoted === 1 ? "Một từ vừa lên thuyền 🚤" : `${promoted} từ vừa lên thuyền 🚤`}
            </span>
          ) : null}
        </motion.div>
      ) : null}
    </div>
  );
}
