import { DAY_MS } from "@mtct/core";
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
  commitEvidence,
  DECAY_LAST_RUN_SETTING,
  getMasteryHistory,
  getStudentMastery,
  isKnownErrorCode,
  MasteryServiceError,
  refreshErrorStat,
  resetErrorCodeCache,
  runMasteryDecay,
} from "./service";

const SKILL = "VMATH.SO.CONG_PV_10";
const OTHER_SKILL = "VIET.HV.AM_B";

describe("commitEvidence / decay (integration, needs the seeded database)", () => {
  let ready = false;
  let student: TempStudent | null = null;
  const needDb = (ctx: TestContext) => {
    if (!ready) ctx.skip("no seeded database (start Postgres and run pnpm db:seed)");
  };

  beforeAll(async () => {
    ready = await databaseReachable();
    if (ready) ready = (await testDb().skill.count({ where: { code: SKILL } })) > 0;
    if (ready) {
      resetErrorCodeCache();
      student = await createTempStudent("mastery");
    }
  });
  afterAll(async () => {
    await removeTempStudent(student);
    await disconnectTestDb();
  });

  it("three evidences move SkillMastery through the docs/04 §3.3 table", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const studentId = student!.id;
    const base = Date.now();
    const at = (days: number) => new Date(base - (3 - days) * DAY_MS);

    // 1) first correct EXERCISE: NOT_STARTED -> LEARNING (m = 25.2, c = 0.08)
    const first = await commitEvidence(db, {
      studentId,
      skillCode: SKILL,
      source: "EXERCISE",
      outcome: "CORRECT",
      score: 1,
      difficulty: 3,
      observedAt: at(1),
    });
    expect(first.before.status).toBe("NOT_STARTED");
    expect(first.after.mastery).toBeCloseTo(25.2, 1);
    expect(first.after.confidence).toBeCloseTo(0.08, 2);
    expect(first.after.status).toBe("LEARNING");

    // 2) parent override to 70: -> SOLID (c = 0.9), first review scheduled in 2 days
    const second = await commitEvidence(db, {
      studentId,
      skillCode: SKILL,
      source: "PARENT_OVERRIDE",
      outcome: "OBSERVED",
      score: 0.7,
      observedAt: at(2),
    });
    expect(second.after.mastery).toBe(70);
    expect(second.after.confidence).toBe(0.9);
    expect(second.after.status).toBe("SOLID");
    expect(second.after.intervalDays).toBe(2);
    expect(second.after.nextReviewAt?.getTime()).toBe(at(2).getTime() + 2 * DAY_MS);

    // 3) wrong answer: 70 -> 59.16 with c >= 0.4 -> NEEDS_PRACTICE
    const third = await commitEvidence(db, {
      studentId,
      skillCode: SKILL,
      source: "EXERCISE",
      outcome: "INCORRECT",
      score: 0,
      difficulty: 3,
      errorCode: "nham_cong_tru",
      observedAt: at(3),
    });
    expect(third.after.mastery).toBeCloseTo(59.16, 1);
    expect(third.after.status).toBe("NEEDS_PRACTICE");
    // a failed review resets the ladder to 2 days (docs/04 §3.4)
    expect(third.after.intervalDays).toBe(2);
    expect(third.after.nextReviewAt?.getTime()).toBe(at(3).getTime() + 2 * DAY_MS);

    // the row in the database matches what the service returned
    const skill = await db.skill.findUniqueOrThrow({
      where: { code: SKILL },
      select: { id: true },
    });
    const row = await db.skillMastery.findUniqueOrThrow({
      where: { studentId_skillId: { studentId, skillId: skill.id } },
    });
    expect(row.status).toBe("NEEDS_PRACTICE");
    expect(row.evidenceCount).toBe(3);
    expect(row.mastery).toBeCloseTo(59.16, 1);

    // one MasteryHistory row per evidence, with the override labelled
    const history = await db.masteryHistory.findMany({
      where: { studentId, skillId: skill.id },
      orderBy: { at: "asc" },
    });
    expect(history).toHaveLength(3);
    expect(history.map((h) => h.cause)).toEqual(["EVIDENCE", "PARENT_OVERRIDE", "EVIDENCE"]);
  });

  it("counts the error code in ErrorStat (7d and 30d windows)", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const studentId = student!.id;
    const before = await db.errorStat.findUnique({
      where: { studentId_errorCode: { studentId, errorCode: "nham_cong_tru" } },
    });
    expect(before?.count7d).toBe(1);
    expect(before?.count30d).toBe(1);

    await commitEvidence(db, {
      studentId,
      skillCode: SKILL,
      source: "INTAKE_PHOTO",
      outcome: "INCORRECT",
      score: 0,
      errorCode: "nham_cong_tru",
    });
    const after = await db.errorStat.findUniqueOrThrow({
      where: { studentId_errorCode: { studentId, errorCode: "nham_cong_tru" } },
    });
    expect(after.count7d).toBe(2); // count7d >= 2 = "active error" (docs/04 §11.3)
    expect(after.count30d).toBe(2);
    expect(after.lastEvidenceId).not.toBeNull();

    // an old evidence counts in the 30-day window only
    await commitEvidence(db, {
      studentId,
      skillCode: SKILL,
      source: "EXERCISE",
      outcome: "INCORRECT",
      score: 0,
      errorCode: "nham_cong_tru",
      observedAt: new Date(Date.now() - 20 * DAY_MS),
    });
    const windows = await refreshErrorStat(db, studentId, "nham_cong_tru");
    expect(windows).toEqual({ count7d: 2, count30d: 3 });
  });

  it("rejects an error code outside content/error-taxonomy.json and writes nothing", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const studentId = student!.id;
    const before = await db.evidence.count({ where: { studentId } });
    await expect(
      commitEvidence(db, {
        studentId,
        skillCode: SKILL,
        source: "EXERCISE",
        outcome: "INCORRECT",
        score: 0,
        errorCode: "khong_co_ma_nay",
      }),
    ).rejects.toMatchObject({ code: "UNKNOWN_ERROR_CODE" });
    expect(await db.evidence.count({ where: { studentId } })).toBe(before);
    expect(await isKnownErrorCode(db, "nham_b_d")).toBe(true);
    expect(await isKnownErrorCode(db, "khong_co_ma_nay")).toBe(false);
  });

  it("rejects an unknown skill", async (ctx) => {
    needDb(ctx);
    await expect(
      commitEvidence(testDb(), {
        studentId: student!.id,
        skillCode: "VMATH.SO.KHONG_TON_TAI",
        source: "EXERCISE",
        outcome: "CORRECT",
        score: 1,
      }),
    ).rejects.toBeInstanceOf(MasteryServiceError);
  });

  it("lists mastery per subject and the history of one skill", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const items = await getStudentMastery(db, student!.id, { subject: "VMATH" });
    expect(items.length).toBeGreaterThanOrEqual(35);
    expect(items.every((i) => i.code.startsWith("VMATH."))).toBe(true);
    const target = items.find((i) => i.code === SKILL);
    expect(target?.status).toBe("NEEDS_PRACTICE");
    // Once a skill has dropped below SOLID it leaves the review ladder; the remediation
    // ladder (docs/04 §11.4) takes over instead of spaced repetition.
    expect(target?.nextReviewAt).toBeNull();
    expect(target?.evidenceCount).toBeGreaterThanOrEqual(3);
    // untouched skills come back as NOT_STARTED rather than being missing
    expect(items.some((i) => i.status === "NOT_STARTED")).toBe(true);

    const h = await getMasteryHistory(db, student!.id, SKILL);
    expect(h.skill.code).toBe(SKILL);
    expect(h.history.length).toBeGreaterThanOrEqual(3);
    expect(h.evidences.some((e) => e.errorCode === "nham_cong_tru")).toBe(true);
  });

  it("nightly decay leaves fresh skills alone and ages stale ones", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const studentId = student!.id;
    const stale = await db.skill.findUniqueOrThrow({
      where: { code: OTHER_SKILL },
      select: { id: true },
    });

    // A skill last practised 40 days ago at mastery 80 / confidence 0.8.
    const longAgo = new Date(Date.now() - 40 * DAY_MS);
    await db.skillMastery.create({
      data: {
        studentId,
        skillId: stale.id,
        mastery: 80,
        confidence: 0.8,
        evidenceCount: 4,
        lastEvidenceAt: longAgo,
        status: "SOLID",
        intervalDays: 4,
      },
    });
    const freshBefore = await db.skillMastery.findFirstOrThrow({
      where: { studentId, skill: { code: SKILL } },
    });

    // Pretend the job last ran 10 days ago -> 10 daily steps.
    await db.setting.upsert({
      where: { key: DECAY_LAST_RUN_SETTING },
      create: {
        key: DECAY_LAST_RUN_SETTING,
        value: { at: new Date(Date.now() - 10 * DAY_MS).toISOString() },
      },
      update: { value: { at: new Date(Date.now() - 10 * DAY_MS).toISOString() } },
    });

    const result = await runMasteryDecay(db);
    expect(result.days).toBe(10);
    expect(result.changed).toBeGreaterThanOrEqual(1);

    const after = await db.skillMastery.findUniqueOrThrow({
      where: { studentId_skillId: { studentId, skillId: stale.id } },
    });
    expect(after.mastery).toBeCloseTo(77, 5); // 80 - 0.3 * 10
    expect(after.confidence).toBeCloseTo(0.7, 5); // 0.8 - 0.01 * 10
    expect(after.status).toBe("SOLID");

    const freshAfter = await db.skillMastery.findUniqueOrThrow({ where: { id: freshBefore.id } });
    expect(freshAfter.mastery).toBeCloseTo(freshBefore.mastery, 5); // practised this week

    const decayHistory = await db.masteryHistory.findMany({
      where: { studentId, skillId: stale.id, cause: "DECAY" },
    });
    expect(decayHistory).toHaveLength(1); // at most one DECAY row per 7 days

    // Running again the same day is a no-op (days = 0).
    const second = await runMasteryDecay(db);
    expect(second.skipped).toBe(true);
    expect(second.days).toBe(0);
  });
});
