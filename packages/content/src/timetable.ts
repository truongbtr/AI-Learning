import { z } from "zod";

/** Subjects that map to the 6 core skill-map subjects (docs/05 §1); null = not tracked. */
export const SUBJECTS = ["ESL", "ENL", "EMATH", "ESCI", "VIET", "VMATH"] as const;
export const PERIODS = ["1-2", "3-4", "5-6", "7-8", "DATN", "9-10"] as const;

const time = z.string().regex(/^\d{2}:\d{2}$/, "HH:MM");

export const timetableSlotSchema = z.object({
  weekday: z.number().int().min(1).max(5),
  period: z.enum(PERIODS),
  subjectLabelVi: z.string().min(1),
  subjectLabelEn: z.string().min(1),
  subject: z.enum(SUBJECTS).nullable(),
  isNative: z.boolean(),
});

export const timetableFileSchema = z
  .object({
    $schema: z.string().optional(),
    className: z.string().min(1),
    schoolYear: z.string().regex(/^\d{4}-\d{4}$/),
    validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    source: z.string().optional(),
    periods: z
      .array(z.object({ period: z.enum(PERIODS), timeFrom: time, timeTo: time }))
      .length(PERIODS.length),
    slots: z.array(timetableSlotSchema),
  })
  .superRefine((file, ctx) => {
    const seen = new Set<string>();
    for (const slot of file.slots) {
      const key = `${slot.weekday}:${slot.period}`;
      if (seen.has(key)) {
        ctx.addIssue({ code: "custom", message: `Duplicate slot ${key}`, path: ["slots"] });
      }
      seen.add(key);
    }
    if (file.slots.length !== 30) {
      ctx.addIssue({
        code: "custom",
        message: `Expected 30 slots (5 weekdays x 6 periods), got ${file.slots.length}`,
        path: ["slots"],
      });
    }
  });

export type TimetableFile = z.infer<typeof timetableFileSchema>;
export type TimetableSlotDef = z.infer<typeof timetableSlotSchema>;

/** Parses and validates a timetable JSON document; throws with a readable message. */
export function parseTimetable(json: unknown): TimetableFile {
  const result = timetableFileSchema.safeParse(json);
  if (!result.success) {
    throw new Error(`Invalid timetable: ${z.prettifyError(result.error)}`);
  }
  return result.data;
}

/** Joins each slot with its period times, ready for the TimetableSlot table. */
export function flattenTimetable(file: TimetableFile) {
  const byPeriod = new Map(file.periods.map((p) => [p.period, p]));
  return file.slots.map((slot) => {
    const p = byPeriod.get(slot.period)!;
    return { ...slot, timeFrom: p.timeFrom, timeTo: p.timeTo };
  });
}
