import { createHash } from "node:crypto";
import type { ExerciseDef, ExercisePack } from "./exercise";
import { errorTagsOf, toExerciseSpec } from "./exercise";
import type { LessonFile } from "./lesson";
import type { SUBJECTS } from "./timetable";

/**
 * Turns authored content files into the plain rows `@mtct/db` writes (docs/10 sec. 4).
 * Lives here — not in @mtct/db — because the db package is built to CommonJS and must not import
 * this ESM package at runtime.
 */

export interface ExerciseRowData {
  stableId: string;
  type: ExerciseDef["type"];
  subject: (typeof SUBJECTS)[number];
  language: ExerciseDef["language"];
  difficulty: number;
  spec: unknown;
  answerKey: unknown;
  explanation: string;
  skillCodes: string[];
  lessonUnitCode: string | null;
  sourceRef: string | null;
  sourceFile: string;
  assetTheme: "NEUTRAL" | "ROBOT" | "GARDEN";
  targetsError: string | null;
  promptVersion: string;
  contentHash: string;
}

/**
 * Stable over cosmetic changes, different whenever anything the child sees or is graded on
 * changes. Key ordering is normalised so re-serialising a file cannot fake a change.
 */
export function contentHashOf(ex: ExerciseDef): string {
  return createHash("sha1").update(stableStringify(ex)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
}

/**
 * The server-side answer bundle. Everything the child's device must not see lives here:
 * the answer itself, the per-choice diagnosis, and the correct count of a COUNT_TAP.
 */
export function answerBundleOf(ex: ExerciseDef): Record<string, unknown> {
  const bundle: Record<string, unknown> = { value: ex.answerKey ?? null };
  const tags = errorTagsOf(ex);
  if (Object.keys(tags).length > 0) bundle.errorTags = tags;
  if (ex.countTarget) bundle.correctCount = ex.countTarget.correctCount;
  return bundle;
}

export function packToRows(pack: ExercisePack, sourceFile: string): ExerciseRowData[] {
  return pack.exercises.map((ex) => ({
    stableId: ex.id,
    type: ex.type,
    subject: pack.subject,
    language: ex.language,
    difficulty: ex.difficulty,
    spec: toExerciseSpec(ex, pack.subject),
    answerKey: answerBundleOf(ex),
    explanation: ex.explanation,
    skillCodes: ex.skillCodes,
    lessonUnitCode: ex.meta.lessonUnitCode ?? null,
    sourceRef: ex.meta.sourceRef,
    sourceFile,
    assetTheme: ex.assetTheme.toUpperCase() as "NEUTRAL" | "ROBOT" | "GARDEN",
    targetsError: ex.targetsError,
    promptVersion: pack.promptVersion,
    contentHash: contentHashOf(ex),
  }));
}

export interface LessonRowData {
  code: string;
  subject: (typeof SUBJECTS)[number];
  title: string;
  objectives: string[];
  vocabulary: string[];
  concepts: string[];
  sampleTasks: string[];
  contentText: string | null;
  pageFrom: number | null;
  pageTo: number | null;
  weekFrom: number | null;
  weekTo: number | null;
  materialTitle: string | null;
  skills: { code: string; weight: number }[];
}

export function lessonToRow(lesson: LessonFile): LessonRowData {
  return {
    code: lesson.code,
    subject: lesson.subject,
    title: lesson.title,
    objectives: lesson.objectives,
    vocabulary: lesson.vocabulary,
    concepts: lesson.concepts,
    // The DB column is String[]: keep the answer with the task so it stays useful when grading.
    sampleTasks: lesson.sampleTasks.map((t) => (t.answer ? `${t.text} → ${t.answer}` : t.text)),
    contentText: lesson.contentText ?? null,
    pageFrom: lesson.book.pageFrom,
    pageTo: lesson.book.pageTo ?? null,
    weekFrom: lesson.weekFrom ?? null,
    weekTo: lesson.weekTo ?? null,
    materialTitle: lesson.book.name,
    skills: lesson.skills,
  };
}
