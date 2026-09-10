"use client";

import { Volume2 } from "lucide-react";
import { useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

/** Reads `text` aloud with Web Speech (default TTS, ADR-6). Every kid screen has one. */
export function speak(text: string, lang = "vi-VN") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

export function SpeakButton({
  text,
  lang = "vi-VN",
  autoPlay = false,
  className,
  label = "Nghe",
}: {
  text: string;
  lang?: string;
  autoPlay?: boolean;
  className?: string;
  label?: string;
}) {
  const play = useCallback(() => speak(text, lang), [text, lang]);
  useEffect(() => {
    if (autoPlay) play();
  }, [autoPlay, play]);
  return (
    <button
      type="button"
      onClick={play}
      aria-label={`${label}: ${text}`}
      className={cn(
        "inline-flex min-h-16 min-w-16 items-center justify-center gap-2 rounded-full bg-sky-500 px-5 text-2xl font-bold text-white shadow-lg transition-transform active:scale-95",
        className,
      )}
    >
      <Volume2 className="h-8 w-8" />
      <span>{label}</span>
    </button>
  );
}
