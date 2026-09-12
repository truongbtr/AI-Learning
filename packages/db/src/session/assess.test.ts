import { afterAll, beforeAll, describe, expect, it, type TestContext } from "vitest";
import {
  createTempStudent,
  databaseReachable,
  disconnectTestDb,
  removeTempStudent,
  type TempStudent,
  testDb,
} from "../test-db";
import { adaptAssessment, assessmentState, planAssessment } from "./assess";
import { planDailyQuest } from "./plan";

/**
 * The diagnostic, against the real bank (docs/04 §10, docs/08 pha 8 việc 4).
 *
 * What these guard, in the order they would hurt:
 *  - a brand-new child gets the diagnostic without anybody running a command;
 *  - the walk actually moves after an answer, rather than handing out ten fixed questions;
 *  - the station the child is standing on is never rewritten under her;
 *  - after three evenings it stops and ordinary planning takes over.
 */
describe("phiên chẩn đoán đầu vào (integration, needs the seeded database)", () => {
  let ready = false;
  let student: TempStudent | null = null;
  const needDb = (ctx: TestContext) => {
    if (!ready) ctx.skip("no seeded database (start Postgres and run pnpm db:seed)");
  };

  beforeAll(async () => {
    ready = await databaseReachable();
    if (!ready) return;
    ready = (await testDb().exercise.count({ where: { status: "PUBLISHED" } })) > 0;
    if (!ready) return;
    student = await createTempStudent("assess");
  });

  afterAll(async () => {
    await removeTempStudent(student);
    await disconnectTestDb();
  });

  it("a child with no evidence at all is due the first of three", async (ctx) => {
    needDb(ctx);
    const state = await assessmentState(testDb(), (student as TempStudent).id);
    expect(state.nextRound).toBe(0);
    expect(state.done).toBe(0);
  });

  it("the Daily Quest *is* the diagnostic on the first evening — no new screen, no command", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const s = student as TempStudent;
    const quest = await planDailyQuest(db, s.id, new Date("2026-09-14T19:30:00+07:00"));
    const session = await db.session.findUnique({
      where: { id: quest.sessionId },
      select: { kind: true },
    });
    expect(session?.kind).toBe("ASSESSMENT");
    expect(quest.plan.log.join("\n")).toMatch(/chẩn đoán/);
    // Every station has a real exercise behind it, even though two subjects have almost none.
    expect(quest.slots.length).toBeGreaterThanOrEqual(8);
    expect(quest.slots.every((slot) => slot.exerciseId)).toBe(true);
  });

  it("plans the same evening twice without building a second one", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const s = student as TempStudent;
    const date = new Date("2026-09-14T19:30:00+07:00");
    const first = await planAssessment(db, s.id, date);
    const again = await planAssessment(db, s.id, date);
    expect(again.sessionId).toBe(first.sessionId);
    expect(again.created).toBe(false);
  });

  it("moves the next station after an answer, and leaves the current one alone", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const s = student as TempStudent;
    const built = await planAssessment(db, s.id, new Date("2026-09-15T19:30:00+07:00"), {
      round: 0,
      force: true,
    });
    const before = built.slots;
    const answeredSkill = before[0]?.skillCode as string;
    const plannedSecond = before[1]?.skillCode as string;

    const result = await adaptAssessment(db, built.sessionId, 1, false);

    const after = ((
      await db.session.findUnique({ where: { id: built.sessionId }, select: { slots: true } })
    )?.slots ?? []) as unknown as typeof before;

    // The station just answered is untouched, whatever the walk decided.
    expect(after[0]?.skillCode).toBe(answeredSkill);
    if (result.changed) {
      expect(after[1]?.skillCode).toBe(result.to);
      expect(after[1]?.skillCode).not.toBe(plannedSecond);
      expect(after[1]?.exerciseId).toBeTruthy();
    } else {
      // No prerequisite with questions behind it: the planned station stays rather than going blank.
      expect(after[1]?.skillCode).toBe(plannedSecond);
      expect(after[1]?.exerciseId).toBeTruthy();
    }
    // Later stations are never disturbed by one answer.
    expect(after.slice(2).map((x) => x.skillCode)).toEqual(before.slice(2).map((x) => x.skillCode));
  });

  it("never rewrites a session that is not a diagnostic", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const s = student as TempStudent;
    const quest = await db.session.create({
      data: { studentId: s.id, kind: "TARGETED", date: new Date("2026-09-16"), slots: [] },
    });
    expect(await adaptAssessment(db, quest.id, 1, true)).toEqual({ changed: false });
  });

  it("stops after three evenings and hands over to ordinary planning", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const s = student as TempStudent;
    for (const [i, date] of ["2026-09-17", "2026-09-18", "2026-09-19"].entries())
      await planAssessment(db, s.id, new Date(`${date}T19:30:00+07:00`), { round: i, force: true });

    const state = await assessmentState(db, s.id);
    expect(state.nextRound).toBeNull();
    expect(state.done).toBeGreaterThanOrEqual(3);

    const quest = await planDailyQuest(db, s.id, new Date("2026-09-20T19:30:00+07:00"));
    const session = await db.session.findUnique({
      where: { id: quest.sessionId },
      select: { kind: true },
    });
    expect(session?.kind).toBe("DAILY_QUEST");
  });
});
