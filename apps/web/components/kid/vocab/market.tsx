"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SpeakerButton } from "../buttons";
import { Picture } from "../exercise/picture";
import { playSound } from "../sound";
import { SPRING, STAGGER } from "../tokens";
import { useSpeak } from "../use-speak";
import { shuffle, type VocabGameProps } from "./types";

/**
 * "Chợ nhỏ" — the stall calls out a whole phrase ("I like bananas.", "The cat is sleeping.") and
 * the child puts the thing it is about into the basket.
 *
 * A word inside a phrase is remembered better than a word on its own, and this is the game that
 * gives the child the phrase every time: it is spoken, and the word never appears in writing on
 * its own beforehand. Tapping is enough — a six-year-old on a tablet can drag, but a tired one
 * should not be stuck.
 */
const ROUND_WORDS = 5;

export function MarketGame({ words, onMeeting, onDone }: VocabGameProps) {
  const reduce = useReducedMotion();
  const { speak } = useSpeak();
  const order = useMemo(() => words.slice(0, ROUND_WORDS), [words]);
  const [index, setIndex] = useState(0);
  const [stall, setStall] = useState<typeof words>([]);
  const [inBasket, setInBasket] = useState<string | null>(null);

  const target = order[index];

  useEffect(() => {
    if (!target) return;
    const others = shuffle(words.filter((w) => w.wordId !== target.wordId)).slice(0, 3);
    setStall(shuffle([target, ...others]));
    setInBasket(null);
  }, [target, words]);

  useEffect(() => {
    if (!target) return;
    const id = window.setTimeout(() => void speak(target.phraseEn, { lang: "en-US" }), 500);
    return () => window.clearTimeout(id);
  }, [target, speak]);

  const take = useCallback(
    (wordId: string) => {
      if (!target || inBasket) return;
      setInBasket(wordId);
      const correct = wordId === target.wordId;
      playSound(correct ? "dung" : "gan-dung");
      onMeeting({ wordId: target.wordId, correct });
      window.setTimeout(() => {
        if (index + 1 >= order.length) onDone();
        else setIndex((i) => i + 1);
      }, 1300);
    },
    [target, inBasket, onMeeting, onDone, index, order.length],
  );

  if (!target) return null;

  return (
    <div className="flex w-full flex-col items-center gap-5" data-testid="vocab-market">
      <div className="flex items-center gap-3 rounded-[28px] bg-white/80 px-5 py-3">
        <SpeakerButton text={target.phraseEn} lang="en-US" size={72} />
        <div className="flex flex-col">
          <span className="font-extrabold text-[24px] text-[#2B2B3A]">{target.phraseEn}</span>
          <span className="font-bold text-[20px] text-[#6B6B7B]">{target.phraseVi}</span>
        </div>
      </div>

      <motion.div
        variants={STAGGER.container}
        initial="hidden"
        animate="show"
        className="flex flex-wrap justify-center gap-4"
      >
        {stall.map((w) => {
          const chosen = inBasket === w.wordId;
          const isTarget = w.wordId === target.wordId;
          const ring =
            inBasket && isTarget
              ? "ring-[6px] ring-[#34C759]"
              : chosen
                ? "ring-[6px] ring-[#FFB020]"
                : "";
          return (
            <motion.button
              key={w.wordId}
              type="button"
              variants={STAGGER.item}
              disabled={Boolean(inBasket)}
              onClick={() => take(w.wordId)}
              whileTap={reduce ? undefined : { scale: 0.94 }}
              animate={chosen && !reduce ? { y: [0, -30, 0], scale: [1, 0.9, 1] } : {}}
              transition={chosen ? { duration: 0.5 } : SPRING.press}
              className={`flex min-h-[160px] min-w-[160px] flex-col items-center justify-center gap-1 rounded-[32px] bg-white p-3 shadow-[0_14px_34px_-18px_rgba(43,43,58,0.55)] ${ring}`}
              data-testid="market-item"
              data-word={w.stableId}
            >
              <Picture image={w.picture} size={104} alt={w.vi} />
              <span className="font-extrabold text-[22px] text-[#2B2B3A]">{w.en}</span>
            </motion.button>
          );
        })}
      </motion.div>

      <div className="flex items-center gap-2 font-bold text-[22px] text-[#6B6B7B]">
        <span className="text-[40px]" aria-hidden="true">
          🧺
        </span>
        Cho vào giỏ nhé!
      </div>
    </div>
  );
}
