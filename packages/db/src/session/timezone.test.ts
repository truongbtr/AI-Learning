import { vnDayDate } from "@mtct/core";
import { afterAll, beforeAll, describe, expect, it, type TestContext } from "vitest";
import {
  createTempStudent,
  databaseReachable,
  disconnectTestDb,
  removeTempStudent,
  type TempStudent,
  testDb,
} from "../test-db";
import { finishSession, startSession } from "./grade";
import { planDailyQuest } from "./plan";

/**
 * Nine in the evening, Vietnam time, on a server that thinks it is somewhere else.
 *
 * `Session.date`, `Streak.lastActiveDate` and `EggProgress.startedOn` are `@db.Date` columns.
 * Written with local midnight they land a day early at UTC+7 (ADR-18, the note at the end), and
 * the whole parent dashboard — the seven-day strip, the streak, the egg — is then telling the
 * family about the wrong day. `packages/core/.../timezone.test.ts` guards the pure conversion;
 * this guards the three writes that actually reach Postgres, because that is where it went wrong.
 *
 * Both zones are run in one pass: Node re-reads `process.env.TZ` on each `Date` operation.
 */

const ORIGINAL_TZ = process.env.TZ;

/** Friday 11/09/2026, 21:00 at home = 14:00 UTC. The hour the children actually sit down. */
const NINE_PM_VN = new Date("2026-09-11T21:00:00+07:00");
const EXPECTED_DAY = "2026-09-11";

describe("21:00 Vietnam lands on the right day (integration, needs the seeded database)", () => {
  let ready = false;
  let student: TempStudent | null = null;
  const needDb = (ctx: TestContext) => {
    if (!ready) ctx.skip("no seeded database (start Postgres and run pnpm db:seed)");
  };

  beforeAll(async () => {
    ready = await databaseReachable();
    if (!ready) return;
    const published = await testDb().exercise.count({ where: { status: "PUBLISHED" } });
    ready = published > 0;
    if (!ready) return;
    student = await createTempStudent("tz");
  });

  afterAll(async () => {
    process.env.TZ = ORIGINAL_TZ;
    await removeTempStudent(student);
    await disconnectTestDb();
  });

  for (const tz of ["UTC", "Asia/Ho_Chi_Minh"] as const) {
    it(`files the session, the streak and the egg under ${EXPECTED_DAY} with TZ=${tz}`, async (ctx) => {
      needDb(ctx);
      process.env.TZ = tz;
      const db = testDb();
      const s = student as TempStudent;

      // Nothing carried over from the other zone's run.
      await db.session.deleteMany({ where: { studentId: s.id } });
      await db.streak.deleteMany({ where: { studentId: s.id } });
      await db.eggProgress.deleteMany({ where: { studentId: s.id } });

      const planned = await planDailyQuest(db, s.id, NINE_PM_VN, { force: true });
      await startSession(db, planned.sessionId);
      await finishSession(db, planned.sessionId, { studentId: s.id, at: NINE_PM_VN });

      const [session, streak, egg] = await Promise.all([
        db.session.findUnique({ where: { id: planned.sessionId }, select: { date: true } }),
        db.streak.findUnique({ where: { studentId: s.id }, select: { lastActiveDate: true } }),
        db.eggProgress.findFirst({
          where: { studentId: s.id },
          orderBy: { eggNo: "desc" },
          select: { startedOn: true },
        }),
      ]);

      const day = (d: Date | null | undefined) => d?.toISOString().slice(0, 10) ?? null;
      expect(day(session?.date), "Session.date").toBe(EXPECTED_DAY);
      expect(day(streak?.lastActiveDate), "Streak.lastActiveDate").toBe(EXPECTED_DAY);
      expect(day(egg?.startedOn), "EggProgress.startedOn").toBe(EXPECTED_DAY);

      // And the column really is the Vietnam day, not the server's idea of midnight.
      expect(session?.date.getTime()).toBe(vnDayDate(NINE_PM_VN).getTime());
      process.env.TZ = ORIGINAL_TZ;
    });
  }
});
