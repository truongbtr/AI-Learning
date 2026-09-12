import { z } from "zod";

/**
 * P13 — cài đặt bé (docs/06 §2.1, docs/08 pha 5 việc 4).
 *
 * `dailyMinutes` is the one setting with teeth: the planner turns it into a number of exercises
 * (docs/04 §4 step 1, 8–15). The floor and ceiling here are the ones the planner clamps to anyway,
 * spelled out so a parent typing 90 gets told rather than silently ignored.
 */
export const studentSettingsSchema = z.object({
  /** 10–25 minutes: below 10 the planner's floor of 8 exercises takes over anyway. */
  dailyMinutes: z.number().int().min(10).max(25).optional(),
  /** "18:30" — when the family usually sits down; shown to the child, not enforced. */
  suggestedTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Giờ phải theo dạng HH:MM")
    .nullish(),
  /** −1 … +1 (docs/04 §4 step 5): a child who likes it harder, or needs it gentler. */
  difficultyBias: z.number().min(-1).max(1).optional(),
  mascot: z.enum(["OWL", "ROBOT"]).optional(),
  /** Two or three words each; they end up as the context of exercises (docs/04 §6). */
  interests: z.array(z.string().trim().min(1).max(24)).max(6).optional(),
  avatarKey: z.string().trim().min(1).max(40).nullish(),
});

export const pictureCodeSchema = z.object({
  pictureSetKey: z.enum(["animals", "things"]).optional(),
  pin: z.array(z.string().trim().min(1).max(24)).length(4),
});

/** FR-LRN-06: "100 sao = đi công viên", with the bar shown to the child in K7. */
export const rewardGoalSchema = z.object({
  title: z.string().trim().min(2).max(80),
  starsNeeded: z.number().int().min(10).max(2000),
});

export type StudentSettingsInput = z.infer<typeof studentSettingsSchema>;
