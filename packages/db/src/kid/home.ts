import { vnDayDate, type WeeklyEvent, weeklyEvent, weekStartOf } from "@mtct/core";
import type { PrismaClient } from "../../generated/client";
import { kidVars, starBalance } from "../session/grade";
import { type EggState, type PictureState, updateEgg, updateWeeklyPicture } from "./rewards";

/**
 * Everything K2 (the child's home screen) needs, in one query round (docs/06 §1.2, §1.8c).
 *
 * The child's screens must never wait: one call gives the world to draw, the mascot's line, the
 * quest's state, the star pocket, the streak, the egg, this week's picture and the letters box.
 */

type Db = PrismaClient;

export interface KidMailItem {
  id: string;
  fromKind: string;
  fromName: string | null;
  text: string;
  audioKey: string | null;
  giftCode: string | null;
  openedAt: string | null;
  deliverOn: string;
  /** A one-tap "Khen" from a parent: the screen drops a big gold star (docs/06 §1.8c item 10). */
  isPraise?: boolean;
}

export interface KidHome {
  studentId: string;
  nickname: string;
  theme: "robot" | "garden";
  mascot: "robot" | "cu";
  avatarKey: string | null;
  vars: { ten: string; vat: string; ban: string };
  stars: number;
  streak: { current: number; longest: number };
  /** Today's quest: how far along it is, and whether there is one at all yet. */
  quest: {
    sessionId: string | null;
    status: string | null;
    done: number;
    total: number;
    finished: boolean;
  };
  egg: EggState;
  picture: PictureState;
  /** One line the mascot says, built from something that actually happened (docs/06 §1.8c item 7). */
  memory: { id: string; text: string } | null;
  event: WeeklyEvent;
  mail: { unopened: number; next: KidMailItem | null };
  pets: { code: string; name: string; isCompanion: boolean }[];
  collectibles: number;
  badges: { code: string; nameVi: string; icon: string; seen: boolean }[];
}

export async function kidHome(db: Db, studentId: string, at = new Date()): Promise<KidHome | null> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { id: true, nickname: true, mascot: true, avatarKey: true, interests: true },
  });
  if (!student) return null;

  const day = vnDayDate(at);
  const [session, streak, stars, memory, mailRows, pets, collectibles, badges] = await Promise.all([
    // the Daily Quest only: a TARGETED session a building opened today is not "today's quest"
    db.session.findFirst({
      where: { studentId, date: day, kind: "DAILY_QUEST" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        slots: true,
        attempts: { select: { gradedAt: true, response: true } },
      },
    }),
    db.streak.findUnique({ where: { studentId } }),
    starBalance(db, studentId),
    db.mascotMemory.findFirst({
      where: {
        studentId,
        usedAt: null,
        validFrom: { lte: at },
        OR: [{ validTo: null }, { validTo: { gte: at } }],
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, text: true },
    }),
    db.kidMail.findMany({
      where: { studentId, deliverOn: { lte: at } },
      orderBy: [{ openedAt: "asc" }, { deliverOn: "desc" }],
      take: 10,
      include: { fromUser: { select: { displayName: true } } },
    }),
    db.studentPet.findMany({
      where: { studentId },
      include: { pet: { select: { code: true, name: true } } },
    }),
    db.studentCollectible.count({ where: { studentId } }),
    db.studentBadge.findMany({
      where: { studentId },
      orderBy: { earnedAt: "desc" },
      take: 12,
      include: { badge: { select: { nameVi: true, icon: true } } },
    }),
  ]);

  const slots = (session?.slots ?? []) as { exerciseId?: string | null }[];
  const done = (session?.attempts ?? []).filter(
    (a) => a.gradedAt !== null || (a.response as { final?: boolean } | null)?.final === true,
  ).length;

  const unopened = mailRows.filter((m) => m.openedAt === null);
  const nextMail = unopened[0] ?? null;
  const praise = nextMail
    ? await db.starLedger.findFirst({
        where: { studentId, reason: "praise", refType: "KidMail", refId: nextMail.id },
        select: { id: true },
      })
    : null;

  return {
    studentId: student.id,
    nickname: student.nickname,
    theme: student.mascot === "OWL" ? "garden" : "robot",
    mascot: student.mascot === "OWL" ? "cu" : "robot",
    avatarKey: student.avatarKey,
    vars: kidVars(student),
    stars,
    streak: { current: streak?.current ?? 0, longest: streak?.longest ?? 0 },
    quest: {
      sessionId: session?.id ?? null,
      status: session?.status ?? null,
      done,
      total: slots.filter((s) => s.exerciseId).length,
      finished: session?.status === "COMPLETED",
    },
    egg: await updateEgg(db, studentId, at),
    picture: await updateWeeklyPicture(db, studentId, at),
    memory,
    event: weeklyEvent(at),
    mail: {
      unopened: unopened.length,
      next: nextMail
        ? {
            id: nextMail.id,
            fromKind: nextMail.fromKind,
            fromName: nextMail.fromUser?.displayName ?? null,
            text: nextMail.text,
            audioKey: nextMail.audioKey,
            giftCode: nextMail.giftCode,
            openedAt: null,
            deliverOn: nextMail.deliverOn.toISOString(),
            isPraise: praise !== null,
          }
        : null,
    },
    pets: pets.map((p) => ({
      code: p.pet.code,
      name: p.pet.name,
      isCompanion: p.isCompanion,
    })),
    collectibles,
    badges: badges.map((b) => ({
      code: b.badgeCode,
      nameVi: b.badge.nameVi,
      icon: b.badge.icon,
      seen: b.seen,
    })),
  };
}

/** Opening a letter: the child sees it once, the parent sees that it was opened (FR-PAR-08). */
export async function openMail(
  db: Db,
  studentId: string,
  mailId: string,
): Promise<KidMailItem | null> {
  const mail = await db.kidMail.findFirst({
    where: { id: mailId, studentId },
    include: { fromUser: { select: { displayName: true } } },
  });
  if (!mail) return null;
  if (!mail.openedAt) {
    await db.kidMail.update({ where: { id: mail.id }, data: { openedAt: new Date() } });
    // A gift travels with the letter: it lands in the collection, not in the star balance.
    if (mail.giftCode) {
      const item = await db.collectible.findUnique({ where: { code: mail.giftCode } });
      if (item) {
        await db.studentCollectible.upsert({
          where: {
            studentId_collectibleCode: { studentId, collectibleCode: item.code },
          },
          create: { studentId, collectibleCode: item.code },
          update: {},
        });
      }
    }
  }
  return {
    id: mail.id,
    fromKind: mail.fromKind,
    fromName: mail.fromUser?.displayName ?? null,
    text: mail.text,
    audioKey: mail.audioKey,
    giftCode: mail.giftCode,
    openedAt: (mail.openedAt ?? new Date()).toISOString(),
    deliverOn: mail.deliverOn.toISOString(),
  };
}

/** The mascot's line is used once, so it never says the same thing two days running. */
export async function useMemory(db: Db, studentId: string, memoryId: string): Promise<void> {
  await db.mascotMemory.updateMany({
    where: { id: memoryId, studentId, usedAt: null },
    data: { usedAt: new Date() },
  });
}

/** The egg on the go, the pieces collected and this week's event — read-only, for the parent view. */
export async function kidWeek(db: Db, studentId: string, at = new Date()) {
  return {
    weekStart: weekStartOf(at).toISOString().slice(0, 10),
    event: weeklyEvent(at),
    egg: await db.eggProgress.findFirst({
      where: { studentId, hatchedPetCode: null },
      orderBy: { eggNo: "desc" },
    }),
    pieces: await db.studentPicturePiece.count({ where: { studentId } }),
  };
}
