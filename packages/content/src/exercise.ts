import { z } from "zod";
import { EXERCISE_TYPES } from "./skill-map";
import { SUBJECTS } from "./timetable";

/**
 * Exercise pack — content/exercises/<subject>/<SKILL_CODE>.pack.json (docs/10 sec. 4.2).
 * One file per skill; the importer turns each entry into an `Exercise` row whose `spec` is the
 * `ExerciseSpec` of docs/04 sec. 5 and whose `answerKey` is stored in its own column so the client
 * never receives it.
 *
 * `id` is the stable id: editing an exercise keeps the id and updates in place, so the `Evidence`
 * a child already produced still points at it. Removing an id retires the row, never deletes it.
 */

/** The six types the phase-3 kid renderer ships with (docs/08 pha 3 item 3). */
export const PHASE3_TYPES = [
  "MCQ",
  "LISTEN_CHOOSE",
  "DRAG_DROP",
  "COUNT_TAP",
  "READ_ALOUD",
  "WRITE_PHOTO",
] as const;
export type Phase3Type = (typeof PHASE3_TYPES)[number];

export const ASSET_THEMES = ["neutral", "robot", "garden"] as const;
export const SCAFFOLDS = ["none", "model", "guided"] as const;
export const IMAGE_KINDS = ["emoji", "icon", "asset", "generated"] as const;

/** Placeholders the app substitutes at display time (docs/10 sec. 7) — never a real child name. */
export const PLACEHOLDERS = ["{ten}", "{vat}", "{ban}"] as const;

const skillCode = z
  .string()
  .regex(/^[A-Z]+\.[A-Z]+\.[A-Z0-9_]+$/, "code must look like MON.MACH.TEN");
const errorTag = z.string().regex(/^[a-z][a-z0-9_]{2,40}$/, "error tags are snake_case");
const stableId = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]{6,60}$/, "id: lowercase, digits and dashes, 7-61 chars");
const audioKey = z.string().regex(/^[a-z0-9][a-z0-9-]{0,60}$/);

export const imageRefSchema = z.object({
  kind: z.enum(IMAGE_KINDS),
  /** emoji character, icon name, or a label from content/art/objects/manifest.json. */
  value: z.string().trim().min(1),
  labelVi: z.string().trim().optional(),
  labelEn: z.string().trim().optional(),
  /**
   * Draw the picture this many times. A counting question ("Trong tranh có mấy bông hoa?") is
   * unanswerable without it, so it is part of the data, not a rendering detail.
   */
  repeat: z.number().int().min(1).max(20).optional(),
});

export const choiceSchema = z.object({
  id: z.string().regex(/^[a-z]$/, "choice ids are single letters a-d"),
  text: z.string().trim().min(1).optional(),
  image: imageRefSchema.optional(),
  audio: audioKey.optional(),
  /** Diagnosis for a wrong choice (docs/04 sec. 11.2) — must be a code of the taxonomy. */
  errorTag: errorTag.optional(),
});

export const promptSchema = z.object({
  text: z.string().trim().min(3),
  /** Read the prompt aloud; `content:import` pre-generates the mp3 for these (ADR-11). */
  tts: z.boolean().default(true),
  audioKey: audioKey.optional(),
  image: imageRefSchema.optional(),
});

export const dragItemSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,20}$/),
  text: z.string().trim().min(1).optional(),
  image: imageRefSchema.optional(),
  /**
   * Why a child might put *this* card in the wrong place (ADR-15). Phase 2 shipped 185 drag
   * exercises that could only ever say "not yet" — the same blind spot `choices[].errorTag`
   * fixed for multiple choice. Server-side only, exactly like the choice tags.
   */
  errorTag: errorTag.optional(),
});

export const dropZoneSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,20}$/),
  label: z.string().trim().min(1).optional(),
  image: imageRefSchema.optional(),
  accepts: z.array(z.string()).min(1),
});

export const exerciseSchema = z
  .object({
    id: stableId,
    type: z.enum(EXERCISE_TYPES),
    language: z.enum(["vi", "en"]),
    difficulty: z.number().int().min(1).max(5),
    skillCodes: z.array(skillCode).min(1).max(2),
    assetTheme: z.enum(ASSET_THEMES).default("neutral"),
    /** The mistake this exercise deliberately drills (docs/10 sec. 7 item 3). */
    targetsError: errorTag.nullable().default(null),
    scaffold: z.enum(SCAFFOLDS).default("none"),
    prompt: promptSchema,
    choices: z.array(choiceSchema).min(2).max(4).optional(),
    dragItems: z.array(dragItemSchema).min(2).optional(),
    dropZones: z.array(dropZoneSchema).min(1).optional(),
    readTarget: z
      .object({
        text: z.string().trim().min(1),
        words: z.array(z.string().trim().min(1)).min(1),
        modelAudioKey: audioKey.optional(),
      })
      .optional(),
    /**
     * LISTEN_CHOOSE: the word or sentence that is *spoken*. The renderer must play it and must
     * NEVER print it — printing it would hand a reading child the answer, which is exactly the
     * trap `prompt.text` fell into before (see docs/adr/ADR-14).
     */
    listenTarget: z
      .object({
        text: z.string().trim().min(1),
        audioKey: audioKey.optional(),
      })
      .optional(),
    countTarget: z
      .object({
        objects: imageRefSchema,
        correctCount: z.number().int().min(1).max(20),
        layout: z.enum(["grid", "line"]).default("grid"),
      })
      .optional(),
    traceTarget: z.object({ glyph: z.string().trim().min(1) }).optional(),
    story: z
      .object({
        sentences: z
          .array(z.object({ text: z.string().trim().min(1), image: imageRefSchema.optional() }))
          .min(1),
      })
      .optional(),
    rubric: z
      .object({
        criteria: z.array(z.string().trim().min(3)).min(1),
        sampleAnswers: z.array(z.string().trim().min(1)).default([]),
      })
      .optional(),
    answerKey: z.unknown(),
    /** 1-2 hints: hint 1 points at the method, hint 2 is concrete. Never the answer (rubric 5). */
    hints: z.array(z.string().trim().min(3)).min(1).max(2),
    /** Shown after a miss; short and friendly (rubric 6). */
    explanation: z.string().trim().min(3),
    meta: z.object({
      estSeconds: z.number().int().min(5).max(300),
      lessonUnitCode: z
        .string()
        .regex(/^[A-Z0-9-]+$/)
        .nullable()
        .optional(),
      /** Where it comes from in the book: "SGK Toan 1 tap mot tr.41". */
      sourceRef: z.string().trim().min(3),
      theme: z.string().trim().optional(),
    }),
  })
  .superRefine((ex, ctx) => {
    const need = (cond: boolean, message: string) => {
      if (!cond) ctx.addIssue({ code: "custom", message });
    };
    if (ex.type === "LISTEN_CHOOSE") {
      need(Boolean(ex.listenTarget), "LISTEN_CHOOSE needs listenTarget (the spoken word)");
      // The instruction must not spell out what is spoken, or reading it is enough to answer.
      if (ex.listenTarget) {
        const strip = (s: string) => ` ${s.toLowerCase().replace(/[.,!?:;"“”…]/g, " ")} `;
        const spoken = strip(ex.listenTarget.text).trim();
        need(
          !strip(ex.prompt.text).includes(` ${spoken} `),
          `the prompt prints the spoken word "${ex.listenTarget.text}" — that gives the answer away`,
        );
      }
    }
    switch (ex.type) {
      // A LISTEN_CHOOSE is answered with choices exactly like an MCQ.
      case "LISTEN_CHOOSE":
      case "MCQ": {
        need(Boolean(ex.choices), `${ex.type} needs choices`);
        const ids = ex.choices?.map((c) => c.id) ?? [];
        need(new Set(ids).size === ids.length, "choice ids must be unique");
        need(
          typeof ex.answerKey === "string" && ids.includes(ex.answerKey),
          "answerKey must be one of the choice ids",
        );
        need(
          (ex.choices ?? []).every((c) => c.text != null || c.image != null || c.audio != null),
          "every choice needs text, an image or audio",
        );
        need(
          (ex.choices ?? []).every((c) => c.id === ex.answerKey || !c.errorTag || c.errorTag),
          "errorTag only belongs on wrong choices",
        );
        need(
          !(ex.choices ?? []).some((c) => c.id === ex.answerKey && c.errorTag),
          "the correct choice must not carry an errorTag",
        );
        break;
      }
      case "DRAG_DROP": {
        need(Boolean(ex.dragItems && ex.dropZones), "DRAG_DROP needs dragItems and dropZones");
        const itemIds = new Set((ex.dragItems ?? []).map((i) => i.id));
        const zoneIds = new Set((ex.dropZones ?? []).map((z) => z.id));
        for (const zone of ex.dropZones ?? [])
          for (const accepted of zone.accepts)
            need(itemIds.has(accepted), `dropZone "${zone.id}" accepts unknown item "${accepted}"`);
        const key = ex.answerKey as Record<string, string[]> | undefined;
        need(
          key != null && typeof key === "object" && !Array.isArray(key),
          "DRAG_DROP answerKey must be { zoneId: itemId[] }",
        );
        if (key && typeof key === "object" && !Array.isArray(key)) {
          for (const [zoneId, items] of Object.entries(key)) {
            need(zoneIds.has(zoneId), `answerKey mentions unknown zone "${zoneId}"`);
            need(Array.isArray(items), `answerKey["${zoneId}"] must be a list of item ids`);
            for (const item of items ?? [])
              need(itemIds.has(item), `answerKey["${zoneId}"] mentions unknown item "${item}"`);
          }
          // Decoys that stay in the tray are fine ("drag the right one in"), but every zone must
          // get something and no item may be placed twice.
          const placed = Object.values(key).flat();
          need(new Set(placed).size === placed.length, "a drag item is placed in two zones");
          need(
            zoneIds.size === Object.keys(key).length,
            "every dropZone needs an entry in the answerKey",
          );
          for (const [zoneId, items] of Object.entries(key))
            need((items ?? []).length > 0, `dropZone "${zoneId}" is left empty by the answerKey`);
        }
        break;
      }
      case "COUNT_TAP": {
        need(Boolean(ex.countTarget), "COUNT_TAP needs countTarget");
        need(
          ex.answerKey === ex.countTarget?.correctCount,
          "COUNT_TAP answerKey must equal countTarget.correctCount",
        );
        break;
      }
      case "READ_ALOUD": {
        need(Boolean(ex.readTarget), "READ_ALOUD needs readTarget");
        const key = ex.answerKey as { words?: string[] } | undefined;
        need(
          Array.isArray(key?.words) && key.words.length > 0,
          "READ_ALOUD answerKey must be { words: [...] }",
        );
        need(
          JSON.stringify(key?.words) === JSON.stringify(ex.readTarget?.words),
          "READ_ALOUD answerKey.words must match readTarget.words",
        );
        break;
      }
      case "WRITE_PHOTO":
      case "SPEAK_ANSWER": {
        need(Boolean(ex.rubric), `${ex.type} needs a rubric (it is graded by the AI queue)`);
        need(ex.answerKey === null, `${ex.type} answerKey must be null (graded later, docs/13)`);
        break;
      }
      case "TRACE": {
        need(Boolean(ex.traceTarget), "TRACE needs traceTarget");
        break;
      }
      case "MINI_STORY": {
        need(Boolean(ex.story), "MINI_STORY needs story.sentences");
        need(Boolean(ex.choices), "MINI_STORY needs a comprehension question with choices");
        break;
      }
    }
    // Rubric 3 (docs/10 sec. 6): a short prompt, one thing to do.
    const words = ex.prompt.text.trim().split(/\s+/).length;
    const limit = ex.language === "vi" ? 20 : 12;
    need(words <= limit, `prompt is ${words} words, limit is ${limit} for ${ex.language}`);
    // Rubric 9: no real names, no "sai".
    need(!/\bsai\b/i.test(ex.prompt.text), 'the word "sai" must never appear in a prompt');
    need(!/\bsai\b/i.test(ex.explanation), 'the word "sai" must never appear in an explanation');
  });

export const exercisePackSchema = z.object({
  $schema: z.string().optional(),
  skillCode,
  subject: z.enum(SUBJECTS),
  generatedBy: z.literal("claude-code").default("claude-code"),
  promptVersion: z.string().trim().min(1).default("exercise-gen-v1"),
  lessonRefs: z.array(z.string().regex(/^[A-Z0-9-]+$/)).default([]),
  /** Short note from the author: which book pages the pack was written from. */
  note: z.string().trim().optional(),
  exercises: z.array(exerciseSchema).min(1),
});

export type ExerciseDef = z.infer<typeof exerciseSchema>;
export type ExercisePack = z.infer<typeof exercisePackSchema>;
export type Choice = z.infer<typeof choiceSchema>;
export type ImageRef = z.infer<typeof imageRefSchema>;

export function parseExercisePack(json: unknown): ExercisePack {
  const result = exercisePackSchema.safeParse(json);
  if (!result.success) throw new Error(`Invalid exercise pack: ${z.prettifyError(result.error)}`);
  return result.data;
}

/**
 * A drop zone as the child's device sees it. `accepts` (which cards the zone tolerates) stays on
 * the server; the client is told only **how many** cards belong here, because "Xong!" has to know
 * when a basket is full without knowing what fills it (ADR-14).
 *
 * Before pha 11 the button lit up as soon as every basket held one card. 573 of the 1552 drag
 * exercises have a basket that wants two or more, so a child who put one card in each could press
 * "Xong!" half-finished and be marked partially wrong — and the error code was written to their
 * evidence. That is what `expect` prevents.
 */
export interface ClientDropZone {
  id: string;
  label?: string;
  image?: ImageRef;
  /** How many cards belong in this zone — the count only, never which ones. */
  expect: number;
}

/**
 * The `ExerciseSpec` stored in `Exercise.spec` and sent to the client (docs/04 sec. 5).
 * `answerKey` is deliberately NOT part of it — it lives in its own column.
 */
export interface ExerciseSpec {
  type: ExerciseDef["type"];
  language: ExerciseDef["language"];
  subject: (typeof SUBJECTS)[number];
  skillCodes: string[];
  difficulty: number;
  prompt: ExerciseDef["prompt"];
  choices?: Omit<Choice, "errorTag">[];
  /** Parallel to `choices`: the diagnosis per choice id, kept server-side only. */
  scaffold: ExerciseDef["scaffold"];
  dragItems?: ExerciseDef["dragItems"];
  dropZones?: ClientDropZone[];
  readTarget?: ExerciseDef["readTarget"];
  /** Spoken only — a renderer that prints this is a bug (see ExercisePreview). */
  listenTarget?: ExerciseDef["listenTarget"];
  countTarget?: Omit<NonNullable<ExerciseDef["countTarget"]>, "correctCount">;
  traceTarget?: ExerciseDef["traceTarget"];
  story?: ExerciseDef["story"];
  rubric?: ExerciseDef["rubric"];
  hints: string[];
  explanation: string;
  meta: ExerciseDef["meta"] & { theme?: string };
}

/**
 * Builds the client-safe spec. Two things are stripped on purpose:
 * - `answerKey` (stored separately),
 * - `countTarget.correctCount` and `choices[].errorTag` — knowing either would give the answer or
 *   leak the diagnosis to the child's device.
 */
export function toExerciseSpec(ex: ExerciseDef, subject: (typeof SUBJECTS)[number]): ExerciseSpec {
  const spec: ExerciseSpec = {
    type: ex.type,
    language: ex.language,
    subject,
    skillCodes: ex.skillCodes,
    difficulty: ex.difficulty,
    prompt: ex.prompt,
    scaffold: ex.scaffold,
    hints: ex.hints,
    explanation: ex.explanation,
    meta: { ...ex.meta, theme: ex.meta.theme ?? ex.assetTheme },
  };
  if (ex.choices) spec.choices = ex.choices.map(({ errorTag: _drop, ...rest }) => ({ ...rest }));
  if (ex.dragItems)
    spec.dragItems = ex.dragItems.map(({ errorTag: _drop, ...rest }) => ({ ...rest }));
  if (ex.dropZones) {
    // How many cards the answer key puts in each zone. `accepts` is wider than the key on purpose
    // (a zone tolerates cards it will mark wrong), so the key is what "full" means.
    const key = (ex.answerKey ?? {}) as Record<string, unknown>;
    spec.dropZones = ex.dropZones.map((zone) => {
      const wanted = key[zone.id];
      const expect = Array.isArray(wanted) ? wanted.length : 1;
      const { accepts: _drop, ...rest } = zone;
      return { ...rest, expect };
    });
  }
  if (ex.readTarget) spec.readTarget = ex.readTarget;
  if (ex.listenTarget) spec.listenTarget = ex.listenTarget;
  if (ex.countTarget) {
    const { correctCount: _drop, ...rest } = ex.countTarget;
    spec.countTarget = rest;
  }
  if (ex.traceTarget) spec.traceTarget = ex.traceTarget;
  if (ex.story) spec.story = ex.story;
  if (ex.rubric) spec.rubric = ex.rubric;
  return spec;
}

/** Diagnosis map kept server-side: choice id -> error code (docs/04 sec. 11.2). */
export function errorTagsOf(ex: ExerciseDef): Record<string, string> {
  const out: Record<string, string> = {};
  for (const c of ex.choices ?? []) if (c.errorTag) out[c.id] = c.errorTag;
  // Drag cards share the map: choice ids are single letters, drag ids are never single letters,
  // so the two cannot collide (ADR-15).
  for (const d of ex.dragItems ?? []) if (d.errorTag) out[d.id] = d.errorTag;
  return out;
}

/** Every text that should get an mp3 at import time (ADR-11 muc 3). */
export function ttsLinesOf(ex: ExerciseDef): { text: string; lang: string }[] {
  const lines: { text: string; lang: string }[] = [];
  if (ex.prompt.tts) lines.push({ text: ex.prompt.text, lang: ex.language });
  if (ex.listenTarget) lines.push({ text: ex.listenTarget.text, lang: ex.language });
  // Placeholders are substituted per child at display time, so they cannot be pre-generated.
  return lines.filter((l) => !PLACEHOLDERS.some((p) => l.text.includes(p)));
}
