"use client";

import { matchReadAloud } from "@mtct/core";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { BigButton, SpeakerButton } from "../buttons";
import { Picture } from "../exercise/picture";
import { playSound } from "../sound";
import { SPRING } from "../tokens";
import { useSpeak } from "../use-speak";
import type { SyllableGameProps, SyllableRound } from "./types";

type ReadRound = Extract<SyllableRound, { game: "read" }>;

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

function createRecognition(): Recognition | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const r = new Ctor();
  r.lang = "vi-VN";
  r.continuous = false;
  r.interimResults = false;
  return r;
}

/**
 * (f) "Đọc to" — the child reads out loud the syllables she has just built.
 *
 * It is READ_ALOUD's machinery (the same `matchReadAloud` the exercise uses, the same "cùng ba mẹ"
 * path of docs/04 §7) around a single syllable: hold the microphone and read; a device that hears
 * nothing — or has no recogniser at all — hands the job to a grown-up, who presses "Con đọc được
 * rồi". A reading the microphone missed is never reported: a machine that did not hear is not a
 * child who could not read.
 */
export function ReadGame({ round, onMeeting, onDone }: SyllableGameProps<ReadRound>) {
  const reduce = useReducedMotion();
  const { speak } = useSpeak();
  const [index, setIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [heard, setHeard] = useState(false);
  const [missed, setMissed] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const item = round.items[index];

  useEffect(() => {
    setSupported(createRecognition() != null);
  }, []);

  useEffect(() => {
    if (!item) return;
    setHeard(false);
    setMissed(false);
    const id = window.setTimeout(
      () => void speak("Con đọc to tiếng này nhé!", { lang: "vi-VN" }),
      400,
    );
    return () => window.clearTimeout(id);
  }, [item, speak]);

  useEffect(() => () => recognition.current?.stop(), []);

  const next = useCallback(() => {
    window.setTimeout(() => {
      if (index + 1 >= round.items.length) onDone();
      else setIndex((i) => i + 1);
    }, 1100);
  }, [index, round.items.length, onDone]);

  const success = useCallback(() => {
    if (!item || heard) return;
    setHeard(true);
    playSound("dung");
    onMeeting(item.id, { game: "read" });
    void speak(item.text, { lang: "vi-VN" });
    next();
  }, [item, heard, onMeeting, speak, next]);

  const listen = useCallback(() => {
    if (!item || listening || heard) return;
    const r = createRecognition();
    if (!r) {
      setSupported(false);
      return;
    }
    recognition.current = r;
    setListening(true);
    setMissed(false);
    playSound("cham");
    r.onresult = (e) => {
      const said = e.results[0]?.[0]?.transcript ?? "";
      const verdict = matchReadAloud([item.text], said, { lang: "vi" }).verdict;
      if (verdict === "good") success();
      else setMissed(true);
    };
    r.onerror = () => {
      setListening(false);
      setMissed(true);
    };
    r.onend = () => setListening(false);
    r.start();
  }, [item, listening, heard, success]);

  if (!item) return null;

  return (
    <div
      className="flex w-full flex-col items-center gap-5"
      data-testid="syl-read"
      data-target={item.text}
    >
      <div className="flex items-center gap-5">
        {item.picture ? (
          <Picture image={item.picture as never} size={120} alt={item.meaning} />
        ) : null}
        <motion.span
          key={item.id}
          initial={reduce ? false : { scale: 0.7, opacity: 0 }}
          animate={{ scale: heard && !reduce ? [1, 1.15, 1] : 1, opacity: 1 }}
          transition={SPRING.pop}
          className="rounded-[34px] bg-white px-8 py-3 font-black text-[96px] text-[#2B2B3A] leading-none shadow-[0_14px_30px_-18px_rgba(43,43,58,0.55)]"
          style={heard ? { boxShadow: "0 0 0 8px #34C759" } : undefined}
        >
          {item.text}
        </motion.span>
        <SpeakerButton text={item.text} lang="vi-VN" size={84} />
      </div>

      {supported ? (
        <motion.button
          type="button"
          onClick={listen}
          disabled={listening || heard}
          whileTap={reduce ? undefined : { scale: 0.92 }}
          animate={listening && !reduce ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={
            listening ? { duration: 0.9, repeat: Number.POSITIVE_INFINITY } : SPRING.press
          }
          className="flex h-[128px] w-[128px] items-center justify-center rounded-full bg-[#2F80ED] text-[60px] shadow-[0_12px_0_-2px_#1F5FBF]"
          aria-label="Chạm rồi đọc"
          data-testid="syl-read-mic"
        >
          🎤
        </motion.button>
      ) : null}

      {!supported || missed ? (
        <div className="flex flex-col items-center gap-2">
          <span className="font-bold text-[22px] text-[#6B6B7B]">Con đọc cho ba mẹ nghe nhé!</span>
          <BigButton tone="reward" onClick={success} disabled={heard} data-testid="syl-read-parent">
            Con đọc được rồi
          </BigButton>
        </div>
      ) : null}
    </div>
  );
}
