"use client";

import { joinSyllable, type Tone, TRAIN_GOAL, writtenSyllable } from "@mtct/core";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { BigButton, SpeakerButton } from "../buttons";
import { Picture } from "../exercise/picture";
import { playSound } from "../sound";
import { SPRING } from "../tokens";
import { useSpeak } from "../use-speak";
import { PieceFace, PieceTile, pieceSpeech } from "./tile";
import type { GameSyllable, SyllableGameProps, SyllableRound } from "./types";

type TrainRound = Extract<SyllableRound, { game: "train" }>;

/**
 * (e) "Tàu chở vần" — the game with many right answers and no wrong ones.
 *
 * The train pulls a carriage carrying a rime ("à", "an"). The child puts an onset on the engine;
 * the machine reads what that makes. A syllable that means something becomes a goods wagon that
 * rolls into the depot with its picture. One that means nothing is read out too, and the machine
 * says "tiếng này chưa có nghĩa, thử cái khác nhé" — which is simply true, and not a mistake.
 *
 * The round ends after four syllables found, or whenever the child presses "Xong".
 */
export function TrainGame({ round, onMeeting, onDone }: SyllableGameProps<TrainRound>) {
  const reduce = useReducedMotion();
  const { speak } = useSpeak();
  const [carIndex, setCarIndex] = useState(0);
  const [engine, setEngine] = useState<string | null>(null);
  const [found, setFound] = useState<GameSyllable[]>([]);
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);
  const engineRef = useRef<HTMLDivElement | null>(null);
  const car = round.cars[carIndex];

  useEffect(() => {
    if (!car) return;
    setEngine(null);
    const id = window.setTimeout(async () => {
      await speak("Toa tàu chở vần", { lang: "vi-VN" });
      await speak(car.chunk, { lang: "vi-VN" });
      await speak("Con ghép âm đầu lên đầu tàu nhé!", { lang: "vi-VN" });
    }, 400);
    return () => window.clearTimeout(id);
  }, [car, speak]);

  const finish = useCallback(() => {
    if (finished) return;
    setFinished(true);
    playSound("xong-phien");
    window.setTimeout(onDone, 900);
  }, [finished, onDone]);

  const tryOnset = useCallback(
    async (onset: string) => {
      if (!car || busy || finished) return;
      setBusy(true);
      setEngine(onset);
      playSound("cham");
      const text = joinSyllable(onset, car.rime, car.tone as Tone);
      const hit = car.answers[onset];
      await new Promise((r) => setTimeout(r, reduce ? 100 : 600));
      await speak(text, { lang: "vi-VN" });
      if (hit) {
        const already = found.some((f) => f.id === hit.id);
        if (!already) {
          playSound("dung");
          onMeeting(hit.id, { game: "train" });
          const next = [...found, hit];
          setFound(next);
          await speak(hit.meaning, { lang: "vi-VN" });
          if (next.length >= TRAIN_GOAL) {
            setBusy(false);
            finish();
            return;
          }
          // every right onset of this carriage found: the next carriage rolls in
          const all = Object.values(car.answers).filter((s) => car.onsets.includes(s.onset));
          if (all.every((s) => next.some((f) => f.id === s.id)) && carIndex + 1 < round.cars.length)
            window.setTimeout(() => setCarIndex((i) => i + 1), 900);
        }
      } else {
        playSound("gan-dung");
        await speak("Tiếng này chưa có nghĩa, thử cái khác nhé!", { lang: "vi-VN" });
      }
      setEngine(null);
      setBusy(false);
    },
    [car, busy, finished, reduce, speak, found, onMeeting, finish, carIndex, round.cars.length],
  );

  const dropAt = useCallback(
    (onset: string, point: { x: number; y: number }) => {
      const el = engineRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = point.x - window.scrollX;
      const y = point.y - window.scrollY;
      if (x >= r.left - 20 && x <= r.right + 20 && y >= r.top - 20 && y <= r.bottom + 20)
        void tryOnset(onset);
    },
    [tryOnset],
  );

  if (!car) return null;
  const madeText = engine ? joinSyllable(engine, car.rime, car.tone as Tone) : null;

  return (
    <div
      className="flex w-full flex-col items-center gap-4"
      data-testid="syl-train"
      data-chunk={car.chunk}
      data-found={found.length}
    >
      {/* the train: engine + rime carriage + the wagons found so far */}
      <div className="flex w-full items-end justify-center gap-2 overflow-x-auto pb-2">
        <AnimatePresence>
          {[...found].reverse().map((s) => (
            <motion.div
              key={s.id}
              initial={reduce ? false : { x: 120, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={SPRING.glide}
              className="flex h-[112px] w-[104px] flex-col items-center justify-center rounded-[18px] bg-[#FFE9A8] shadow-[inset_0_-8px_0_#E8C565]"
              data-testid="syl-train-wagon"
              data-text={s.text}
            >
              {s.picture ? (
                <Picture image={s.picture as never} size={56} alt={s.meaning} />
              ) : (
                <span className="text-[36px]" aria-hidden>
                  📦
                </span>
              )}
              <span className="font-black text-[26px] text-[#2B2B3A]">
                {writtenSyllable(s.text, s.properName)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div className="flex h-[124px] min-w-[150px] items-center justify-center rounded-[20px] bg-[#DDF6E4] px-3 shadow-[inset_0_-8px_0_#A9DDBA]">
          <PieceFace kind="rime" value={car.chunk} />
        </div>
        <motion.div
          ref={engineRef}
          role="button"
          tabIndex={0}
          aria-label="đầu tàu"
          animate={busy && !reduce ? { x: [0, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.3, repeat: busy ? 2 : 0 }}
          className="relative flex h-[140px] w-[150px] flex-col items-center justify-end rounded-t-[40px] rounded-b-[18px] bg-[#2F80ED] pb-3 shadow-[inset_0_-10px_0_#1F5FBF]"
          data-testid="syl-train-engine"
        >
          <span className="-top-7 absolute left-5 text-[34px]" aria-hidden>
            💨
          </span>
          <div className="flex h-[96px] w-[96px] items-center justify-center rounded-[18px] border-4 border-white/70 border-dashed">
            {engine ? <PieceFace kind="onset" value={engine} size={0.95} /> : null}
          </div>
        </motion.div>
      </div>

      <div className="flex min-h-[64px] items-center gap-3">
        <SpeakerButton text={car.chunk} lang="vi-VN" size={72} />
        {madeText ? (
          <span className="font-black text-[48px] text-[#2B2B3A]" data-testid="syl-train-made">
            {madeText}
          </span>
        ) : (
          <span className="font-bold text-[22px] text-[#6B6B7B]">Đã tìm {found.length} tiếng</span>
        )}
      </div>

      {/* the platform: onsets waiting to ride */}
      <div className="flex flex-wrap justify-center gap-3 rounded-[30px] bg-[#E9EEF5] p-4">
        {car.onsets.map((onset) => (
          <PieceTile
            key={onset}
            kind="onset"
            value={onset}
            disabled={busy || finished}
            onTap={() => {
              void speak(pieceSpeech("onset", onset), { lang: "vi-VN" }).then(() =>
                tryOnset(onset),
              );
            }}
            onDragEnd={(point) => dropAt(onset, point)}
            testId="syl-train-onset"
          />
        ))}
      </div>

      <div className="flex gap-3">
        {carIndex + 1 < round.cars.length ? (
          <BigButton tone="quiet" disabled={busy} onClick={() => setCarIndex((i) => i + 1)}>
            Toa khác
          </BigButton>
        ) : null}
        <BigButton tone="correct" disabled={busy} onClick={finish} data-testid="syl-train-done">
          Xong
        </BigButton>
      </div>
    </div>
  );
}
