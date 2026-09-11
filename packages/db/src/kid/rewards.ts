import {
  EGG_CRACKS_TO_HATCH,
  PICTURE_PIECES,
  pictureForWeek,
  type WeeklyEvent,
  weeklyEvent,
  weekStartOf,
} from "@mtct/core";
import type { PrismaClient } from "../../generated/client";

/**
 * What a child gets for turning up (docs/06 §1.8c items 1, 2, 10, 11 and §1.5).
 *
 * Everything here is derived from days actually learnt, never incremented blindly, so running it
 * twice after a reconnect cannot hatch two pets or hand out the same badge again. And nothing here
 * ever takes something away: a missed day leaves the egg and the picture exactly as they were.
 */

type Db = PrismaClient;

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Days this week on which the child finished at least one session. */
async function learningDaysThisWeek(db: Db, studentId: string, at: Date): Promise<number> {
  const from = weekStartOf(at);
  const rows = await db.session.findMany({
    where: { studentId, status: "COMPLETED", date: { gte: from, lte: startOfDay(at) } },
    select: { date: true },
    distinct: ["date"],
  });
  return rows.length;
}

export interface EggState {
  weekStart: string;
  cracks: number;
  needed: number;
  hatched: { code: string; name: string } | null;
  /** True only on the run that hatched it, so the finale knows to play the scene. */
  justHatched: boolean;
}

/** One crack per day learnt; the fifth one hatches (docs/06 §1.8c item 1). */
export async function updateEgg(db: Db, studentId: string, at = new Date()): Promise<EggState> {
  const weekStart = weekStartOf(at);
  const cracks = Math.min(EGG_CRACKS_TO_HATCH, await learningDaysThisWeek(db, studentId, at));
  const existing = await db.eggProgress.findUnique({
    where: { studentId_weekStart: { studentId, weekStart } },
  });

  let hatchedPetCode = existing?.hatchedPetCode ?? null;
  let justHatched = false;
  if (!hatchedPetCode && cracks >= EGG_CRACKS_TO_HATCH) {
    const owned = await db.studentPet.findMany({ where: { studentId }, select: { petCode: true } });
    const pool = await db.pet.findMany({
      where: { code: { notIn: owned.map((o) => o.petCode) } },
      orderBy: { code: "asc" },
    });
    // Common pets first so a rare one stays rare; the choice is random inside that.
    const common = pool.filter((p) => p.rarity !== "rare");
    const pick = (common.length > 0 ? common : pool)[
      Math.floor(Math.random() * Math.max(1, (common.length > 0 ? common : pool).length))
    ];
    if (pick) {
      hatchedPetCode = pick.code;
      justHatched = true;
      await db.studentPet.upsert({
        where: { studentId_petCode: { studentId, petCode: pick.code } },
        create: { studentId, petCode: pick.code, isCompanion: owned.length === 0 },
        update: {},
      });
    }
  }

  await db.eggProgress.upsert({
    where: { studentId_weekStart: { studentId, weekStart } },
    create: { studentId, weekStart, cracks, hatchedPetCode },
    update: { cracks, hatchedPetCode },
  });

  const pet = hatchedPetCode
    ? await db.pet.findUnique({
        where: { code: hatchedPetCode },
        select: { code: true, name: true },
      })
    : null;
  return {
    weekStart: weekStart.toISOString().slice(0, 10),
    cracks,
    needed: EGG_CRACKS_TO_HATCH,
    hatched: pet,
    justHatched,
  };
}

export interface PictureState {
  weekStart: string;
  theme: string;
  nameVi: string;
  imageKey: string;
  total: number;
  /** Which pieces are turned over (0-based). */
  pieces: number[];
  complete: boolean;
  justEarned: number | null;
}

/** A piece of the week's picture for every day learnt (docs/06 §1.8c item 2). */
export async function updateWeeklyPicture(
  db: Db,
  studentId: string,
  at = new Date(),
): Promise<PictureState> {
  const weekStart = weekStartOf(at);
  const info = pictureForWeek(at);
  await db.weeklyPicture.upsert({
    where: { weekStart },
    create: { weekStart, theme: info.theme, imageKey: info.imageKey, pieces: PICTURE_PIECES },
    update: {},
  });

  const earned = Math.min(PICTURE_PIECES, await learningDaysThisWeek(db, studentId, at));
  const have = await db.studentPicturePiece.findMany({
    where: { studentId, weekStart },
    select: { pieceIndex: true },
  });
  const owned = new Set(have.map((p) => p.pieceIndex));
  let justEarned: number | null = null;
  for (let i = 0; i < earned; i++) {
    if (owned.has(i)) continue;
    await db.studentPicturePiece.create({ data: { studentId, weekStart, pieceIndex: i } });
    owned.add(i);
    justEarned = i;
  }

  return {
    weekStart: weekStart.toISOString().slice(0, 10),
    theme: info.theme,
    nameVi: info.nameVi,
    imageKey: info.imageKey,
    total: PICTURE_PIECES,
    pieces: [...owned].sort((a, b) => a - b),
    complete: owned.size >= PICTURE_PIECES,
    justEarned,
  };
}

export interface EarnedBadge {
  code: string;
  nameVi: string;
  icon: string;
}

interface BadgeRule {
  type?: string;
  count?: number;
  days?: number;
  subject?: string;
  exerciseType?: string;
  event?: string;
  sessions?: number;
}

/**
 * Every badge whose rule is now true and which the child does not have yet. The rules live in the
 * `Badge.rule` column (seeded from docs/03 §4 item 5), so adding a badge is a seed change, not a
 * code change.
 */
export async function checkBadges(
  db: Db,
  studentId: string,
  at = new Date(),
): Promise<EarnedBadge[]> {
  const [badges, owned] = await Promise.all([
    db.badge.findMany(),
    db.studentBadge.findMany({ where: { studentId }, select: { badgeCode: true } }),
  ]);
  const have = new Set(owned.map((b) => b.badgeCode));
  const todo = badges.filter((b) => !have.has(b.code));
  if (todo.length === 0) return [];

  const event = weeklyEvent(at);
  const weekStart = weekStartOf(at);
  const earned: EarnedBadge[] = [];

  for (const badge of todo) {
    const rule = (badge.rule ?? {}) as BadgeRule;
    let ok = false;
    switch (rule.type) {
      case "sessions_completed":
        ok =
          (await db.session.count({ where: { studentId, status: "COMPLETED" } })) >=
          (rule.count ?? 1);
        break;
      case "streak": {
        const streak = await db.streak.findUnique({ where: { studentId } });
        ok = (streak?.longest ?? 0) >= (rule.days ?? 3);
        break;
      }
      case "stars_total": {
        const sum = await db.starLedger.aggregate({ where: { studentId }, _sum: { delta: true } });
        ok = (sum._sum.delta ?? 0) >= (rule.count ?? 50);
        break;
      }
      case "exercise_type_count":
        ok =
          (await db.attempt.count({
            where: {
              session: { studentId },
              isCorrect: true,
              exercise: { type: (rule.exerciseType ?? "READ_ALOUD") as never },
            },
          })) >= (rule.count ?? 10);
        break;
      case "skills_mastered":
        ok =
          (await db.skillMastery.count({
            where: {
              studentId,
              status: "SOLID",
              ...(rule.subject ? { skill: { subject: rule.subject as never } } : {}),
            },
          })) >= (rule.count ?? 1);
        break;
      case "perfect_session": {
        const sessions = await db.session.findMany({
          where: { studentId, status: "COMPLETED" },
          select: { attempts: { select: { isCorrect: true, tries: true } } },
          orderBy: { date: "desc" },
          take: 10,
        });
        ok = sessions.some(
          (s) =>
            s.attempts.length >= 8 &&
            s.attempts.every((a) => a.isCorrect === true && a.tries === 1),
        );
        break;
      }
      case "comeback": {
        const two = await db.session.findMany({
          where: { studentId, status: "COMPLETED" },
          select: { date: true },
          orderBy: { date: "desc" },
          take: 2,
          distinct: ["date"],
        });
        ok =
          two.length === 2 &&
          (two[0]?.date.getTime() ?? 0) - (two[1]?.date.getTime() ?? 0) >= 3 * DAY_MS;
        break;
      }
      case "early_bird": {
        const early = await db.attempt.findFirst({
          where: { session: { studentId } },
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
        });
        ok = early !== null && early.createdAt.getHours() < 8;
        break;
      }
      case "egg_hatched":
        ok = (await db.studentPet.count({ where: { studentId } })) >= (rule.count ?? 1);
        break;
      case "picture_complete":
        ok =
          (await db.studentPicturePiece.count({ where: { studentId, weekStart } })) >=
          PICTURE_PIECES;
        break;
      case "event_week":
        // Only this week's event badge, and only after a few days of showing up.
        ok =
          rule.event === event.code &&
          (await learningDaysThisWeek(db, studentId, at)) >= (rule.sessions ?? 3);
        break;
      default:
        ok = false;
    }
    if (ok) {
      await db.studentBadge.create({ data: { studentId, badgeCode: badge.code } });
      earned.push({ code: badge.code, nameVi: badge.nameVi, icon: badge.icon });
    }
  }
  return earned;
}

export interface IssuedCertificate {
  id: string;
  kind: string;
  title: string;
  issuedAt: string;
}

/**
 * A certificate for something a grown-up would be proud of: a skill that has become solid, or a
 * month of turning up (docs/06 §1.8c item 11). One per run at most — it should feel rare.
 */
export async function issueCertificates(
  db: Db,
  studentId: string,
  at = new Date(),
): Promise<IssuedCertificate[]> {
  const out: IssuedCertificate[] = [];
  const solid = await db.skillMastery.findMany({
    where: { studentId, status: "SOLID" },
    include: { skill: { select: { nameVi: true } } },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });
  const existing = await db.certificate.findMany({
    where: { studentId },
    select: { title: true },
  });
  const titles = new Set(existing.map((c) => c.title));

  for (const m of solid) {
    const title = `Đã thành thạo: ${m.skill.nameVi}`;
    if (titles.has(title)) continue;
    const row = await db.certificate.create({
      data: { studentId, kind: "TOPIC", title, issuedAt: at },
    });
    out.push({ id: row.id, kind: row.kind, title, issuedAt: row.issuedAt.toISOString() });
    break; // one at a time
  }

  const monthStart = new Date(at.getFullYear(), at.getMonth(), 1);
  const monthTitle = `Chăm học tháng ${at.getMonth() + 1}/${at.getFullYear()}`;
  if (!titles.has(monthTitle)) {
    const days = await db.session.findMany({
      where: { studentId, status: "COMPLETED", date: { gte: monthStart } },
      select: { date: true },
      distinct: ["date"],
    });
    if (days.length >= 20) {
      const row = await db.certificate.create({
        data: { studentId, kind: "MONTH", title: monthTitle, issuedAt: at },
      });
      out.push({
        id: row.id,
        kind: row.kind,
        title: monthTitle,
        issuedAt: row.issuedAt.toISOString(),
      });
    }
  }
  return out;
}

export interface SessionRewards {
  egg: EggState;
  picture: PictureState;
  badges: EarnedBadge[];
  certificates: IssuedCertificate[];
  event: WeeklyEvent;
}

/** Everything the celebration screen needs, granted once the quest is closed. */
export async function grantSessionRewards(
  db: Db,
  studentId: string,
  at = new Date(),
): Promise<SessionRewards> {
  const egg = await updateEgg(db, studentId, at);
  const picture = await updateWeeklyPicture(db, studentId, at);
  const badges = await checkBadges(db, studentId, at);
  const certificates = await issueCertificates(db, studentId, at);
  return { egg, picture, badges, certificates, event: weeklyEvent(at) };
}

/**
 * Writes the lines the mascot will use tomorrow, from what happened today (docs/06 §1.8c item 7).
 * Called at the end of a session; nothing here is invented — every line points at a real row.
 */
export async function rememberForTomorrow(
  db: Db,
  studentId: string,
  at = new Date(),
): Promise<number> {
  const day = startOfDay(at);
  const session = await db.session.findFirst({
    where: { studentId, date: day, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    select: { slots: true, attempts: { select: { order: true, isCorrect: true } } },
  });
  if (!session) return 0;

  const slots = (session.slots ?? []) as { order: number; skillCode: string }[];
  const right = new Set(session.attempts.filter((a) => a.isCorrect).map((a) => a.order));
  const best = slots.find((s) => right.has(s.order));
  const lines: { kind: "YESTERDAY_WIN" | "INTEREST"; text: string }[] = [];

  if (best) {
    const skill = await db.skill.findUnique({
      where: { code: best.skillCode },
      select: { nameVi: true },
    });
    if (skill)
      lines.push({
        kind: "YESTERDAY_WIN",
        text: `Hôm qua con làm rất giỏi phần ${skill.nameVi} đấy!`,
      });
  }

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { interests: true },
  });
  const interest = student?.interests[Math.floor(Math.random() * (student?.interests.length || 1))];
  if (interest) lines.push({ kind: "INTEREST", text: `Mình vẫn nhớ con thích ${interest} nhé!` });

  const tomorrow = new Date(day.getTime() + 24 * 60 * 60 * 1000);
  let written = 0;
  for (const line of lines) {
    const dup = await db.mascotMemory.findFirst({
      where: { studentId, text: line.text, usedAt: null },
      select: { id: true },
    });
    if (dup) continue;
    await db.mascotMemory.create({
      data: {
        studentId,
        kind: line.kind,
        text: line.text,
        validFrom: tomorrow,
        validTo: new Date(tomorrow.getTime() + 3 * 24 * 60 * 60 * 1000),
      },
    });
    written++;
  }
  return written;
}
