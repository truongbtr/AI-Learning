"use client";

import { motion } from "framer-motion";
import { HintBulb, SpeakerButton } from "../buttons";
import { Mascot } from "../mascot";
import { SPRING, STAGGER } from "../tokens";
import { Picture } from "./picture";
import { speechLang } from "./speech-lang";
import { type ExerciseProps, fillPlaceholders } from "./types";

/**
 * The frame every exercise sits in: the question card, the speaker that reads it, the hint lamp,
 * and the mascot standing by.
 *
 * Two rules from docs/06 live here so no exercise type can forget them: the question is read
 * aloud as soon as it appears (§1 rule 2), and while the child is answering the question itself
 * holds still — only the background and the mascot keep moving (§1 rule 9).
 */
export function ExerciseFrame({
  spec,
  vars,
  onHint,
  hintsUsed,
  disabled,
  children,
  extraTop,
  mascot = "robot",
}: {
  spec: ExerciseProps["spec"];
  vars?: Record<string, string>;
  onHint: () => void;
  hintsUsed: number;
  disabled?: boolean;
  children: React.ReactNode;
  extraTop?: React.ReactNode;
  mascot?: "robot" | "cu";
}) {
  const text = fillPlaceholders(spec.prompt.text, vars);
  const img = spec.prompt.image;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-5">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={SPRING.pop}
        className="flex w-full items-center gap-4 rounded-[36px] bg-white/94 px-6 py-5 shadow-[0_18px_46px_-24px_rgba(43,43,58,0.55)]"
        data-testid="exercise-prompt"
      >
        <SpeakerButton
          text={text}
          lang={spec.language === "en" ? "en-US" : "vi-VN"}
          clip={spec.prompt.audioKey}
          auto
        />
        <p className="min-w-0 flex-1 font-extrabold text-[30px] text-[#2B2B3A] leading-snug">
          {text}
        </p>
        <HintBulb onHint={onHint} used={hintsUsed} total={spec.hints.length} disabled={disabled} />
      </motion.div>

      {img ? (
        <motion.div
          variants={STAGGER.item}
          initial="hidden"
          animate="show"
          className="flex items-center justify-center"
          data-testid="prompt-image"
        >
          <Picture image={img} size={208} />
        </motion.div>
      ) : null}

      {extraTop}

      <motion.div
        variants={STAGGER.container}
        initial="hidden"
        animate="show"
        className="w-full"
        data-testid="exercise-body"
      >
        {children}
      </motion.div>

      <div className="pointer-events-none fixed right-4 bottom-4 opacity-95 sm:right-8">
        <Mascot name={mascot} state={disabled ? "cheer" : "think"} size={132} interactive />
      </div>
    </div>
  );
}

/** The mascot works one through first (`scaffold: "model"`, docs/04 §11.4 rung 3). */
export function ModelFirst({
  line,
  onReady,
  mascot = "robot",
  language,
}: {
  line: string;
  onReady: () => void;
  mascot?: "robot" | "cu";
  /** The exercise's language: an English model line is read by the English voice. */
  language?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full items-center gap-4 rounded-[32px] bg-[#FFF3DF] px-6 py-5"
      data-testid="model-first"
    >
      <Mascot name={mascot} state="talk" size={120} interactive={false} />
      <div className="flex-1">
        <p className="font-extrabold text-[24px] text-[#2B2B3A] leading-snug">{line}</p>
        <button
          type="button"
          onClick={onReady}
          className="mt-3 min-h-[64px] rounded-[26px] bg-[#2F80ED] px-7 font-extrabold text-[22px] text-white"
        >
          Con hiểu rồi!
        </button>
      </div>
      <SpeakerButton text={line} lang={speechLang(line, language)} auto />
    </motion.div>
  );
}
