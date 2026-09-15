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
  snapshotOf,
  subjectToCity,
  vnDayDate,
} from "@mtct/core";
import type { Prisma, PrismaClient } from "../../generated/client";
import { planTargetedSession, TargetedSessionError } from "../session/targeted";

type Db = PrismaClient;

export class CityError extends Error {
  constructor(
    public code:
      | "PLOT_LOCKED"
      | "BUILD_LOCKED"
      | "SKILL_NOT_IN_CITY"
      | "SKILL_NOT_WAITING"
      | "NO_EXERCISES",
    message: string,
  ) {
    super(message);
  }
}

export interface CityRead {
  state: CityState;
  /** Growth since the kid last looked (celebrations to play), empty on the first visit. */
  changes: CityChange[];
}

export interface WorldCity {
  city: CitySubject;
  buildings: number;
  /** Buildings with a mission today — the map shows a sparkle on the city. */
  missions: number;
  waiting: number;
  wonderPieces: number;
  wonderTotal: number;
  plots: number;
  /** Something new to celebrate inside. */
  hasNews: boolean;
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
  /** Skill codes with an unanswered station in today's Daily Quest. */
  missionSkillCodes: string[];
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

async function loadShared(db: Db, studentId: string, at: Date): Promise<Shared> {
  const today = vnDayDate(at);
  const [stars, badgesEarned, completed, streak, collectibles, pets, quest, errorStats, tracks] =
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
      db.session.findFirst({
        where: { studentId, date: today, kind: "DAILY_QUEST" },
        orderBy: { createdAt: "desc" },
        select: { slots: true, attempts: { select: { order: true } } },
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

  const answered = new Set(quest?.attempts.map((a) => a.order) ?? []);
  const slots = (Array.isArray(quest?.slots) ? quest?.slots : []) as {
    order?: number;
    skillCode?: string;
    exerciseId?: string | null;
  }[];
  const missionSkillCodes = slots
    .filter((s) => s.exerciseId && s.skillCode && s.order !== undefined && !answered.has(s.order))
    .map((s) => s.skillCode as string);

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
    missionSkillCodes,
    errorCountBySkillCode,
    remediatingSkillIds: new Set(tracks.map((t) => t.skillId)),
  };
}

async function loadCity(db: Db, studentId: string, city: CitySubject, shared: Shared) {
  const subject = cityToSubject(city);
  // Vietnam midnight (vnDayDate is 00:00 UTC of the Vietnamese day, i.e. 07:00 local)
  const startOfToday = new Date(vnDayDate(shared.now).getTime() - 7 * 3_600_000);
  const since = new Date(startOfToday.getTime() - 2 * 86_400_000);
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
  const input: CityInput = {
    city,
    now: shared.now,
    todayKey: shared.todayKey,
    skills,
    storedOrder: record.skillOrder,
    missionSkillCodes: shared.missionSkillCodes,
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
  return { state, record };
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

/** One city for the kid: what to draw, the HUD numbers, and what grew since the last visit. */
export async function cityRead(
  db: Db,
  studentId: string,
  city: CitySubject,
  at = new Date(),
): Promise<CityRead> {
  const shared = await loadShared(db, studentId, at);
  const { state, record } = await loadCity(db, studentId, city, shared);
  return { state, changes: cityChanges(parseSeen(record.seen), state.view) };
}

/** The world map: one line per city. */
export async function worldRead(db: Db, studentId: string, at = new Date()): Promise<WorldCity[]> {
  const shared = await loadShared(db, studentId, at);
  const out: WorldCity[] = [];
  for (const city of CITY_SUBJECTS) {
    const { state, record } = await loadCity(db, studentId, city, shared);
    const { view, hud } = state;
    out.push({
      city,
      buildings: view.skills.length,
      missions: view.skills.filter((s) => s.mission).length,
      waiting: view.skills.filter((s) => s.needsHelp || s.level === 0).length,
      wonderPieces: hud.wonder.pieces,
      wonderTotal: hud.wonder.total,
      plots: view.land.owned,
      hasNews: cityChanges(parseSeen(record.seen), view).length > 0,
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

export interface CityPracticeResult {
  sessionId: string;
  created: boolean;
  skillCode: string;
}

/**
 * The kid taps scaffolding → a short TARGETED session on exactly that skill.
 *
 * POST /api/sessions/targeted stays closed to children (a six-year-old must not pick the skill they
 * find easiest). This door is narrower: the server re-derives the city and only opens a session
 * for a building the system itself is showing as waiting — scaffolding (level 0) or a worker
 * (repeated errors, a remediation ladder). One session per skill per day: tapping again reopens it.
 */
export async function startCityPractice(
  db: Db,
  studentId: string,
  city: CitySubject,
  skillId: string,
  at = new Date(),
): Promise<CityPracticeResult> {
  const shared = await loadShared(db, studentId, at);
  const { state } = await loadCity(db, studentId, city, shared);
  const building = state.view.skills.find((s) => s.skillId === skillId);
  if (!building) throw new CityError("SKILL_NOT_IN_CITY", "Kỹ năng này không ở thành phố này");
  if (!building.needsHelp && building.level > 0) {
    throw new CityError(
      "SKILL_NOT_WAITING",
      "Công trình này đã vững, không cần luyện thêm hôm nay",
    );
  }
  const skill = await db.skill.findUnique({ where: { id: skillId }, select: { code: true } });
  if (!skill) throw new CityError("SKILL_NOT_IN_CITY", "Không tìm thấy kỹ năng");

  const today = vnDayDate(at);
  const existing = await db.session.findMany({
    where: { studentId, kind: "TARGETED", date: today, status: { in: ["PLANNED", "IN_PROGRESS"] } },
    orderBy: { createdAt: "desc" },
    select: { id: true, slots: true },
  });
  const reuse = existing.find((s) => {
    const slots = (Array.isArray(s.slots) ? s.slots : []) as { skillCode?: string }[];
    return slots.some((x) => x.skillCode === skill.code);
  });
  if (reuse) return { sessionId: reuse.id, created: false, skillCode: skill.code };

  try {
    const result = await planTargetedSession(db, studentId, skill.code, { date: at });
    return { sessionId: result.sessionId, created: result.created, skillCode: skill.code };
  } catch (err) {
    if (err instanceof TargetedSessionError && err.code === "NO_EXERCISES") {
      throw new CityError("NO_EXERCISES", "Chưa có bài luyện cho kỹ năng này");
    }
    throw err;
  }
}
