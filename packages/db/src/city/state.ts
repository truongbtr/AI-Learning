// The kid's six subject cities, read from learning data (Pha 10 việc 3, ADR-21).
//
// Everything a city shows is recomputed from Evidence-driven tables on every read; the only city
// data stored is what cannot be recomputed stably (StudentCity: lot order, the kid's plot choices,
// what the kid last saw). Nothing here writes Evidence, Attempt, Session results or SkillMastery.

import {
  buildCityState,
  CITY_SUBJECTS,
  type CityChange,
  type CityInput,
  type CityPlotBuild,
  type CitySeen,
  type CitySkillInput,
  type CityState,
  type CitySubject,
  cityChanges,
  cityToSubject,
  dayKey,
  majoritySubject,
  planStations,
  type StationPlan,
  snapshotOf,
  stationCount,
  subjectToCity,
  vnDayDate,
} from "@mtct/core";
import type { Prisma, PrismaClient } from "../../generated/client";
import { subjectsOnTimetable } from "../session/plan";
import { CITY_SESSION_SLOTS } from "./session";

type Db = PrismaClient;

export class CityError extends Error {
  constructor(
    public code: "PLOT_LOCKED" | "BUILD_LOCKED",
    message: string,
  ) {
    super(message);
  }
}

/** Today's session of one city, as the stations see it. */
export interface CitySessionState {
  id: string;
  status: string;
  stations: StationPlan;
}

export interface CityRead {
  state: CityState;
  /** Growth since the kid last looked (celebrations to play), empty on the first visit. */
  changes: CityChange[];
  /** Today's session in this city (null before the city screen planned one). */
  session: CitySessionState | null;
}

export interface WorldCity {
  city: CitySubject;
  buildings: number;
  /** Stations still to play tonight — the number next to the sparkle on the map. */
  missions: number;
  wonderPieces: number;
  wonderTotal: number;
  plots: number;
  /** Something new to celebrate inside. */
  hasNews: boolean;
  /** Today's city session is finished. */
  doneToday: boolean;
  /** Work waits here tonight: the subject is in tonight's quest, homework waits, or it is begun. */
  tonight: boolean;
  /** The class had this subject today (timetable) — the map points there first. */
  onTimetable: boolean;
  homework: "none" | "open" | "done";
}

interface Shared {
  now: Date;
  todayKey: string;
  starsBySubject: Record<CitySubject, number>;
  badgesEarned: number;
  learningDayKeys: string[];
  daysLearnt: number;
  collectibleCodes: string[];
  petCodes: string[];
  /** Each city's session today: the open one, else the latest finished one. */
  citySessions: Map<string, CitySessionState>;
  /** Subjects in tonight's Daily Quest. */
  questCities: Set<string>;
  errorCountBySkillCode: Map<string, number>;
  remediatingSkillIds: Set<string>;
}

const emptyStars = (): Record<CitySubject, number> =>
  Object.fromEntries(CITY_SUBJECTS.map((c) => [c, 0])) as Record<CitySubject, number>;

/**
 * Stars count toward the city of the subject they were earned in: an exercise's star goes to its
 * skill's subject, a session's bonus to the subject most of its stations were about, a homework
 * round to the homework's subject. Movement breaks and parents' praise belong to no city.
 * Only positive entries count — nothing is ever spent in the city (Pha 10 §1.4).
 */
export async function starsBySubject(
  db: Db,
  studentId: string,
): Promise<Record<CitySubject, number>> {
  const out = emptyStars();
  const rows = await db.starLedger.findMany({
    where: { studentId, delta: { gt: 0 }, refType: { in: ["Attempt", "Session", "Homework"] } },
    select: { delta: true, refType: true, refId: true },
  });
  const ids = (type: string) =>
    rows.filter((r) => r.refType === type && r.refId).map((r) => r.refId as string);
  const homeworkIds = ids("Homework").map((ref) => ref.split(":")[0] as string);
  const [attempts, sessions, homework] = await Promise.all([
    db.attempt.findMany({
      where: { id: { in: ids("Attempt") } },
      select: { id: true, exercise: { select: { subject: true } } },
    }),
    db.session.findMany({
      where: { id: { in: ids("Session") } },
      select: { id: true, slots: true },
    }),
    db.homework.findMany({
      where: { id: { in: homeworkIds } },
      select: { id: true, subject: true },
    }),
  ]);
  const attemptSubject = new Map(attempts.map((a) => [a.id, a.exercise.subject as string]));
  const sessionSubject = new Map(
    sessions.map((s) => {
      const slots = (Array.isArray(s.slots) ? s.slots : []) as { subject?: string }[];
      return [s.id, majoritySubject(slots.map((x) => x.subject).filter((x): x is string => !!x))];
    }),
  );
  const homeworkSubject = new Map(homework.map((h) => [h.id, h.subject as string | null]));
  for (const r of rows) {
    const ref = r.refId ?? "";
    const subject =
      r.refType === "Attempt"
        ? attemptSubject.get(ref)
        : r.refType === "Session"
          ? sessionSubject.get(ref)
          : homeworkSubject.get(ref.split(":")[0] as string);
    if (!subject) continue;
    const city = subjectToCity(subject);
    if (city in out) out[city] += r.delta;
  }
  return out;
}

type StoredSlot = {
  order?: number;
  skillCode?: string;
  exerciseId?: string | null;
  homework?: unknown;
  missing?: string;
  subject?: string;
};

/** A finished attempt: graded, or marked final by the three-try ladder (same rule as the kid API). */
const attemptDone = (a: { gradedAt: Date | null; response: Prisma.JsonValue }) =>
  a.gradedAt !== null || (a.response as { final?: boolean } | null)?.final === true;

export function stationsOfSession(
  slots: Prisma.JsonValue,
  attempts: { order: number; gradedAt: Date | null; response: Prisma.JsonValue }[],
): StationPlan {
  const done = new Set(attempts.filter(attemptDone).map((a) => a.order));
  const list = (Array.isArray(slots) ? slots : []) as StoredSlot[];
  return planStations(
    list
      .filter((s) => typeof s.order === "number")
      .map((s) => ({
        order: s.order as number,
        skillCode: s.skillCode ?? "",
        homework: !!s.homework,
        missing: !s.homework && !s.exerciseId,
        done: done.has(s.order as number),
      })),
  );
}

async function loadShared(db: Db, studentId: string, at: Date): Promise<Shared> {
  const today = vnDayDate(at);
  const [stars, badgesEarned, completed, streak, collectibles, pets, sessions, errorStats, tracks] =
    await Promise.all([
      starsBySubject(db, studentId),
      db.studentBadge.count({ where: { studentId } }),
      db.session.findMany({
        where: { studentId, status: "COMPLETED" },
        select: { date: true },
        distinct: ["date"],
      }),
      db.streak.findUnique({ where: { studentId }, select: { current: true } }),
      db.studentCollectible.findMany({
        where: { studentId },
        orderBy: { acquiredAt: "asc" },
        select: { collectibleCode: true },
      }),
      db.studentPet.findMany({
        where: { studentId },
        orderBy: [{ isCompanion: "desc" }, { hatchedAt: "asc" }],
        select: { petCode: true },
      }),
      db.session.findMany({
        where: { studentId, date: today, kind: { in: ["DAILY_QUEST", "FREE_PLAY"] } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          kind: true,
          slots: true,
          status: true,
          generationLog: true,
          attempts: { select: { order: true, gradedAt: true, response: true } },
        },
      }),
      db.errorStat.findMany({
        where: { studentId, count7d: { gt: 0 } },
        select: { errorCode: true, count7d: true },
      }),
      db.remediationTrack.findMany({
        where: { studentId, status: "ACTIVE" },
        select: { skillId: true },
      }),
    ]);

  const citySessions = new Map<string, CitySessionState>();
  const questCities = new Set<string>();
  for (const session of sessions) {
    if (session.kind === "DAILY_QUEST") {
      for (const slot of (Array.isArray(session.slots) ? session.slots : []) as StoredSlot[])
        if (slot.subject) questCities.add(subjectToCity(slot.subject));
      continue;
    }
    const city = (session.generationLog as { city?: string } | null)?.city;
    if (!city) continue;
    const known = citySessions.get(city);
    // newest first: keep the newest, but an open session wins over a finished one
    if (known && (known.status !== "COMPLETED" || session.status === "COMPLETED")) continue;
    citySessions.set(city, {
      id: session.id,
      status: session.status,
      stations: stationsOfSession(session.slots, session.attempts),
    });
  }

  const codes = await db.errorCode.findMany({
    where: { code: { in: errorStats.map((e) => e.errorCode) } },
    select: { code: true, remediationSkills: true },
  });
  const errorCountBySkillCode = new Map<string, number>();
  for (const e of errorStats) {
    for (const skillCode of codes.find((c) => c.code === e.errorCode)?.remediationSkills ?? []) {
      errorCountBySkillCode.set(
        skillCode,
        Math.max(errorCountBySkillCode.get(skillCode) ?? 0, e.count7d),
      );
    }
  }

  return {
    now: at,
    todayKey: dayKey(at),
    starsBySubject: stars,
    badgesEarned,
    learningDayKeys: completed.map((s) => s.date.toISOString().slice(0, 10)),
    daysLearnt: streak?.current ?? 0,
    collectibleCodes: collectibles.map((c) => c.collectibleCode),
    petCodes: pets.map((p) => p.petCode),
    citySessions,
    questCities,
    errorCountBySkillCode,
    remediatingSkillIds: new Set(tracks.map((t) => t.skillId)),
  };
}

async function loadCity(db: Db, studentId: string, city: CitySubject, shared: Shared) {
  const subject = cityToSubject(city);
  // Vietnam midnight (vnDayDate is 00:00 UTC of the Vietnamese day, i.e. 07:00 local)
  const startOfToday = new Date(vnDayDate(shared.now).getTime() - 7 * 3_600_000);
  const since = new Date(startOfToday.getTime() - 2 * 86_400_000);
  const session = shared.citySessions.get(city) ?? null;
  const stationCodes = [
    ...new Set(session?.stations.stations.filter((s) => !s.done).map((s) => s.skillCode) ?? []),
  ];
  const [masteries, record, homework] = await Promise.all([
    db.skillMastery.findMany({
      where: { studentId, evidenceCount: { gt: 0 }, skill: { subject } },
      select: {
        skillId: true,
        mastery: true,
        status: true,
        masteredSince: true,
        createdAt: true,
        skill: { select: { code: true, nameVi: true, nameEn: true, order: true } },
      },
    }),
    db.studentCity.upsert({
      where: { studentId_subject: { studentId, subject } },
      create: { studentId, subject },
      update: {},
    }),
    db.homework.findMany({
      where: {
        studentId,
        subject,
        diary: { date: { gte: since } },
        // still open, or finished today — yesterday's finished homework no longer lights the street
        OR: [{ status: { in: ["PENDING", "IN_PROGRESS"] } }, { doneAt: { gte: startOfToday } }],
      },
      select: { status: true, optional: true },
    }),
  ]);
  const skills: CitySkillInput[] = masteries.map((m) => ({
    skillId: m.skillId,
    code: m.skill.code,
    nameVi: m.skill.nameVi,
    nameEn: m.skill.nameEn,
    order: m.skill.order,
    firstAt: m.createdAt,
    mastery: m.mastery,
    status: m.status,
    masteredSince: m.masteredSince,
    errorCount7d: shared.errorCountBySkillCode.get(m.skill.code) ?? 0,
    remediationActive: shared.remediatingSkillIds.has(m.skillId),
  }));
  // a station on a skill never practised yet: its building starts tonight, as a construction site
  const known = new Set(skills.map((s) => s.code));
  const fresh = stationCodes.filter((c) => !known.has(c));
  if (fresh.length > 0) {
    const rows = await db.skill.findMany({
      where: { code: { in: fresh }, subject },
      select: { id: true, code: true, nameVi: true, nameEn: true, order: true },
    });
    for (const s of rows) {
      skills.push({
        skillId: s.id,
        code: s.code,
        nameVi: s.nameVi,
        nameEn: s.nameEn,
        order: s.order,
        firstAt: shared.now,
        mastery: 0,
        status: "NEW",
        masteredSince: null,
        errorCount7d: 0,
        remediationActive: false,
      });
    }
  }
  const input: CityInput = {
    city,
    now: shared.now,
    todayKey: shared.todayKey,
    skills,
    storedOrder: record.skillOrder,
    missionSkillCodes: stationCodes,
    starsEarned: shared.starsBySubject[city],
    plotBuilds: parsePlotBuilds(record.plotBuilds),
    badgesEarned: shared.badgesEarned,
    learningDayKeys: shared.learningDayKeys,
    daysLearnt: shared.daysLearnt,
    collectibleCodes: shared.collectibleCodes,
    petCodes: shared.petCodes,
    homework: homework.map((h) => ({ status: h.status, optional: h.optional })),
  };
  const state = buildCityState(input);
  if (state.skillOrder.length !== record.skillOrder.length) {
    await db.studentCity.update({
      where: { id: record.id },
      data: { skillOrder: state.skillOrder },
    });
  }
  return { state, record, session };
}

function parsePlotBuilds(value: Prisma.JsonValue): CityPlotBuild[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((v) => {
    const o = v as { plot?: unknown; build?: unknown };
    return typeof o?.plot === "number" && typeof o?.build === "string"
      ? [{ plot: o.plot, build: o.build }]
      : [];
  });
}

function parseSeen(value: Prisma.JsonValue | null): CitySeen | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const o = value as Record<string, unknown>;
  if (typeof o.owned !== "number" || typeof o.levels !== "object") return null;
  return o as unknown as CitySeen;
}

/** One city for the kid: what to draw, the HUD numbers, what grew, and tonight's stations. */
export async function cityRead(
  db: Db,
  studentId: string,
  city: CitySubject,
  at = new Date(),
): Promise<CityRead> {
  const shared = await loadShared(db, studentId, at);
  const { state, record, session } = await loadCity(db, studentId, city, shared);
  return { state, changes: cityChanges(parseSeen(record.seen), state.view), session };
}

/** The world map: one line per city. */
export async function worldRead(db: Db, studentId: string, at = new Date()): Promise<WorldCity[]> {
  const shared = await loadShared(db, studentId, at);
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { className: true },
  });
  const timetable = new Set(
    (await subjectsOnTimetable(db, student?.className ?? "1B3", at)).map((s) => subjectToCity(s)),
  );
  const out: WorldCity[] = [];
  for (const city of CITY_SUBJECTS) {
    const { state, record, session } = await loadCity(db, studentId, city, shared);
    const { view, hud } = state;
    const doneToday = session?.status === "COMPLETED";
    // tonight's work: a subject of tonight's quest, the teacher's homework, or a city already begun
    const begun = !!session && session.status !== "COMPLETED";
    const tonight = shared.questCities.has(city) || view.townHallOrder === "open" || begun;
    const left = begun
      ? (session?.stations.stations.filter((s) => !s.done).length ?? 0)
      : tonight
        ? stationCount(CITY_SESSION_SLOTS)
        : 0;
    out.push({
      city,
      buildings: view.skills.length,
      missions: doneToday ? 0 : left,
      wonderPieces: hud.wonder.pieces,
      wonderTotal: hud.wonder.total,
      plots: view.land.owned,
      hasNews: cityChanges(parseSeen(record.seen), view).length > 0,
      doneToday,
      tonight: tonight && !doneToday,
      onTimetable: timetable.has(city),
      homework: view.townHallOrder,
    });
  }
  return out;
}

/** The kid has watched the celebrations: remember this city as seen. Recomputed, never from the client. */
export async function markCitySeen(
  db: Db,
  studentId: string,
  city: CitySubject,
  at = new Date(),
): Promise<void> {
  const shared = await loadShared(db, studentId, at);
  const { state, record } = await loadCity(db, studentId, city, shared);
  await db.studentCity.update({
    where: { id: record.id },
    data: { seen: snapshotOf(state.view) as unknown as Prisma.InputJsonValue },
  });
}

/** "Con chọn xây gì": only on an unlocked plot, only something the city has unlocked. */
export async function choosePlotBuild(
  db: Db,
  studentId: string,
  city: CitySubject,
  plot: number,
  build: string,
  at = new Date(),
): Promise<CityState> {
  const shared = await loadShared(db, studentId, at);
  const { state, record } = await loadCity(db, studentId, city, shared);
  if (!Number.isInteger(plot) || plot < 0 || plot >= state.view.land.owned) {
    throw new CityError("PLOT_LOCKED", "Ô đất này chưa mở");
  }
  if (!state.hud.unlockedBuilds.includes(build)) {
    throw new CityError("BUILD_LOCKED", "Công trình này chưa mở khoá");
  }
  const builds = parsePlotBuilds(record.plotBuilds).filter((b) => b.plot !== plot);
  builds.push({ plot, build });
  const stored = builds.map((b) => ({ ...b, at: at.toISOString() }));
  await db.studentCity.update({
    where: { id: record.id },
    data: { plotBuilds: stored as Prisma.InputJsonValue },
  });
  return {
    ...state,
    view: {
      ...state.view,
      land: { ...state.view.land, builds: builds.sort((a, b) => a.plot - b.plot) },
    },
  };
}
