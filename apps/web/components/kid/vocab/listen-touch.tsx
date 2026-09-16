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
 * "Nghe rồi chạm tranh" — the plainest of the six, and the one a child who cannot read English can
 * always play: the word is spoken, four pictures are on screen, tap the one it means.
 *
 * The word is never printed. A six-year-old learning a first English word should meet it by ear
 * and by picture; printing it turns a listening game into a reading one (the same trap ADR-14
 * describes for LISTEN_CHOOSE).
 */
/** Four words is a round of about a minute; six turns it into a chore (docs/08 pha 11). */
const ROUND_WORDS = 4;

export function ListenTouchGame({ words, onMeeting, onDone }: VocabGameProps) {
  const reduce = useReducedMotion();
  const { speak } = useSpeak();
  const asked = useMemo(() => words.slice(0, ROUND_WORDS), [words]);
  const [round, setRound] = useState(0);
  const [options, setOptions] = useState<typeof words>([]);
  const [picked, setPicked] = useState<string | null>(null);

  const target = asked[round];

  useEffect(() => {
    if (!target) return;
    const others = shuffle(words.filter((w) => w.wordId !== target.wordId)).slice(0, 3);
    setOptions(shuffle([target, ...others]));
    setPicked(null);
  }, [target, words]);

  // say the word as the round appears, and again on demand
  useEffect(() => {
    if (!target) return;
    const id = window.setTimeout(() => void speak(target.en, { lang: "en-US" }), 500);
    return () => window.clearTimeout(id);
  }, [target, speak]);

  const pick = useCallback(
    (wordId: string) => {
      if (!target || picked) return;
      setPicked(wordId);
      const correct = wordId === target.wordId;
      playSound(correct ? "dung" : "gan-dung");
      onMeeting({ wordId: target.wordId, correct });
      window.setTimeout(() => {
        if (round + 1 >= asked.length) onDone();
        else setRound((r) => r + 1);
      }, 1100);
    },
    [target, picked, onMeeting, onDone, round, asked.length],
  );

  if (!target) return null;

  return (
    <div className="flex w-full flex-col items-center gap-6" data-testid="vocab-listen-touch">
      <div className="flex flex-col items-center gap-2">
        <SpeakerButton text={target.en} lang="en-US" size={112} />
        <span className="font-bold text-[22px] text-[#6B6B7B]">Nghe rồi chạm tranh nhé!</span>
      </div>

      <motion.div
        variants={STAGGER.container}
        initial="hidden"
        animate="show"
        className="flex flex-wrap justify-center gap-4"
      >
        {options.map((w) => {
          const isTarget = w.wordId === target.wordId;
          const chosen = picked === w.wordId;
          const ring =
            picked && isTarget
              ? "ring-[6px] ring-[#34C759]"
              : chosen
                ? "ring-[6px] ring-[#FFB020]"
                : "";
          return (
            <motion.button
              key={w.wordId}
              type="button"
              variants={STAGGER.item}
              disabled={Boolean(picked)}
              onClick={() => pick(w.wordId)}
              whileTap={reduce ? undefined : { scale: 0.94 }}
              animate={
                picked && isTarget && !reduce
                  ? { scale: [1, 1.1, 1] }
                  : chosen && !isTarget && !reduce
                    ? { x: [0, -10, 10, -6, 6, 0] }
                    : {}
              }
              transition={picked ? { duration: 0.45 } : SPRING.press}
              className={`flex min-h-[168px] min-w-[168px] flex-col items-center justify-center rounded-[32px] bg-white p-4 shadow-[0_14px_34px_-18px_rgba(43,43,58,0.55)] ${ring}`}
              data-testid="vocab-option"
              data-word={w.stableId}
            >
              <Picture image={w.picture} size={128} alt={w.vi} />
            </motion.button>
          );
        })}
      </motion.div>

      {picked ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-1"
        >
          <span className="font-extrabold text-[30px] text-[#2B2B3A]">{target.en}</span>
          <span className="font-bold text-[22px] text-[#6B6B7B]">{target.vi}</span>
        </motion.div>
      ) : null}
    </div>
  );
}
