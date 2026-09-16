import { afterAll, beforeAll, describe, expect, it, type TestContext } from "vitest";
import { databaseReachable, disconnectTestDb, testDb } from "../test-db";
import { MAX_VOCAB_STATIONS, type PickedSlot, vocabStations } from "./plan";

/**
 * Turning vocabulary slots into games (pha 11).
 *
 * The rules worth a test: at most two an evening, only skills that actually have words, and the
 * game changes rather than being the same one every time.
 */
const WITH_WORDS = "ESL.VOC.FAMILY";
const WITHOUT_WORDS = "VMATH.SO.CONG_PV_10";

function slot(order: number, skillCode: string): PickedSlot {
  return {
    order,
    kind: "focus",
    skillCode,
    subject: skillCode.startsWith("ESL") ? "ESL" : "VMATH",
    difficulty: 2,
    reason: "kiểm thử",
    exerciseId: `ex-${order}`,
    stableId: `stable-${order}`,
  } as PickedSlot;
}

describe("vocabulary stations (integration, needs the imported lexicon)", () => {
  let ready = false;
  const needDb = (ctx: TestContext) => {
    if (!ready) ctx.skip("no lexicon in the database (run pnpm content:import)");
  };

  beforeAll(async () => {
    ready = await databaseReachable();
    if (!ready) return;
    ready = (await testDb().word.count({ where: { skill: { code: WITH_WORDS } } })) > 0;
  });
  afterAll(async () => {
    await disconnectTestDb();
  });

  it("plays at most two vocabulary skills a night, and leaves the rest as exercises", async (ctx) => {
    needDb(ctx);
    const slots = [
      slot(1, WITHOUT_WORDS),
      slot(2, WITH_WORDS),
      slot(3, "ESL.VOC.FOOD"),
      slot(4, "ESL.VOC.COLORS"),
      slot(5, WITHOUT_WORDS),
    ];
    const out = await vocabStations(testDb(), "no-such-student", slots);

    const games = out.filter((s) => s.vocab);
    expect(games).toHaveLength(MAX_VOCAB_STATIONS);
    // a station that became a game carries no exercise any more
    for (const g of games) expect(g.exerciseId).toBeNull();
    // and nothing else was touched
    expect(out[0]?.exerciseId).toBe("ex-1");
    expect(out[4]?.exerciseId).toBe("ex-5");
  });

  it("leaves a skill with no words alone", async (ctx) => {
    needDb(ctx);
    const out = await vocabStations(testDb(), "no-such-student", [slot(1, WITHOUT_WORDS)]);
    expect(out[0]?.vocab).toBeUndefined();
    expect(out[0]?.exerciseId).toBe("ex-1");
  });

  it("picks one of the six games", async (ctx) => {
    needDb(ctx);
    const out = await vocabStations(testDb(), "no-such-student", [slot(1, WITH_WORDS)]);
    expect([
      "listen-touch",
      "match-pairs",
      "what-vanished",
      "market",
      "build-word",
      "say-it",
    ]).toContain(out[0]?.vocab?.game);
  });
});
