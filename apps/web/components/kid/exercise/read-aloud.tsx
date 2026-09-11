"use client";

import { matchReadAloud, type ReadAloudResult } from "@mtct/core";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { SpeakerButton } from "../buttons";
import { Mascot } from "../mascot";
import { playSound } from "../sound";
import { SPRING } from "../tokens";
import { ExerciseFrame } from "./frame";
import type { ExerciseProps } from "./types";

/**
 * READ_ALOUD: the child holds the button and reads, the browser writes down what it heard, and
 * `matchReadAloud` (in packages/core, so the server marks it the same way) lines the words up.
 *
 * No AI (ADR-10). When the device has no recogniser — Safari on an old iPad, say — the exercise
 * does not disappear: the child reads it to a grown-up, who presses "con đọc được rồi", which is
 * what docs/04 §7 calls the "cùng ba mẹ" path.
 */

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void)
    | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function createRecognition(lang: string): Recognition | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const r = new Ctor();
  r.lang = lang;
  r.continuous = false;
  r.interimResults = false;
  return r;
}

export function ReadAloudExercise({
  spec,
  onSubmit,
  onHint,
  disabled,
  vars,
  mascot,
}: ExerciseProps) {
  const [hintsUsed, setHintsUsed] = useState(0);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [result, setResult] = useState<ReadAloudResult | null>(null);
  const [supported, setSupported] = useState(true);
  const started = useRef(0);
  const recognition = useRef<Recognition | null>(null);
  const reduce = useReducedMotion();

  const words = spec.readTarget?.words ?? [];
  const text = spec.readTarget?.text ?? words.join(" ");
  const lang = spec.language === "en" ? "en-US" : "vi-VN";

  useEffect(() => {
    setSupported(createRecognition(lang) != null);
  }, [lang]);

  const stop = useCallback(() => {
    recognition.current?.stop();
    recognition.current = null;
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (disabled) return;
    const r = createRecognition(lang);
    if (!r) {
      setSupported(false);
      return;
    }
    recognition.current = r;
    started.current = Date.now();
    setHeard("");
    setResult(null);
    setListening(true);
    playSound("cham");
    r.onresult = (e) => {
      const said = e.results[0]?.[0]?.transcript ?? "";
      setHeard(said);
      const seconds = (Date.now() - started.current) / 1000;
      const marked = matchReadAloud(words, said, {
        lang: spec.language === "en" ? "en" : "vi",
        seconds,
      });
      setResult(marked);
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    r.start();
  }, [disabled, lang, words, spec.language]);

  useEffect(() => () => recognition.current?.stop(), []);

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
        {/* what to read: big, spaced, one line per phrase */}
        <div className="flex w-full max-w-3xl flex-wrap items-center justify-center gap-4 rounded-[34px] bg-white px-8 py-8 shadow-[0_16px_40px_-22px_rgba(43,43,58,0.5)]">
          {words.map((w, i) => {
            const mark = result?.words[i];
            // A word can repeat in a line ("ba ba"), so the position is part of the identity.
            const key = `${w}@${words.slice(0, i).filter((x) => x === w).length}`;
            return (
              <motion.span
                key={key}
                animate={mark?.ok && !reduce ? { scale: [1, 1.18, 1], color: "#34C759" } : {}}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`font-extrabold text-[52px] leading-tight ${
                  mark ? (mark.ok ? "text-[#34C759]" : "text-[#B4761A]") : "text-[#2B2B3A]"
                }`}
                data-testid="read-word"
                data-ok={mark?.ok ? "true" : undefined}
              >
                {w}
              </motion.span>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <SpeakerButton text={text} lang={lang} clip={spec.readTarget?.modelAudioKey} size={80} />
          <span className="font-bold text-[20px] text-[#6B6B7B]">Nghe mẫu</span>
        </div>

        {supported ? (
          <motion.button
            type="button"
            onPointerDown={start}
            onPointerUp={stop}
            onPointerLeave={() => listening && stop()}
            disabled={disabled}
            animate={listening && !reduce ? { scale: [1, 1.06, 1] } : { scale: 1 }}
            transition={
              listening ? { duration: 0.8, repeat: Number.POSITIVE_INFINITY } : SPRING.press
            }
            className={`flex min-h-[120px] min-w-[260px] items-center justify-center gap-3 rounded-[40px] px-10 font-extrabold text-[28px] text-white shadow-[0_12px_0_-2px_#1F5FBF] ${
              listening ? "bg-[#E85D9C]" : "bg-[#2F80ED]"
            }`}
            data-testid="mic-button"
            data-listening={listening ? "true" : undefined}
          >
            <span className="text-[34px]">{listening ? "🎙️" : "🎤"}</span>
            {listening ? "Đang nghe…" : "Giữ để đọc"}
          </motion.button>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-[32px] bg-[#FFF3DF] px-8 py-6 text-center">
            <Mascot name={mascot ?? "robot"} state="listen" size={110} interactive={false} />
            <p className="font-extrabold text-[22px] text-[#2B2B3A]">
              Máy này chưa nghe được. Con đọc cho ba mẹ nghe nhé!
            </p>
            <button
              type="button"
              onClick={() => onSubmit({ transcript: null, parentConfirmed: true })}
              className="min-h-[72px] rounded-[28px] bg-[#34C759] px-8 font-extrabold text-[22px] text-white"
              data-testid="parent-confirm"
            >
              Con đọc được rồi
            </button>
          </div>
        )}

        {heard ? (
          <p className="text-[20px] text-[#6B6B7B]">
            Mình nghe được: <span className="font-bold">“{heard}”</span>
          </p>
        ) : null}

        {result ? (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() =>
              onSubmit({
                transcript: heard,
                accuracy: result.accuracy,
                wordsPerMinute: result.wordsPerMinute,
                missed: result.missed,
              })
            }
            className="min-h-[84px] rounded-[34px] bg-[#34C759] px-10 font-extrabold text-[26px] text-white shadow-[0_10px_0_-2px_#22A344]"
            data-testid="read-submit"
          >
            {result.verdict === "good" ? "Xong, gửi bạn Cú!" : "Gửi bài đọc"}
          </motion.button>
        ) : null}
      </div>
    </ExerciseFrame>
  );
}
