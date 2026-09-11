import { EGG_DAYS_TO_HATCH, PICTURE_PIECES } from "@mtct/core";
import { afterAll, beforeAll, describe, expect, it, type TestContext } from "vitest";
import {
  createTempStudent,
  databaseReachable,
  disconnectTestDb,
  removeTempStudent,
  type TempStudent,
  testDb,
} from "../test-db";
import { updateEgg, updateWeeklyPicture } from "./rewards";

/**
 * ADR-16: nothing a child earned by turning up may be taken back for resting.
 *
 * These tests write finished sessions on chosen dates — including a fortnight with a long gap in
 * the middle — and then check what the egg, the picture and the streak say. The old weekly rule
 * would fail every one of them, which is exactly the point.
 */
describe("the egg and the picture never go backwards (integration)", () => {
  let ready = false;
  let student: TempStudent | null = null;
  const needDb = (ctx: TestContext) => {
    if (!ready) ctx.skip("no database (start Postgres and run pnpm db:seed)");
  };

  beforeAll(async () => {
    ready = await databaseReachable();
    if (!ready) return;
    // The egg can only hatch if there are pets to hatch into.
    ready = (await testDb().pet.count()) > 0;
    if (!ready) return;
    student = await createTempStudent("rewards");
  });

  afterAll(async () => {
    await removeTempStudent(student);
    await disconnectTestDb();
  });

  /** Marks `dates` as days the child finished a quest. */
  async function learnedOn(dates: string[]): Promise<void> {
    const db = testDb();
    for (const d of dates) {
      const day = new Date(`${d}T00:00:00`);
      await db.session.create({
        data: {
          studentId: student?.id ?? "",
          kind: "DAILY_QUEST",
          date: day,
          status: "COMPLETED",
          slots: [],
          finishedAt: day,
        },
      });
    }
  }

  it("cracks once a day, hatches on the fourth, and ignores Monday", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    // Thursday and Friday of one week, then Monday of the next: three days across a week border.
    await learnedOn(["2026-09-10", "2026-09-11", "2026-09-14"]);
    const three = await updateEgg(db, student?.id ?? "", new Date("2026-09-14T19:00:00"));
    expect(three.cracks).toBe(3); // the weekly egg would have said 1 here
    expect(three.needed).toBe(EGG_DAYS_TO_HATCH);
    expect(three.justHatched).toBe(false);

    await learnedOn(["2026-09-15"]);
    const four = await updateEgg(db, student?.id ?? "", new Date("2026-09-15T19:00:00"));
    expect(four.justHatched).toBe(true);
    expect(four.hatched?.code).toBeTruthy();
    expect(await db.studentPet.count({ where: { studentId: student?.id } })).toBe(1);

    // Running it again after a reconnect must not hatch a second pet.
    const again = await updateEgg(db, student?.id ?? "", new Date("2026-09-15T19:05:00"));
    expect(again.justHatched).toBe(false);
    expect(await db.studentPet.count({ where: { studentId: student?.id } })).toBe(1);

    // A fortnight off: the next egg keeps the cracks it had, it does not go back to zero.
    const afterABreak = await updateEgg(db, student?.id ?? "", new Date("2026-09-29T19:00:00"));
    expect(afterABreak.eggNo).toBe(1);
    expect(afterABreak.cracks).toBe(0);
    await learnedOn(["2026-09-30"]);
    const oneCrack = await updateEgg(db, student?.id ?? "", new Date("2026-09-30T19:00:00"));
    expect(oneCrack.eggNo).toBe(1);
    expect(oneCrack.cracks).toBe(1);
  });

  it("keeps the pieces already turned over when a week ends", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const at = new Date("2026-09-30T19:30:00");
    const picture = await updateWeeklyPicture(db, student?.id ?? "", at);
    // Five learning days so far, spread over three calendar weeks.
    expect(picture.pieces).toEqual([0, 1, 2, 3, 4]);
    expect(picture.total).toBe(PICTURE_PIECES);
    expect(picture.complete).toBe(false);
    expect(picture.pictureNo).toBe(0);

    // The sixth day finishes picture 0 — and the child sees it whole that evening.
    await learnedOn(["2026-10-01"]);
    const done = await updateWeeklyPicture(db, student?.id ?? "", new Date("2026-10-01T19:30:00"));
    expect(done.pictureNo).toBe(0);
    expect(done.complete).toBe(true);
    expect(done.finished).toBe(1);

    // The seventh starts picture 1 with one piece; picture 0 stays in the collection.
    await learnedOn(["2026-10-02"]);
    const next = await updateWeeklyPicture(db, student?.id ?? "", new Date("2026-10-02T19:30:00"));
    expect(next.pictureNo).toBe(1);
    expect(next.pieces).toEqual([0]);
    expect(next.imageKey).not.toBe(done.imageKey);
    expect(await db.studentPicturePiece.count({ where: { studentId: student?.id } })).toBe(7);
  });
});
