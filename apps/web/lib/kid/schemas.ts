import { z } from "zod";

/**
 * What the kid app is allowed to send (docs/02 §6: never trust the device).
 *
 * An answer is a small, closed shape — no scores, no "correct" flag, no skill codes. The child's
 * device reports what was tapped, said or photographed; the server decides what it means.
 */
export const attemptResponseSchema = z
  .object({
    choiceId: z
      .string()
      .regex(/^[a-z]$/, "Phương án là một chữ cái")
      .optional(),
    placements: z.record(z.string().max(24), z.array(z.string().max(24)).max(20)).optional(),
    count: z.number().int().min(0).max(50).optional(),
    heard: z.string().trim().max(500).optional(),
    seconds: z.number().min(0).max(600).optional(),
    parentVerdict: z.enum(["good", "retry"]).optional(),
    photoKey: z.string().trim().max(200).optional(),
    skipped: z.boolean().optional(),
  })
  .strict();

export const submitAttemptSchema = z.object({
  order: z.number().int().min(0).max(60),
  response: attemptResponseSchema,
  timeMs: z
    .number()
    .int()
    .min(0)
    .max(30 * 60_000)
    .optional(),
  hintsUsed: z.number().int().min(0).max(10).optional(),
  /** Same token twice = the same submit arriving twice; it is not graded again. */
  token: z.string().trim().min(6).max(64).optional(),
});

export const planSessionSchema = z.object({
  studentId: z.string().min(1),
  /** Only ever today or a day a parent is testing with; the planner is idempotent per day. */
  date: z.coerce.date().optional(),
  force: z.boolean().optional(),
});

export type SubmitAttemptBody = z.infer<typeof submitAttemptSchema>;
export type PlanSessionBody = z.infer<typeof planSessionSchema>;
