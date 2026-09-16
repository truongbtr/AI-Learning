"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { SpeakerButton } from "../buttons";
import { Picture } from "../exercise/picture";
import { playSound } from "../sound";
import { SPRING } from "../tokens";
import { useSpeak } from "../use-speak";
import { shuffle, type VocabGameProps } from "./types";

/**
 * "Ghép chữ cái" — the picture and the voice give the word, and the child builds it from letter
 * tiles. This is the only game that asks anything of the spelling, and it asks gently: the letters
 * are all there, in the right number, and a letter in the wrong place just slides back.
 *
 * Words longer than eight letters are skipped in the round — "watermelon" is a picture and a sound
 * for a first-grader, not a spelling task.
 */
const MAX_LETTERS = 8;
const ROUND_WORDS = 3;

export function BuildWordGame({ words, onMeeting, onDone }: VocabGameProps) {
  const reduce = useReducedMotion();
  const { speak } = useSpeak();
  const order = useMemo(
    () =>
      words
        .filter((w) => w.en.replace(/[^a-zA-Z]/g, "").length <= MAX_LETTERS)
        .slice(0, ROUND_WORDS),
    [words],
  );
  const [index, setIndex] = useState(0);
  const [tiles, setTiles] = useState<{ id: string; ch: string }[]>([]);
  const [built, setBuilt] = useState<{ id: string; ch: string }[]>([]);
  const [done, setDone] = useState(false);

  const target = order[index];
  const letters = useMemo(() => (target ? [...target.en.toLowerCase()] : []), [target]);
  /** One stable key per place in the word, so React is not asked to key on an index. */
  const slots = useMemo(
    () => letters.map((ch, i) => ({ key: `${target?.wordId ?? "w"}-${i}-${ch}` })),
    [letters, target],
  );

  useEffect(() => {
    if (!target) return;
    setTiles(shuffle(letters.map((ch, i) => ({ id: `${ch}-${i}`, ch }))));
    setBuilt([]);
    setDone(false);
    const id = window.setTimeout(() => void speak(target.en, { lang: "en-US" }), 400);
    return () => window.clearTimeout(id);
  }, [target, letters, speak]);

  // Finished as soon as the word is complete — right or not, the child sees what they built.
  useEffect(() => {
    if (!target || done || built.length !== letters.length || letters.length === 0) return;
    const madeWord = built.map((b) => b.ch).join("");
    const correct = madeWord === target.en.toLowerCase();
    setDone(true);
    playSound(correct ? "dung" : "gan-dung");
    void speak(target.en, { lang: "en-US" });
    onMeeting({ wordId: target.wordId, correct });
    const id = window.setTimeout(() => {
      if (index + 1 >= order.length) onDone();
      else setIndex((i) => i + 1);
    }, 1600);
    return () => window.clearTimeout(id);
  }, [built, letters, target, done, onMeeting, onDone, index, order.length, speak]);

  if (!target) {
    // every word in this round is too long to spell — hand the station back rather than stall
    onDone();
    return null;
  }

  const wrongSpot = (i: number) => done && built[i]?.ch !== target.en.toLowerCase()[i];

  return (
    <div className="flex w-full flex-col items-center gap-5" data-testid="vocab-build-word">
      <div className="flex items-center gap-4">
        <Picture image={target.picture} size={120} alt={target.vi} />
        <div className="flex flex-col items-start gap-1">
          <SpeakerButton text={target.en} lang="en-US" size={72} />
          <span className="font-bold text-[20px] text-[#6B6B7B]">{target.vi}</span>
        </div>
      </div>

      {/* what the child has built so far */}
      <div className="flex min-h-[96px] flex-wrap items-center justify-center gap-2">
        {slots.map(({ key }, i) => {
          const tile = built[i];
          return (
            <motion.button
              key={key}
              type="button"
              disabled={!tile || done}
              onClick={() => {
                if (!tile || done) return;
                setBuilt((b) => b.filter((x) => x.id !== tile.id));
                setTiles((t) => [...t, tile]);
              }}
              animate={tile && wrongSpot(i) && !reduce ? { y: [0, -6, 0] } : {}}
              transition={SPRING.press}
              className={`flex h-[84px] w-[68px] items-center justify-center rounded-[22px] font-extrabold text-[36px] ${
                tile
                  ? done && wrongSpot(i)
                    ? "bg-[#FFF4E0] text-[#2B2B3A] ring-[5px] ring-[#FFB020]"
                    : "bg-white text-[#2B2B3A] shadow-[0_10px_24px_-14px_rgba(43,43,58,0.5)]"
                  : "border-4 border-[#C9BDA4] border-dashed bg-white/40 text-transparent"
              }`}
              data-testid="word-slot"
            >
              {tile?.ch ?? "·"}
            </motion.button>
          );
        })}
      </div>

      {/* the letters still waiting */}
      <div className="flex flex-wrap justify-center gap-2" data-testid="letter-tray">
        {tiles.map((tile) => (
          <motion.button
            key={tile.id}
            type="button"
            disabled={done}
            onClick={() => {
              playSound("cham");
              setTiles((t) => t.filter((x) => x.id !== tile.id));
              setBuilt((b) => [...b, tile]);
            }}
            whileTap={reduce ? undefined : { scale: 0.92 }}
            transition={SPRING.press}
            className="flex h-[84px] w-[68px] items-center justify-center rounded-[22px] bg-[#FFF3DD] font-extrabold text-[36px] text-[#2B2B3A] shadow-[0_10px_24px_-14px_rgba(43,43,58,0.5)]"
            data-testid="letter-tile"
          >
            {tile.ch}
          </motion.button>
        ))}
      </div>

      {done ? (
        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-extrabold text-[30px] text-[#2B2B3A]"
        >
          {target.en}
        </motion.span>
      ) : null}
    </div>
  );
}
