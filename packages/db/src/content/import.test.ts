import { afterAll, beforeAll, describe, expect, it, type TestContext } from "vitest";
import {
  createTempStudent,
  databaseReachable,
  disconnectTestDb,
  removeTempStudent,
  type TempStudent,
  testDb,
} from "../test-db";
import { exportPack } from "./export";
import { type ExerciseRow, importExercises, publishBatch } from "./import";
import { bankCoverage } from "./stats";

/**
 * The importer contract (docs/10 sec. 11, docs/08 pha 2 "tieu chi xong"):
 *  - re-importing an unchanged batch makes no new rows;
 *  - editing one exercise updates it in place, keeps the stableId, keeps the old Evidence;
 *  - nothing outside the content tables is ever written.
 */
const SKILL = "VMATH.SO.CONG_PV_10";
const PREFIX = "itest-import";

function row(n: number, overrides: Partial<ExerciseRow> = {}): ExerciseRow {
  const text = `Co ${n} qua cam va 2 qua cam. Tat ca may qua?`;
  return {
    stableId: `${PREFIX}-${String(n).padStart(4, "0")}`,
    type: "MCQ",
    subject: "VMATH",
    language: "vi",
    difficulty: ((n - 1) % 5) + 1,
    spec: {
      type: "MCQ",
      language: "vi",
      subject: "VMATH",
      skillCodes: [SKILL],
      difficulty: ((n - 1) % 5) + 1,
      prompt: { text, tts: true },
      choices: [
        { id: "a", text: String(n + 1) },
        { id: "b", text: String(n + 2) },
        { id: "c", text: String(n) },
      ],
      scaffold: "none",
      hints: ["Dem tiep tu so lon."],
      explanation: `${n} cong 2 bang ${n + 2}.`,
      meta: { estSeconds: 25, sourceRef: "SGK Toan 1 tap mot tr.41" },
    },
    answerKey: { value: "b", errorTags: { a: "dem_thieu_1", c: "nham_cong_tru" } },
    explanation: `${n} cong 2 bang ${n + 2}.`,
    skillCodes: [SKILL],
    lessonUnitCode: null,
    sourceRef: "SGK Toan 1 tap mot tr.41",
    sourceFile: "exercises/vmath/test.pack.json",
    assetTheme: "NEUTRAL",
    targetsError: null,
    promptVersion: "exercise-gen-v1",
    contentHash: `hash-${n}-v1`,
    ...overrides,
  };
}

/** Tables that belong to the child and must never be touched by an import. */
async function learningDataCounts() {
  const db = testDb();
  const [evidence, mastery, history, session, attempt, errorStat, track] = await Promise.all([
    db.evidence.count(),
    db.skillMastery.count(),
    db.masteryHistory.count(),
    db.session.count(),
    db.attempt.count(),
    db.errorStat.count(),
    db.remediationTrack.count(),
  ]);
  return { evidence, mastery, history, session, attempt, errorStat, track };
}

describe("content importer (integration, needs the seeded database)", () => {
  let ready = false;
  let student: TempStudent | null = null;
  let skillId = "";
  const needDb = (ctx: TestContext) => {
    if (!ready) ctx.skip("no seeded database (start Postgres and run pnpm db:seed)");
  };

  beforeAll(async () => {
    ready = await databaseReachable();
    if (ready) {
      const skill = await testDb().skill.findUnique({ where: { code: SKILL } });
      ready = Boolean(skill);
      skillId = skill?.id ?? "";
    }
    if (ready) student = await createTempStudent("import");
  });

  afterAll(async () => {
    if (ready) {
      await testDb().exercise.deleteMany({ where: { stableId: { startsWith: PREFIX } } });
      await testDb().contentBatch.deleteMany({ where: { sourceDir: "itest" } });
    }
    await removeTempStudent(student);
    await disconnectTestDb();
  });

  it("creates the batch on the first import", async (ctx) => {
    needDb(ctx);
    const rows = Array.from({ length: 5 }, (_, i) => row(i + 1));
    const result = await importExercises(testDb(), rows, { sourceDir: "itest" });
    expect(result.created).toBe(5);
    expect(result.updated).toBe(0);
    expect(result.batchId).toBeTruthy();
    const saved = await testDb().exercise.findUnique({
      where: { stableId: `${PREFIX}-0001` },
      include: { skills: true },
    });
    expect(saved?.status).toBe("DRAFT"); // never visible to a child before a parent publishes
    expect(saved?.skills).toHaveLength(1);
    expect(saved?.skills[0]?.skillId).toBe(skillId);
  });

  it("re-importing the same batch creates no duplicate (docs/08 pha 2)", async (ctx) => {
    needDb(ctx);
    const rows = Array.from({ length: 5 }, (_, i) => row(i + 1));
    const before = await testDb().exercise.count({ where: { stableId: { startsWith: PREFIX } } });
    const result = await importExercises(testDb(), rows, { sourceDir: "itest" });
    expect(result.created).toBe(0);
    expect(result.updated).toBe(0);
    expect(result.unchanged).toBe(5);
    const after = await testDb().exercise.count({ where: { stableId: { startsWith: PREFIX } } });
    expect(after).toBe(before);
  });

  it("--dry-run reports 0 changes for an unchanged batch and writes nothing", async (ctx) => {
    needDb(ctx);
    const rows = Array.from({ length: 5 }, (_, i) => row(i + 1));
    const batchesBefore = await testDb().contentBatch.count();
    const result = await importExercises(testDb(), rows, { sourceDir: "itest", dryRun: true });
    expect(result.plan).toEqual([]);
    expect(result.unchanged).toBe(5);
    expect(result.batchId).toBeNull();
    expect(await testDb().contentBatch.count()).toBe(batchesBefore);
  });

  it("editing one exercise updates it in place, keeps the stableId and keeps old Evidence", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const target = await db.exercise.findUniqueOrThrow({
      where: { stableId: `${PREFIX}-0002` },
    });
    // A child has already worked this exercise: Session -> Attempt -> Evidence.
    const session = await db.session.create({
      data: { studentId: student?.id as string, kind: "DAILY_QUEST", date: new Date() },
    });
    const attempt = await db.attempt.create({
      data: { sessionId: session.id, exerciseId: target.id, order: 1, isCorrect: true, score: 1 },
    });
    const evidence = await db.evidence.create({
      data: {
        studentId: student?.id as string,
        skillId,
        source: "EXERCISE",
        outcome: "CORRECT",
        score: 1,
        weight: 1,
        attemptId: attempt.id,
      },
    });

    const edited = row(2, {
      contentHash: "hash-2-v2",
      explanation: "Hai cong hai bang bon nhe.",
    });
    const rows = [row(1), edited, row(3), row(4), row(5)];
    const result = await importExercises(db, rows, { sourceDir: "itest" });
    expect(result.updated).toBe(1);
    expect(result.created).toBe(0);

    const after = await db.exercise.findUniqueOrThrow({ where: { stableId: `${PREFIX}-0002` } });
    expect(after.id).toBe(target.id); // same row: the attempt and its evidence still point at it
    expect(after.explanation).toBe("Hai cong hai bang bon nhe.");
    const keptAttempt = await db.attempt.findUnique({
      where: { id: attempt.id },
      include: { evidences: true },
    });
    expect(keptAttempt?.exerciseId).toBe(target.id);
    expect(keptAttempt?.evidences.map((e) => e.id)).toContain(evidence.id);

    await db.session.delete({ where: { id: session.id } }); // cascades attempt; evidence unlinks
    await db.evidence.deleteMany({ where: { id: evidence.id } });
  });

  it("keeps a published exercise published when its text is fixed", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    await db.exercise.update({
      where: { stableId: `${PREFIX}-0003` },
      data: { status: "PUBLISHED", qualityFlag: "GOOD" },
    });
    await importExercises(db, [row(3, { contentHash: "hash-3-v2" })], {
      sourceDir: "itest",
      retireMissing: false,
    });
    const after = await db.exercise.findUniqueOrThrow({ where: { stableId: `${PREFIX}-0003` } });
    expect(after.status).toBe("PUBLISHED");
    expect(after.qualityFlag).toBe("GOOD");
  });

  it("retires an exercise dropped from the files instead of deleting it", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const rows = [
      row(1),
      row(2, { contentHash: "hash-2-v2" }),
      row(3, { contentHash: "hash-3-v2" }),
    ];
    const result = await importExercises(db, rows, { sourceDir: "itest" });
    expect(result.retired).toBeGreaterThanOrEqual(2);
    const gone = await db.exercise.findUnique({ where: { stableId: `${PREFIX}-0005` } });
    expect(gone).not.toBeNull();
    expect(gone?.status).toBe("RETIRED");
  });

  it("never retires exercises of another file, even for the same skill", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    // The real bank's exercises for this skill come from their own pack file. An import of five
    // test rows used to retire all fifty of them — running the test suite emptied the bank.
    const before = await db.exercise.count({
      where: {
        skills: { some: { skill: { code: SKILL } } },
        status: "PUBLISHED",
        stableId: { not: { startsWith: PREFIX } },
      },
    });
    await importExercises(db, [row(1)], { sourceDir: "itest" });
    const after = await db.exercise.count({
      where: {
        skills: { some: { skill: { code: SKILL } } },
        status: "PUBLISHED",
        stableId: { not: { startsWith: PREFIX } },
      },
    });
    expect(after).toBe(before);
  });

  it("brings a retired exercise back as DRAFT when it returns to the files", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const gone = await db.exercise.findUniqueOrThrow({ where: { stableId: `${PREFIX}-0005` } });
    expect(gone.status).toBe("RETIRED");
    // Same text as before — the hash has not changed, so only the status tells it came back.
    const result = await importExercises(db, [row(5)], {
      sourceDir: "itest",
      retireMissing: false,
    });
    expect(result.revived).toBe(1);
    expect(result.unchanged).toBe(0);
    const back = await db.exercise.findUniqueOrThrow({ where: { stableId: `${PREFIX}-0005` } });
    expect(back.id).toBe(gone.id); // same row, so the old Evidence still points at it
    expect(back.status).toBe("DRAFT"); // a parent looks at it again before a child meets it
  });

  it("never writes a child's learning data (docs/10 §11)", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const evidence = await db.evidence.create({
      data: {
        studentId: student?.id as string,
        skillId,
        source: "EXERCISE",
        outcome: "CORRECT",
        score: 1,
        weight: 1,
      },
    });
    const before = await learningDataCounts();
    await importExercises(
      db,
      Array.from({ length: 5 }, (_, i) => row(i + 1, { contentHash: `hash-${i + 1}-v3` })),
      { sourceDir: "itest" },
    );
    expect(await learningDataCounts()).toEqual(before);
    await db.evidence.delete({ where: { id: evidence.id } });
  });

  it("publishes a batch and then counts it in content:stats", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const result = await importExercises(
      db,
      Array.from({ length: 5 }, (_, i) => row(i + 1, { contentHash: `hash-${i + 1}-v4` })),
      { sourceDir: "itest" },
    );
    const published = await publishBatch(db, result.batchId as string);
    expect(published).toBeGreaterThan(0);
    const coverage = await bankCoverage(db, { skillCodes: [SKILL] });
    expect(coverage.skills[0]?.published).toBeGreaterThanOrEqual(published);
  });

  it("exports a pack that carries the diagnosis back into the file", async (ctx) => {
    needDb(ctx);
    const pack = await exportPack(testDb(), SKILL);
    const mine = pack?.exercises.find((e) => e.id === `${PREFIX}-0001`) as
      | { choices?: { id: string; errorTag?: string }[]; answerKey?: unknown }
      | undefined;
    expect(mine?.answerKey).toBe("b");
    expect(mine?.choices?.find((c) => c.id === "a")?.errorTag).toBe("dem_thieu_1");
  });
});
