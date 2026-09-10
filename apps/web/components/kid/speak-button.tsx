"use client";

import { Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { KID_PROSODY, pickVoice, type VoicePersona } from "@/lib/tts/voices";
import { cn } from "@/lib/utils";

type SpeakState = "idle" | "loading" | "speaking" | "unavailable";

let currentAudio: HTMLAudioElement | null = null;

function stopAll() {
  currentAudio?.pause();
  currentAudio = null;
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

/** Resolves the voice list even when the browser loads it lazily (Chrome). */
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis;
  const now = synth.getVoices();
  if (now.length > 0) return Promise.resolve(now);
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(synth.getVoices()), 1500);
    synth.addEventListener(
      "voiceschanged",
      () => {
        clearTimeout(timer);
        resolve(synth.getVoices());
      },
      { once: true },
    );
  });
}

/**
 * Speaks `text`: recorded clip / cloud neural mp3 from /api/tts first (docs/06 §3 `useSpeak`),
 * else Web Speech — but only with a real voice for the language. Reading Vietnamese with an
 * English voice is worse than silence for a 6-year-old. Returns false when nothing could play.
 */
export async function speak(
  text: string,
  lang = "vi-VN",
  clip?: string,
  onState?: (s: SpeakState) => void,
  voice: VoicePersona = "girl",
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  stopAll();
  onState?.("loading");

  try {
    const params = new URLSearchParams({ text, lang, voice });
    if (clip) params.set("clip", clip);
    const res = await fetch(`/api/tts?${params}`, { cache: "force-cache" });
    if (res.status === 200) {
      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      currentAudio = audio;
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        onState?.("speaking");
        audio.play().catch(() => resolve());
      });
      onState?.("idle");
      return true;
    }
  } catch {
    // network error → try on-device speech
  }

  if (!("speechSynthesis" in window)) {
    onState?.("unavailable");
    return false;
  }
  const synthVoice = pickVoice(await loadVoices(), lang);
  if (!synthVoice) {
    console.warn(
      `[tts] no ${lang} voice installed; staying silent instead of using a foreign voice`,
    );
    onState?.("unavailable");
    return false;
  }
  const u = new SpeechSynthesisUtterance(text);
  u.voice = synthVoice as SpeechSynthesisVoice;
  u.lang = lang;
  u.rate = KID_PROSODY.rate;
  u.pitch = KID_PROSODY.pitch;
  await new Promise<void>((resolve) => {
    u.onend = () => resolve();
    u.onerror = () => resolve();
    onState?.("speaking");
    window.speechSynthesis.speak(u);
  });
  onState?.("idle");
  return true;
}

export function SpeakButton({
  text,
  lang = "vi-VN",
  clip,
  voice = "girl",
  autoPlay = false,
  className,
  label = "Nghe",
}: {
  text: string;
  lang?: string;
  /** Key of a recorded clip in content/art/audio/<lang>/ (real child voice), if one exists. */
  clip?: string;
  /** Cloned child voice for this screen (see personaFor in lib/tts/voices). */
  voice?: VoicePersona;
  autoPlay?: boolean;
  className?: string;
  label?: string;
}) {
  const [state, setState] = useState<SpeakState>("idle");
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stopAll();
    };
  }, []);
  const play = useCallback(
    () => speak(text, lang, clip, (s) => mounted.current && setState(s), voice),
    [text, lang, clip, voice],
  );
  useEffect(() => {
    if (autoPlay) void play();
  }, [autoPlay, play]);

  return (
    <button
      type="button"
      onClick={() => void play()}
      aria-label={`${label}: ${text}`}
      aria-pressed={state === "speaking"}
      title={state === "unavailable" ? "Máy này chưa có giọng đọc tiếng Việt" : undefined}
      className={cn(
        "inline-flex min-h-16 min-w-16 items-center justify-center gap-2 rounded-full px-5 text-2xl font-bold text-white shadow-lg transition-transform active:scale-95",
        state === "speaking" ? "animate-pulse bg-sky-600" : "bg-sky-500",
        state === "unavailable" && "bg-slate-400",
        className,
      )}
    >
      <Volume2 className="h-8 w-8" />
      <span>{label}</span>
    </button>
  );
}
