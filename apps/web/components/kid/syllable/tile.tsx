"use client";

import { onsetSound, TONE_MARKS, TONE_NAMES, type Tone } from "@mtct/core";
import { motion, useReducedMotion } from "framer-motion";
import { forwardRef } from "react";
import { SPRING } from "../tokens";
import { PIECE_STYLE, type PieceKind, TILE_MIN } from "./types";

/** What a piece says out loud when it is touched: an onset says its SOUND ("bờ"), not its name. */
export function pieceSpeech(kind: PieceKind, value: string): string {
  if (kind === "onset") return onsetSound(value);
  if (kind === "tone") return TONE_NAMES[value as Tone] ?? value;
  return value;
}

/** The mark a tone hat wears, on a dotted circle so it can be seen alone: ◌̀ ◌́ ◌̉ ◌̃ ◌̣. */
export function toneGlyph(tone: Tone): string {
  return tone === "ngang" ? "◌" : `◌${TONE_MARKS[tone]}`;
}

/**
 * The shape of a piece is how a six-year-old tells them apart before she can read them: a square
 * for the onset, a long bar for the rime, a hat for the tone.
 */
export function PieceFace({
  kind,
  value,
  size = 1,
}: {
  kind: PieceKind;
  value: string;
  size?: number;
}) {
  const style = PIECE_STYLE[kind];
  const h = Math.round(TILE_MIN * size);
  if (kind === "tone") {
    const glyph = toneGlyph(value as Tone);
    return (
      <span
        className="relative flex items-end justify-center"
        style={{ width: h, height: h }}
        aria-hidden
      >
        <svg viewBox="0 0 100 100" width={h} height={h} className="absolute inset-0">
          <title>{TONE_NAMES[value as Tone]}</title>
          <path
            d="M50 6 C62 6 70 40 76 62 L94 70 C98 72 98 80 92 82 L8 82 C2 80 2 72 6 70 L24 62 C30 40 38 6 50 6 Z"
            fill={style.bg}
            stroke={style.ring}
            strokeWidth="5"
            strokeLinejoin="round"
          />
        </svg>
        <span
          className="relative mb-[22%] font-black leading-none"
          style={{ color: style.ink, fontSize: Math.round(h * 0.42) }}
        >
          {glyph}
        </span>
      </span>
    );
  }
  const width = kind === "rime" ? Math.max(h * 1.6, 34 + value.length * 30 * size) : h;
  return (
    <span
      className="flex items-center justify-center font-black leading-none"
      style={{
        width,
        height: h,
        borderRadius: kind === "onset" ? 18 : 40,
        background: style.bg,
        boxShadow: `inset 0 0 0 5px ${style.ring}`,
        color: style.ink,
        fontSize: Math.round(h * 0.46),
      }}
      aria-hidden
    >
      {value}
    </span>
  );
}

export interface PieceTileProps {
  kind: PieceKind;
  value: string;
  onTap?: () => void;
  onDragEnd?: (point: { x: number; y: number }) => void;
  disabled?: boolean;
  /** Softly glowing: the piece the voice is saying right now, or the one just touched. */
  lit?: boolean;
  /** Wiggles once in amber: this is not the piece for that slot. */
  nudge?: boolean;
  size?: number;
  testId?: string;
}

/** A piece a child can touch and drag. It speaks through `onTap`; the caller owns the voice. */
export const PieceTile = forwardRef<HTMLButtonElement, PieceTileProps>(function PieceTile(
  { kind, value, onTap, onDragEnd, disabled, lit, nudge, size = 1, testId },
  ref,
) {
  const reduce = useReducedMotion();
  const style = PIECE_STYLE[kind];
  return (
    <motion.button
      ref={ref}
      type="button"
      disabled={disabled}
      aria-label={`${style.label} ${pieceSpeech(kind, value)}`}
      data-testid={testId ?? `piece-${kind}`}
      data-kind={kind}
      data-value={value}
      onClick={() => {
        if (!disabled) onTap?.();
      }}
      drag={Boolean(onDragEnd && !disabled && !reduce)}
      dragSnapToOrigin
      dragElastic={0.6}
      onDragEnd={(_, info) => onDragEnd?.({ x: info.point.x, y: info.point.y })}
      whileTap={reduce || disabled ? undefined : { scale: 0.92 }}
      whileDrag={{ scale: 1.08, zIndex: 40 }}
      animate={
        nudge && !reduce
          ? { x: [0, -10, 10, -6, 6, 0] }
          : lit && !reduce
            ? { y: [0, -6, 0], scale: [1, 1.06, 1] }
            : { x: 0, y: 0, scale: 1 }
      }
      transition={nudge || lit ? { duration: 0.45 } : SPRING.press}
      className="relative flex touch-none select-none items-center justify-center rounded-[22px] p-1"
      style={{
        minWidth: TILE_MIN * size,
        minHeight: TILE_MIN * size,
        filter: disabled ? "saturate(0.6)" : undefined,
        boxShadow: nudge
          ? "0 0 0 6px #FFB020"
          : lit
            ? `0 0 0 6px ${style.ring}66, 0 14px 30px -14px rgba(43,43,58,0.55)`
            : "0 12px 26px -16px rgba(43,43,58,0.55)",
      }}
    >
      <PieceFace kind={kind} value={value} size={size} />
    </motion.button>
  );
});
