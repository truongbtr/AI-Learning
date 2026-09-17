import type { Slot } from "@mtct/core";
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
import { hiddenOrders } from "./excluded";
import { choiceAt, sessionForKid } from "./grade";
import { EXCLUDED_TYPES, pickExercises } from "./plan";

/**
 * No session hands out a "write it in your notebook, then a parent photographs it" question
 * (owner, 16/09/2026; ADR-25). The bank keeps them.
 *
 * A skill of our own with exactly two exercises — one to photograph, one to tap — makes the
 * assertion certain: the picker chooses among its first few rows at random, so before the change
 * a dozen picks would have landed on the photo one about half the time.
 */
const PREFIX = "itest-nophoto";
const SKILL = "VMATH.ITEST.NO_PHOTO";

describe("no write-and-photograph questions in a session (integration)", () => {
  let ready = false;
  let tapId = "";
  let photoId = "";
  let student: TempStudent | null = null;
  const needDb = (ctx: TestContext) => {
    if (!ready) ctx.skip("no database (start Postgres and run pnpm db:seed)");
  };

  beforeAll(async () => {
    ready = await databaseReachable();
    if (!ready) return;
    const db = testDb();
    await cleanUp();
    const skill = await db.skill.create({
      data: {
        code: SKILL,
        subject: "VMATH",
        strand: "VMATH.ITEST",
        nameVi: "Kỹ năng thử",
        nameEn: "Test skill",
        exerciseTypes: ["WRITE_PHOTO", "MCQ"],
      },
    });
    const common = {
      subject: "VMATH" as const,
      language: "vi" as const,
      difficulty: 2,
      status: "PUBLISHED" as const,
      skills: { create: { skillId: skill.id } },
    };
    const photo = await db.exercise.create({
      data: {
        ...common,
        stableId: `${PREFIX}-photo`,
        type: "WRITE_PHOTO",
        spec: {
          type: "WRITE_PHOTO",
          language: "vi",
          subject: "VMATH",
          skillCodes: [SKILL],
          difficulty: 2,
          prompt: { text: "Viết số 5 vào vở rồi nhờ ba mẹ chụp.", tts: true },
          scaffold: "none",
          hints: [],
          meta: { estSeconds: 60 },
        },
        answerKey: { value: "5" },
        contentHash: `${PREFIX}-hash-photo`,
      },
    });
    const tap = await db.exercise.create({
      data: {
        ...common,
        stableId: `${PREFIX}-tap`,
        type: "MCQ",
        spec: {
          type: "MCQ",
          language: "vi",
          subject: "VMATH",
          skillCodes: [SKILL],
          difficulty: 2,
          prompt: { text: "Số nào là số năm?", tts: true },
          choices: [
            { id: "a", text: "5" },
            { id: "b", text: "2" },
          ],
          scaffold: "none",
          hints: [],
          meta: { estSeconds: 20 },
        },
        answerKey: { value: "a" },
        contentHash: `${PREFIX}-hash-tap`,
      },
    });
    tapId = tap.id;
    photoId = photo.id;
    student = await createTempStudent("nophoto");
  });

  async function cleanUp() {
    const db = testDb();
    await db.exercise.deleteMany({ where: { stableId: { startsWith: PREFIX } } });
    await db.skill.deleteMany({ where: { code: SKILL } });
  }

  afterAll(async () => {
    await removeTempStudent(student);
    if (ready) await cleanUp();
    await disconnectTestDb();
  });

  const slot = (prefer?: Slot["prefer"]): Slot =>
    ({
      skillCode: SKILL,
      subject: "VMATH",
      kind: "focus",
      difficulty: 2,
      ...(prefer ? { prefer } : {}),
    }) as Slot;

  it("never picks the photo question, even when it is the only other one", async (ctx) => {
    needDb(ctx);
    for (let i = 0; i < 12; i++) {
      const [picked] = await pickExercises(testDb(), [slot()]);
      expect(picked?.exerciseId).toBe(tapId);
    }
  });

  it("never picks it when a step of the ladder asks for that type by name", async (ctx) => {
    needDb(ctx);
    for (let i = 0; i < 6; i++) {
      const [picked] = await pickExercises(testDb(), [slot({ types: ["WRITE_PHOTO"] })]);
      expect(picked?.exerciseId).toBe(tapId);
    }
  });

  /** A session planned before the rule, with the photo question still in it. */
  async function oldSession() {
    const db = testDb();
    const base = { skillCode: SKILL, subject: "VMATH", kind: "focus", difficulty: 2, reason: "t" };
    return db.session.create({
      data: {
        studentId: student?.id ?? "",
        kind: "FREE_PLAY",
        date: vnDayDate(new Date()),
        status: "PLANNED",
        slots: [
          { ...base, order: 1, exerciseId: photoId },
          { ...base, order: 2, exerciseId: tapId },
        ],
      },
    });
  }

  it("never shows the photo question of a session planned before the rule", async (ctx) => {
    needDb(ctx);
    const session = await oldSession();
    const kid = await sessionForKid(testDb(), session.id);
    expect(kid?.items.map((i) => i.exerciseId)).toEqual([tapId]);
    expect(kid?.nextOrder).toBe(2);
    expect([
      ...(await hiddenOrders(testDb(), [
        { order: 1, exerciseId: photoId },
        { order: 2, exerciseId: tapId },
      ])),
    ]).toEqual([1]);
  });

  it("never offers it as the second choice of a choice station, nor as the first", async (ctx) => {
    needDb(ctx);
    const session = await oldSession();
    for (const order of [1, 2]) {
      const { items } = await choiceAt(testDb(), session.id, order);
      expect(items.map((i) => i.type)).not.toContain("WRITE_PHOTO");
    }
  });

  it("keeps the photo questions in the bank", async (ctx) => {
    needDb(ctx);
    expect(EXCLUDED_TYPES).toContain("WRITE_PHOTO");
    const kept = await testDb().exercise.count({
      where: { stableId: `${PREFIX}-photo`, status: "PUBLISHED" },
    });
    expect(kept).toBe(1);
  });
});
