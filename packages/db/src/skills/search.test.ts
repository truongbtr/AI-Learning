import { afterAll, beforeAll, describe, expect, it, type TestContext } from "vitest";
import { databaseReachable, disconnectTestDb, testDb } from "../test-db";
import { searchSkills, searchTokens } from "./search";

describe("searchTokens", () => {
  it("keeps letters and digits of any script, drops punctuation", () => {
    expect(searchTokens("đọc từ có sh")).toEqual(["đọc", "từ", "có", "sh"]);
    expect(searchTokens("ESL.PH.DIGRAPHS_SH")).toEqual(["esl", "ph", "digraphs", "sh"]);
    expect(searchTokens("  ")).toEqual([]);
  });
});

describe("searchSkills (integration, needs the seeded database)", () => {
  let ready = false;
  beforeAll(async () => {
    ready = await databaseReachable();
    if (ready) {
      const n = await testDb().skill.count();
      ready = n > 0;
    }
  });
  afterAll(disconnectTestDb);

  /** Reported as "skipped", never as a silent pass, when there is no seeded database. */
  const needDb = (ctx: TestContext) => {
    if (!ready) ctx.skip("no seeded database (start Postgres and run pnpm db:seed)");
  };

  const top = async (q: string, limit = 3) =>
    (await searchSkills(testDb(), q, { limit })).map((r) => r.code);

  it("finds the sh/ch/th digraph skill from Vietnamese, with and without diacritics", async (ctx) => {
    needDb(ctx);
    expect(await top("đọc từ có sh")).toContain("ESL.PH.DIGRAPHS_SH_CH_TH");
    expect(await top("doc tu co sh")).toContain("ESL.PH.DIGRAPHS_SH_CH_TH");
  });

  it("finds addition within 10 for both maths subjects", async (ctx) => {
    needDb(ctx);
    const vi = await top("cộng trong phạm vi 10");
    expect(vi).toContain("VMATH.SO.CONG_PV_10");
    const noDiacritics = await top("cong trong pham vi 10");
    expect(noDiacritics).toContain("VMATH.SO.CONG_PV_10");
    const en = await top("addition within 10", 5);
    expect(en).toContain("EMATH.OA.ADD_WITHIN_10");
  });

  it("matches skill codes and English names", async (ctx) => {
    needDb(ctx);
    expect(await top("VIET.HV.AM_U")).toContain("VIET.HV.AM_U_UW");
    expect(await top("tell time", 5)).toContain("EMATH.MD.TELL_TIME_HOUR_HALF");
  });

  it("filters by subject and honours the limit", async (ctx) => {
    needDb(ctx);
    const hits = await searchSkills(testDb(), "đọc", { subject: "VIET", limit: 5 });
    expect(hits.length).toBeLessThanOrEqual(5);
    expect(hits.every((h) => h.code.startsWith("VIET."))).toBe(true);
    expect(hits.every((h) => h.isActive)).toBe(true);
  });

  it("ranks rows matching every token above partial matches", async (ctx) => {
    needDb(ctx);
    const hits = await searchSkills(testDb(), "dấu hỏi ngã", { limit: 5 });
    expect(hits[0]?.code).toBe("VIET.HV.NHAM_LAN_DAU_HOI_NGA");
    expect(hits[0]?.full).toBe(true);
  });

  it("returns nothing for an empty query", async (ctx) => {
    needDb(ctx);
    expect(await searchSkills(testDb(), "   ")).toEqual([]);
  });
});
