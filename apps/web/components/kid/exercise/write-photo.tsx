"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { Mascot } from "../mascot";
import { playSound } from "../sound";
import { SPRING } from "../tokens";
import { ExerciseFrame } from "./frame";
import type { ExerciseProps } from "./types";

/**
 * WRITE_PHOTO: the child writes on paper — which is the point, a six-year-old learning to write
 * needs a pencil — and a grown-up photographs it. The attempt is stored as `PENDING` and marked
 * later through the AI queue (docs/13), so nothing here pretends to judge handwriting.
 *
 * The camera is a plain file input with `capture`: on an iPad that opens the camera directly, and
 * where it does not, the child can pick a photo instead. No getUserMedia, no permission dialog in
 * the middle of a lesson.
 */
export function WritePhotoExercise({
  spec,
  onSubmit,
  onHint,
  disabled,
  vars,
  mascot,
}: ExerciseProps) {
  const [hintsUsed, setHintsUsed] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const pick = (f: File | undefined) => {
    if (!f) return;
    playSound("cham");
    setFile(f);
    setPreview(URL.createObjectURL(f));
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
        {spec.rubric?.criteria?.length ? (
          <ul className="w-full max-w-2xl space-y-2 rounded-[32px] bg-white/85 px-8 py-6">
            {spec.rubric.criteria.map((c) => (
              <li key={c} className="flex items-start gap-3 text-[22px] text-[#2B2B3A]">
                <span className="mt-1 text-[#34C759]">✓</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {preview ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={SPRING.pop}
            className="overflow-hidden rounded-[32px] bg-white p-3 shadow-[0_16px_40px_-22px_rgba(43,43,58,0.5)]"
          >
            {/* biome-ignore lint/performance/noImgElement: a local object URL, never a remote photo */}
            <img
              src={preview}
              alt="Ảnh bài viết của con"
              className="max-h-[340px] rounded-[24px]"
            />
          </motion.div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-[32px] bg-white/70 px-10 py-8 text-center">
            <Mascot name={mascot ?? "robot"} state="encourage" size={130} interactive={false} />
            <p className="max-w-md font-extrabold text-[24px] text-[#2B2B3A] leading-snug">
              Con viết vào vở nhé. Xong rồi nhờ ba mẹ chụp giúp!
            </p>
          </div>
        )}

        <input
          ref={input}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
          data-testid="photo-input"
        />

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={disabled}
            className="min-h-[84px] rounded-[34px] bg-[#2F80ED] px-9 font-extrabold text-[24px] text-white shadow-[0_10px_0_-2px_#1F5FBF]"
            data-testid="photo-capture"
          >
            📷 {preview ? "Chụp lại" : "Gọi ba mẹ chụp"}
          </button>
          {preview ? (
            <button
              type="button"
              onClick={() => onSubmit({ photo: file, pending: true })}
              disabled={disabled}
              className="min-h-[84px] rounded-[34px] bg-[#34C759] px-9 font-extrabold text-[24px] text-white shadow-[0_10px_0_-2px_#22A344]"
              data-testid="photo-submit"
            >
              Gửi cho bạn Cú
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSubmit({ photo: null, skipped: true })}
              disabled={disabled}
              className="min-h-[84px] rounded-[34px] bg-white px-9 font-extrabold text-[22px] text-[#6B6B7B]"
              data-testid="photo-skip"
            >
              Để chụp sau
            </button>
          )}
        </div>
        <p className="text-[20px] text-[#6B6B7B]">Bạn Cú sẽ xem và khen con sau nhé!</p>
      </div>
    </ExerciseFrame>
  );
}
