import { SYLLABLE_BRICK_BOX } from "@mtct/core";
import { afterAll, beforeAll, describe, expect, it, type TestContext } from "vitest";
import type { PickedSlot } from "../session/plan";
import { MAX_SYLLABLE_STATIONS, syllableStations } from "../session/syllable-plan";
import {
  createTempStudent,
  databaseReachable,
  disconnectTestDb,
  removeTempStudent,
  type TempStudent,
  testDb,
} from "../test-db";
import {
  judgeSyllable,
  recordSyllableMeeting,
  syllableBook,
  syllableStation,
  syllablesForStation,
} from "./service";

/**
 * Xưởng Tiếng against the real dictionary (pha 12, ADR-24).
 *
 * What these guard: a meeting writes exactly one Leitner row of kind=syllable and one piece of
 * evidence with the error code the build shows; right or wrong is decided from the syllable, not
 * from the device; a newcomer starts with the syllables heard at home; and the planner turns
 * spelling practice into at most two stations without making the evening longer.
 */
describe("syllables, the Leitner ladder and the evidence (integration, needs viet.json imported)", () => {
  let ready = false;
  let student: TempStudent | null = null;
  const sid = () => student?.id ?? "";

  const needDb = (ctx: TestContext) => {
    if (!ready) ctx.skip("no syllable dictionary in the database (run pnpm content:import)");
  };

  beforeAll(async () => {
    ready = await databaseReachable();
    if (!ready) return;
    ready = (await testDb().syllable.count({ where: { isActive: true } })) > 0;
    if (!ready) return;
    student = await createTempStudent("syllable");
  });

  afterAll(async () => {
    await removeTempStudent(student);
    await disconnectTestDb();
  });

  it("starts a newcomer with the syllables heard at home, and never repeats one", async (ctx) => {
    needDb(ctx);
    const picked = await syllablesForStation(testDb(), sid(), { classWeek: 4 });
    expect(picked.length).toBe(8);
    expect(new Set(picked.map((s) => s.id)).size).toBe(picked.length);
    const everyday = await testDb().syllable.findMany({
      where: { everyday: true },
      select: { id: true },
    });
    const home = new Set(everyday.map((s) => s.id));
    expect(picked.filter((s) => home.has(s.id)).length).toBeGreaterThanOrEqual(3);
  });

  it("judges a build piece by piece, whatever the device claims", () => {
    const ba = { text: "bà", onset: "b", rime: "a", tone: "huyen" as const };
    expect(judgeSyllable(ba, { game: "build", onset: "b", rime: "a", tone: "huyen" })).toEqual({
      correct: true,
      errorCode: null,
    });
    expect(judgeSyllable(ba, { game: "build", onset: "d", rime: "a", tone: "huyen" })).toEqual({
      correct: false,
      errorCode: "nham_b_d",
    });
    expect(judgeSyllable(ba, { game: "tone", tone: "sac" }).errorCode).toBe("sai_dau_thanh");
    expect(judgeSyllable(ba, { game: "pair", picked: "dà", errorCode: "nham_b_d" }).correct).toBe(
      false,
    );
  });

  it("writes one Leitner row of kind=syllable and one piece of evidence per meeting", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const ba = await db.syllable.findUniqueOrThrow({ where: { stableId: "viet-ba-huyen" } });
    const attemptsBefore = await db.attempt.count({ where: { session: { studentId: sid() } } });

    const wrong = await recordSyllableMeeting(db, {
      studentId: sid(),
      syllableId: ba.id,
      answer: { game: "build", onset: "d", rime: "a", tone: "huyen" },
    });
    expect(wrong.correct).toBe(false);
    expect(wrong.errorCode).toBe("nham_b_d");
    expect(wrong.box).toBe(1);

    const rows = await db.lexemeProgress.findMany({ where: { studentId: sid() } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: "syllable", lexemeId: ba.id, seen: 1, known: 0 });

    const evidence = await db.evidence.findMany({ where: { studentId: sid() } });
    expect(evidence).toHaveLength(1);
    expect(evidence[0]).toMatchObject({
      skillId: ba.skillId,
      source: "EXERCISE",
      outcome: "INCORRECT",
      errorCode: "nham_b_d",
    });
    expect(evidence[0]?.note).toBe("xuong-tieng:build:viet-ba-huyen:box0");
    // a game writes no Attempt
    expect(await db.attempt.count({ where: { session: { studentId: sid() } } })).toBe(
      attemptsBefore,
    );

    // the same syllable later the same evening: counted, but the box waits for tomorrow
    const again = await recordSyllableMeeting(db, {
      studentId: sid(),
      syllableId: ba.id,
      answer: { game: "build", onset: "b", rime: "a", tone: "huyen" },
    });
    expect(again.correct).toBe(true);
    expect(again.box).toBe(1);
    const row = await db.lexemeProgress.findFirstOrThrow({ where: { studentId: sid() } });
    expect(row).toMatchObject({ seen: 2, known: 1 });
  });

  it("refuses a pair code the taxonomy of pairs does not have", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const ba = await db.syllable.findUniqueOrThrow({ where: { stableId: "viet-ba-huyen" } });
    await expect(
      recordSyllableMeeting(db, {
        studentId: sid(),
        syllableId: ba.id,
        answer: { game: "pair", picked: "dà", errorCode: "made_up_code" },
      }),
    ).rejects.toThrow();
  });

  it("lays a brick when a syllable reaches the brick box, and the book shows it", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const ca = await db.syllable.findUniqueOrThrow({ where: { stableId: "viet-ca-sac" } });
    await db.lexemeProgress.create({
      data: {
        studentId: sid(),
        kind: "syllable",
        lexemeId: ca.id,
        box: SYLLABLE_BRICK_BOX - 1,
        seen: 3,
        known: 3,
        lastSeenAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    });
    const result = await recordSyllableMeeting(db, {
      studentId: sid(),
      syllableId: ca.id,
      answer: { game: "pair", picked: "cá", errorCode: "nham_c_k_q" },
    });
    expect(result.brick).toBe(true);
    const book = await syllableBook(db, sid());
    expect(book.known).toBe(1);
    expect(book.groups.flatMap((g) => g.syllables).map((s) => s.text)).toEqual(["cá"]);
    expect(book.practising).toBe(1); // "bà", still at box 1, is not in the grid
  });

  it("deals a station with two rounds of different games", async (ctx) => {
    needDb(ctx);
    const station = await syllableStation(testDb(), sid(), {
      sessionId: "test-session",
      order: 3,
      games: ["build", "pair"],
      skills: ["VIET.HV.AM_B"],
    });
    expect(station.rounds).toHaveLength(2);
    expect(station.rounds[0]?.game).not.toBe(station.rounds[1]?.game);
    expect(station.done).toBe(false);
    const first = station.rounds[0];
    if (first?.game === "build") expect(first.items.length).toBeGreaterThanOrEqual(6);
  });

  it("turns spelling slots into at most two stations and keeps the evening's length", async (ctx) => {
    needDb(ctx);
    const slot = (order: number, skillCode: string, kind: PickedSlot["kind"]): PickedSlot => ({
      order,
      kind,
      skillCode,
      subject: skillCode.startsWith("VIET") ? "VIET" : "VMATH",
      difficulty: 2,
      reason: "test",
      exerciseId: `ex-${order}`,
    });
    const slots: PickedSlot[] = [
      slot(1, "VMATH.SO.DEM_DEN_10", "warmup"),
      slot(2, "VIET.HV.AM_B", "focus"),
      slot(3, "VIET.HV.AM_C", "focus"),
      slot(4, "VIET.HV.AM_B", "review"),
      slot(5, "VMATH.SO.DEM_DEN_10", "focus"),
      slot(6, "VIET.HV.DAU_HUYEN", "new"),
      slot(7, "VMATH.SO.DEM_DEN_10", "focus"),
      slot(8, "VIET.HV.AM_O", "focus"),
      slot(9, "VMATH.SO.DEM_DEN_10", "finish"),
    ];
    const out = await syllableStations(testDb(), sid(), slots, new Date());
    const stations = out.slots.filter((s) => s.syllable);
    expect(stations.length).toBeGreaterThanOrEqual(1);
    expect(stations.length).toBeLessThanOrEqual(MAX_SYLLABLE_STATIONS);
    for (const s of stations) {
      expect(s.exerciseId).toBeNull();
      expect(s.syllable?.games).toHaveLength(2);
      expect(s.syllable?.games[0]).not.toBe(s.syllable?.games[1]);
    }
    // review, warm-up and the finish keep their exercises
    for (const order of [1, 4, 9])
      expect(out.slots.find((s) => s.order === order)?.exerciseId).toBe(`ex-${order}`);
    // four slot-equivalents per station: the evening never gets longer
    expect(out.slots.length).toBeLessThanOrEqual(slots.length - 3 * stations.length);
    expect(out.log.some((l) => l.startsWith("xưởng tiếng"))).toBe(true);
  });
});
