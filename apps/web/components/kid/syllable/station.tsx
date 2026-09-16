"use client";

import { SYLLABLE_GAME_NAMES } from "@mtct/core";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Mascot } from "../mascot";
import { playSound } from "../sound";
import { SPRING } from "../tokens";
import { useSpeak } from "../use-speak";
import { BuildGame } from "./build";
import { PairGame } from "./pair";
import { ReadGame } from "./read";
import { ToneWheelGame } from "./tone-wheel";
import { TrainGame } from "./train";
import type { SyllableAnswer, SyllableRound, SyllableStationData } from "./types";

/**
 * One Xưởng Tiếng station (pha 12), in either world: two short spelling games of different kinds,
 * then one line of praise and the bricks the evening laid.
 *
 * Every meeting is sent as it happens, so a child who wanders off keeps what she built. Whether
 * it was right, what it does to the Leitner box and to mastery is decided on the server (ADR-22,
 * ADR-24); this screen never sees a box number.
 */
export function SyllableStation({
  sessionId,
  order,
  station,
  mascot,
  onFinished,
  onStars,
  /** The bench plays without writing anything. */
  offline = false,
}: {
  sessionId: string;
  order: number;
  station: SyllableStationData;
  mascot: "robot" | "cu";
  onFinished: () => void;
  onStars?: (total: number) => void;
  offline?: boolean;
}) {
  const { speak } = useSpeak();
  const [roundIndex, setRoundIndex] = useState(0);
  const [state, setState] = useState<"intro" | "playing" | "done">("intro");
  const [bricks, setBricks] = useState(0);
  const round = station.rounds[roundIndex];
  const title = round ? SYLLABLE_GAME_NAMES[round.game] : "";

  useEffect(() => {
    if (state !== "intro" || !round) return;
    const id = window.setTimeout(() => {
      void speak(title, { lang: "vi-VN" });
      setState("playing");
    }, 1200);
    return () => window.clearTimeout(id);
  }, [state, round, title, speak]);

  const onMeeting = useCallback(
    (syllableId: string, answer: SyllableAnswer) => {
      if (offline) return;
      void fetch("/api/kid/syllable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, order, syllableId, answer }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { brick?: boolean } | null) => {
          if (data?.brick) setBricks((n) => n + 1);
        })
        .catch(() => {
          /* a syllable that did not reach the server comes back tomorrow — never a blocker */
        });
    },
    [sessionId, order, offline],
  );

  const onRoundDone = useCallback(() => {
    if (roundIndex + 1 < station.rounds.length) {
      playSound("sao");
      setRoundIndex((i) => i + 1);
      setState("intro");
      return;
    }
    playSound("xong-phien");
    setState("done");
    if (!offline) {
      // one star for the work, like any other station (ADR-16), keyed to the station
      void fetch("/api/kid/syllable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, order, done: true }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { starsTotal?: number } | null) => {
          if (typeof data?.starsTotal === "number") onStars?.(data.starsTotal);
        })
        .catch(() => {});
    }
    window.setTimeout(onFinished, 2200);
  }, [roundIndex, station.rounds.length, offline, sessionId, order, onStars, onFinished]);

  if (station.rounds.length === 0) {
    onFinished();
    return null;
  }

  return (
    <div
      className="flex w-full flex-col items-center justify-center gap-5"
      data-testid="syllable-station"
      data-games={station.rounds.map((r) => r.game).join(",")}
      data-round={roundIndex}
    >
      <AnimatePresence mode="wait">
        {state === "intro" ? (
          <motion.div
            key={`intro-${roundIndex}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={SPRING.pop}
            className="flex flex-col items-center gap-3"
          >
            <span className="text-[64px]" aria-hidden>
              ⚙️
            </span>
            <Mascot name={mascot} state="greet" size={130} />
            <span className="font-extrabold text-[30px] text-[#2B2B3A]">Xưởng Tiếng · {title}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {state === "playing" && round ? (
        <RoundBody key={roundIndex} round={round} onMeeting={onMeeting} onDone={onRoundDone} />
      ) : null}

      {state === "done" ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING.pop}
          className="flex flex-col items-center gap-3"
          data-testid="syllable-station-done"
        >
          <Mascot name={mascot} state="cheer" size={150} />
          <span className="font-extrabold text-[30px] text-[#2B2B3A]">Xong Xưởng Tiếng rồi!</span>
          {bricks > 0 ? (
            <span className="flex items-center gap-2 font-bold text-[24px] text-[#6B6B7B]">
              {bricks === 1
                ? "Một viên gạch mới cho Phố Chữ"
                : `${bricks} viên gạch mới cho Phố Chữ`}
              <GoldBrick />
            </span>
          ) : null}
        </motion.div>
      ) : null}
    </div>
  );
}

/** A golden brick, drawn — the brick emoji is red, and nothing on a child's screen is. */
export function GoldBrick({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block rounded-[6px]"
      style={{
        width: size * 1.6,
        height: size,
        background: "linear-gradient(180deg, #FFE27A 0%, #F5B93A 100%)",
        boxShadow: "inset 0 -4px 0 #D99A22, 0 3px 6px -3px rgba(43,43,58,0.5)",
      }}
    />
  );
}

const BRICK_SLOTS = Array.from({ length: 10 }, (_, n) => `brick-${n + 1}`);

/** The pile towards the next house: laid bricks bright, the rest faint. Never a fraction. */
export function BrickRow({ laid, size = 18 }: { laid: number; size?: number }) {
  return (
    <span className="flex items-center gap-[3px]" aria-hidden>
      {BRICK_SLOTS.map((key, n) => (
        <span key={key} style={{ opacity: n < laid ? 1 : 0.18 }}>
          <GoldBrick size={size} />
        </span>
      ))}
    </span>
  );
}

function RoundBody({
  round,
  onMeeting,
  onDone,
}: {
  round: SyllableRound;
  onMeeting: (syllableId: string, answer: SyllableAnswer) => void;
  onDone: () => void;
}) {
  switch (round.game) {
    case "build":
    case "split":
      return <BuildGame round={round} onMeeting={onMeeting} onDone={onDone} />;
    case "pair":
      return <PairGame round={round} onMeeting={onMeeting} onDone={onDone} />;
    case "tone":
      return <ToneWheelGame round={round} onMeeting={onMeeting} onDone={onDone} />;
    case "train":
      return <TrainGame round={round} onMeeting={onMeeting} onDone={onDone} />;
    case "read":
      return <ReadGame round={round} onMeeting={onMeeting} onDone={onDone} />;
  }
}
