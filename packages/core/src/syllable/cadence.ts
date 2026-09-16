/**
 * The spelling-out rhythm — "bờ – a – ba – huyền – bà" (pha 13, ADR-24).
 *
 * ONE function, on purpose. The rhythm a child hears at school is the rhythm the machine must
 * use, and schools have changed it before: the older books read the letter names ("bê – a – ba"),
 * the current programme reads the sounds ("bờ – a – ba"). Keeping it in one pure function means a
 * change of programme is a change of this file plus one re-run of the mp3 generation — not a
 * search through six games.
 *
 * A step is what the voice says next AND what lights up on screen while it says it, so the child
 * sees the tile they are hearing.
 */
import {
  applyTone,
  joinSyllable,
  onsetSound,
  type SyllableParts,
  splitSyllable,
  TONE_NAMES,
  type Tone,
} from "./parts";

export type CadenceKind = "onset" | "rime" | "blend" | "tone" | "full";

export interface CadenceStep {
  kind: CadenceKind;
  /** What is written on the tile that lights up ("b", "a", "ba", "huyền", "bà"). */
  text: string;
  /** What the voice says — the only difference is the onset, which says its sound. */
  say: string;
}

/**
 * The steps for one syllable, in the order they are said.
 *
 *   bà      → bờ · a · ba · huyền · bà
 *   ba      → bờ · a · ba                  (a flat tone is not named)
 *   anh     → anh                          (no onset, no tone: there is nothing to put together)
 *   ánh     → anh · sắc · ánh
 *   quyển   → quờ · yên · quyên · hỏi · quyển
 *
 * Returns an empty list for anything that is not a syllable, so a caller can tell the difference
 * between "nothing to say" and "say this one thing".
 */
export function cadence(syllable: string | SyllableParts): CadenceStep[] {
  const parts = typeof syllable === "string" ? splitSyllable(syllable) : syllable;
  if (!parts) return [];
  const { amDau, van, thanh } = parts;
  const full = joinSyllable(amDau, van, thanh);
  const steps: CadenceStep[] = [];

  if (amDau) {
    steps.push({ kind: "onset", text: amDau, say: onsetSound(amDau) });
    steps.push({ kind: "rime", text: van, say: van });
    steps.push({ kind: "blend", text: amDau + van, say: amDau + van });
  } else {
    steps.push({ kind: "rime", text: van, say: van });
  }

  if (thanh !== "ngang") {
    steps.push({ kind: "tone", text: TONE_NAMES[thanh], say: TONE_NAMES[thanh] });
    steps.push({ kind: "full", text: full, say: full });
  }
  return steps;
}

/** The cadence as one line for the voice: "bờ – a – ba – huyền – bà". */
export function cadenceLine(syllable: string | SyllableParts): string {
  return cadence(syllable)
    .map((s) => s.say)
    .join(" – ");
}

/** The syllable as it would be written with another tone — the tone wheel turns on this. */
export function withTone(syllable: string, thanh: Tone): string | null {
  const parts = splitSyllable(syllable);
  if (!parts) return null;
  return parts.amDau + applyTone(parts.van, thanh);
}
