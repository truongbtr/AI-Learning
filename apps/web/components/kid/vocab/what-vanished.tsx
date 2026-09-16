"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Picture } from "../exercise/picture";
import { playSound } from "../sound";
import { SPRING } from "../tokens";
import { useSpeak } from "../use-speak";
import { shuffle, type VocabGameProps } from "./types";

/**
 * "Cái gì biến mất?" — four pictures sit on the quay, the seagull carries one away, and the child
 * says which one is gone by tapping its name.
 *
 * This is the one game that asks a child to *retrieve* a word rather than recognise it among
 * pictures, which is the harder and more useful kind of practice. The names are spoken as they are
 * tapped, so the English spelling is only a hint, never the question.
 */
const ROUND_WORDS = 4;

export function WhatVanishedGame({ words, onMeeting, onDone }: VocabGameProps) {
  const reduce = useReducedMotion();
  const { speak } = useSpeak();
  const pool = useMemo(() => words.slice(0, ROUND_WORDS), [words]);
  const [phase, setPhase] = useState<"look" | "gone" | "answered">("look");
  const [missing, setMissing] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [rounds, setRounds] = useState(0);

  // Look at them, hear them, then one goes.
  useEffect(() => {
    if (phase !== "look" || pool.length === 0) return;
    let cancelled = false;
    const id = window.setTimeout(() => {
      if (cancelled) return;
      const gone = shuffle(pool)[0];
      setMissing(gone?.wordId ?? null);
      setPicked(null);
      setPhase("gone");
    }, 2600);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [phase, pool]);

  const answer = (wordId: string) => {
    if (phase !== "gone" || !missing) return;
    setPicked(wordId);
    setPhase("answered");
    const correct = wordId === missing;
    playSound(correct ? "dung" : "gan-dung");
    const gone = pool.find((w) => w.wordId === missing);
    if (gone) void speak(gone.en, { lang: "en-US" });
    onMeeting({ wordId: missing, correct });
    window.setTimeout(() => {
      if (rounds + 1 >= Math.min(3, pool.length)) onDone();
      else {
        setRounds((r) => r + 1);
        setPhase("look");
      }
    }, 1500);
  };

  if (pool.length === 0) return null;

  return (
    <div className="flex w-full flex-col items-center gap-6" data-testid="vocab-what-vanished">
      <span className="font-bold text-[22px] text-[#6B6B7B]">
        {phase === "look" ? "Nhìn kỹ nhé…" : "Cái gì biến mất rồi?"}
      </span>

      <div className="flex min-h-[170px] flex-wrap items-center justify-center gap-4">
        <AnimatePresence>
          {pool.map((w) =>
            phase !== "look" && w.wordId === missing ? null : (
              <motion.div
                key={w.wordId}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -80, rotate: 18 }}
                transition={SPRING.pop}
                className="flex min-h-[150px] min-w-[150px] items-center justify-center rounded-[32px] bg-white p-3 shadow-[0_14px_34px_-18px_rgba(43,43,58,0.55)]"
              >
                <Picture image={w.picture} size={112} alt={w.vi} />
              </motion.div>
            ),
          )}
        </AnimatePresence>
      </div>

      {phase !== "look" ? (
        <div className="flex flex-wrap justify-center gap-3">
          {pool.map((w) => {
            const isGone = w.wordId === missing;
            const ring =
              phase === "answered" && isGone
                ? "ring-[6px] ring-[#34C759]"
                : phase === "answered" && picked === w.wordId
                  ? "ring-[6px] ring-[#FFB020]"
                  : "";
            return (
              <motion.button
                key={w.wordId}
                type="button"
                disabled={phase === "answered"}
                onClick={() => answer(w.wordId)}
                whileTap={reduce ? undefined : { scale: 0.95 }}
                transition={SPRING.press}
                className={`min-h-[84px] rounded-[28px] bg-white px-6 font-extrabold text-[26px] text-[#2B2B3A] shadow-[0_12px_28px_-16px_rgba(43,43,58,0.5)] ${ring}`}
                data-testid="vanished-name"
                data-word={w.stableId}
              >
                {w.en}
              </motion.button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
