"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { BigButton } from "./buttons";
import { ConfettiCelebration } from "./feedback";
import { Mascot } from "./mascot";
import { TreasureChest } from "./quest-map";
import { playSound } from "./sound";
import { COLOR, SPRING } from "./tokens";
import { useSpeak } from "./use-speak";

/**
 * K5, the end of a quest (docs/06 §1.3, checklist §4 item 6): a four-to-six second scene — the
 * chest opens, stars pour out, the total counts up, a badge flies in if there is one, the mascot
 * dances. A tap skips straight to the end, because the fourth time it is no longer a surprise.
 */

export interface FinaleBadge {
  code: string;
  nameVi: string;
  icon: string;
}

export interface SessionFinaleProps {
  stars: number;
  totalStars: number;
  lines: string[];
  badges: FinaleBadge[];
  mascot?: "robot" | "cu";
  /** The weekly egg cracking or hatching, when it did (docs/06 §1.8c item 1). */
  egg?: { cracks: number; needed: number; hatched?: { name: string } | null; justHatched: boolean };
  picture?: { nameVi: string; pieces: number; total: number; imageKey: string } | null;
  onDone: () => void;
}

type Beat = "chest" | "stars" | "badge" | "extras" | "done";

export function SessionFinale({
  stars,
  totalStars,
  lines,
  badges,
  mascot = "robot",
  egg,
  picture,
  onDone,
}: SessionFinaleProps) {
  const reduce = useReducedMotion();
  const [beat, setBeat] = useState<Beat>("chest");
  const [shown, setShown] = useState(0);
  const { speak } = useSpeak();

  useEffect(() => {
    if (reduce) {
      setBeat("done");
      setShown(stars);
      return;
    }
    const timers = [
      window.setTimeout(() => {
        playSound("xong-phien");
        setBeat("stars");
      }, 900),
      window.setTimeout(() => setBeat(badges.length > 0 ? "badge" : "extras"), 2600),
      window.setTimeout(() => setBeat("extras"), badges.length > 0 ? 4200 : 2700),
      window.setTimeout(() => setBeat("done"), badges.length > 0 ? 5400 : 4200),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [badges.length, reduce, stars]);

  // The star count runs up while the stars are pouring out of the chest.
  useEffect(() => {
    if (beat === "chest") return;
    if (reduce || shown >= stars) return setShown(stars);
    const id = window.setInterval(() => setShown((s) => (s >= stars ? s : s + 1)), 90);
    return () => window.clearInterval(id);
  }, [beat, stars, shown, reduce]);

  useEffect(() => {
    if (beat !== "extras" && beat !== "done") return;
    if (lines[0]) speak(lines[0], { lang: "vi" });
  }, [beat, lines, speak]);

  const skip = () => {
    setBeat("done");
    setShown(stars);
  };

  return (
    <button
      type="button"
      onClick={skip}
      data-testid="session-finale"
      data-beat={beat}
      className="flex w-full cursor-default flex-col items-center gap-5 text-center"
    >
      <ConfettiCelebration fire={beat !== "chest"} power={1.2} />

      <motion.div
        animate={beat === "chest" ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={{ duration: 0.9, repeat: beat === "chest" ? Number.POSITIVE_INFINITY : 0 }}
      >
        <TreasureChest open={beat !== "chest"} size={168} />
      </motion.div>

      <AnimatePresence>
        {beat !== "chest" ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={SPRING.pop}
            className="flex items-center gap-3 rounded-[30px] bg-white/92 px-8 py-4 shadow-[0_14px_34px_-18px_rgba(43,43,58,0.7)]"
          >
            {/* biome-ignore lint/performance/noImgElement: an inline SVG asset, not a photo */}
            <img src="/art/effects/star-gold-big.svg" alt="" width={64} height={64} />
            <span
              className="font-black text-[44px] tabular-nums"
              style={{ color: COLOR.ink }}
              data-testid="finale-stars"
            >
              +{shown}
            </span>
            <span className="font-extrabold text-[22px] text-[#6B6B7B]">
              (tất cả {totalStars} sao)
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {beat === "badge" && badges[0] ? (
          <BadgeCeremony badge={badges[0]} extra={badges.length - 1} />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {beat === "extras" || beat === "done" ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {egg ? (
              <div className="flex items-center gap-2 rounded-3xl bg-white/90 px-5 py-3 font-extrabold text-[20px]">
                {/* biome-ignore lint/performance/noImgElement: an inline SVG asset, not a photo */}
                <img
                  src={`/art/effects/egg${egg.justHatched || egg.hatched ? "-cracked" : ""}.svg`}
                  alt=""
                  width={44}
                  height={44}
                />
                {egg.hatched
                  ? `${egg.hatched.name} đã nở!`
                  : `Trứng nứt ${egg.cracks}/${egg.needed}`}
              </div>
            ) : null}
            {picture ? (
              <div className="flex items-center gap-2 rounded-3xl bg-white/90 px-5 py-3 font-extrabold text-[20px]">
                🖼️ {picture.pieces}/{picture.total} mảnh tranh
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex items-end gap-3">
        <Mascot
          name={mascot}
          state={beat === "done" ? "celebrate" : "cheer"}
          size={190}
          interactive
        />
        <div className="mb-6 max-w-[24rem] rounded-[28px] bg-white/95 px-6 py-4 text-left shadow">
          {lines.map((line) => (
            <p key={line} className="font-extrabold text-[22px] text-[#2B2B3A] leading-snug">
              {line}
            </p>
          ))}
        </div>
      </div>

      <BigButton tone="reward" onClick={onDone} data-testid="finale-home">
        🏡 Về nhà
      </BigButton>
    </button>
  );
}

/** A badge never appears quietly: it gets a frame, a sound and a moment (docs/06 §1.5). */
export function BadgeCeremony({ badge, extra = 0 }: { badge: FinaleBadge; extra?: number }) {
  const reduce = useReducedMotion();
  useEffect(() => {
    playSound("huy-hieu");
  }, []);
  return (
    <motion.div
      data-testid="badge-ceremony"
      initial={{ opacity: 0, scale: 0.4, rotate: -12 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={SPRING.pop}
      className="relative flex flex-col items-center gap-2"
    >
      <motion.div
        animate={reduce ? {} : { rotate: [0, 360] }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        className="-z-10 absolute h-[220px] w-[220px] rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(255,212,71,0.9), rgba(255,255,255,0.1), rgba(255,212,71,0.9))",
        }}
      />
      <div className="relative flex h-[168px] w-[168px] items-center justify-center">
        {/* biome-ignore lint/performance/noImgElement: an inline SVG asset, not a photo */}
        <img src="/art/effects/badge-frame.svg" alt="" width={168} height={168} />
        <span className="absolute text-[56px]">{badge.icon}</span>
      </div>
      <p className="font-black text-[26px] text-[#2B2B3A]">{badge.nameVi}</p>
      {extra > 0 ? (
        <p className="font-extrabold text-[19px] text-[#6B6B7B]">và {extra} huy hiệu nữa!</p>
      ) : null}
    </motion.div>
  );
}
