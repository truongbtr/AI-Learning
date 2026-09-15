"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { playSound } from "../sound";
import { SPRING, STAGGER } from "../tokens";
import { ExerciseFrame } from "./frame";
import { type ExerciseProps, imageSrc } from "./types";

/**
 * COUNT_TAP: the child touches each thing and it is counted for them — the way a six-year-old
 * counts with a finger, which is exactly the skill (docs/04 §5).
 *
 * How many things are drawn comes from `countTarget.objects.repeat`, never from the answer: the
 * count itself is in `answerKey.correctCount`, which the device never receives (ADR-14).
 */
export function CountTapExercise({
  spec,
  onSubmit,
  onHint,
  disabled,
  vars,
  mascot,
}: ExerciseProps) {
  const [tapped, setTapped] = useState<number[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const reduce = useReducedMotion();
  const target = spec.countTarget;
  const objects = target?.objects;
  const total = Math.max(1, Math.min(20, objects?.repeat ?? 6));
  const src = objects ? imageSrc(objects.value, objects.kind) : null;
  const grid = target?.layout === "line";

  const tap = (i: number) => {
    if (disabled || tapped.includes(i)) return;
    playSound("cham");
    setTapped((t) => [...t, i]);
  };

  return (
    <ExerciseFrame
      spec={spec}
      vars={vars}
      onHint={() => {
        setHintsUsed((n) => Math.min(spec.hints.length, n + 1));
        onHint();
      }}
      hintsUsed={hintsUsed}
      disabled={disabled}
      mascot={mascot}
    >
      <div className="flex flex-col items-center gap-6">
        <div
          className={`flex w-full max-w-3xl flex-wrap items-center justify-center gap-4 rounded-[34px] bg-white/70 p-6 ${
            grid ? "flex-nowrap overflow-x-auto" : ""
          }`}
          data-testid="count-objects"
        >
          {Array.from({ length: total }, (_, i) => i).map((i) => {
            const done = tapped.includes(i);
            return (
              <motion.button
                key={`obj-${i}`}
                type="button"
                variants={STAGGER.item}
                onClick={() => tap(i)}
                disabled={disabled}
                whileTap={reduce ? undefined : { scale: 0.88 }}
                animate={done && !reduce ? { scale: [1, 1.25, 1.05], rotate: [0, -8, 0] } : {}}
                // a three-step pop cannot be a spring (motion allows two keyframes per spring)
                transition={done ? { duration: 0.35, ease: "easeOut" } : SPRING.press}
                className="relative flex min-h-[96px] min-w-[96px] items-center justify-center rounded-[26px]"
                data-testid="count-object"
                data-counted={done ? "true" : undefined}
              >
                {src ? (
                  // biome-ignore lint/performance/noImgElement: local SVG asset
                  <img
                    src={src}
                    alt=""
                    className={`h-20 w-20 object-contain ${done ? "" : "opacity-90"}`}
                  />
                ) : (
                  <span className="text-[62px] leading-none">{objects?.value ?? "⭐"}</span>
                )}
                {done ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={SPRING.pop}
                    className="-top-1 -right-1 absolute flex h-9 w-9 items-center justify-center rounded-full bg-[#2F80ED] font-extrabold text-[19px] text-white"
                  >
                    {tapped.indexOf(i) + 1}
                  </motion.span>
                ) : null}
              </motion.button>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <span className="font-extrabold text-[28px] text-[#2B2B3A]">
            Đã đếm: <span className="tabular-nums">{tapped.length}</span>
          </span>
          {tapped.length > 0 ? (
            <button
              type="button"
              onClick={() => setTapped([])}
              disabled={disabled}
              className="min-h-[64px] rounded-[26px] bg-white px-6 font-extrabold text-[21px] text-[#6B6B7B]"
            >
              Đếm lại
            </button>
          ) : null}
        </div>

        <motion.button
          type="button"
          onClick={() => {
            if (disabled || tapped.length === 0) return;
            onSubmit({ count: tapped.length });
          }}
          disabled={disabled || tapped.length === 0}
          animate={{ opacity: tapped.length > 0 && !disabled ? 1 : 0.45 }}
          className="min-h-[84px] rounded-[34px] bg-[#34C759] px-10 font-extrabold text-[26px] text-white shadow-[0_10px_0_-2px_#22A344]"
          data-testid="count-submit"
        >
          Xong!
        </motion.button>
      </div>
    </ExerciseFrame>
  );
}
