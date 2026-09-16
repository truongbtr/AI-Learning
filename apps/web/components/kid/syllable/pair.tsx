"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { SpeakerButton } from "../buttons";
import { Picture } from "../exercise/picture";
import { playSound } from "../sound";
import { SPRING } from "../tokens";
import { useSpeak } from "../use-speak";
import type { SyllableGameProps, SyllableRound } from "./types";
import { useCadence } from "./use-cadence";

type PairRound = Extract<SyllableRound, { game: "pair" }>;

/** The two letters (or tone marks) a pair is about, said by the mascot before the first card. */
const PAIR_LINES: Record<string, string> = {
  b_d: "Bờ hay dờ đây nhỉ?",
  ch_tr: "Chờ hay trờ đây nhỉ?",
  s_x: "Sờ hay xờ đây nhỉ?",
  ng_ngh: "Ngờ đơn hay ngờ kép đây nhỉ?",
  c_k: "Cờ nào đây nhỉ?",
  hoi_nga: "Dấu hỏi hay dấu ngã đây nhỉ?",
};

/**
 * (d) "Cặp dễ lẫn" — hear a syllable, pick its face out of exactly two big cards that differ in
 * one thing only: b/d, ch/tr, s/x, ng/ngh, c/k, or a hỏi against a ngã.
 *
 * Never more than two: this is about telling two shapes apart, not about searching. The cards do
 * not speak before they are chosen — that would turn the game into matching sounds.
 */
export function PairGame({ round, onMeeting, onDone }: SyllableGameProps<PairRound>) {
  const reduce = useReducedMotion();
  const { speak } = useSpeak();
  const cadence = useCadence();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const item = round.items[index];

  useEffect(() => {
    if (!item) return;
    setPicked(null);
    const id = window.setTimeout(async () => {
      await speak(PAIR_LINES[item.kind] ?? "", { lang: "vi-VN" });
      await speak(item.syllable.text, { lang: "vi-VN" });
    }, 400);
    return () => window.clearTimeout(id);
  }, [item, speak]);

  const pick = useCallback(
    async (card: string) => {
      if (!item || picked) return;
      setPicked(card);
      onMeeting(item.syllable.id, { game: "pair", picked: card, errorCode: item.errorCode });
      const right = card === item.syllable.text;
      playSound(right ? "dung" : "gan-dung");
      if (!right) await speak(`Đây là thẻ ${item.syllable.text}.`, { lang: "vi-VN" });
      await cadence.play(item.syllable.text);
      window.setTimeout(() => {
        if (index + 1 >= round.items.length) onDone();
        else setIndex((i) => i + 1);
      }, 900);
    },
    [item, picked, onMeeting, speak, cadence, index, round.items.length, onDone],
  );

  if (!item) return null;

  return (
    <div
      className="flex w-full flex-col items-center gap-5"
      data-testid="syl-pair"
      data-target={item.syllable.text}
      data-spoken={cadence.spoken.join("|")}
    >
      <div className="flex items-center gap-4">
        {item.syllable.picture ? (
          <Picture image={item.syllable.picture as never} size={110} alt={item.syllable.meaning} />
        ) : null}
        <SpeakerButton text={item.syllable.text} lang="vi-VN" size={96} />
      </div>
      <div className="flex flex-wrap justify-center gap-6">
        {item.cards.map((card) => {
          const isTarget = card === item.syllable.text;
          const chosen = picked === card;
          return (
            <motion.button
              key={card}
              type="button"
              disabled={Boolean(picked)}
              onClick={() => void pick(card)}
              whileTap={reduce ? undefined : { scale: 0.94 }}
              animate={
                picked && isTarget && !reduce
                  ? { scale: [1, 1.1, 1] }
                  : chosen && !isTarget && !reduce
                    ? { x: [0, -10, 10, -6, 6, 0] }
                    : {}
              }
              transition={picked ? { duration: 0.45 } : SPRING.press}
              className="flex min-h-[200px] min-w-[220px] items-center justify-center rounded-[40px] bg-white px-8 font-black text-[84px] text-[#2B2B3A] leading-none shadow-[0_16px_34px_-18px_rgba(43,43,58,0.55)]"
              style={
                picked && isTarget
                  ? { boxShadow: "0 0 0 8px #34C759" }
                  : chosen
                    ? { boxShadow: "0 0 0 8px #FFB020" }
                    : undefined
              }
              data-testid="syl-pair-card"
              data-card={card}
            >
              {card}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
