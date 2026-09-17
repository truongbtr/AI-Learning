"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { SpeakerButton } from "../buttons";
import { useShortScreen } from "../fit-to-height";
import { playSound } from "../sound";
import { SPRING, STAGGER } from "../tokens";
import { useSpeak } from "../use-speak";
import { ExerciseFrame } from "./frame";
import { Picture } from "./picture";
import { type ExerciseProps, fillPlaceholders } from "./types";

/**
 * MCQ and LISTEN_CHOOSE — the same card grid, answered by tapping.
 *
 * LISTEN_CHOOSE differs in one thing that matters: the word to be heard is **played and never
 * printed** (ADR-14). A child who can read would otherwise answer a listening question by reading
 * it, and the exercise would measure nothing.
 */

function ChoiceCard({
  label,
  image,
  onPick,
  disabled,
  picked,
  state,
  language,
}: {
  label?: string;
  image?: { kind: string; value: string; labelVi?: string };
  onPick: (el: HTMLElement) => void;
  disabled?: boolean;
  picked: boolean;
  state?: "correct" | "almost" | null;
  language: "vi" | "en";
}) {
  const reduce = useReducedMotion();
  const short = useShortScreen();
  const ref = useRef<HTMLButtonElement>(null);
  const ring =
    state === "correct"
      ? "ring-[6px] ring-[#34C759]"
      : state === "almost"
        ? "ring-[6px] ring-[#FFB020]"
        : picked
          ? "ring-[6px] ring-[#2F80ED]"
          : "";

  return (
    <motion.button
      ref={ref}
      type="button"
      variants={STAGGER.item}
      disabled={disabled}
      onClick={() => ref.current && onPick(ref.current)}
      whileTap={reduce || disabled ? undefined : { scale: 0.94 }}
      whileHover={reduce || disabled ? undefined : { scale: 1.03, y: -4 }}
      animate={
        state === "almost" && !reduce
          ? { x: [0, -12, 12, -8, 8, 0] }
          : state === "correct" && !reduce
            ? { scale: [1, 1.08, 1] }
            : {}
      }
      transition={state ? { duration: 0.45 } : SPRING.press}
      className={`flex min-h-[152px] min-w-[152px] flex-1 flex-col items-center justify-center gap-2 rounded-[32px] bg-white px-6 py-5 shadow-[0_14px_34px_-18px_rgba(43,43,58,0.55)] [@media(max-height:820px)]:min-h-[116px] [@media(max-height:820px)]:py-3 ${ring}`}
      data-testid="choice"
      data-picked={picked ? "true" : undefined}
    >
      {image ? <Picture image={image} size={short ? 92 : 128} /> : null}
      {label ? (
        <span className="font-extrabold text-[34px] text-[#2B2B3A] leading-tight">{label}</span>
      ) : null}
      {image && !label ? <span className="sr-only">{image.labelVi ?? "hình"}</span> : null}
      {label && !image ? (
        <span className="sr-only">{language === "en" ? "answer" : "đáp án"}</span>
      ) : null}
    </motion.button>
  );
}

export function ChoiceExercise({
  spec,
  onSubmit,
  onHint,
  disabled,
  feedback,
  vars,
  mascot,
}: ExerciseProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const { speak } = useSpeak();
  const listening = spec.type === "LISTEN_CHOOSE";
  const heard = spec.listenTarget?.text ?? "";
  const lang = spec.language === "en" ? "en-US" : "vi-VN";

  // A listening question plays itself as soon as it appears, and can be replayed on demand.
  useEffect(() => {
    if (!listening || !heard) return;
    const id = window.setTimeout(() => {
      void speak(heard, { lang, clip: spec.listenTarget?.audioKey });
    }, 900);
    return () => window.clearTimeout(id);
  }, [listening, heard, lang, speak, spec.listenTarget?.audioKey]);

  useEffect(() => {
    if (feedback?.kind === "almost") setPicked(null);
  }, [feedback?.kind]);

  const pick = (id: string, el: HTMLElement) => {
    if (disabled) return;
    setPicked(id);
    playSound("cham");
    const r = el.getBoundingClientRect();
    onSubmit({ choiceId: id, at: { x: r.left + r.width / 2, y: r.top + r.height / 2 } });
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
      extraTop={
        listening ? (
          <div
            className="flex flex-col items-center gap-2 [@media(max-height:820px)]:flex-row [@media(max-height:820px)]:gap-4"
            data-testid="listen-again"
          >
            <SpeakerButton text={heard} lang={lang} clip={spec.listenTarget?.audioKey} size={96} />
            <span className="font-bold text-[20px] text-[#6B6B7B]">Bấm để nghe lại</span>
          </div>
        ) : null
      }
    >
      <div className="flex flex-wrap justify-center gap-4">
        {(spec.choices ?? []).map((c) => (
          <ChoiceCard
            key={c.id}
            label={c.text ? fillPlaceholders(c.text, vars) : undefined}
            image={c.image}
            language={spec.language}
            disabled={disabled}
            picked={picked === c.id}
            state={
              feedback && picked === c.id
                ? feedback.kind === "correct"
                  ? "correct"
                  : "almost"
                : feedback?.kind === "answer" && feedback.reveal === c.id
                  ? "correct"
                  : null
            }
            onPick={(el) => pick(c.id, el)}
          />
        ))}
      </div>
    </ExerciseFrame>
  );
}
