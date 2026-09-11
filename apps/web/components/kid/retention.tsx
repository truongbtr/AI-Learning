"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { BigButton } from "./buttons";
import { Mascot, type MascotName } from "./mascot";
import { playSound } from "./sound";
import { COLOR, SPRING } from "./tokens";
import { useSpeak } from "./use-speak";

/**
 * The things that bring a six-year-old back tomorrow (docs/06 §1.8b items 1–4, §1.8c P0 items).
 *
 * Every one of them follows the same two rules: nothing is ever taken away, and nothing compares
 * one child to the other.
 */

// --------------------------------------------------------------------------- the week's coat

export function EventBanner({ name, emoji, line }: { name: string; emoji: string; line: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      data-testid="event-banner"
      initial={reduce ? false : { y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={SPRING.pop}
      className="flex items-center gap-3 rounded-full bg-white/90 px-5 py-2 shadow-[0_8px_20px_-14px_rgba(43,43,58,0.7)]"
      title={line}
    >
      <motion.span
        className="text-[30px]"
        animate={reduce ? {} : { rotate: [0, -12, 12, 0] }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
      >
        {emoji}
      </motion.span>
      <span className="font-extrabold text-[20px] text-[#2B2B3A]">{name}</span>
    </motion.div>
  );
}

// --------------------------------------------------------------------------- the weekly egg

/** Stable keys for the little marks — a list of fixed slots, not array indexes. */
const CRACK_SLOTS = ["crack-a", "crack-b", "crack-c", "crack-d", "crack-e", "crack-f"];
const PIECE_SLOTS = ["piece-a", "piece-b", "piece-c", "piece-d", "piece-e", "piece-f"];

export function EggCard({
  cracks,
  needed,
  hatched,
}: {
  cracks: number;
  needed: number;
  hatched?: { name: string } | null;
}) {
  const reduce = useReducedMotion();
  return (
    <div
      data-testid="egg-card"
      data-cracks={cracks}
      className="flex items-center gap-3 rounded-[28px] bg-white/90 px-5 py-3 shadow-[0_10px_24px_-16px_rgba(43,43,58,0.7)]"
    >
      {/* biome-ignore lint/performance/noImgElement: an inline SVG asset, not a photo */}
      <motion.img
        src={`/art/effects/egg${cracks > 0 || hatched ? "-cracked" : ""}.svg`}
        alt=""
        width={56}
        height={56}
        animate={reduce ? {} : { rotate: [0, -6, 6, 0] }}
        transition={{ duration: 2.6, repeat: Number.POSITIVE_INFINITY }}
      />
      <div className="text-left">
        <p className="font-extrabold text-[20px] text-[#2B2B3A]">
          {hatched ? `${hatched.name} đã nở!` : "Trứng bí mật"}
        </p>
        <div className="mt-1 flex gap-1" aria-hidden>
          {CRACK_SLOTS.slice(0, needed).map((slot, i) => (
            <span
              key={slot}
              className="h-3 w-6 rounded-full"
              style={{ background: i < cracks ? COLOR.reward : "rgba(43,43,58,0.12)" }}
            />
          ))}
        </div>
        <p className="sr-only">{`Trứng nứt ${cracks} trên ${needed}`}</p>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------- the weekly picture

export function WeekPicture({
  imageKey,
  nameVi,
  pieces,
  total,
}: {
  imageKey: string;
  nameVi: string;
  pieces: number[];
  total: number;
}) {
  const cols = 3;
  const have = new Set(pieces);
  return (
    <div
      data-testid="week-picture"
      data-pieces={pieces.length}
      className="rounded-[28px] bg-white/90 p-4 shadow-[0_10px_24px_-16px_rgba(43,43,58,0.7)]"
    >
      <p className="mb-2 font-extrabold text-[20px] text-[#2B2B3A]">{nameVi}</p>
      <div className="relative aspect-[3/2] w-[clamp(14rem,26vw,20rem)] overflow-hidden rounded-2xl bg-[#FFF3DC]">
        {/* biome-ignore lint/performance/noImgElement: an inline SVG asset, not a photo */}
        <img src={`/${imageKey}`} alt={nameVi} className="h-full w-full object-cover" />
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2">
          {PIECE_SLOTS.slice(0, total).map((slot, i) => (
            <motion.div
              key={slot}
              initial={false}
              animate={{ opacity: have.has(i) ? 0 : 1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center border border-white/70 bg-[#FFF8EC] text-[22px]"
              style={{ gridColumn: (i % cols) + 1, gridRow: Math.floor(i / cols) + 1 }}
            >
              ❔
            </motion.div>
          ))}
        </div>
      </div>
      <p className="mt-2 font-extrabold text-[#6B6B7B] text-[18px]">
        {pieces.length}/{total} mảnh — mỗi ngày học được một mảnh
      </p>
    </div>
  );
}

// --------------------------------------------------------------------------- the letters box

export interface KidLetter {
  id: string;
  text: string;
  fromName: string | null;
  audioKey: string | null;
}

export function MailBox({
  unopened,
  letter,
  mascot = "robot",
  onOpen,
}: {
  unopened: number;
  letter: KidLetter | null;
  mascot?: MascotName;
  onOpen: (id: string) => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const { speak } = useSpeak();
  const reduce = useReducedMotion();

  if (unopened === 0 || !letter) return null;
  return (
    <>
      <motion.button
        type="button"
        data-testid="mailbox"
        onClick={() => {
          playSound("cham");
          setOpen(true);
          void onOpen(letter.id);
          speak(letter.text, { lang: "vi" });
        }}
        animate={reduce ? {} : { y: [0, -6, 0] }}
        transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY }}
        className="relative flex min-h-[64px] items-center gap-2 rounded-[28px] bg-white/92 px-5 font-extrabold text-[20px] shadow-[0_10px_24px_-14px_rgba(43,43,58,0.7)]"
      >
        <span className="text-[30px]">💌</span> Thư cho con
        <span className="-top-2 -right-2 absolute flex h-8 w-8 items-center justify-center rounded-full bg-[#E85D9C] text-[18px] text-white">
          {unopened}
        </span>
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B2B3A]/45 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              transition={SPRING.pop}
              className="flex max-w-xl flex-col items-center gap-4 rounded-[32px] bg-[#FFF8EC] p-8 text-center"
            >
              <Mascot name={mascot} state="talk" size={150} interactive={false} />
              <p className="font-extrabold text-[26px] text-[#2B2B3A] leading-snug">
                {letter.text}
              </p>
              <p className="font-extrabold text-[20px] text-[#6B6B7B]">
                {letter.fromName ? `— ${letter.fromName}` : "— Ba mẹ"}
              </p>
              <BigButton tone="reward" onClick={() => setOpen(false)}>
                Cảm ơn ba mẹ!
              </BigButton>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

/** The big gold star a parent sends with one tap (docs/06 §1.8c item 10). */
export function BigGoldStar({ from, onDone }: { from: string; onDone: () => void }) {
  useEffect(() => {
    playSound("huy-hieu");
    const id = window.setTimeout(onDone, 4200);
    return () => window.clearTimeout(id);
  }, [onDone]);
  return (
    <motion.div
      data-testid="big-gold-star"
      className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* biome-ignore lint/performance/noImgElement: an inline SVG asset, not a photo */}
      <motion.img
        src="/art/effects/star-gold-big.svg"
        alt=""
        width={220}
        height={220}
        initial={{ y: -260, scale: 0.4, rotate: -30 }}
        animate={{ y: 0, scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 12 }}
      />
      <p className="rounded-full bg-white/95 px-6 py-3 font-black text-[24px] text-[#2B2B3A]">
        {from} gửi con một ngôi sao vàng!
      </p>
    </motion.div>
  );
}

// --------------------------------------------------------------------------- during a session

/** Thirty seconds of standing up and moving (docs/06 §1.8b item 3). Worth one star. */
export function MovementBreak({
  mascot = "robot",
  canSkip,
  onDone,
}: {
  mascot?: MascotName;
  canSkip: boolean;
  onDone: (completed: boolean) => void;
}) {
  const [left, setLeft] = useState(30);
  const { speak } = useSpeak();
  const move = MOVES[Math.floor(Math.random() * MOVES.length)] as string;

  useEffect(() => {
    speak(`Mình cùng nghỉ một chút nhé! ${move}`, { lang: "vi" });
    const id = window.setInterval(() => setLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [move, speak]);

  useEffect(() => {
    if (left === 0) onDone(true);
  }, [left, onDone]);

  return (
    <div
      data-testid="movement-break"
      className="flex flex-col items-center gap-5 rounded-[32px] bg-white/92 p-8 text-center"
    >
      <Mascot name={mascot} state="celebrate" size={190} interactive />
      <p className="font-black text-[30px] text-[#2B2B3A]">{move}</p>
      <div className="relative flex h-[120px] w-[120px] items-center justify-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <title>Đếm ngược</title>
          <circle cx="50" cy="50" r="44" fill="none" stroke="#FFF0C8" strokeWidth="10" />
          <motion.circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke={COLOR.reward}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 44}
            animate={{ strokeDashoffset: 2 * Math.PI * 44 * (1 - left / 30) }}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <span className="font-black text-[40px] text-[#2B2B3A] tabular-nums">{left}</span>
      </div>
      {canSkip ? (
        <button
          type="button"
          onClick={() => onDone(false)}
          className="min-h-[64px] rounded-[28px] bg-white px-7 font-extrabold text-[20px] text-[#6B6B7B] shadow"
        >
          Bỏ qua lần này
        </button>
      ) : (
        <p className="font-extrabold text-[19px] text-[#6B6B7B]">Đứng dậy cùng mình nào!</p>
      )}
    </div>
  );
}

const MOVES = [
  "Đứng lên nhảy 5 cái nào!",
  "Vươn vai thật cao nhé!",
  "Xoay người sang trái, sang phải!",
  "Giơ tay lên trời và vẫy 5 lần!",
];

/** "Carry on or stop?" after eight exercises (docs/06 §1.8b item 4). Stopping is a real choice. */
export function CarryOnPrompt({
  mascot = "robot",
  onCarryOn,
  onStop,
}: {
  mascot?: MascotName;
  onCarryOn: () => void;
  onStop: () => void;
}) {
  const { speak } = useSpeak();
  useEffect(() => {
    speak("Con muốn chơi tiếp hay nghỉ nhé?", { lang: "vi" });
  }, [speak]);
  return (
    <div
      data-testid="carry-on"
      className="flex flex-col items-center gap-5 rounded-[32px] bg-white/92 p-8 text-center"
    >
      <Mascot name={mascot} state="think" size={180} interactive />
      <p className="font-black text-[28px] text-[#2B2B3A]">Chơi tiếp hay nghỉ?</p>
      <p className="font-extrabold text-[20px] text-[#6B6B7B]">
        Nghỉ bây giờ con vẫn giữ sao và ngọn lửa nhé!
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <BigButton tone="primary" onClick={onCarryOn} data-testid="carry-on-yes">
          ▶️ Chơi tiếp
        </BigButton>
        <BigButton tone="quiet" onClick={onStop} data-testid="carry-on-stop">
          🛌 Nghỉ thôi
        </BigButton>
      </div>
    </div>
  );
}

/** The station where the child picks one of two exercises (docs/06 §1.8b item 2). */
export function ChoiceStation({
  options,
  onPick,
}: {
  options: { order: number; label: string; icon: string }[];
  onPick: (order: number) => void;
}) {
  return (
    <div
      data-testid="choice-station"
      className="flex flex-col items-center gap-5 rounded-[32px] bg-white/92 p-8 text-center"
    >
      <p className="font-black text-[28px] text-[#2B2B3A]">Con chọn bài nào?</p>
      <div className="flex flex-wrap justify-center gap-5">
        {options.map((o) => (
          <motion.button
            key={o.order}
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              playSound("cham");
              onPick(o.order);
            }}
            className="flex min-h-[140px] w-[190px] flex-col items-center justify-center gap-2 rounded-[28px] bg-[#FFF3DC] p-5 font-extrabold text-[21px] text-[#2B2B3A] shadow-[0_10px_24px_-14px_rgba(43,43,58,0.7)]"
          >
            <span className="text-[44px]">{o.icon}</span>
            {o.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
