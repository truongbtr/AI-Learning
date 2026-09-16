// "Làm nhiệm vụ" inside one subject city (Pha 10 việc 4, tiêu chí 1: 12 missions, at least three
// exercise types). Built with the SAME planner and exercise picker as the Daily Quest, only narrowed
// to one subject — no second planning algorithm (docs/04 §4, ADR-21).

import { type CitySubject, cityToSubject, planSession, type Slot, vnDayDate } from "@mtct/core";
import type { Prisma, PrismaClient } from "../../generated/client";
import { type PickedSlot, pickExercises, plannerSnapshot } from "../session/plan";
import { syllableStations } from "../session/syllable-plan";

type Db = PrismaClient;

export const CITY_SESSION_SLOTS = 12;
/** planSession turns minutes into slots at 1.3 min each: 15.6 min → 12 slots. */
const CITY_SESSION_MINUTES = CITY_SESSION_SLOTS * 1.3;
/** The session is varied on purpose: the kid should meet at least this many exercise types. */
export const CITY_SESSION_MIN_TYPES = 3;

export interface CitySessionPlan {
  sessionId: string;
  created: boolean;
  slots: PickedSlot[];
  status: string;
}

/** Spread exercise types over the slots: slot i prefers the i-th type its skill supports. */
export function varyTypes(slots: Slot[], typesBySkill: Map<string, string[]>): Slot[] {
  const counter = new Map<string, number>();
  return slots.map((slot) => {
    const types = typesBySkill.get(slot.skillCode) ?? [];
    if (types.length < 2 || slot.prefer?.targetsError || slot.prefer?.types?.length) return slot;
    const n = counter.get(slot.skillCode) ?? 0;
    counter.set(slot.skillCode, n + 1);
    // offset by slot order so two skills with the same type list do not both start on type 0
    const type = types[(n + slot.order) % types.length] as string;
    return { ...slot, prefer: { ...slot.prefer, types: [type] } };
  });
}

/**
 * Today's city session for one subject: returned as it is if already planned (a kid leaving and
 * coming back finds the same missions), planned now otherwise. After a finished session the same
 * one comes back (the city shows "xong"), unless `again` — "chơi thêm" — plans a fresh one.
 * The subject's teacher homework that can be done on screen opens the road, like on the Daily Quest.
 */
export async function planCitySession(
  db: Db,
  studentId: string,
  city: CitySubject,
  date = new Date(),
  opts: { again?: boolean } = {},
): Promise<CitySessionPlan> {
  const day = vnDayDate(date);
  const subject = cityToSubject(city);
  const today = await db.session.findMany({
    where: { studentId, kind: "FREE_PLAY", date: day },
    orderBy: { createdAt: "desc" },
    select: { id: true, slots: true, status: true, generationLog: true },
  });
  const mine = today.filter((s) => (s.generationLog as { city?: string } | null)?.city === city);
  // the open one if there is one; the finished one unless the child asked to play again
  const existing = mine.find((s) => s.status !== "COMPLETED") ?? (opts.again ? undefined : mine[0]);
  if (existing) {
    return {
      sessionId: existing.id,
      created: false,
      slots: (existing.slots ?? []) as unknown as PickedSlot[],
      status: existing.status,
    };
  }

  const input = await plannerSnapshot(db, studentId, date);
  const skills = input.skills.filter((s) => s.subject === subject);
  const codes = new Set(skills.map((s) => s.code));
  const plan = planSession({
    ...input,
    dailyMinutes: CITY_SESSION_MINUTES,
    skills,
    todaySubjects: [subject],
    lessonSkills: (input.lessonSkills ?? []).filter((c) => codes.has(c)),
    planSkills: (input.planSkills ?? []).filter((c) => codes.has(c)),
    activeErrors: (input.activeErrors ?? []).map((e) => ({
      ...e,
      remediationSkills: e.remediationSkills.filter((c) => codes.has(c)),
    })),
    tracks: (input.tracks ?? []).filter((t) => codes.has(t.skillCode)),
  });

  const skillRows = await db.skill.findMany({
    where: { code: { in: [...new Set(plan.slots.map((s) => s.skillCode))] } },
    select: { code: true, exerciseTypes: true },
  });
  const typesBySkill = new Map(skillRows.map((s) => [s.code, s.exerciseTypes]));
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { mascot: true },
  });
  const practice = await pickExercises(db, varyTypes(plan.slots, typesBySkill), {
    recentExerciseIds: input.recentExerciseIds,
    theme: student?.mascot === "OWL" ? "GARDEN" : "ROBOT",
  });

  const homework = await db.homework.findMany({
    where: {
      studentId,
      subject,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      taskType: { in: ["READ_ALOUD", "VIDEO_SUBMIT"] },
      diary: { date: { gte: new Date(day.getTime() - 2 * 86_400_000) } },
    },
    orderBy: [{ optional: "asc" }, { createdAt: "asc" }],
    take: 2,
  });
  const homeworkSlots: PickedSlot[] = homework.map((h, i) => ({
    order: i + 1,
    kind: "homework",
    skillCode: h.skillCodes[0] ?? "",
    subject,
    difficulty: 2,
    reason: h.optional ? "cô khuyến khích" : "bài cô giao hôm nay",
    exerciseId: null,
    homework: {
      id: h.id,
      taskType: h.taskType,
      text: h.text,
      repeatCount: h.repeatCount,
      pages: h.pages,
      submitTo: h.submitTo,
      subject: h.subject,
    },
  }));

  // Phố Chữ: spelling practice is played in Xưởng Tiếng (pha 12). Other cities are unchanged.
  const games =
    city === "viet"
      ? await syllableStations(db, studentId, practice.slice(0, CITY_SESSION_SLOTS), date)
      : { slots: practice.slice(0, CITY_SESSION_SLOTS), log: [] as string[] };
  const slots: PickedSlot[] = [
    ...homeworkSlots,
    ...games.slots.map((slot, i) => ({ ...slot, order: homeworkSlots.length + i + 1 })),
  ];
  const session = await db.session.create({
    data: {
      studentId,
      kind: "FREE_PLAY",
      date: day,
      status: "PLANNED",
      slots: slots as unknown as Prisma.InputJsonValue,
      generationLog: {
        city,
        log: plan.log,
        remediating: plan.remediating,
        missing: slots.filter((p) => p.missing).map((p) => p.missing),
        plannedAt: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    },
  });
  return { sessionId: session.id, created: true, slots, status: "PLANNED" };
}
