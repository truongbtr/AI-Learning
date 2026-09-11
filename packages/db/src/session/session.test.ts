import { afterAll, beforeAll, describe, expect, it, type TestContext } from "vitest";
import {
  createTempStudent,
  databaseReachable,
  disconnectTestDb,
  removeTempStudent,
  type TempStudent,
  testDb,
} from "../test-db";
import { finishSession, sessionForKid, starBalance, startSession, submitAttempt } from "./grade";
import { planDailyQuest } from "./plan";

/**
 * A whole session, end to end, against the real bank (docs/08 pha 3 việc 4).
 *
 * What these tests are really guarding:
 *  - the child's device never receives an answer key;
 *  - a wrong choice becomes the diagnosis the author wrote on it, so tomorrow's ladder is aimed
 *    at the actual mistake and not at a guess;
 *  - the same answer arriving twice (lost network) changes nothing;
 *  - a session stopped halfway can be carried on.
 */
const PREFIX = "itest-session";
const SKILL = "VMATH.SO.CONG_PV_10";

describe("a day's session (integration, needs the seeded database)", () => {
  let ready = false;
  let student: TempStudent | null = null;
  let exerciseId = "";
  const needDb = (ctx: TestContext) => {
    if (!ready) ctx.skip("no seeded database (start Postgres and run pnpm db:seed)");
  };

  beforeAll(async () => {
    ready = await databaseReachable();
    if (!ready) return;
    const db = testDb();
    const skill = await db.skill.findUnique({ where: { code: SKILL }, select: { id: true } });
    const published = await db.exercise.count({ where: { status: "PUBLISHED" } });
    ready = Boolean(skill) && published > 0;
    if (!ready) return;
    student = await createTempStudent("session");

    // One exercise we control completely, so the assertions are about behaviour, not about
    // whichever question the planner happened to pick.
    const created = await db.exercise.create({
      data: {
        stableId: `${PREFIX}-0001`,
        type: "MCQ",
        subject: "VMATH",
        language: "vi",
        difficulty: 2,
        status: "PUBLISHED",
        spec: {
          type: "MCQ",
          language: "vi",
          subject: "VMATH",
          skillCodes: [SKILL],
          difficulty: 2,
          prompt: { text: "3 cộng 2 bằng mấy?", tts: true },
          choices: [
            { id: "a", text: "4" },
            { id: "b", text: "5" },
            { id: "c", text: "1" },
          ],
          scaffold: "none",
          hints: ["Đếm tiếp từ 3.", "3, rồi 4, rồi 5."],
          explanation: "3 cộng 2 bằng 5.",
          meta: { estSeconds: 25, sourceRef: "SGK Toán 1 tập một tr.41" },
        },
        answerKey: { value: "b", errorTags: { a: "dem_thieu_1", c: "nham_cong_tru" } },
        explanation: "3 cộng 2 bằng 5.",
        contentHash: `${PREFIX}-hash-1`,
        skills: { create: { skillId: skill?.id ?? "" } },
      },
    });
    exerciseId = created.id;
  });

  afterAll(async () => {
    if (ready) {
      await testDb().exercise.deleteMany({ where: { stableId: { startsWith: PREFIX } } });
    }
    await removeTempStudent(student);
    await disconnectTestDb();
  });

  /** A session of one, built by hand, so the assertions do not depend on the planner's choices. */
  async function oneExerciseSession(): Promise<string> {
    const db = testDb();
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    const session = await db.session.create({
      data: {
        studentId: student?.id ?? "",
        kind: "TARGETED",
        date: day,
        status: "PLANNED",
        slots: [
          {
            order: 0,
            kind: "focus",
            skillCode: SKILL,
            subject: "VMATH",
            difficulty: 2,
            reason: "kiểm thử",
            exerciseId,
            stableId: `${PREFIX}-0001`,
          },
        ],
      },
    });
    return session.id;
  }

  it("plans a Daily Quest from the imported bank, and plans it only once a day", async (ctx) => {
    needDb(ctx);
    const first = await planDailyQuest(testDb(), student?.id ?? "");
    expect(first.created).toBe(true);
    expect(first.slots.length).toBeGreaterThanOrEqual(8);
    expect(first.slots.filter((s) => s.exerciseId).length).toBeGreaterThan(0);
    expect(first.plan.log.length).toBeGreaterThan(0);

    const again = await planDailyQuest(testDb(), student?.id ?? "");
    expect(again.created).toBe(false);
    expect(again.sessionId).toBe(first.sessionId);
  });

  it("sends the child the questions and none of the answers", async (ctx) => {
    needDb(ctx);
    const sessionId = await oneExerciseSession();
    await startSession(testDb(), sessionId);
    const kid = await sessionForKid(testDb(), sessionId, { studentId: student?.id });
    expect(kid?.items).toHaveLength(1);
    const payload = JSON.stringify(kid);
    expect(payload).not.toContain("answerKey");
    expect(payload).not.toContain("errorTag");
    expect(payload).not.toContain("dem_thieu_1");
    expect(kid?.vars.ten).toBe(student ? "Test session" : undefined);
    expect(kid?.nextOrder).toBe(0);
  });

  it("turns a wrong choice into the diagnosis the author wrote on it", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const sessionId = await oneExerciseSession();

    const first = await submitAttempt(db, {
      sessionId,
      order: 0,
      response: { choiceId: "a" },
      token: "t1",
    });
    expect(first.correct).toBe(false);
    expect(first.final).toBe(false);
    expect(first.stage).toBe("hint");
    expect(first.hint).toBe("Đếm tiếp từ 3.");
    expect(JSON.stringify(first)).not.toContain("dem_thieu_1"); // never told to the child

    const second = await submitAttempt(db, {
      sessionId,
      order: 0,
      response: { choiceId: "c" },
      token: "t2",
    });
    expect(second.stage).toBe("hint");
    expect(second.hint).toBe("3, rồi 4, rồi 5.");

    const third = await submitAttempt(db, {
      sessionId,
      order: 0,
      response: { choiceId: "a" },
      token: "t3",
    });
    expect(third.final).toBe(true);
    expect(third.stage).toBe("reveal");
    expect(third.reveal?.value).toBe("b");
    expect(third.reveal?.explanation).toBe("3 cộng 2 bằng 5.");
    expect(third.line.toLowerCase()).not.toContain("sai");

    const evidence = await db.evidence.findFirst({
      where: { studentId: student?.id, attempt: { session: { id: sessionId } } },
      orderBy: { createdAt: "desc" },
    });
    expect(evidence?.errorCode).toBe("dem_thieu_1");
    expect(evidence?.source).toBe("EXERCISE");
    expect(evidence?.outcome).toBe("INCORRECT");

    const stat = await db.errorStat.findUnique({
      where: { studentId_errorCode: { studentId: student?.id ?? "", errorCode: "dem_thieu_1" } },
    });
    expect(stat?.count7d).toBeGreaterThanOrEqual(1);
  });

  it("does not grade the same answer twice when the network hiccups", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const sessionId = await oneExerciseSession();
    const before = await starBalance(db, student?.id ?? "");

    const sent = await submitAttempt(db, {
      sessionId,
      order: 0,
      response: { choiceId: "b" },
      token: "same-token",
    });
    expect(sent.correct).toBe(true);
    expect(sent.starsAwarded).toBe(2); // right the first time

    const resent = await submitAttempt(db, {
      sessionId,
      order: 0,
      response: { choiceId: "b" },
      token: "same-token",
    });
    expect(resent.correct).toBe(true);
    expect(resent.starsAwarded).toBe(0);

    const evidences = await db.evidence.count({
      where: { attempt: { session: { id: sessionId } } },
    });
    expect(evidences).toBe(1);
    expect(await starBalance(db, student?.id ?? "")).toBe(before + 2);
  });

  it("remembers where a session stopped, so it can be carried on", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const sessionId = await oneExerciseSession();
    expect((await sessionForKid(db, sessionId))?.nextOrder).toBe(0);
    await submitAttempt(db, { sessionId, order: 0, response: { choiceId: "b" }, token: "x1" });
    const after = await sessionForKid(db, sessionId);
    expect(after?.nextOrder).toBeNull();
    expect(after?.attempts[0]?.done).toBe(true);
  });

  it("closes the session with the day's stars and the streak", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const sessionId = await oneExerciseSession();
    await submitAttempt(db, { sessionId, order: 0, response: { choiceId: "b" }, token: "f1" });

    const summary = await finishSession(db, sessionId, { studentId: student?.id });
    expect(summary.answered).toBe(1);
    expect(summary.correct).toBe(1);
    expect(summary.accuracy).toBe(1);
    expect(summary.starsEarned).toBeGreaterThanOrEqual(5); // 2 for the answer + 3 for finishing
    expect(summary.streak.current).toBeGreaterThanOrEqual(1);
    expect(summary.bySkill[0]?.skillCode).toBe(SKILL);

    const closedAgain = await finishSession(db, sessionId, { studentId: student?.id });
    expect(closedAgain.starsEarned).toBe(summary.starsEarned); // the bonus is not handed out twice

    const row = await db.session.findUnique({ where: { id: sessionId } });
    expect(row?.status).toBe("COMPLETED");
    expect(row?.finishedAt).not.toBeNull();
  });
});
