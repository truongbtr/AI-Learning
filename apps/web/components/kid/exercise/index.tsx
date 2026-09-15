"use client";

import { useState } from "react";
import { ChoiceExercise } from "./choice";
import { CountTapExercise } from "./count-tap";
import { DragDropExercise } from "./drag-drop";
import { ModelFirst } from "./frame";
import { ReadAloudExercise } from "./read-aloud";
import type { ExerciseProps } from "./types";
import { WritePhotoExercise } from "./write-photo";

/**
 * One door for all six exercise types (docs/06 §1.3): the session hands over a spec and gets the
 * right renderer back, with the same props every time.
 *
 * `scaffold: "model"` is handled here rather than in each type, because it happens before any of
 * them: the mascot talks one through first, and only then does the child get their turn
 * (docs/04 §11.4 rung 3).
 */
export function ExerciseRenderer(props: ExerciseProps) {
  const { spec } = props;
  const [modelled, setModelled] = useState(spec.scaffold !== "model");

  if (!modelled) {
    const line =
      spec.hints[0] ??
      spec.explanation ??
      "Mình làm thử một bài giống hệt nhé, con xem rồi làm bài của con.";
    return (
      <div className="mx-auto w-full max-w-4xl">
        <ModelFirst
          line={line}
          onReady={() => setModelled(true)}
          mascot={props.mascot}
          language={spec.language}
        />
      </div>
    );
  }

  switch (spec.type) {
    case "MCQ":
    case "LISTEN_CHOOSE":
      return <ChoiceExercise {...props} />;
    case "DRAG_DROP":
      return <DragDropExercise {...props} />;
    case "COUNT_TAP":
      return <CountTapExercise {...props} />;
    case "READ_ALOUD":
      return <ReadAloudExercise {...props} />;
    case "WRITE_PHOTO":
      return <WritePhotoExercise {...props} />;
    default:
      // TRACE, SPEAK_ANSWER and MINI_STORY arrive in phase 7; never leave a child on a blank page.
      return (
        <div className="mx-auto max-w-xl rounded-[32px] bg-white/90 px-8 py-10 text-center">
          <p className="font-extrabold text-[24px] text-[#2B2B3A]">
            Bài này mình để dành cho lần sau nhé!
          </p>
          <button
            type="button"
            onClick={() => props.onSubmit({ skipped: true })}
            className="mt-4 min-h-[72px] rounded-[28px] bg-[#2F80ED] px-8 font-extrabold text-[22px] text-white"
          >
            Bài tiếp theo
          </button>
        </div>
      );
  }
}

export type { ExerciseProps } from "./types";
export {
  ChoiceExercise,
  CountTapExercise,
  DragDropExercise,
  ReadAloudExercise,
  WritePhotoExercise,
};
