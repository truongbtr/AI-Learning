import type { ExerciseSpec } from "@mtct/content";

/**
 * What the child's device is allowed to know about an exercise.
 *
 * The server sends `ExerciseSpec` and nothing else: no `answerKey`, no `choices[].errorTag`, no
 * `dragItems[].errorTag`, no `countTarget.correctCount` (ADR-14, ADR-15). Marking happens in
 * `POST /api/sessions/:id/attempts`. `listenTarget` is here because it has to be *played* — a renderer that
 * prints it turns a listening question into a reading question, and that is a bug with a name.
 */
export type ClientSpec = ExerciseSpec;

export interface FeedbackState {
  kind: "correct" | "almost" | "answer";
  /** How many tries so far (1, 2, 3) — the third shows the answer. */
  tries: number;
  /** The right answer, sent only once the exercise is over. */
  reveal?: unknown;
  /** Drag cards the server found in the wrong zone; they float home (ADR-15). */
  wrongItems?: string[];
}

export interface ExerciseProps {
  spec: ClientSpec;
  /** The child's answer, in the shape the server expects for this type. */
  onSubmit: (response: unknown) => void;
  onHint: () => void;
  disabled: boolean;
  feedback?: FeedbackState;
  /** Substituted into the prompt: {ten} → nickname, {vat} → a thing from the child's world. */
  vars?: Record<string, string>;
  /** Used by the "mascot does one first" scaffold. */
  mascot?: "robot" | "cu";
}

/** {ten}/{vat}/{ban} are replaced when the exercise is shown, not when it is written (docs/10 §7). */
export function fillPlaceholders(text: string, vars: Record<string, string> = {}): string {
  return text.replace(/\{(ten|vat|ban)\}/g, (whole, key: string) => vars[key] ?? whole);
}

/** An emoji, an icon or an object from content/art/objects. */
export function imageSrc(value: string, kind: string): string | null {
  if (kind === "asset") return `/art/objects/${value}.svg`;
  return null;
}
