import { afterAll, beforeAll, describe, expect, it, type TestContext } from "vitest";
import { resetErrorCodeCache } from "../mastery/service";
import {
  createTempStudent,
  databaseReachable,
  disconnectTestDb,
  removeTempStudent,
  type TempStudent,
  testDb,
} from "../test-db";
import { applyChatIntake, ChatIntakeRejected } from "./apply";
import { chatBatchCards } from "./cards";
import { buildChatContext } from "./context";
import type { ChatIntakeInput } from "./types";
import { undoChatBatch } from "./undo";
import { ambiguousBlank } from "./validate";

/**
 * The four things the chat door is judged on (docs/13 §7, pha 8b tiêu chí 2–4):
 *   a valid reading becomes evidence and moves the mastery,
 *   "Hoàn tác lô này" takes it back out and the mastery returns to what it was,
 *   a made-up skill code is refused and says where,
 *   and the three doubtful cases are held instead of applied.
 */

const SKILL = "VMATH.SO.CONG_PV_10";
const OTHER_SKILL = "VIET.HV.AM_B";
const ERROR_CODE = "nham_cong_tru";

describe("chat intake (integration, needs the seeded database)", () => {
  let ready = false;
  let student: TempStudent | null = null;
  const needDb = (ctx: TestContext) => {
    if (!ready) ctx.skip("no seeded database (start Postgres and run pnpm db:seed)");
  };

  beforeAll(async () => {
    ready = await databaseReachable();
    if (ready) ready = (await testDb().skill.count({ where: { code: SKILL } })) > 0;
    if (ready) ready = (await testDb().errorCode.count({ where: { code: ERROR_CODE } })) > 0;
    if (ready) {
      resetErrorCodeCache();
      student = await createTempStudent("chat");
      // buildChatContext only answers for a child who is still learning here.
      await testDb().student.update({ where: { id: student.id }, data: { isActive: true } });
    }
  });
  afterAll(async () => {
    if (student) {
      const db = testDb();
      // The temp student cascades, but the intake jobs it owns are keyed to the ADMIN user.
      await db.chatBatch.deleteMany({ where: { studentId: student.id } });
      await db.intakeJob.deleteMany({ where: { studentId: student.id } });
    }
    await removeTempStudent(student);
    await disconnectTestDb();
  });

  /** A context row, so the skill codes below count as "offered" (docs/13 §7.4). */
  async function context(): Promise<string> {
    const db = testDb();
    const row = await db.chatContext.create({
      data: {
        studentId: student!.id,
        date: new Date(Date.UTC(2026, 8, 12)),
        skillCodes: [SKILL, OTHER_SKILL],
      },
    });
    return row.id;
  }

  function body(over: Partial<ChatIntakeInput> = {}): ChatIntakeInput {
    return {
      kind: "PHOTO_INTAKE",
      docType: "WORKBOOK",
      subject: "VMATH",
      summary: "Phiếu cộng trong phạm vi 10, 3 câu",
      confidence: 0.9,
      items: [
        {
          index: 0,
          questionText: "3 + 4 =",
          studentAnswer: "7",
          outcome: "CORRECT",
          skillCodes: [SKILL],
        },
        {
          index: 1,
          questionText: "8 + 5 =",
          studentAnswer: "12",
          outcome: "INCORRECT",
          errorCode: ERROR_CODE,
          skillCodes: [SKILL],
        },
        {
          index: 2,
          questionText: "6 + 2 =",
          studentAnswer: "8",
          outcome: "CORRECT",
          skillCodes: [SKILL],
        },
      ],
      ...over,
    };
  }

  it("applies a clear reading: Evidence lands, mastery moves, the card shows it", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const applied = await applyChatIntake(db, {
      studentId: student!.id,
      body: body(),
      contextId: await context(),
    });

    expect(applied.status).toBe("APPLIED");
    expect(applied.held).toBe(0);
    expect(applied.evidence).toBe(3);

    const evidences = await db.evidence.findMany({ where: { chatBatchId: applied.batchId } });
    expect(evidences).toHaveLength(3);
    // docs/13 §7.3: the weight of this source is INTAKE_PHOTO's 0.8.
    expect(evidences.every((e) => e.source === "CHAT_INTAKE")).toBe(true);
    expect(evidences.find((e) => e.outcome === "CORRECT")?.weight).toBeCloseTo(0.8, 3);

    const mastery = await db.skillMastery.findFirst({
      where: { studentId: student!.id, skill: { code: SKILL } },
    });
    expect(mastery?.mastery).toBeGreaterThan(0);
    expect(mastery?.evidenceCount).toBe(3);

    const cards = await chatBatchCards(db, { studentIds: [student!.id] });
    const card = cards.find((c) => c.id === applied.batchId);
    expect(card?.canUndo).toBe(true);
    expect(card?.itemCount).toBe(3);
    expect(card?.moved[0]?.after).toBeGreaterThan(0);

    // The error the reader saw is counted for the remediation ladder (docs/04 §11.3).
    const stat = await db.errorStat.findFirst({
      where: { studentId: student!.id, errorCode: ERROR_CODE },
    });
    expect(stat?.count7d).toBeGreaterThanOrEqual(1);
  });

  it("undo removes the batch's evidence and the mastery goes back to what it was", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const before = await db.skillMastery.findFirst({
      where: { studentId: student!.id, skill: { code: OTHER_SKILL } },
    });
    const baseline = before?.mastery ?? 0;

    const applied = await applyChatIntake(db, {
      studentId: student!.id,
      body: body({
        subject: "VIET",
        items: [
          {
            index: 0,
            questionText: "b hay d?",
            studentAnswer: "b",
            outcome: "CORRECT",
            skillCodes: [OTHER_SKILL],
          },
          {
            index: 1,
            questionText: "ba hay da?",
            studentAnswer: "da",
            outcome: "CORRECT",
            skillCodes: [OTHER_SKILL],
          },
        ],
      }),
      contextId: await context(),
    });
    const moved = await db.skillMastery.findFirst({
      where: { studentId: student!.id, skill: { code: OTHER_SKILL } },
    });
    expect(moved?.mastery).toBeGreaterThan(baseline);

    const undone = await undoChatBatch(db, applied.batchId, { at: new Date() });
    expect(undone.evidenceRemoved).toBe(2);
    expect(await db.evidence.count({ where: { chatBatchId: applied.batchId } })).toBe(0);

    const after = await db.skillMastery.findFirst({
      where: { studentId: student!.id, skill: { code: OTHER_SKILL } },
    });
    expect(after?.mastery).toBeCloseTo(baseline, 3);
    expect(after?.evidenceCount).toBe(before?.evidenceCount ?? 0);

    // A second tap changes nothing.
    const again = await undoChatBatch(db, applied.batchId);
    expect(again.alreadyUndone).toBe(true);
    const batch = await db.chatBatch.findUnique({ where: { id: applied.batchId } });
    expect(batch?.status).toBe("UNDONE");
  });

  it("refuses a skill code that is not in the skill map, and says which field", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const before = await db.evidence.count({ where: { studentId: student!.id } });
    const call = applyChatIntake(db, {
      studentId: student!.id,
      body: body({
        items: [
          {
            index: 0,
            questionText: "3 + 4 =",
            studentAnswer: "7",
            outcome: "CORRECT",
            skillCodes: ["VMATH.SO.KHONG_CO_THAT"],
          },
        ],
      }),
      contextId: await context(),
    });
    await expect(call).rejects.toThrow(ChatIntakeRejected);
    await call.catch((err: ChatIntakeRejected) => {
      expect(err.fields[0]?.path).toBe("items[0].skillCodes[0]");
      expect(err.fields[0]?.message).toContain("VMATH.SO.KHONG_CO_THAT");
    });
    expect(await db.evidence.count({ where: { studentId: student!.id } })).toBe(before);
  });

  it("refuses an error code that is not in error-taxonomy.json", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const call = applyChatIntake(db, {
      studentId: student!.id,
      body: body({
        items: [
          {
            index: 0,
            questionText: "8 + 5 =",
            studentAnswer: "12",
            outcome: "INCORRECT",
            errorCode: "loi_tu_bia_ra",
            skillCodes: [SKILL],
          },
        ],
      }),
      contextId: await context(),
    });
    await expect(call).rejects.toThrow(ChatIntakeRejected);
    await call.catch((err: ChatIntakeRejected) => {
      expect(err.fields[0]?.path).toBe("items[0].errorCode");
      expect(err.fields[0]?.message).toContain("error-taxonomy.json");
    });
  });

  it("holds the whole batch when the reader was not sure (confidence < 0.6)", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const applied = await applyChatIntake(db, {
      studentId: student!.id,
      body: body({ confidence: 0.45 }),
      contextId: await context(),
    });
    expect(applied.status).toBe("HELD");
    expect(applied.evidence).toBe(0);
    expect(applied.heldReasons.join(" ")).toContain("chưa chắc");
    // The page is still there in full, on the screen a parent already knows (docs/13 §7.3).
    const job = await db.intakeResult.findUnique({
      where: { id: applied.intakeResultId },
      include: { items: true, job: true },
    });
    expect(job?.items).toHaveLength(3);
    expect(job?.job.status).toBe("PENDING_REVIEW");
    expect(job?.items.every((i) => i.skillCodesFinal.length === 0)).toBe(true);
  });

  it("holds a skill nobody offered, and applies the rest of the page", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const ctxId = await db.chatContext.create({
      data: { studentId: student!.id, date: new Date(Date.UTC(2026, 8, 12)), skillCodes: [SKILL] },
    });
    const applied = await applyChatIntake(db, {
      studentId: student!.id,
      body: body({
        items: [
          {
            index: 0,
            questionText: "3 + 4 =",
            studentAnswer: "7",
            outcome: "CORRECT",
            skillCodes: [SKILL],
          },
          {
            index: 1,
            questionText: "b hay d?",
            studentAnswer: "b",
            outcome: "CORRECT",
            skillCodes: [OTHER_SKILL],
          },
        ],
      }),
      contextId: ctxId.id,
    });
    expect(applied.status).toBe("PARTIAL");
    expect(applied.evidence).toBe(1);
    expect(applied.held).toBe(1);
    expect(applied.heldReasons.join(" ")).toContain(OTHER_SKILL);
    await undoChatBatch(db, applied.batchId);
  });

  it("holds an item where a blank cannot be told from a wrong answer", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const applied = await applyChatIntake(db, {
      studentId: student!.id,
      body: body({
        items: [
          {
            index: 0,
            questionText: "3 + 4 =",
            studentAnswer: "7",
            outcome: "CORRECT",
            skillCodes: [SKILL],
          },
          {
            index: 1,
            questionText: "8 + 5 =",
            studentAnswer: null,
            outcome: "UNGRADED",
            skillCodes: [SKILL],
          },
        ],
      }),
      contextId: await context(),
    });
    expect(applied.held).toBe(1);
    expect(applied.heldReasons.join(" ")).toContain("để trống");
    await undoChatBatch(db, applied.batchId);
  });

  it("honours needsParent, the flag the phone skill sets", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const applied = await applyChatIntake(db, {
      studentId: student!.id,
      body: body({
        items: [
          {
            index: 0,
            questionText: "3 + 4 =",
            studentAnswer: "7",
            outcome: "CORRECT",
            skillCodes: [SKILL],
          },
          {
            index: 1,
            questionText: "8 + 5 =",
            studentAnswer: "13",
            outcome: "CORRECT",
            skillCodes: [SKILL],
            needsParent: true,
          },
        ],
      }),
      contextId: await context(),
    });
    expect(applied.held).toBe(1);
    expect(applied.evidence).toBe(1);
    expect(applied.heldReasons.join(" ")).toContain("ba mẹ xem giúp");
    await undoChatBatch(db, applied.batchId);
  });

  it("holds everything when no context was read first (docs/13 §7.4)", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const applied = await applyChatIntake(db, { studentId: student!.id, body: body() });
    expect(applied.status).toBe("HELD");
    expect(applied.heldReasons.join(" ")).toContain("ngữ cảnh");
  });

  it("buildChatContext offers codes and remembers what it offered", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const built = await buildChatContext(db, {
      student: student!.slug,
      terms: ["cộng trong phạm vi 10"],
      date: new Date(Date.UTC(2026, 8, 12)),
    });
    expect(built).not.toBeNull();
    expect(built?.errorCodes.length).toBeGreaterThan(10);
    expect(built?.skillCandidates.length).toBeGreaterThan(0);
    const stored = await db.chatContext.findUnique({ where: { id: built!.contextId } });
    expect(stored?.skillCodes).toEqual(built?.skillCandidates.map((s) => s.code));
    expect(built?.rules.join(" ")).toContain("BLANK");
  });
});

describe("ambiguousBlank — docs/13 §7.3", () => {
  it("is true when the reader refused to grade, said blank but copied an answer, or wrong with nothing written", () => {
    expect(ambiguousBlank({ index: 0, outcome: "UNGRADED" })).toBe(true);
    expect(ambiguousBlank({ index: 0, outcome: "BLANK", studentAnswer: "7" })).toBe(true);
    expect(ambiguousBlank({ index: 0, outcome: "INCORRECT", studentAnswer: "" })).toBe(true);
  });
  it("is false for an ordinary blank and an ordinary mistake", () => {
    expect(ambiguousBlank({ index: 0, outcome: "BLANK", studentAnswer: null })).toBe(false);
    expect(ambiguousBlank({ index: 0, outcome: "INCORRECT", studentAnswer: "12" })).toBe(false);
    expect(ambiguousBlank({ index: 0, outcome: "CORRECT", studentAnswer: "7" })).toBe(false);
  });
});
