import { getTimetable, prisma, updateTimetableSlots } from "@mtct/db";
import { z } from "zod";
import { ApiError, handle, json, parseBody } from "@/lib/api";
import { requireRole } from "@/lib/auth/session";
import { subjectSchema } from "@/lib/mastery/schemas";

export const dynamic = "force-dynamic";

const editSchema = z.object({
  className: z.string().min(1).max(20).default("1B3"),
  slots: z
    .array(
      z.object({
        weekday: z.number().int().min(1).max(5),
        period: z.enum(["1-2", "3-4", "5-6", "7-8", "DATN", "9-10"]),
        subject: subjectSchema.nullable(),
        subjectLabelVi: z.string().trim().min(1).max(60).optional(),
        isNative: z.boolean().optional(),
      }),
    )
    .min(1)
    .max(30),
});

/** GET /api/timetable?className=1B3 — the class timetable as P12 draws it (FR-PAR-06). */
export const GET = handle(async (request: Request) => {
  await requireRole("PARENT", "ADMIN");
  const className = new URL(request.url).searchParams.get("className") ?? "1B3";
  const timetable = await getTimetable(prisma, className);
  if (!timetable) throw new ApiError(404, "Chưa có thời khoá biểu cho lớp này");
  return json(timetable);
});

/**
 * PATCH /api/timetable — a parent corrects which core subject a period really is.
 *
 * This is not cosmetic: `plannerSnapshot` reads the timetable to decide which subjects lead
 * tomorrow's session (docs/05 §2), so a wrong mapping quietly practises the wrong thing all term.
 */
export const PATCH = handle(async (request: Request) => {
  await requireRole("PARENT", "ADMIN");
  const body = await parseBody(request, editSchema);
  const timetable = await getTimetable(prisma, body.className);
  if (!timetable) throw new ApiError(404, "Chưa có thời khoá biểu cho lớp này");
  const changed = await updateTimetableSlots(prisma, timetable.id, body.slots);
  return json({ changed, timetable: await getTimetable(prisma, body.className) });
});
