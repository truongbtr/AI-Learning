"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Picture } from "../exercise/picture";
import { playSound } from "../sound";
import { SPRING } from "../tokens";
import { useSpeak } from "../use-speak";
import { shuffle, type VocabGameProps } from "./types";

/**
 * "Lật thẻ tìm đôi" — a picture card and a word card for four words, face down. Turning a picture
 * plays its word, so even a child who cannot read the card hears what it says; a pair found stays
 * open and is one meeting with that word.
 *
 * Nothing is timed and nothing is lost: two cards that do not match simply turn back over.
 */
interface Card {
  key: string;
  wordId: string;
  kind: "picture" | "word";
}

const ROUND_WORDS = 4;

export function MatchPairsGame({ words, onMeeting, onDone }: VocabGameProps) {
  const reduce = useReducedMotion();
  const { speak } = useSpeak();
  const round = useMemo(() => words.slice(0, ROUND_WORDS), [words]);
  const [cards, setCards] = useState<Card[]>([]);
  const [open, setOpen] = useState<string[]>([]);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [misses, setMisses] = useState<Record<string, number>>({});

  useEffect(() => {
    setCards(
      shuffle(
        round.flatMap((w) => [
          { key: `${w.wordId}-p`, wordId: w.wordId, kind: "picture" as const },
          { key: `${w.wordId}-w`, wordId: w.wordId, kind: "word" as const },
        ]),
      ),
    );
    setOpen([]);
    setFound(new Set());
  }, [round]);

  useEffect(() => {
    if (round.length > 0 && found.size === round.length) {
      const id = window.setTimeout(onDone, 900);
      return () => window.clearTimeout(id);
    }
  }, [found, round.length, onDone]);

  const wordOf = (wordId: string) => round.find((w) => w.wordId === wordId);

  const flip = (card: Card) => {
    if (open.includes(card.key) || found.has(card.wordId) || open.length === 2) return;
    playSound("cham");
    const w = wordOf(card.wordId);
    if (w) void speak(w.en, { lang: "en-US" });
    const next = [...open, card.key];
    setOpen(next);
    if (next.length < 2) return;

    const [a, b] = next.map((k) => cards.find((c) => c.key === k));
    if (a && b && a.wordId === b.wordId) {
      playSound("dung");
      // Found first try = recognised. Found after a mix-up still counts as a meeting, just not as
      // a "knew it" — the ladder decides, and neither answer is called a mistake.
      onMeeting({ wordId: a.wordId, correct: (misses[a.wordId] ?? 0) === 0 });
      window.setTimeout(() => {
        setFound((f) => new Set([...f, a.wordId]));
        setOpen([]);
      }, 600);
      return;
    }
    if (a && b) {
      setMisses((m) => ({
        ...m,
        [a.wordId]: (m[a.wordId] ?? 0) + 1,
        [b.wordId]: (m[b.wordId] ?? 0) + 1,
      }));
    }
    window.setTimeout(() => setOpen([]), 900);
  };

  return (
    <div className="flex w-full flex-col items-center gap-5" data-testid="vocab-match-pairs">
      <span className="font-bold text-[22px] text-[#6B6B7B]">Lật thẻ tìm đôi nhé!</span>
      <div className="grid grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => {
          const w = wordOf(card.wordId);
          const isOpen = open.includes(card.key) || found.has(card.wordId);
          return (
            <motion.button
              key={card.key}
              type="button"
              onClick={() => flip(card)}
              whileTap={reduce ? undefined : { scale: 0.95 }}
              animate={found.has(card.wordId) && !reduce ? { scale: [1, 1.06, 1] } : { scale: 1 }}
              transition={SPRING.press}
              className={`flex min-h-[120px] min-w-[104px] items-center justify-center rounded-[28px] p-3 shadow-[0_12px_28px_-16px_rgba(43,43,58,0.5)] ${
                found.has(card.wordId) ? "bg-[#EAF7EC] ring-[5px] ring-[#34C759]" : "bg-white"
              }`}
              data-testid="pair-card"
              data-open={isOpen ? "true" : "false"}
            >
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.span
                    key="face"
                    initial={{ rotateY: reduce ? 0 : -90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: reduce ? 0 : 90, opacity: 0 }}
                    className="flex items-center justify-center"
                  >
                    {card.kind === "picture" && w ? (
                      <Picture image={w.picture} size={88} alt={w.vi} />
                    ) : (
                      <span className="px-1 text-center font-extrabold text-[24px] text-[#2B2B3A] leading-tight">
                        {w?.en}
                      </span>
                    )}
                  </motion.span>
                ) : (
                  <motion.span
                    key="back"
                    initial={{ rotateY: reduce ? 0 : -90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: reduce ? 0 : 90, opacity: 0 }}
                    className="text-[40px]"
                    aria-label="thẻ úp"
                  >
                    🐚
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
