"use client";

import type { CadenceStep, SyllableParts } from "@mtct/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSpeak } from "../use-speak";
import { playCadence } from "./cadence-player";

/**
 * Plays the spelling-out rhythm of a syllable one step at a time — "bờ", "a", "ba", "huyền",
 * "bà" — and says which step is being spoken, so the tile it belongs to can light up with it.
 *
 * The steps come from `cadence()` and nowhere else (ADR-24): when the school's rhythm changes,
 * this hook changes with it. Each step is its own pre-generated mp3, fetched in order.
 *
 * `spoken` is the list of what was actually said, in order — the page writes it into a data
 * attribute so the acceptance test can hold the rhythm to `cadence()`.
 */
export function useCadence() {
  const { speak, cancel } = useSpeak();
  const [step, setStep] = useState<CadenceStep | null>(null);
  const [playing, setPlaying] = useState(false);
  const [spoken, setSpoken] = useState<string[]>([]);
  const run = useRef(0);

  useEffect(
    () => () => {
      run.current++;
    },
    [],
  );

  const play = useCallback(
    async (syllable: string | SyllableParts) => {
      const mine = ++run.current;
      const alive = () => run.current === mine;
      setPlaying(true);
      setSpoken([]);
      await playCadence(syllable, {
        speak: (text) => speak(text, { lang: "vi-VN" }),
        alive,
        onStep: (s) => {
          setStep(s);
          setSpoken((list) => [...list, s.say]);
        },
      });
      if (!alive()) return false;
      setStep(null);
      setPlaying(false);
      return true;
    },
    [speak],
  );

  const stop = useCallback(() => {
    run.current++;
    cancel();
    setStep(null);
    setPlaying(false);
  }, [cancel]);

  return { play, stop, step, playing, spoken };
}
