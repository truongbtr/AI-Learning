import { z } from "zod";
import { skillCodeSchema, subjectSchema } from "@/lib/mastery/schemas";

/** The filters `/parent/<bé>/evidence` and the skill drawer share (docs/08 pha 5, tiêu chí 1). */
export const evidenceQuerySchema = z.object({
  subject: subjectSchema.nullish(),
  skill: skillCodeSchema.nullish(),
  error: z
    .string()
    .trim()
    .regex(/^[a-z][a-z0-9_]{2,40}$/)
    .nullish(),
  source: z
    .enum([
      "EXERCISE",
      "INTAKE_PHOTO",
      "INTAKE_TEACHER_NOTE",
      "HOMEWORK",
      "EXTERNAL_REPORT",
      "PARENT_NOTE",
      "PARENT_OVERRIDE",
      "VOICE_TUTOR",
    ])
    .nullish(),
  outcome: z.enum(["CORRECT", "PARTIAL", "INCORRECT", "OBSERVED"]).nullish(),
  /** Last N days, counted from today inclusive. */
  days: z.coerce.number().int().min(1).max(365).nullish(),
  limit: z.coerce.number().int().min(1).max(200).nullish(),
  cursor: z.string().trim().min(1).max(40).nullish(),
});

export type EvidenceQuery = z.infer<typeof evidenceQuerySchema>;

/** Reads the filters off a URL, dropping empty strings so `?subject=` means "no filter". */
export function evidenceQueryFrom(params: URLSearchParams | Record<string, string | undefined>) {
  const get = (key: string) =>
    params instanceof URLSearchParams ? params.get(key) : (params[key] ?? null);
  const raw = Object.fromEntries(
    ["subject", "skill", "error", "source", "outcome", "days", "limit", "cursor"]
      .map((key) => [key, get(key) || undefined])
      .filter(([, v]) => v !== undefined),
  );
  return evidenceQuerySchema.parse(raw);
}

/** POST /api/sessions/targeted — the "Luyện hôm nay" button in the skill drawer (FR-PAR-02). */
export const targetedSessionSchema = z.object({
  studentId: z.string().min(1),
  skillCode: skillCodeSchema,
  /** Include the prerequisites the child is not yet solid on. Default true (docs/04 §2). */
  withPrerequisites: z.boolean().optional(),
});
