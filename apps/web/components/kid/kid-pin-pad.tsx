"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SpeakerButton } from "./buttons";
import { Mascot } from "./mascot";
import { PicturePinGrid } from "./picture-pin-grid";
import { SPRING } from "./tokens";

/**
 * `KidPinPad` (docs/06 §1.3): the picture code, dressed for the world.
 *
 * The grid itself is the phase-0 component — same rules, same four pictures in order. What is
 * added here is everything that makes it feel like the app and not a form: the companion waiting
 * beside it, the instruction read aloud, and a card that springs in.
 */
export function KidPinPad({
  name,
  setKey,
  onComplete,
  disabled,
  resetToken,
  error,
  mascot = "robot",
}: {
  name: string;
  setKey: string | null | undefined;
  onComplete: (keys: string[]) => void;
  disabled?: boolean;
  resetToken?: number;
  error?: string | null;
  mascot?: "robot" | "cu";
}) {
  const reduce = useReducedMotion();
  const line = `Chào ${name}! Chọn bốn hình của con nhé.`;
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={SPRING.pop}
      className="w-full max-w-3xl rounded-[40px] bg-white/92 p-6 shadow-[0_30px_70px_-30px_rgba(43,43,58,0.6)]"
      data-testid="kid-pin-pad"
    >
      <div className="mb-4 flex items-center gap-4">
        <Mascot name={mascot} state={error ? "encourage" : "greet"} size={110} />
        <div className="flex-1">
          <p className="font-extrabold text-[26px] text-[#2B2B3A] leading-tight">{line}</p>
          {error ? <p className="mt-1 font-bold text-[21px] text-[#B4761A]">{error}</p> : null}
        </div>
        <SpeakerButton text={error ? `${line} ${error}` : line} auto />
      </div>
      <PicturePinGrid
        setKey={setKey}
        onComplete={onComplete}
        disabled={disabled}
        resetToken={resetToken}
        size="big"
      />
    </motion.div>
  );
}
