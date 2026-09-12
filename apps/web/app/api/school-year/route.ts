import {
  applySchoolYearStart,
  listSchoolWeeks,
  prisma,
  proposeSchoolYearStart,
  updateSchoolWeek,
} from "@mtct/db";
import { z } from "zod";
import { handle, json, parseBody } from "@/lib/api";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const applySchema = z.object({
  startMonday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const weekEditSchema = z.object({
  weekId: z.string().min(1),
  isHoliday: z.boolean().optional(),
  note: z.string().trim().max(200).nullish(),
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),
});

/** GET /api/school-year — what the diary says the first Monday was, plus the 35 weeks (docs/11 §5). */
export const GET = handle(async () => {
  await requireRole("PARENT", "ADMIN");
  const [proposal, weeks] = await Promise.all([
    proposeSchoolYearStart(prisma),
    listSchoolWeeks(prisma),
  ]);
  return json({ ...proposal, weeks });
});

/**
 * PATCH /api/school-year — one week: a holiday, a note, or dates a parent corrected by hand
 * (P12, FR-PAR-06).
 *
 * A holiday week is how a family says "the class did not move that week", so nothing and nobody
 * is behind because of Tết.
 */
export const PATCH = handle(async (request: Request) => {
  await requireRole("PARENT", "ADMIN");
  const body = await parseBody(request, weekEditSchema);
  const week = await updateSchoolWeek(prisma, body.weekId, {
    isHoliday: body.isHoliday,
    note: body.note === undefined ? undefined : body.note,
    dateFrom: body.dateFrom ? new Date(`${body.dateFrom}T00:00:00Z`) : undefined,
    dateTo: body.dateTo ? new Date(`${body.dateTo}T00:00:00Z`) : undefined,
  });
  return json({ week });
});

/**
 * POST /api/school-year — a parent confirms the date, and the 35 weeks move.
 *
 * Deliberately a separate, explicit step: `expectedWeek` for every skill is measured against these
 * weeks, so moving them silently would quietly re-label how far behind or ahead a child is.
 */
export const POST = handle(async (request: Request) => {
  const user = await requireRole("PARENT", "ADMIN");
  const { startMonday } = await parseBody(request, applySchema);
  const applied = await applySchoolYearStart(prisma, new Date(`${startMonday}T00:00:00Z`), user.id);
  return json(applied);
});
