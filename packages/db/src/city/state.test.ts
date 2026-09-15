import { afterAll, beforeAll, describe, expect, it, type TestContext } from "vitest";
import {
  createTempStudent,
  databaseReachable,
  disconnectTestDb,
  removeTempStudent,
  type TempStudent,
  testDb,
} from "../test-db";
import {
  CityError,
  choosePlotBuild,
  cityRead,
  markCitySeen,
  starsBySubject,
  startCityPractice,
  worldRead,
} from "./state";

/**
 * Pha 10 việc 3: the Phố Chữ city of a throw-away child, built from real rows — masteries, stars,
 * finished sessions, a badge — and then grown, to check the city follows and never moves or shrinks.
 */
describe("subject city from learning data (integration)", () => {
  let ready = false;
  let student: TempStudent | null = null;
  let skills: { id: string; code: string }[] = [];
  const at = new Date("2026-10-22T19:00:00+07:00"); // a Thursday evening
  const sid = () => student?.id ?? "";
  const needDb = (ctx: TestContext) => {
    if (!ready) ctx.skip("no database (start Postgres and run pnpm db:seed)");
  };

  beforeAll(async () => {
    ready = await databaseReachable();
    if (!ready) return;
    const db = testDb();
    skills = await db.skill.findMany({
      where: {
        subject: "VIET",
        isActive: true,
        exerciseSkills: { some: { exercise: { status: "PUBLISHED" } } },
      },
      orderBy: { order: "asc" },
      take: 4,
      select: { id: true, code: true },
    });
    ready = skills.length === 4 && (await db.badge.count()) > 0;
    if (!ready) return;
    student = await createTempStudent("city");
  });

  afterAll(async () => {
    await removeTempStudent(student);
    await disconnectTestDb();
  });

  it("builds the city: levels, land from earned stars, badge building, wonder piece", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const [a, b, c] = skills as unknown as [{ id: string }, { id: string }, { id: string }];
    const mastery = (
      skillId: string,
      value: number,
      status: "LEARNING" | "SOLID" | "MASTERED",
      created: string,
      since?: string,
    ) =>
      db.skillMastery.create({
        data: {
          studentId: sid(),
          skillId,
          mastery: value,
          confidence: 0.7,
          evidenceCount: 3,
          status,
          masteredSince: since ? new Date(since) : null,
          createdAt: new Date(created),
        },
      });
    await mastery(a.id, 30, "LEARNING", "2026-10-01T10:00:00Z");
    await mastery(b.id, 65, "SOLID", "2026-10-02T10:00:00Z");
    await mastery(c.id, 92, "MASTERED", "2026-10-03T10:00:00Z", "2026-09-10T10:00:00Z");

    // four finished quests this week, each with a Phố Chữ bonus of 3 → 12 stars … plus 9 more below
    for (const day of ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22"]) {
      const session = await db.session.create({
        data: {
          studentId: sid(),
          kind: "DAILY_QUEST",
          date: new Date(`${day}T00:00:00Z`),
          status: "COMPLETED",
          slots: [
            { order: 0, subject: "VIET", skillCode: "x" },
            { order: 1, subject: "VIET" },
            { order: 2, subject: "VMATH" },
          ],
          finishedAt: new Date(`${day}T12:00:00Z`),
        },
      });
      await db.starLedger.create({
        data: {
          studentId: sid(),
          delta: 3,
          reason: "session",
          refType: "Session",
          refId: session.id,
        },
      });
    }
    const extra = await db.session.create({
      data: {
        studentId: sid(),
        kind: "FREE_PLAY",
        date: new Date("2026-10-18T00:00:00Z"),
        status: "PLANNED",
        slots: [{ order: 0, subject: "VIET" }],
      },
    });
    await db.starLedger.create({
      data: { studentId: sid(), delta: 9, reason: "session", refType: "Session", refId: extra.id },
    });
    // spending and praise never count toward land
    await db.starLedger.create({ data: { studentId: sid(), delta: -15, reason: "collectible" } });
    await db.starLedger.create({
      data: { studentId: sid(), delta: 5, reason: "praise", refType: "KidMail", refId: "m1" },
    });
    const badge = await db.badge.findFirst({ select: { code: true } });
    await db.studentBadge.create({ data: { studentId: sid(), badgeCode: badge?.code ?? "" } });

    expect((await starsBySubject(db, sid())).viet).toBe(21);

    const { state, changes } = await cityRead(db, sid(), "viet", at);
    expect(changes).toEqual([]); // first visit: nothing to celebrate
    expect(state.view.skills.map((s) => [s.skillId, s.level])).toEqual([
      [a.id, 0],
      [b.id, 2],
      [c.id, 4],
    ]);
    expect(state.view.land).toMatchObject({ owned: 1, progress: 1, nextCost: 25 });
    expect(state.view.publicBuildings).toEqual(["market"]);
    expect(state.view.wonder.pieces).toBe(1);
    expect(state.hud.wonder.thisWeekDays).toBe(4);
    expect(state.view.bustle).toBe(0);
  });

  it("stores the lot order and only ever appends", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const d = skills[3] as { id: string };
    await db.skillMastery.create({
      data: {
        studentId: sid(),
        skillId: d.id,
        mastery: 45,
        evidenceCount: 1,
        status: "LEARNING",
        createdAt: new Date("2026-09-01T00:00:00Z"),
      },
    });
    const { state } = await cityRead(db, sid(), "viet", at);
    // an older activation date does not push in front: buildings never move
    expect(state.view.skills.map((s) => s.skillId)).toEqual([
      skills[0]?.id,
      skills[1]?.id,
      skills[2]?.id,
      d.id,
    ]);
    const record = await db.studentCity.findUnique({
      where: { studentId_subject: { studentId: sid(), subject: "VIET" } },
    });
    expect(record?.skillOrder).toHaveLength(4);
  });

  it("celebrates growth once, after the kid has seen the city", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    await markCitySeen(db, sid(), "viet", at);
    const a = skills[0] as { id: string };
    await db.skillMastery.update({
      where: { studentId_skillId: { studentId: sid(), skillId: a.id } },
      data: { mastery: 62 },
    });
    const { changes } = await cityRead(db, sid(), "viet", at);
    expect(changes).toEqual([{ type: "levelUp", skillId: a.id, from: 0, to: 2 }]);
    await markCitySeen(db, sid(), "viet", at);
    expect((await cityRead(db, sid(), "viet", at)).changes).toEqual([]);
    // a later dip is not a "change" — nothing is ever reported as lost
    await db.skillMastery.update({
      where: { studentId_skillId: { studentId: sid(), skillId: a.id } },
      data: { mastery: 20 },
    });
    expect((await cityRead(db, sid(), "viet", at)).changes).toEqual([]);
  });

  it("lets the kid choose what to build, only on open land and from what is unlocked", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const state = await choosePlotBuild(db, sid(), "viet", 0, "garden", at);
    expect(state.view.land.builds).toEqual([{ plot: 0, build: "garden" }]);
    await expect(choosePlotBuild(db, sid(), "viet", 1, "house", at)).rejects.toMatchObject({
      code: "PLOT_LOCKED",
    });
    await expect(choosePlotBuild(db, sid(), "viet", 0, "tower", at)).rejects.toBeInstanceOf(
      CityError,
    );
    // changing your mind replaces, it does not add
    await choosePlotBuild(db, sid(), "viet", 0, "pond", at);
    expect((await cityRead(db, sid(), "viet", at)).state.view.land.builds).toEqual([
      { plot: 0, build: "pond" },
    ]);
  });

  it("opens a targeted session only for a building that is waiting, once per day", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const waiting = skills[0] as { id: string; code: string };
    const first = await startCityPractice(db, sid(), "viet", waiting.id, at);
    expect(first.skillCode).toBe(waiting.code);
    const again = await startCityPractice(db, sid(), "viet", waiting.id, at);
    expect(again).toMatchObject({ sessionId: first.sessionId, created: false });
    const steady = skills[2] as { id: string };
    await expect(startCityPractice(db, sid(), "viet", steady.id, at)).rejects.toMatchObject({
      code: "SKILL_NOT_WAITING",
    });
    await expect(startCityPractice(db, sid(), "vmath", waiting.id, at)).rejects.toMatchObject({
      code: "SKILL_NOT_IN_CITY",
    });
  });

  it("summarises all six cities for the world map", async (ctx) => {
    needDb(ctx);
    const world = await worldRead(testDb(), sid(), at);
    expect(world.map((w) => w.city)).toEqual(["viet", "vmath", "esl", "enl", "emath", "esci"]);
    expect(world.find((w) => w.city === "viet")?.buildings).toBe(4);
    expect(world.find((w) => w.city === "vmath")?.buildings).toBe(0);
  });
});
