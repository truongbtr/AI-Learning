import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PrismaClient } from "@mtct/db";
import { afterAll, beforeAll, describe, expect, it, type TestContext } from "vitest";
import { pushResults } from "./push";
import { parseInboxContext } from "./schemas";
import { pullPending, validateInbox } from "./service";

/**
 * The whole queue, end to end (docs/13 §2): an app-created item → pull → a result written by hand
 * → validate → push → the parent has something to approve. Skips itself without a database.
 */
describe("inbox pull → validate → push (integration)", () => {
  const db = new PrismaClient({ log: ["error"] });
  let ready = false;
  let root = "";
  let itemId = "";
  let studentId = "";
  let userId = "";
  const needDb = (ctx: TestContext) => {
    if (!ready) ctx.skip("no seeded database (start Postgres and run pnpm db:seed)");
  };

  beforeAll(async () => {
    try {
      await db.$queryRaw`SELECT 1`;
      ready = (await db.errorCode.count()) > 0;
    } catch {
      ready = false;
    }
    if (!ready) return;
    root = mkdtempSync(join(tmpdir(), "mtct-inbox-rt-"));
    const slug = `itest-inbox-${Date.now().toString(36)}`;
    const user = await db.user.create({
      data: { username: slug, displayName: "Test inbox", role: "CHILD", isActive: false },
    });
    userId = user.id;
    const student = await db.student.create({
      data: {
        userId: user.id,
        slug,
        fullName: "Test inbox",
        nickname: "Bé Thử",
        grade: 1,
        isActive: false,
      },
    });
    studentId = student.id;
    const item = await db.inboxItem.create({
      data: {
        kind: "PHOTO_INTAKE",
        studentId,
        payload: { subject: "VIET", text: "Bài 13 U u Ư ư — luyện đọc" },
      },
    });
    itemId = item.id;
  });

  afterAll(async () => {
    if (ready) {
      await db.inboxItem.deleteMany({ where: { id: itemId } });
      await db.student.deleteMany({ where: { id: studentId } });
      await db.user.deleteMany({ where: { id: userId } });
      rmSync(root, { recursive: true, force: true });
    }
    await db.$disconnect();
  });

  it("pull writes a context the reader can work from, and marks the item PULLED", async (ctx) => {
    needDb(ctx);
    const result = await pullPending(db, { root });
    const mine = result.items.find((i) => i.id === itemId);
    expect(mine).toBeTruthy();

    const context = parseInboxContext(
      JSON.parse(readFileSync(join(mine?.path as string, "context.json"), "utf8")),
    );
    // Nickname only — the full name and the birth date must never leave the app (NFR-06).
    expect(context.student?.nickname).toBe("Bé Thử");
    expect(JSON.stringify(context)).not.toContain("Test inbox");
    expect(context.errorCodes.length).toBeGreaterThanOrEqual(35);
    expect(context.expects).toContain("IntakeExtraction");
    // Skill candidates come from the phase-1 full-text search, so no code has to be invented.
    expect(context.skillCandidates.length).toBeGreaterThan(0);
    expect(context.skillCandidates.every((s) => s.code.includes("."))).toBe(true);

    expect((await db.inboxItem.findUnique({ where: { id: itemId } }))?.status).toBe("PULLED");
  });

  it("push loads the result as something the parent must approve, and is idempotent", async (ctx) => {
    needDb(ctx);
    const dir = join(root, new Date().toISOString().slice(0, 10), itemId);
    const context = parseInboxContext(JSON.parse(readFileSync(join(dir, "context.json"), "utf8")));
    const skill = context.skillCandidates[0]?.code as string;
    writeFileSync(
      join(dir, "result.json"),
      JSON.stringify({
        kind: "PHOTO_INTAKE",
        docType: "WORKBOOK",
        subject: "VIET",
        summary: "Trang luyện đọc bài 13",
        confidence: 0.8,
        items: [
          { index: 0, questionText: "Đọc: bà, bé", outcome: "CORRECT", skillCodes: [skill] },
          { index: 1, questionText: "Viết chữ u", outcome: "BLANK" },
        ],
      }),
    );
    writeFileSync(
      join(dir, "plan-hint.json"),
      JSON.stringify({
        studentNickname: "Bé Thử",
        focusSkills: [{ code: skill, weight: 1 }],
        note: "Con đọc tốt, tuần này luyện thêm phần viết.",
      }),
    );

    expect(validateInbox(root).issues.filter((i) => i.level === "error")).toEqual([]);

    const pushed = await pushResults(db, { root });
    expect(pushed.failed).toEqual([]);
    expect(pushed.pushed).toHaveLength(1);
    expect(pushed.planHints).toBe(1);

    const item = await db.inboxItem.findUnique({ where: { id: itemId } });
    expect(item?.status).toBe("DONE");
    expect(item?.resultRef).toMatch(/^IntakeResult:/);

    const resultId = item?.resultRef?.split(":")[1] as string;
    const stored = await db.intakeResult.findUnique({
      where: { id: resultId },
      include: { items: true, job: true },
    });
    expect(stored?.job.status).toBe("PENDING_REVIEW"); // a parent still has to approve
    expect(stored?.items.map((i) => i.outcome).sort()).toEqual(["BLANK", "CORRECT"]);
    // The parent has not confirmed the labels yet.
    expect(stored?.items.every((i) => i.skillCodesFinal.length === 0)).toBe(true);
    // No Evidence yet: the queue never writes a child's learning data by itself (docs/13 §2).
    expect(await db.evidence.count({ where: { studentId } })).toBe(0);

    const hint = await db.planHint.findFirst({ where: { studentId } });
    expect(hint?.createdBy).toBe("CLAUDE_CODE");

    // Running push again must not duplicate anything.
    const again = await pushResults(db, { root });
    expect(again.pushed).toHaveLength(0);
    expect(await db.intakeResult.count({ where: { jobId: stored?.jobId } })).toBe(1);

    await db.planHint.deleteMany({ where: { studentId } });
    await db.intakeJob.deleteMany({ where: { id: stored?.jobId } });
    expect(existsSync(dir)).toBe(true); // folders are kept unless --clean
  });
});
