import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, type TestContext } from "vitest";
import {
  createTempStudent,
  databaseReachable,
  disconnectTestDb,
  removeTempStudent,
  type TempStudent,
  testDb,
} from "../test-db";
import { applyOpsPlan, formatPlan, PLANNER_MIX_SETTING, planOpsRequests } from "./apply";
import { exportOpsState, pruneOldDays } from "./export";
import { docsRoot } from "./paths";
import { parseOpsRequest } from "./requests";

/**
 * The three things docs/14 says must be true, plus the snapshot the whole chat side reads:
 *
 *   - a valid request applies, and leaves a way back;
 *   - a request that reaches for `Evidence` / `Attempt` / `Session` / `SkillMastery` / `User` is
 *     refused **and the database does not move**;
 *   - `setPlannerWeight` pulling review down to 20% is stopped at the 30% floor.
 */

function tempOps(): string {
  const root = mkdtempSync(join(tmpdir(), "mtct-ops-"));
  mkdirSync(join(root, "requests"), { recursive: true });
  return root;
}

function writeRequest(root: string, name: string, body: unknown): void {
  writeFileSync(join(root, "requests", name), `${JSON.stringify(body, null, 2)}\n`, "utf8");
}

describe("ops requests — the whitelist of docs/14 §4", () => {
  let ready = false;
  let student: TempStudent | null = null;
  const roots: string[] = [];
  const needDb = (ctx: TestContext) => {
    if (!ready) ctx.skip("no seeded database (start Postgres and run pnpm db:seed)");
  };

  beforeAll(async () => {
    ready = await databaseReachable();
    if (ready) ready = (await testDb().skill.count()) > 0;
    if (ready) student = await createTempStudent("ops");
  });
  afterAll(async () => {
    await removeTempStudent(student);
    for (const root of roots) rmSync(root, { recursive: true, force: true });
    await disconnectTestDb();
  });

  it("applies a valid planHint and writes a way back", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const root = tempOps();
    roots.push(root);
    const skill = await db.skill.findFirstOrThrow({ select: { code: true } });
    writeRequest(root, "2026-09-12-1-plan-hint.json", {
      schemaVersion: 1,
      createdBy: "claude-chat",
      createdAt: new Date().toISOString(),
      reason: "Bé sai b/d bốn lần trong chín ngày, thang rèn đang đứng ở bậc 2",
      ops: [
        {
          type: "planHint",
          student: student!.slug,
          focusSkills: [skill.code],
          validDays: 3,
          note: "ưu tiên bài đối chiếu",
        },
      ],
    });

    const plan = await planOpsRequests(db, { root });
    expect(plan.files).toHaveLength(1);
    expect(plan.files[0]?.issues).toHaveLength(0);
    const printed = formatPlan(plan);
    expect(printed).toContain("trước:");
    expect(printed).toContain("lùi  :");

    const hintsBefore = await db.planHint.count({ where: { studentId: student!.id } });
    const result = await applyOpsPlan(db, plan);
    expect(result.applied).toBe(1);
    expect(await db.planHint.count({ where: { studentId: student!.id } })).toBe(hintsBefore + 1);

    // The request file left ops/requests and the result carries the rollback.
    expect(readdirSync(join(root, "requests")).filter((f) => f.endsWith(".json"))).toHaveLength(0);
    const applied = JSON.parse(readFileSync(result.results[0]?.movedTo as string, "utf8")) as {
      result: { operations: { rollbackData: Record<string, unknown> }[] };
    };
    expect(applied.result.operations[0]?.rollbackData.deletePlanHintId).toBeTruthy();

    const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf8");
    expect(changelog).toContain("2026-09-12-1-plan-hint.json");
  });

  it("refuses anything that reaches for the child's learning record, and the database does not move", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const root = tempOps();
    roots.push(root);
    writeRequest(root, "2026-09-12-2-delete-evidence.json", {
      schemaVersion: 1,
      createdBy: "claude-chat",
      reason: "Xoá vài bằng chứng đọc sai của hôm qua cho sạch",
      ops: [{ type: "deleteEvidence", student: "thy", table: "Evidence" }],
    });
    writeRequest(root, "2026-09-12-3-touch-user.json", {
      schemaVersion: 1,
      createdBy: "claude-chat",
      reason: "Đổi mật khẩu tài khoản User cho tiện đăng nhập",
      ops: [{ type: "setSkillStatus", skillCode: "VIET.HV.AM_B", isActive: false, note: "User" }],
    });

    const before = {
      evidence: await db.evidence.count(),
      attempts: await db.attempt.count(),
      sessions: await db.session.count(),
      mastery: await db.skillMastery.count(),
      users: await db.user.count(),
      skillActive: (await db.skill.findUnique({ where: { code: "VIET.HV.AM_B" } }))?.isActive,
    };

    const plan = await planOpsRequests(db, { root });
    for (const file of plan.files) expect(file.issues.length).toBeGreaterThan(0);
    expect(formatPlan(plan)).toContain("TỪ CHỐI");

    const result = await applyOpsPlan(db, plan);
    expect(result.applied).toBe(0);
    expect(result.rejected).toBe(2);
    for (const file of result.results) expect(file.movedTo).toContain("rejected");

    expect(await db.evidence.count()).toBe(before.evidence);
    expect(await db.attempt.count()).toBe(before.attempts);
    expect(await db.session.count()).toBe(before.sessions);
    expect(await db.skillMastery.count()).toBe(before.mastery);
    expect(await db.user.count()).toBe(before.users);
    // The second file only *mentioned* User in a note, and was refused with it.
    expect((await db.skill.findUnique({ where: { code: "VIET.HV.AM_B" } }))?.isActive).toBe(
      before.skillActive,
    );

    const rejected = readdirSync(join(root, "rejected")).filter((f) => f.endsWith(".json"));
    expect(rejected.length).toBeGreaterThanOrEqual(2);
  });

  it("stops setPlannerWeight at the 30% review floor", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const root = tempOps();
    roots.push(root);
    const before = await db.setting.findUnique({ where: { key: PLANNER_MIX_SETTING } });

    writeRequest(root, "2026-09-12-4-planner-weight.json", {
      schemaVersion: 1,
      createdBy: "claude-chat",
      reason: "Muốn dồn thời gian cho trọng tâm, kéo phần ôn xuống 20%",
      ops: [{ type: "setPlannerWeight", focus: 0.7, review: 0.2 }],
    });

    const plan = await planOpsRequests(db, { root });
    const issues = plan.files[0]?.issues ?? [];
    expect(issues.some((i) => i.message.includes("30%"))).toBe(true);

    const result = await applyOpsPlan(db, plan);
    expect(result.applied).toBe(0);
    const after = await db.setting.findUnique({ where: { key: PLANNER_MIX_SETTING } });
    expect(after?.value ?? null).toEqual(before?.value ?? null);
  });

  it("accepts a weight change that keeps review at or above the floor", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const root = tempOps();
    roots.push(root);
    const before = await db.setting.findUnique({ where: { key: PLANNER_MIX_SETTING } });
    writeRequest(root, "2026-09-12-5-planner-weight-ok.json", {
      schemaVersion: 1,
      createdBy: "claude-chat",
      reason: "Tuần này ưu tiên trọng tâm một chút, vẫn giữ nhịp ôn đúng 30%",
      ops: [{ type: "setPlannerWeight", focus: 0.6, review: 0.3 }],
    });
    const plan = await planOpsRequests(db, { root });
    expect(plan.files[0]?.issues).toHaveLength(0);
    const result = await applyOpsPlan(db, plan);
    expect(result.applied).toBe(1);
    const after = await db.setting.findUnique({ where: { key: PLANNER_MIX_SETTING } });
    expect(after?.value).toEqual({ focus: 0.6, review: 0.3 });
    // Put it back the way it was, so the next planner run is unaffected by a test.
    if (before)
      await db.setting.update({
        where: { key: PLANNER_MIX_SETTING },
        data: { value: before.value as object },
      });
    else await db.setting.delete({ where: { key: PLANNER_MIX_SETTING } });
  });

  it("refuses a request with no reason, and one asking for an unknown operation", () => {
    const noReason = parseOpsRequest({ schemaVersion: 1, ops: [{ type: "planHint" }] });
    expect(noReason.issues.some((i) => i.path === "reason")).toBe(true);
    const unknown = parseOpsRequest({
      schemaVersion: 1,
      reason: "Thử một thao tác không có trong danh sách",
      ops: [{ type: "dropDatabase" }],
    });
    expect(unknown.issues.some((i) => i.message.includes("không nằm trong danh sách"))).toBe(true);
    expect(unknown.ops).toHaveLength(0);
  });
});

describe("ops:export — the snapshot Claude chat reads (docs/14 §3)", () => {
  let ready = false;
  const roots: string[] = [];
  const needDb = (ctx: TestContext) => {
    if (!ready) ctx.skip("no seeded database (start Postgres and run pnpm db:seed)");
  };

  beforeAll(async () => {
    ready = await databaseReachable();
  });
  afterAll(async () => {
    for (const root of roots) rmSync(root, { recursive: true, force: true });
    await disconnectTestDb();
  });

  it("without docs/ it keeps QUYET-DINH.md and the phase label, and warns in SUMMARY.md", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const root = tempOps();
    roots.push(root);
    mkdirSync(join(root, "context"), { recursive: true });
    const decisions = "# Quyết định đã chốt\n\n- **ADR-10** — bản cũ còn đúng\n";
    writeFileSync(join(root, "context", "QUYET-DINH.md"), decisions, "utf8");
    writeFileSync(
      join(root, "context", "HIEN-TRANG.md"),
      "# Hiện trạng\n\n- Pha gần nhất ghi trong `docs/TIEN-DO.md`: **Pha 10 — thành phố**\n",
      "utf8",
    );

    const result = await exportOpsState(db, {
      root,
      now: new Date(),
      docsRoot: null,
      skipLatest: true,
    });

    expect(readFileSync(join(root, "context", "QUYET-DINH.md"), "utf8")).toBe(decisions);
    const state = readFileSync(join(root, "context", "HIEN-TRANG.md"), "utf8");
    expect(state).toContain("**Pha 10 — thành phố**");
    expect(state).not.toContain("không đọc được");
    const summary = readFileSync(join(root, "state", "SUMMARY.md"), "utf8");
    expect(summary).toContain("Cảnh báo khi xuất");
    expect(summary).toContain("QUYET-DINH.md");
    expect(result.warnings.some((w) => w.includes("docs/"))).toBe(true);
  });

  it("keeps QUYET-DINH.md when docs/ is there but empty — a folder is not the documents", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const root = tempOps();
    roots.push(root);
    mkdirSync(join(root, "context"), { recursive: true });
    const decisions = "# Quyết định đã chốt\n\n- **ADR-10** — bản cũ còn đúng\n";
    writeFileSync(join(root, "context", "QUYET-DINH.md"), decisions, "utf8");
    // what the worker of 16/09 saw: a mounted path with nothing readable in it
    const emptyDocs = mkdtempSync(join(tmpdir(), "mtct-docs-empty-"));
    roots.push(emptyDocs);

    const result = await exportOpsState(db, {
      root,
      now: new Date(),
      docsRoot: emptyDocs,
      skipLatest: true,
    });

    expect(readFileSync(join(root, "context", "QUYET-DINH.md"), "utf8")).toBe(decisions);
    const summary = readFileSync(join(root, "state", "SUMMARY.md"), "utf8");
    expect(summary).toContain("Cảnh báo khi xuất");
    expect(result.warnings.some((w) => w.includes("QUYET-DINH.md"))).toBe(true);
  });

  it("writes every file docs/14 §3 lists, with no full name and no birth date in any of them", async (ctx) => {
    needDb(ctx);
    const db = testDb();
    const root = tempOps();
    roots.push(root);
    const now = new Date();

    const result = await exportOpsState(db, { root, now });
    const names = result.files.map((f) => f.name).sort();
    expect(names).toEqual(
      [
        "SUMMARY.md",
        "attempts.csv",
        "content-coverage.csv",
        "diary.csv",
        "error-stats.csv",
        "evidence.csv",
        "exercise-health.csv",
        "lexemes.csv",
        "mastery-history.csv",
        "mastery.csv",
        "meta.json",
        "remediation.csv",
        "sessions.csv",
        "students.csv",
      ].sort(),
    );
    expect(result.totalBytes).toBeLessThan(5 * 1024 * 1024);

    // NFR-06: nothing in the snapshot may identify a child beyond the home name.
    const realNames = await db.student.findMany({ select: { fullName: true, birthDate: true } });
    for (const file of result.files) {
      const text = readFileSync(join(result.dir, file.name), "utf8");
      for (const s of realNames) {
        expect(text).not.toContain(s.fullName);
        if (s.birthDate) expect(text).not.toContain(s.birthDate.toISOString().slice(0, 10));
      }
    }

    // The files a person and a fresh chat session open first.
    const summary = readFileSync(join(root, "state", "SUMMARY.md"), "utf8");
    expect(summary).toContain("# Tuần này thế nào");
    expect(summary).toContain("## Nội dung");
    const state = readFileSync(join(root, "context", "HIEN-TRANG.md"), "utf8");
    expect(state).toContain("Hiện trạng");
    expect(state).toContain("ops/state/SUMMARY.md");
    const decisions = readFileSync(join(root, "context", "QUYET-DINH.md"), "utf8");
    expect(decisions).toContain("ADR-10");
    // The two reversals a fresh session must not re-propose (docs/14 §5).
    expect(decisions).toContain("ADR-18");

    // `latest/` is a full copy, so `ops/state/latest/mastery.csv` always works.
    expect(readdirSync(join(root, "state", "latest")).length).toBe(result.files.length);

    const meta = JSON.parse(readFileSync(join(result.dir, "meta.json"), "utf8")) as {
      schemaVersion: number;
      files: { name: string }[];
    };
    expect(meta.schemaVersion).toBe(2); // 2 since pha 12: lexemes.csv
  });

  it("keeps 90 days and drops what is older", () => {
    const root = tempOps();
    roots.push(root);
    const state = join(root, "state");
    const day = (offsetDays: number) =>
      new Date(Date.now() - offsetDays * 86_400_000).toISOString().slice(0, 10);
    for (const d of [day(0), day(30), day(91), day(200)])
      mkdirSync(join(state, d), { recursive: true });
    mkdirSync(join(state, "latest"), { recursive: true });

    const pruned = pruneOldDays(state, new Date());
    expect(pruned.sort()).toEqual([day(200), day(91)].sort());
    expect(readdirSync(state).sort()).toEqual([day(0), day(30), "latest"].sort());
  });
});

describe("docsRoot — the documents are found whatever the current directory", () => {
  it("finds the repository docs from another working directory", () => {
    const cwd = process.cwd();
    const away = mkdtempSync(join(tmpdir(), "mtct-cwd-"));
    try {
      process.chdir(away);
      const found = docsRoot();
      expect(found).not.toBeNull();
      expect(readFileSync(join(found as string, "02-KIEN-TRUC.md"), "utf8")).toContain("ADR-10");
    } finally {
      process.chdir(cwd);
      rmSync(away, { recursive: true, force: true });
    }
  });

  it("prefers DOCS_ROOT when it holds the architecture document", () => {
    const dir = mkdtempSync(join(tmpdir(), "mtct-docs-"));
    writeFileSync(join(dir, "02-KIEN-TRUC.md"), "| ADR-1 | x | y | z |\n", "utf8");
    const before = process.env.DOCS_ROOT;
    process.env.DOCS_ROOT = dir;
    try {
      expect(docsRoot()).toBe(dir);
    } finally {
      if (before === undefined) delete process.env.DOCS_ROOT;
      else process.env.DOCS_ROOT = before;
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
