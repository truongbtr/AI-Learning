import { z } from "zod";

export const SUBJECTS = ["ESL", "ENL", "EMATH", "ESCI", "VIET", "VMATH"] as const;

export const subjectSchema = z.enum(SUBJECTS);

export const skillCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Z]+\.[A-Z]+\.[A-Z0-9_]+$/, "Mã kỹ năng không hợp lệ");

/** POST /api/evidence — internal (docs/02 §5, docs/03 §2.3). */
export const evidenceInputSchema = z
  .object({
    studentId: z.string().min(1),
    skillCode: skillCodeSchema.optional(),
    skillId: z.string().min(1).optional(),
    source: z.enum([
      "EXERCISE",
      "INTAKE_PHOTO",
      "INTAKE_TEACHER_NOTE",
      "HOMEWORK",
      "EXTERNAL_REPORT",
      "PARENT_NOTE",
      "PARENT_OVERRIDE",
      "VOICE_TUTOR",
    ]),
    outcome: z.enum(["CORRECT", "PARTIAL", "INCORRECT", "OBSERVED"]),
    score: z.number().min(0).max(1),
    difficulty: z.number().int().min(1).max(5).optional(),
    hintsUsed: z.number().int().min(0).max(10).optional(),
    tries: z.number().int().min(1).max(10).optional(),
    /** Must be a code in content/error-taxonomy.json; the service rejects anything else. */
    errorCode: z
      .string()
      .trim()
      .regex(/^[a-z][a-z0-9_]{2,40}$/, "Mã lỗi phải là snake_case")
      .nullish(),
    note: z.string().trim().max(500).nullish(),
    observedAt: z.coerce.date().optional(),
    attemptId: z.string().nullish(),
    intakeItemId: z.string().nullish(),
  })
  .refine((v) => Boolean(v.skillCode || v.skillId), {
    message: "Cần skillCode hoặc skillId",
    path: ["skillCode"],
  });

export type EvidenceInput = z.infer<typeof evidenceInputSchema>;

export const skillSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(120),
  subject: subjectSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
