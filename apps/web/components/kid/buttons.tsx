"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { playSound } from "./sound";
import { COLOR, KID, SPRING } from "./tokens";
import { useSpeak } from "./use-speak";

/**
 * The things a child presses (docs/06 §1.1, §1.3).
 *
 * Every one of them is at least 64 px, carries its label at 22 px or more, squashes when pressed
 * and springs back, and makes a short sound. None of them can ever be red.
 */

type ButtonTone = "primary" | "reward" | "quiet" | "correct";

const TONE: Record<ButtonTone, { bg: string; shade: string; text: string }> = {
  primary: { bg: "#2F80ED", shade: "#1F5FBF", text: "#FFFFFF" },
  reward: { bg: "#FFD447", shade: "#E8B92E", text: "#2B2B3A" },
  quiet: { bg: "#FFFFFF", shade: "#E6D9C0", text: "#2B2B3A" },
  correct: { bg: "#34C759", shade: "#22A344", text: "#FFFFFF" },
};

export interface BigButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: ButtonTone;
  /** A colour from the child's own theme wins over `tone`. */
  color?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  full?: boolean;
  className?: string;
  "data-testid"?: string;
}

export function BigButton({
  children,
  onClick,
  tone = "primary",
  color,
  icon,
  disabled,
  full,
  className,
  ...rest
}: BigButtonProps) {
  const reduce = useReducedMotion();
  const t = TONE[tone];
  const bg = color ?? t.bg;
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        playSound("cham");
        onClick?.();
      }}
      initial={reduce ? false : { scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: disabled ? 0.55 : 1 }}
      whileTap={reduce || disabled ? undefined : { scale: 0.94 }}
      whileHover={reduce || disabled ? undefined : { scale: 1.03 }}
      transition={SPRING.press}
      style={{
        minHeight: KID.buttonHeight,
        minWidth: KID.tapMin,
        borderRadius: 34,
        background: bg,
        color: tone === "quiet" ? COLOR.ink : t.text,
        boxShadow: `0 10px 0 -2px ${t.shade}, 0 18px 30px -14px rgba(43,43,58,0.5)`,
      }}
      className={`relative inline-flex items-center justify-center gap-3 px-8 font-extrabold text-[26px] ${
        full ? "w-full" : ""
      } ${className ?? ""}`}
      {...rest}
    >
      <span
        className="pointer-events-none absolute top-2 right-4 left-4 h-6 rounded-full bg-white/25"
        aria-hidden
      />
      {icon ? <span className="relative">{icon}</span> : null}
      <span className="relative">{children}</span>
    </motion.button>
  );
}

/** A square tile with a picture on it — subjects, collection items, the "play more" row. */
export function IconTile({
  label,
  emoji,
  src,
  onClick,
  color = "#FFFFFF",
  size = 132,
  badge,
}: {
  label: string;
  emoji?: string;
  src?: string;
  onClick?: () => void;
  color?: string;
  size?: number;
  badge?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={() => {
        playSound("cham");
        onClick?.();
      }}
      whileTap={reduce ? undefined : { scale: 0.94 }}
      whileHover={reduce ? undefined : { scale: 1.04, rotate: -1 }}
      transition={SPRING.press}
      style={{ width: size, minHeight: size, background: color, borderRadius: 28 }}
      className="relative flex flex-col items-center justify-center gap-2 p-3 shadow-[0_10px_24px_-14px_rgba(43,43,58,0.6)]"
    >
      {badge ? <span className="-top-2 -right-2 absolute">{badge}</span> : null}
      {src ? (
        // biome-ignore lint/performance/noImgElement: an SVG asset, not a photo — next/image adds nothing
        <img src={src} alt="" className="h-[62%] w-[62%] object-contain" />
      ) : (
        <span className="text-[44px] leading-none">{emoji}</span>
      )}
      <span className="font-extrabold text-[20px] text-[#2B2B3A] leading-tight">{label}</span>
    </motion.button>
  );
}

/**
 * The speaker: every piece of text a child meets can be read aloud (docs/06 §1 rule 2).
 * It goes quiet and grey when the device has no voice for that language, instead of reading
 * Vietnamese in English.
 */
export function SpeakerButton({
  text,
  lang = "vi-VN",
  clip,
  auto = false,
  size = 72,
  onSpeakingChange,
}: {
  text: string;
  lang?: string;
  clip?: string;
  /** Read it as soon as it appears — what the design asks for on every question. */
  auto?: boolean;
  size?: number;
  onSpeakingChange?: (speaking: boolean) => void;
}) {
  const { speak, state, speaking } = useSpeak();
  const reduce = useReducedMotion();
  const [tried, setTried] = useState(false);

  useEffect(() => {
    onSpeakingChange?.(speaking);
  }, [speaking, onSpeakingChange]);

  useEffect(() => {
    if (!auto || tried) return;
    setTried(true);
    void speak(text, { lang, clip });
  }, [auto, tried, speak, text, lang, clip]);

  const dead = state === "unavailable";
  return (
    <motion.button
      type="button"
      aria-label={`Nghe: ${text}`}
      onClick={() => void speak(text, { lang, clip })}
      whileTap={reduce ? undefined : { scale: 0.92 }}
      animate={speaking && !reduce ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={speaking ? { duration: 0.7, repeat: Number.POSITIVE_INFINITY } : SPRING.press}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className={`flex items-center justify-center shadow-[0_8px_18px_-10px_rgba(43,43,58,0.6)] ${
        dead ? "bg-[#E6E6EC] text-[#9A9AA8]" : "bg-white text-[#2F80ED]"
      }`}
      data-testid="speaker-button"
      data-state={state}
    >
      <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} aria-hidden fill="none">
        <path d="M4 9h3l5-4v14l-5-4H4z" fill="currentColor" />
        {dead ? (
          <path
            d="M16 9l5 6M21 9l-5 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ) : (
          <>
            <path
              d="M16 9c1.2 1 1.2 5 0 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M19 6c2.6 2.4 2.6 9.6 0 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              opacity={speaking ? 1 : 0.45}
            />
          </>
        )}
      </svg>
    </motion.button>
  );
}

/** The hint lamp: one tap, one hint, and it lights up so the child can see it worked. */
export function HintBulb({
  onHint,
  used = 0,
  total = 2,
  disabled,
}: {
  onHint: () => void;
  used?: number;
  total?: number;
  disabled?: boolean;
}) {
  const reduce = useReducedMotion();
  const lit = used > 0;
  const out = disabled || used >= total;
  return (
    <motion.button
      type="button"
      onClick={() => {
        if (out) return;
        playSound("cham");
        onHint();
      }}
      aria-label="Gợi ý"
      whileTap={reduce || out ? undefined : { scale: 0.9, rotate: -6 }}
      animate={lit && !reduce ? { rotate: [0, -4, 4, 0] } : {}}
      transition={{ duration: 0.6 }}
      style={{ width: 72, height: 72, borderRadius: 36 }}
      className={`flex items-center justify-center shadow-[0_8px_18px_-10px_rgba(43,43,58,0.6)] ${
        out ? "bg-[#EFE7D6] text-[#B5A98F]" : "bg-[#FFD447] text-[#7A5B00]"
      }`}
      data-testid="hint-bulb"
    >
      <svg viewBox="0 0 24 24" width={36} height={36} aria-hidden>
        <path d="M9 18h6v1.5a2.5 2.5 0 0 1-5 0V18Z" fill="currentColor" opacity={lit ? 1 : 0.75} />
        <path
          d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z"
          fill="currentColor"
          opacity={lit ? 1 : 0.85}
        />
      </svg>
    </motion.button>
  );
}

/** The way back to the grown-ups: hold for two seconds, so a stray tap cannot leave (docs/06 §1.8). */
export function ParentDoor({ onOpen }: { onOpen: () => void }) {
  const [held, setHeld] = useState(0);
  useEffect(() => {
    if (held === 0) return;
    const id = window.setInterval(() => setHeld((h) => (h > 0 ? h + 100 : 0)), 100);
    return () => window.clearInterval(id);
  }, [held]);
  useEffect(() => {
    if (held >= 2000) {
      setHeld(0);
      onOpen();
    }
  }, [held, onOpen]);
  return (
    <button
      type="button"
      aria-label="Dành cho ba mẹ (giữ 2 giây)"
      onPointerDown={() => setHeld(1)}
      onPointerUp={() => setHeld(0)}
      onPointerLeave={() => setHeld(0)}
      className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white/90 text-[#6B6B7B] shadow"
      data-testid="parent-door"
    >
      <span className="text-center font-extrabold text-[14px] leading-tight">ba mẹ</span>
      {held > 0 ? (
        <span
          className="absolute inset-0 rounded-full border-4 border-[#2F80ED]"
          style={{ clipPath: `inset(${100 - Math.min(100, held / 20)}% 0 0 0)` }}
        />
      ) : null}
    </button>
  );
}
