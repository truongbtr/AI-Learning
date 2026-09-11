"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pickVoice } from "@/lib/tts/voices";

/**
 * `useSpeak` (docs/06 §3): reads a line to the child and says whether it is still speaking, so
 * the mascot's mouth can move with it.
 *
 * Order, as the design fixes it: an mp3 that `content:import` already generated (or a recorded
 * clip) → the browser's own voice → silence. Silence is a real answer: reading Vietnamese with an
 * English voice is worse than not reading it at all, so the speaker button goes quiet and grey
 * instead (ADR-6).
 *
 * One line at a time: starting a new line cancels the old one, and leaving the screen cancels
 * everything — a sentence that follows a child into the next question is a bug.
 */

export type SpeakState = "idle" | "loading" | "speaking" | "unavailable";

let current: { audio?: HTMLAudioElement; utterance?: SpeechSynthesisUtterance } | null = null;

function stopEverything() {
  if (current?.audio) {
    current.audio.pause();
    current.audio.currentTime = 0;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  current = null;
}

async function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const list = window.speechSynthesis.getVoices();
  if (list.length > 0) return list;
  return new Promise((resolve) => {
    const done = () => resolve(window.speechSynthesis.getVoices());
    window.speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 700);
  });
}

export interface SpeakOptions {
  /** A fixed mascot line recorded or generated ahead of time: content/art/audio/<lang>/<key>.mp3 */
  clip?: string;
  lang?: string;
}

export function useSpeak() {
  const [state, setState] = useState<SpeakState>("idle");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stopEverything();
    };
  }, []);

  const cancel = useCallback(() => {
    stopEverything();
    if (mounted.current) setState("idle");
  }, []);

  const speak = useCallback(async (text: string, opts: SpeakOptions = {}) => {
    const trimmed = text.trim();
    if (!trimmed) return false;
    const lang = opts.lang ?? "vi-VN";
    stopEverything();
    if (mounted.current) setState("loading");

    // 1. the server's audio (recorded clip, cached mp3, or cloud synthesis)
    try {
      const url = `/api/tts?text=${encodeURIComponent(trimmed)}&lang=${encodeURIComponent(lang)}${
        opts.clip ? `&clip=${encodeURIComponent(opts.clip)}` : ""
      }`;
      const res = await fetch(url);
      if (res.ok && res.status !== 204) {
        const blob = await res.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        current = { audio };
        if (mounted.current) setState("speaking");
        await new Promise<void>((resolve) => {
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
          void audio.play().catch(() => resolve());
        });
        if (mounted.current) setState("idle");
        return true;
      }
    } catch {
      /* fall through to the device voice */
    }

    // 2. the device's own voice, but only when it really has one for this language
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (mounted.current) setState("unavailable");
      return false;
    }
    const voice = pickVoice(await loadVoices(), lang);
    if (!voice) {
      if (mounted.current) setState("unavailable");
      return false;
    }
    const u = new SpeechSynthesisUtterance(trimmed);
    u.voice = voice as SpeechSynthesisVoice;
    u.lang = lang;
    const { kidProsody } = await import("@/lib/tts/voices");
    const prosody = kidProsody(lang);
    u.rate = prosody.rate;
    u.pitch = prosody.pitch;
    current = { utterance: u };
    if (mounted.current) setState("speaking");
    await new Promise<void>((resolve) => {
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    });
    if (mounted.current) setState("idle");
    return true;
  }, []);

  return { speak, cancel, state, speaking: state === "speaking" };
}
