import {
  EGG_DAYS_TO_HATCH,
  PICTURE_PIECES,
  pictureByNumber,
  type WeeklyEvent,
  weeklyEvent,
  weekStartOf,
} from "@mtct/core";
import type { PrismaClient } from "../../generated/client";

/**
 * What a child gets for turning up (docs/06 §1.8c items 1, 2, 10, 11 and §1.5).
 *
 * Everything here is derived from the days actually learnt, never incremented blindly, so running
 * it twice after a reconnect cannot hatch two pets or hand out the same badge again.
 *
 * Since ADR-16 the counting is *cumulative*, not weekly: the egg and the picture carry on from
 * where the child left them. A week off makes the egg slower; it never makes it emptier.
 */

type Db = PrismaClient;

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Days this week on which the child finished at least one session (for the weekly event badge). */
async function learningDaysThisWeek(db: Db, studentId: string, at: Date): Promise<number> {
  const from = weekStartOf(at);
  const rows = await db.session.findMany({
    where: { studentId, status: "COMPLETED", date: { gte: from, lte: startOfDay(at) } },
    select: { date: true },
    distinct: ["date"],
  });
  return rows.length;
}

/** Every day the child has ever finished a session. The egg and the picture count from this. */
async function learningDaysTotal(db: Db, studentId: string, at: Date): Promise<number> {
  const rows = await db.session.findMany({
    where: { studentId, status: "COMPLETED", date: { lte: startOfDay(at) } },
    select: { date: true },
    distinct: ["date"],
  });
  return rows.length;
}

export interface EggState {
  /** Which egg this is, counting from the first one. */
  eggNo: number;
  cracks: number;
  needed: number;
  hatched: { code: string; name: string } | null;
  /** True only on the run that hatched it, so the finale knows to play the scene. */
  justHatched: boolean;
  /** No pet left to hatch: the egg waits, full, instead of quietly going backwards. */
  waitingForNewPet: boolean;
}

/**
 * One crack per day learnt; the fourth hatches, then the next egg starts (docs/06 §1.8c item 1).
 *
 * Everything is a function of "how many days has this child learnt in total", so a rest day simply
 * does not add a crack — it never removes one, and Monday is not a deadline (ADR-16).
 */
export async function updateEgg(db: Db, studentId: string, at = new Date()): Promise<EggState> {
  const days = await learningDaysTotal(db, studentId, at);
  const wantHatched = Math.floor(days / EGG_DAYS_TO_HATCH);

  const rows = await db.eggProgress.findMany({
    where: { studentId },
    orderBy: { eggNo: "asc" },
  });
  const hatchedRows = rows.filter((r) => r.hatchedPetCode !== null);
  let justHatched = false;
  let waitingForNewPet = false;

  // Hatch every egg the days have paid for. Normally that is nought or one per session.
  for (let eggNo = hatchedRows.length; eggNo < wantHatched; eggNo++) {
    const pick = await pickPet(db, studentId);
    if (!pick) {
      // All the pets are already home. Keep the egg full and wait for the seed to bring more.
      waitingForNewPet = true;
      break;
    }
    await db.studentPet.upsert({
      where: { studentId_petCode: { studentId, petCode: pick.code } },
      create: {
        studentId,
        petCode: pick.code,
        isCompanion: (await db.studentPet.count({ where: { studentId } })) === 0,
      },
      update: {},
    });
    await db.eggProgress.upsert({
      where: { studentId_eggNo: { studentId, eggNo } },
      create: {
        studentId,
        eggNo,
        startedOn: startOfDay(at),
        cracks: EGG_DAYS_TO_HATCH,
        hatchedPetCode: pick.code,
        hatchedAt: at,
      },
      update: { cracks: EGG_DAYS_TO_HATCH, hatchedPetCode: pick.code, hatchedAt: at },
    });
    justHatched = true;
  }

  const done = await db.eggProgress.count({
    where: { studentId, hatchedPetCode: { not: null } },
  });
  const eggNo = done;
  const cracks = waitingForNewPet ? EGG_DAYS_TO_HATCH : days - done * EGG_DAYS_TO_HATCH;
  const current = await db.eggProgress.upsert({
    where: { studentId_eggNo: { studentId, eggNo } },
    create: { studentId, eggNo, startedOn: startOfDay(at), cracks },
    update: { cracks },
  });

  // The pet that came out last stays on the home card until the new egg gets its first crack, so
  // a child who hatched one yesterday still finds it waiting this morning.
  const last = await db.eggProgress.findFirst({
    where: { studentId, hatchedPetCode: { not: null } },
    orderBy: { eggNo: "desc" },
    select: { hatchedPetCode: true },
  });
  const showPet = justHatched || (cracks === 0 && done > 0);
  const petCode = showPet ? (last?.hatchedPetCode ?? current.hatchedPetCode) : null;
  const pet = petCode
    ? await db.pet.findUnique({ where: { code: petCode }, select: { code: true, name: true } })
    : null;

  return {
    eggNo,
    cracks: Math.min(cracks, EGG_DAYS_TO_HATCH),
    needed: EGG_DAYS_TO_HATCH,
    hatched: pet,
    justHatched,
    waitingForNewPet,
  };
}

/** A pet the child does not have yet; common ones first so a rare one stays rare. */
async function pickPet(db: Db, studentId: string): Promise<{ code: string } | null> {
  const owned = await db.studentPet.findMany({ where: { studentId }, select: { petCode: true } });
  const pool = await db.pet.findMany({
    where: { code: { notIn: owned.map((o) => o.petCode) } },
    orderBy: { code: "asc" },
  });
  if (pool.length === 0) return null;
  const common = pool.filter((p) => p.rarity !== "rare");
  const from = common.length > 0 ? common : pool;
  return from[Math.floor(Math.random() * from.length)] ?? null;
}

export interface PictureState {
  /** Which picture this is, counting from the first one. */
  pictureNo: number;
  theme: string;
  nameVi: string;
  imageKey: string;
  total: number;
  /** Which pieces are turned over (0-based). */
  pieces: number[];
  complete: boolean;
  justEarned: number | null;
  /** Pictures finished earlier, for the collection shelf. */
  finished: number;
}

/**
 * A piece for every day learnt; six pieces finish a picture and the next one starts
 * (docs/06 §1.8c item 2, ADR-16).
 *
 * Like the egg, this counts total days learnt rather than days this week, so a child who learns
 * three days a week still sees a picture finished — it simply takes two weeks.
 */
export async function updateWeeklyPicture(
  db: Db,
  studentId: string,
  at = new Date(),
): Promise<PictureState> {
  const days = await learningDaysTotal(db, studentId, at);
  const complete = Math.floor(days / PICTURE_PIECES);
  // The picture the child is looking at: the one just finished stays up until the next piece is
  // earned, so the last day of a picture shows the whole picture rather than an empty new frame.
  const pictureNo = days > 0 && days % PICTURE_PIECES === 0 ? complete - 1 : complete;
  const info = pictureByNumber(pictureNo);
  await db.weeklyPicture.upsert({
    where: { pictureNo },
    create: { pictureNo, theme: info.theme, imageKey: info.imageKey, pieces: PICTURE_PIECES },
    update: {},
  });

  // Fill in every piece the days have paid for, on this picture and on any left half-done.
  let justEarned: number | null = null;
  for (let n = 0; n <= complete; n++) {
    const upTo = Math.min(PICTURE_PIECES, days - n * PICTURE_PIECES);
    const have = await db.studentPicturePiece.findMany({
      where: { studentId, pictureNo: n },
      select: { pieceIndex: true },
    });
    const owned = new Set(have.map((p) => p.pieceIndex));
    for (let i = 0; i < upTo; i++) {
      if (owned.has(i)) continue;
      await db.studentPicturePiece.create({ data: { studentId, pictureNo: n, pieceIndex: i } });
      justEarned = i;
    }
  }

  const pieces = (
    await db.studentPicturePiece.findMany({
      where: { studentId, pictureNo },
      select: { pieceIndex: true },
      orderBy: { pieceIndex: "asc" },
    })
  ).map((p) => p.pieceIndex);

  return {
    pictureNo,
    theme: info.theme,
    nameVi: info.nameVi,
    imageKey: info.imageKey,
    total: PICTURE_PIECES,
    pieces,
    complete: pieces.length >= PICTURE_PIECES,
    justEarned,
    finished: complete,
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
        // Any picture the child has finished, not only the one in progress (ADR-16).
        ok = (await db.studentPicturePiece.count({ where: { studentId } })) >= PICTURE_PIECES;
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
