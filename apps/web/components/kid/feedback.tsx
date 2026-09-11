"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { Mascot } from "./mascot";
import { playSound } from "./sound";
import { COLOR, SPRING } from "./tokens";

/**
 * How the child is told how it went (docs/06 §1 rule 4, §1.3).
 *
 * Three states only — `correct`, `almost`, `answer` — and none of them is a failure. There is no
 * red, no cross, no "sai". "Almost" shakes the card gently, the mascot leans in, and the hint
 * slides up from it. After the third try the answer is shown and read out, and the session
 * carries on.
 */

export type FeedbackKind = "correct" | "almost" | "answer" | null;

export interface FeedbackOverlayProps {
  kind: FeedbackKind;
  /** What the mascot says. Kept short: a child reads two lines, not five. */
  message?: string;
  /** Shown under the message when the answer is revealed. */
  explanation?: string;
  mascot?: "robot" | "cu";
  onDone?: () => void;
  /** `correct` closes itself after this many ms; the others wait for a tap. */
  autoMs?: number;
}

const TONE = {
  correct: { bg: "rgba(52,199,89,0.94)", icon: "✓", text: "#FFFFFF", state: "cheer" as const },
  almost: { bg: "rgba(255,176,32,0.96)", icon: "↻", text: "#2B2B3A", state: "encourage" as const },
  answer: { bg: "rgba(47,128,237,0.95)", icon: "★", text: "#FFFFFF", state: "talk" as const },
};

export function FeedbackOverlay({
  kind,
  message,
  explanation,
  mascot = "robot",
  onDone,
  autoMs = 1500,
}: FeedbackOverlayProps) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!kind) return;
    playSound(kind === "correct" ? "dung" : "gan-dung");
    if (kind !== "correct") return;
    const id = window.setTimeout(() => onDone?.(), autoMs);
    return () => window.clearTimeout(id);
  }, [kind, autoMs, onDone]);

  return (
    <AnimatePresence>
      {kind ? (
        <motion.div
          key={kind}
          className="fixed inset-0 z-40 flex items-end justify-center p-6 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => kind !== "correct" && onDone?.()}
          data-testid="feedback-overlay"
          data-kind={kind}
        >
          <motion.div
            initial={reduce ? {} : { y: 60, scale: 0.9 }}
            animate={{ y: 0, scale: 1 }}
            exit={reduce ? {} : { y: 40, opacity: 0 }}
            transition={SPRING.pop}
            style={{ background: TONE[kind].bg, color: TONE[kind].text }}
            className="flex w-full max-w-2xl items-center gap-5 rounded-[36px] px-7 py-6 shadow-[0_24px_60px_-20px_rgba(43,43,58,0.6)]"
          >
            <Mascot name={mascot} state={TONE[kind].state} size={128} interactive={false} />
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-[30px] leading-tight">
                <span className="mr-2">{TONE[kind].icon}</span>
                {message ??
                  (kind === "correct"
                    ? "Tuyệt lắm!"
                    : kind === "almost"
                      ? "Gần đúng rồi, thử lại nhé!"
                      : "Mình cùng xem nhé")}
              </p>
              {explanation ? <p className="mt-2 text-[22px] leading-snug">{explanation}</p> : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/** The hint, sliding up from the mascot (docs/06 §1.3 "gợi ý trượt lên từ mascot"). */
export function HintBubble({
  hint,
  mascot = "robot",
}: {
  hint: string | null;
  mascot?: "robot" | "cu";
}) {
  return (
    <AnimatePresence>
      {hint ? (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20 }}
          transition={SPRING.pop}
          className="flex items-end gap-3"
          data-testid="hint-bubble"
        >
          <Mascot name={mascot} state="encourage" size={110} interactive={false} />
          <div className="mb-4 max-w-lg rounded-[28px] bg-[#FFF8EC] px-6 py-4 shadow-[0_12px_30px_-16px_rgba(43,43,58,0.6)]">
            <p className="font-extrabold text-[22px] text-[#2B2B3A] leading-snug">{hint}</p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/** Confetti for the end of a session — lazy so canvas-confetti never loads on a quiet screen. */
export async function fireConfetti(power = 1) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const { default: confetti } = await import("canvas-confetti");
  const colours = ["#FFD447", "#FF8C42", "#2F80ED", "#7BC67E", "#E85D9C", "#7C5CFF"];
  confetti({
    particleCount: Math.round(70 * power),
    spread: 78,
    origin: { y: 0.7 },
    colors: colours,
  });
  window.setTimeout(
    () =>
      confetti({
        particleCount: Math.round(45 * power),
        spread: 110,
        origin: { y: 0.6 },
        colors: colours,
      }),
    240,
  );
}

export function ConfettiCelebration({ fire, power = 1 }: { fire: boolean; power?: number }) {
  useEffect(() => {
    if (fire) void fireConfetti(power);
  }, [fire, power]);
  return null;
}

/** A round badge with a tick — used on finished stations and done items. */
export function DoneTick({ size = 40 }: { size?: number }) {
  return (
    <span
      className="flex items-center justify-center rounded-full shadow"
      style={{ width: size, height: size, background: COLOR.correct }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} aria-hidden="true">
        <path
          d="M5 13l4 4 10-10"
          fill="none"
          stroke="#fff"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
