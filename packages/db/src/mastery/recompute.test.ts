import { vnDayDate } from "@mtct/core";
import { afterAll, beforeAll, describe, expect, it, type TestContext } from "vitest";
import { applyChatIntake } from "../chat/apply";
import { undoChatBatch } from "../chat/undo";
import {
  createTempStudent,
  databaseReachable,
  disconnectTestDb,
  removeTempStudent,
  type TempStudent,
  testDb,
} from "../test-db";
import { recomputeSkillMastery } from "./recompute";
import { commitEvidence, resetErrorCodeCache } from "./service";

/**
 * The replay behind "Hoàn tác lô này" (docs/13 §7.3, docs/14 §4).
 *
 * The case that matters is the one a snapshot would get wrong: a skill that already had history
 * before the batch — including an exercise answered with a hint and a second try, whose penalties
 * live on `Attempt` and not on `Evidence`. If the replay cannot reproduce that, undo would quietly
 * hand the child back a different number than they had, which is worse than no undo at all.
 */

const SKILL = "VMATH.SO.CONG_PV_10";

describe("recomputeSkillMastery (integration, needs the seeded database)", () => {
  let ready = false;
  let student: TempStudent | null = null;
  const needDb = (ctx: TestContext) => {
    if (!ready) ctx.skip("no seeded database (start Postgres and run pnpm db:seed)");
  };

  beforeAll(async () => {
    ready = await databaseReachable();
    if (ready) ready = (await testDb().skill.count({ where: { code: SKILL } })) > 0;
    if (ready) ready = (await testDb().exercise.count({ where: { status: "PUBLISHED" } })) > 0;
    if (ready) {
      resetErrorCodeCache();
      student = await createTempStudent("recompute");
    }
  });
  afterAll(async () => {
    if (student) {
      const db = testDb();
      await db.chatBatch.deleteMany({ where: { studentId: student.id } });
      await db.intakeJob.deleteMany({ where: { studentId: student.id } });
    }
    await removeTempStudent(student);
    await disconnectTestDb();
  });

  it("undo returns a skill with real history to exactly the value it had", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const studentId = student!.id;
    const now = new Date();

    // ── history: one exercise answered with a hint on the second try (docs/04 §3.1 penalties) ──
    const exercise = await db.exercise.findFirstOrThrow({ where: { status: "PUBLISHED" } });
    const session = await db.session.create({
      data: { studentId, kind: "DAILY_QUEST", date: vnDayDate(now), status: "COMPLETED" },
    });
    const attempt = await db.attempt.create({
      data: {
        sessionId: session.id,
        exerciseId: exercise.id,
        order: 1,
        isCorrect: false,
        score: 0.5,
        hintsUsed: 1,
        tries: 2,
        gradedBy: "LOCAL",
      },
    });
    await commitEvidence(db, {
      studentId,
      skillCode: SKILL,
      source: "EXERCISE",
      outcome: "PARTIAL",
      score: 0.5,
      difficulty: 4,
      hintsUsed: 1,
      tries: 2,
      attemptId: attempt.id,
      observedAt: new Date(now.getTime() - 60_000),
    });
    const beforeBatch = await db.skillMastery.findFirstOrThrow({
      where: { studentId, skill: { code: SKILL } },
    });
    expect(beforeBatch.mastery).toBeGreaterThan(0);

    // ── a recompute with nothing removed must not move anything ────────────────────────────────
    const noop = await recomputeSkillMastery(db, studentId, beforeBatch.skillId, now);
    expect(noop.masteryAfter).toBeCloseTo(beforeBatch.mastery, 6);
    expect(noop.changed).toBe(false);

    // ── then a chat batch on the same skill, and take it back out ───────────────────────────────
    const context = await db.chatContext.create({
      data: { studentId, date: vnDayDate(now), skillCodes: [SKILL] },
    });
    const applied = await applyChatIntake(db, {
      studentId,
      contextId: context.id,
      body: {
        kind: "PHOTO_INTAKE",
        docType: "WORKBOOK",
        subject: "VMATH",
        confidence: 0.92,
        summary: "hai câu cộng",
        items: [
          {
            index: 0,
            questionText: "2 + 3 =",
            studentAnswer: "5",
            outcome: "CORRECT",
            skillCodes: [SKILL],
          },
          {
            index: 1,
            questionText: "4 + 4 =",
            studentAnswer: "8",
            outcome: "CORRECT",
            skillCodes: [SKILL],
          },
        ],
      },
    });
    const afterBatch = await db.skillMastery.findFirstOrThrow({
      where: { studentId, skill: { code: SKILL } },
    });
    expect(afterBatch.mastery).toBeGreaterThan(beforeBatch.mastery);
    expect(afterBatch.evidenceCount).toBe(beforeBatch.evidenceCount + 2);

    await undoChatBatch(db, applied.batchId, { at: now });

    const restored = await db.skillMastery.findFirstOrThrow({
      where: { studentId, skill: { code: SKILL } },
    });
    expect(restored.mastery).toBeCloseTo(beforeBatch.mastery, 6);
    expect(restored.confidence).toBeCloseTo(beforeBatch.confidence, 6);
    expect(restored.evidenceCount).toBe(beforeBatch.evidenceCount);
    expect(restored.status).toBe(beforeBatch.status);
    expect(restored.intervalDays).toBe(beforeBatch.intervalDays);

    // The undo is in the history, so a parent can see the number was put back (docs/04 §3).
    const recalc = await db.masteryHistory.findFirst({
      where: { studentId, skillId: beforeBatch.skillId, cause: "RECALC" },
      orderBy: { at: "desc" },
    });
    expect(recalc?.masteryAfter).toBeCloseTo(beforeBatch.mastery, 6);
  });

  it("a skill whose last evidence is gone goes back to NOT_STARTED", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const studentId = student!.id;
    const skill = await db.skill.findFirstOrThrow({ where: { code: "VIET.HV.AM_B" } });
    await commitEvidence(db, {
      studentId,
      skillId: skill.id,
      source: "PARENT_NOTE",
      outcome: "CORRECT",
      score: 1,
    });
    await db.evidence.deleteMany({ where: { studentId, skillId: skill.id } });
    const result = await recomputeSkillMastery(db, studentId, skill.id);
    expect(result.evidenceCount).toBe(0);
    const row = await db.skillMastery.findFirstOrThrow({
      where: { studentId, skillId: skill.id },
    });
    expect(row.status).toBe("NOT_STARTED");
    expect(row.mastery).toBe(0);
    expect(row.lastEvidenceAt).toBeNull();

    // Falling back to nothing is the biggest move there is; it leaves a line a parent can read.
    const line = await db.masteryHistory.findFirst({
      where: { studentId, skillId: skill.id, cause: "RECALC" },
      orderBy: { at: "desc" },
    });
    expect(line?.masteryAfter).toBe(0);
    expect(line?.masteryBefore).toBeGreaterThan(0);
  });
});
