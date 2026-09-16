"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SpeakerButton } from "../buttons";
import { Picture } from "../exercise/picture";
import { playSound } from "../sound";
import { SPRING } from "../tokens";
import { useSpeak } from "../use-speak";
import type { VocabGameProps } from "./types";

/**
 * "Nói to lên" — the mascot says the word, the child says it back.
 *
 * Saying a word out loud is what makes it stick, so this game exists even though a browser
 * recogniser hears a six-year-old's English imperfectly. That is why it is generous: anything
 * close enough counts, and on a device with no recogniser (Safari on an older iPad) the child
 * simply says it to a grown-up and taps "con nói được rồi" — the "cùng ba mẹ" path of docs/04 §7.
 *
 * Nothing here is ever called wrong: a word not heard is a word to meet again tomorrow.
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

/** Close enough for a six-year-old: same first sound and no more than one letter out of place. */
export function soundsLike(said: string, target: string): boolean {
  const a = said
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .trim();
  const b = target
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .trim();
  if (!a || !b) return false;
  if (a === b || a.includes(b)) return true;
  // the recogniser often returns a short phrase — look at every word in it
  return a.split(/\s+/).some((token) => {
    if (token === b) return true;
    if (token[0] !== b[0]) return false;
    if (Math.abs(token.length - b.length) > 1) return false;
    let diff = 0;
    for (let i = 0, j = 0; i < token.length && j < b.length; i++, j++) {
      if (token[i] === b[j]) continue;
      diff++;
      if (diff > 1) return false;
      if (token.length > b.length) j--;
      else if (token.length < b.length) i--;
    }
    return true;
  });
}

const ROUND_WORDS = 3;

export function SayItGame({ words, onMeeting, onDone }: VocabGameProps) {
  const reduce = useReducedMotion();
  const { speak } = useSpeak();
  const order = useMemo(() => words.slice(0, ROUND_WORDS), [words]);
  const [index, setIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [state, setState] = useState<"waiting" | "good" | "again">("waiting");
  const [supported, setSupported] = useState(true);
  const recognition = useRef<Recognition | null>(null);

  const target = order[index];

  useEffect(() => {
    setSupported(createRecognition("en-US") != null);
  }, []);

  useEffect(() => {
    if (!target) return;
    setState("waiting");
    setHeard("");
    const id = window.setTimeout(() => void speak(target.en, { lang: "en-US" }), 400);
    return () => window.clearTimeout(id);
  }, [target, speak]);

  const next = useCallback(
    (correct: boolean) => {
      if (!target) return;
      playSound(correct ? "dung" : "gan-dung");
      onMeeting({ wordId: target.wordId, correct });
      window.setTimeout(() => {
        if (index + 1 >= order.length) onDone();
        else setIndex((i) => i + 1);
      }, 1200);
    },
    [target, onMeeting, onDone, index, order.length],
  );

  const listen = useCallback(() => {
    if (!target || listening) return;
    const r = createRecognition("en-US");
    if (!r) {
      setSupported(false);
      return;
    }
    recognition.current = r;
    setListening(true);
    r.onresult = (e) => {
      const said = e.results[0]?.[0]?.transcript ?? "";
      setHeard(said);
      const ok = soundsLike(said, target.en);
      setState(ok ? "good" : "again");
      next(ok);
    };
    r.onerror = () => {
      setListening(false);
      recognition.current = null;
    };
    r.onend = () => {
      setListening(false);
      recognition.current = null;
    };
    r.start();
  }, [target, listening, next]);

  useEffect(() => () => recognition.current?.stop(), []);

  if (!target) return null;

  return (
    <div className="flex w-full flex-col items-center gap-5" data-testid="vocab-say-it">
      <Picture image={target.picture} size={140} alt={target.vi} />
      <div className="flex items-center gap-3">
        <SpeakerButton text={target.en} lang="en-US" size={80} />
        <div className="flex flex-col">
          <span className="font-extrabold text-[32px] text-[#2B2B3A]">{target.en}</span>
          <span className="font-bold text-[20px] text-[#6B6B7B]">{target.vi}</span>
        </div>
      </div>

      {supported ? (
        <motion.button
          type="button"
          onClick={listen}
          disabled={listening || state !== "waiting"}
          whileTap={reduce ? undefined : { scale: 0.95 }}
          animate={listening && !reduce ? { scale: [1, 1.06, 1] } : {}}
          transition={listening ? { duration: 1, repeat: Number.POSITIVE_INFINITY } : SPRING.press}
          className="flex min-h-[96px] items-center gap-3 rounded-[34px] bg-[#2F80ED] px-8 font-extrabold text-[26px] text-white shadow-[0_12px_0_-2px_#1F63BF]"
          data-testid="say-it-button"
        >
          <span className="text-[36px]" aria-hidden="true">
            🎤
          </span>
          {listening ? "Mình đang nghe…" : "Con nói đi!"}
        </motion.button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setState("good");
            next(true);
          }}
          className="min-h-[96px] rounded-[34px] bg-[#34C759] px-8 font-extrabold text-[24px] text-white shadow-[0_12px_0_-2px_#22A344]"
          data-testid="say-it-parent"
        >
          Con nói được rồi 👍
        </button>
      )}

      {heard ? (
        <span className="font-bold text-[20px] text-[#6B6B7B]">Mình nghe thấy: “{heard}”</span>
      ) : null}
      {state === "good" ? (
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="font-extrabold text-[26px] text-[#34C759]"
        >
          Nghe rõ lắm!
        </motion.span>
      ) : null}
      {state === "again" ? (
        <span className="font-bold text-[22px] text-[#6B6B7B]">Mai mình nói lại từ này nhé!</span>
      ) : null}
    </div>
  );
}
