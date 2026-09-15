import { afterAll, beforeAll, describe, expect, it, type TestContext } from "vitest";
import {
  createTempStudent,
  databaseReachable,
  disconnectTestDb,
  removeTempStudent,
  type TempStudent,
  testDb,
} from "../test-db";
import { CITY_SESSION_MIN_TYPES, CITY_SESSION_SLOTS, planCitySession, varyTypes } from "./session";
import { cityRead, worldRead } from "./state";

describe("varyTypes", () => {
  it("rotates the types a skill supports across its slots", () => {
    const slot = (order: number, skillCode: string) =>
      ({ order, skillCode, kind: "focus", subject: "VMATH", difficulty: 2, reason: "" }) as const;
    const out = varyTypes(
      [slot(1, "A"), slot(2, "A"), slot(3, "A"), slot(4, "B")],
      new Map([
        ["A", ["MCQ", "DRAG_DROP", "COUNT_TAP"]],
        ["B", ["MCQ"]],
      ]),
    );
    expect(new Set(out.slice(0, 3).map((s) => s.prefer?.types?.[0]))).toEqual(
      new Set(["MCQ", "DRAG_DROP", "COUNT_TAP"]),
    );
    expect(out[3]?.prefer).toBeUndefined(); // one type only: nothing to prefer
  });
});

describe("city session (integration)", () => {
  let ready = false;
  let student: TempStudent | null = null;
  const needDb = (ctx: TestContext) => {
    if (!ready) ctx.skip("no database with a published VMATH bank");
  };

  beforeAll(async () => {
    ready = await databaseReachable();
    if (!ready) return;
    ready =
      (await testDb().exercise.count({ where: { status: "PUBLISHED", subject: "VMATH" } })) > 50;
    if (!ready) return;
    student = await createTempStudent("citysession");
  });

  afterAll(async () => {
    await removeTempStudent(student);
    await disconnectTestDb();
  });

  it("plans 12 Thành Số missions of one subject with at least three exercise types, once a day", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const at = new Date("2026-10-21T19:00:00+07:00");
    const plan = await planCitySession(db, student?.id ?? "", "vmath", at);
    expect(plan.created).toBe(true);
    const practice = plan.slots.filter((s) => s.exerciseId);
    expect(practice.length).toBe(CITY_SESSION_SLOTS);
    expect(new Set(plan.slots.map((s) => s.subject))).toEqual(new Set(["VMATH"]));
    const exercises = await db.exercise.findMany({
      where: { id: { in: practice.map((s) => s.exerciseId as string) } },
      select: { type: true, subject: true },
    });
    expect(new Set(exercises.map((e) => e.subject))).toEqual(new Set(["VMATH"]));
    expect(new Set(exercises.map((e) => e.type)).size).toBeGreaterThanOrEqual(
      CITY_SESSION_MIN_TYPES,
    );

    const again = await planCitySession(db, student?.id ?? "", "vmath", at);
    expect(again).toMatchObject({ sessionId: plan.sessionId, created: false });
    // another city gets its own session the same day
    const other = await planCitySession(db, student?.id ?? "", "viet", at);
    expect(other.sessionId).not.toBe(plan.sessionId);
  });

  it("shows the session as 3–4 stars on buildings, and counts them on the world map", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const at = new Date("2026-10-21T19:00:00+07:00");
    const read = await cityRead(db, student?.id ?? "", "vmath", at);
    const stations = read.session?.stations.stations ?? [];
    expect(stations.length).toBeGreaterThanOrEqual(3);
    expect(stations.length).toBeLessThanOrEqual(4);
    // every station stands on a building of the city, and only those carry a star
    const starred = read.state.view.skills.filter((s) => s.mission);
    expect(starred.length).toBeGreaterThan(0);
    expect(starred.length).toBeLessThanOrEqual(stations.length);
    const world = await worldRead(db, student?.id ?? "", at);
    expect(world.find((w) => w.city === "vmath")?.missions).toBe(stations.length);
  });

  it("plans a fresh session only when the child asks to play again", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const at = new Date("2026-10-21T19:00:00+07:00");
    const first = await planCitySession(db, student?.id ?? "", "vmath", at);
    await db.session.update({ where: { id: first.sessionId }, data: { status: "COMPLETED" } });
    const same = await planCitySession(db, student?.id ?? "", "vmath", at);
    expect(same).toMatchObject({ sessionId: first.sessionId, status: "COMPLETED" });
    const again = await planCitySession(db, student?.id ?? "", "vmath", at, { again: true });
    expect(again.created).toBe(true);
    expect(again.sessionId).not.toBe(first.sessionId);
  });
});
