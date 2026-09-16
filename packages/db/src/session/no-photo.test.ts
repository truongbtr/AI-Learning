import type { Slot } from "@mtct/core";
import { afterAll, beforeAll, describe, expect, it, type TestContext } from "vitest";
import { databaseReachable, disconnectTestDb, testDb } from "../test-db";
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
    await db.exercise.create({
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
  });

  async function cleanUp() {
    const db = testDb();
    await db.exercise.deleteMany({ where: { stableId: { startsWith: PREFIX } } });
    await db.skill.deleteMany({ where: { code: SKILL } });
  }

  afterAll(async () => {
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

  it("keeps the photo questions in the bank", async (ctx) => {
    needDb(ctx);
    expect(EXCLUDED_TYPES).toContain("WRITE_PHOTO");
    const kept = await testDb().exercise.count({
      where: { stableId: `${PREFIX}-photo`, status: "PUBLISHED" },
    });
    expect(kept).toBe(1);
  });
});
