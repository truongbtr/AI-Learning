import { z } from "zod";

/**
 * The maths models MATH NOTES draws on every page (pha 13, docs/giao-trinh/EDI-MN1-vol1-phan-tich.md):
 * ten-frames, ten-rods with loose cubes, bead strings, number lines with hops, number bonds, dot
 * cards and the 1–20 number chart.
 *
 * A model is a *picture* in an exercise — an `ImageRef` with `kind: "model"` — never a new exercise
 * type. The child still answers with a choice, a drag, a tap count or their voice; the picture just
 * looks like the page the class had that morning. It is plain data, so it is drawn the same on the
 * child's screen, in the parent preview and in a test, and no migration is needed to store it.
 *
 * Nothing here gives the answer away by itself: a model shows what the question shows in the book.
 */

const n20 = z.number().int().min(0).max(20);
const TONES = ["dark", "light"] as const;

/** One or two ten-frames, filled left to right, row by row; `dots` in order (dark then light). */
export const tenFrameModelSchema = z
  .object({
    kind: z.literal("tenFrame"),
    frames: z.union([z.literal(1), z.literal(2)]).default(1),
    dots: z
      .array(z.object({ count: n20, tone: z.enum(TONES).default("dark") }))
      .max(2)
      .default([]),
  })
  .refine((m) => m.dots.reduce((a, d) => a + d.count, 0) <= m.frames * 10, {
    message: "a ten-frame model has more dots than cells",
  });

/** Ten-rods and loose cubes, or a string of ten beads and loose beads. */
export const tensOnesModelSchema = z.object({
  kind: z.literal("tensOnes"),
  tens: z.number().int().min(0).max(2),
  ones: z.number().int().min(0).max(25),
  /** 9 draws the book's trap: a "ten" that is one cube short (sách tr.21, đáp án D). */
  rodSize: z.union([z.literal(9), z.literal(10)]).default(10),
  style: z.enum(["cubes", "beads"]).default("cubes"),
});

/** A number line with sparse labels, highlighted points, "?" boxes and one run of hops. */
export const numberLineModelSchema = z
  .object({
    kind: z.literal("numberLine"),
    from: n20,
    to: n20,
    /** Numbers printed under their mark; all of them when left out. */
    labels: z.array(n20).optional(),
    /** Marks that show a "?" box instead of their number. */
    hidden: z.array(n20).default([]),
    /** Marks with a dot on them (the numbers being compared, the start of a count-on). */
    marks: z.array(n20).max(3).default([]),
    /** `count` hops of one, starting at `start` (9 + 3: start 9, count 3). */
    hops: z.object({ start: n20, count: z.number().int().min(1).max(10) }).optional(),
  })
  .refine((m) => m.to > m.from, { message: "numberLine: to must be greater than from" })
  .refine((m) => m.to - m.from <= 20, { message: "numberLine: at most 21 marks" })
  .refine((m) => !m.hops || m.hops.start + m.hops.count <= m.to, {
    message: "numberLine: the hops run past the end of the line",
  })
  .refine(
    (m) =>
      [...(m.labels ?? []), ...m.hidden, ...m.marks, ...(m.hops ? [m.hops.start] : [])].every(
        (x) => x >= m.from && x <= m.to,
      ),
    { message: "numberLine: a label, mark or hop is off the line" },
  );

/** Whole on top, two parts below; `null` draws a "?" circle. */
export const numberBondModelSchema = z
  .object({
    kind: z.literal("numberBond"),
    whole: n20.nullable(),
    parts: z.tuple([n20.nullable(), n20.nullable()]),
  })
  .refine(
    (m) =>
      m.whole == null ||
      m.parts[0] == null ||
      m.parts[1] == null ||
      m.parts[0] + m.parts[1] === m.whole,
    { message: "numberBond: the parts do not add up to the whole" },
  );

/** Dot cards (dice-like), side by side — "two cards with 2 dots" is `cards: [2, 2]`. */
export const dotCardsModelSchema = z.object({
  kind: z.literal("dotCards"),
  cards: z.array(z.number().int().min(0).max(10)).min(1).max(3),
});

/** The 2 × 10 number chart of Lesson 3-3; `hidden` cells show "?", `marked` cells are circled. */
export const numberChartModelSchema = z
  .object({
    kind: z.literal("numberChart"),
    from: z.number().int().min(1).max(20).default(1),
    to: z.number().int().min(1).max(20).default(20),
    hidden: z.array(n20).default([]),
    marked: z.array(n20).max(3).default([]),
  })
  .refine((m) => m.to >= m.from, { message: "numberChart: to < from" });

/** One counter, as a drag card: "drag 7 dots into the ten-frame". */
export const counterModelSchema = z.object({
  kind: z.literal("counter"),
  tone: z.enum(TONES).default("dark"),
});

export const mathModelSchema = z.discriminatedUnion("kind", [
  tenFrameModelSchema,
  tensOnesModelSchema,
  numberLineModelSchema,
  numberBondModelSchema,
  dotCardsModelSchema,
  numberChartModelSchema,
  counterModelSchema,
]);

export type MathModel = z.infer<typeof mathModelSchema>;
export type TenFrameModel = z.infer<typeof tenFrameModelSchema>;
export type TensOnesModel = z.infer<typeof tensOnesModelSchema>;
export type NumberLineModel = z.infer<typeof numberLineModelSchema>;
export type NumberBondModel = z.infer<typeof numberBondModelSchema>;
export type DotCardsModel = z.infer<typeof dotCardsModelSchema>;
export type NumberChartModel = z.infer<typeof numberChartModelSchema>;
export type MathModelKind = MathModel["kind"];
export const MATH_MODEL_KINDS: MathModelKind[] = [
  "tenFrame",
  "tensOnes",
  "numberLine",
  "numberBond",
  "dotCards",
  "numberChart",
  "counter",
];
