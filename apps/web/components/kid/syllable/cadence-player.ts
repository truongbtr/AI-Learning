import { type CadenceStep, cadence, type SyllableParts } from "@mtct/core";

/** A step stays lit at least this long, so the eye can follow even where there is no voice. */
export const STEP_MIN_MS = 420;
export const GAP_MS = 140;

export interface CadencePlayer {
  /** Says one line and resolves when it has been said (the kid `useSpeak`). */
  speak: (text: string) => Promise<unknown>;
  /** Called as each step starts, so its tile can light up. */
  onStep?: (step: CadenceStep) => void;
  /** False once the caller has moved on: the rest of the rhythm is dropped. */
  alive?: () => boolean;
  wait?: (ms: number) => Promise<void>;
  now?: () => number;
}

const sleep = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));

/**
 * The spelling-out rhythm, spoken: every step of `cadence()`, one after the other, each waiting
 * for the one before to finish. Nothing else decides the order (ADR-24). Returns the lines said.
 */
export async function playCadence(
  syllable: string | SyllableParts,
  player: CadencePlayer,
): Promise<string[]> {
  const wait = player.wait ?? sleep;
  const now = player.now ?? Date.now;
  const said: string[] = [];
  for (const step of cadence(syllable)) {
    if (player.alive && !player.alive()) return said;
    player.onStep?.(step);
    said.push(step.say);
    const started = now();
    await player.speak(step.say);
    const left = STEP_MIN_MS - (now() - started);
    if (left > 0) await wait(left);
    await wait(GAP_MS);
  }
  return said;
}
