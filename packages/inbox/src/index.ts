/**
 * AI queue (docs/13, ADR-10). The app enqueues `InboxItem`s and reads results back; the reading
 * and writing in between is done by Claude Code in the repo. No LLM SDK lives here.
 */

// The exercise contract the optional EXERCISE_GEN task would have to satisfy (docs/08 pha 2
// item 2) is the same one the content workshop uses — re-exported so the queue is self-contained.
export {
  type ExerciseDef,
  type ExerciseSpec,
  exercisePackSchema,
  exerciseSchema,
  parseExercisePack,
  toExerciseSpec,
} from "@mtct/content";
export * from "./push";
export * from "./schemas";
export * from "./service";
