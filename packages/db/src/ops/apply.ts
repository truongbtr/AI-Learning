import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { dayKey, MAX_SLOTS, MIN_SLOTS, MINUTES_PER_EXERCISE } from "@mtct/core";
import type { PrismaClient } from "../../generated/client";
import { opsRoot } from "./paths";
import {
  describeOperation,
  FORBIDDEN_TARGETS,
  type OpsIssue,
  type OpsOperation,
  type ParsedOpsRequest,
  parseOpsRequest,
} from "./requests";

/**
 * `pnpm ops:apply` — the only way into the database from `ops/requests/` (docs/14 §2, §4).
 *
 * Three guarantees, in this order, because they are what the whole arrangement was bought with:
 *
 *   1. **Every change is visible before it is applied.** The plan is read, resolved against the
 *      database, and printed as before → after. Nothing is written during that pass.
 *   2. **Every change has a way back**, written into `ops/applied/<day>/<file>.json` as a concrete
 *      instruction, not a promise.
 *   3. **A person presses the button.** The CLI waits unless `--yes` was given, which is for the
 *      nightly case that does not exist yet — docs/14 §6 has the owner nodding before it runs.
 *
 * And the rule that needs no enforcement because there is no code for it: nothing here writes
 * `Evidence`, `Attempt`, `Session`, `SkillMastery` or `User`.
 */

type Db = PrismaClient;

/** docs/14 §4 `setPlannerWeight` lands here, and the planner reads it (see `plannerSnapshot`). */
export const PLANNER_MIX_SETTING = "planner.mix";

export interface OpsChange {
  op: OpsOperation;
  /** One line a person reads. */
  describe: string;
  before: string;
  after: string;
  /** How to undo it, in words the owner can act on. */
  rollback: string;
  /** Set when the operation cannot be applied at all. */
  blocked?: string;
  /** A note worth reading but not a refusal (a clamp, a duplicate). */
  warning?: string;
}

export interface PlannedFile {
  file: string;
  request: ParsedOpsRequest;
  changes: OpsChange[];
  /** Shape problems and forbidden targets: the file is rejected whole. */
  issues: OpsIssue[];
}

export interface OpsPlan {
  root: string;
  files: PlannedFile[];
}

export interface OpsApplyOptions {
  root?: string;
  at?: Date;
  /** Only this file (a name inside `ops/requests/`). */
  only?: string;
}

/** Reads `ops/requests/*.json` and resolves every operation against the database. Writes nothing. */
export async function planOpsRequests(db: Db, opts: OpsApplyOptions = {}): Promise<OpsPlan> {
  const root = opts.root ?? opsRoot();
  const dir = join(root, "requests");
  mkdirSync(dir, { recursive: true });
  const names = readdirSync(dir)
    .filter((n) => n.endsWith(".json"))
    .filter((n) => !opts.only || n === opts.only)
    .sort();

  const files: PlannedFile[] = [];
  for (const name of names) {
    const path = join(dir, name);
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(path, "utf8"));
    } catch (err) {
      files.push({
        file: name,
        request: {
          schemaVersion: 0,
          createdBy: "",
          createdAt: "",
          reason: "",
          ops: [],
          issues: [],
        },
        changes: [],
        issues: [{ path: "file", message: `không đọc được JSON: ${(err as Error).message}` }],
      });
      continue;
    }
    const request = parseOpsRequest(raw);
    const issues = [...request.issues, ...forbiddenTargetIssues(raw)];
    const changes: OpsChange[] = [];
    if (issues.length === 0)
      for (const op of request.ops) changes.push(await previewOperation(db, op));
    files.push({ file: name, request, changes, issues });
  }
  return { root, files };
}

/**
 * A request that names one of the untouchable tables anywhere in it is refused before anything else
 * is considered — even if the operation itself looks harmless.
 *
 * This is belt and braces: there is no operation that could write those tables. But a request that
 * *tries* is a signal worth stopping on, because whoever wrote it believed it was possible, and the
 * rejection file is where they find out it is not.
 */
export function forbiddenTargetIssues(raw: unknown): OpsIssue[] {
  const text = JSON.stringify(raw ?? {});
  const hits = FORBIDDEN_TARGETS.filter((target) =>
    new RegExp(`["':\\s.]${escapeRegExp(target)}\\b`, "i").test(text),
  );
  if (hits.length === 0) return [];
  return [
    {
      path: "file",
      message: `yêu cầu có nhắc tới ${hits.join(", ")} — dữ liệu học của con và tài khoản là bất khả xâm phạm (docs/14 §4). Muốn sửa nhãn thì ba mẹ dùng PARENT_OVERRIDE trên web, có ghi vết.`,
    },
  ];
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// preview
// ─────────────────────────────────────────────────────────────────────────────────────────────────

async function previewOperation(db: Db, op: OpsOperation): Promise<OpsChange> {
  const describe = describeOperation(op);
  const base = { op, describe };
  switch (op.type) {
    case "planHint": {
      const student = await findStudent(db, String(op.student));
      if (!student)
        return { ...base, before: "—", after: "—", rollback: "—", blocked: noStudent(op) };
      const existing = await db.planHint.findFirst({
        where: { studentId: student.id, validTo: { gte: new Date() } },
        orderBy: { createdAt: "desc" },
      });
      return {
        ...base,
        before: existing
          ? `đang có gợi ý đến ${existing.validTo.toISOString().slice(0, 10)}: ${existing.note}`
          : "chưa có gợi ý nào còn hiệu lực",
        after: `gợi ý mới, hiệu lực ${op.validDays ?? 3} ngày`,
        rollback: "xoá PlanHint vừa tạo (id ghi trong ops/applied) — planner trở về chế độ B",
      };
    }
    case "retireExercise":
    case "reviveExercise": {
      const exercise = await db.exercise.findUnique({
        where: { stableId: String(op.stableId) },
        select: { id: true, status: true, usageCount: true },
      });
      if (!exercise)
        return {
          ...base,
          before: "—",
          after: "—",
          rollback: "—",
          blocked: `không có bài nào stableId = ${op.stableId}`,
        };
      const next = op.type === "retireExercise" ? "RETIRED" : "PUBLISHED";
      return {
        ...base,
        before: `status = ${exercise.status} (đã dùng ${exercise.usageCount} lượt)`,
        after: `status = ${next}`,
        rollback: `đặt lại status = ${exercise.status}`,
        warning: exercise.status === next ? "đã ở trạng thái đó rồi, không đổi gì" : undefined,
      };
    }
    case "flagExercise": {
      const exercise = await db.exercise.findUnique({
        where: { stableId: String(op.stableId) },
        select: { qualityFlag: true },
      });
      if (!exercise)
        return {
          ...base,
          before: "—",
          after: "—",
          rollback: "—",
          blocked: `không có bài nào stableId = ${op.stableId}`,
        };
      return {
        ...base,
        before: `qualityFlag = ${exercise.qualityFlag}`,
        after: `qualityFlag = ${op.flag}`,
        rollback: `đặt lại qualityFlag = ${exercise.qualityFlag}`,
      };
    }
    case "setSkillStatus": {
      const skill = await db.skill.findUnique({
        where: { code: String(op.skillCode) },
        select: { isActive: true, _count: { select: { masteries: true } } },
      });
      if (!skill)
        return {
          ...base,
          before: "—",
          after: "—",
          rollback: "—",
          blocked: `không có kỹ năng nào mã ${op.skillCode}`,
        };
      return {
        ...base,
        before: `isActive = ${skill.isActive}`,
        after: `isActive = ${op.isActive}`,
        rollback: `đặt lại isActive = ${skill.isActive}`,
        warning:
          op.isActive === false && skill._count.masteries > 0
            ? `${skill._count.masteries} bản ghi năng lực của con vẫn giữ nguyên, chỉ ẩn khỏi bản đồ`
            : undefined,
      };
    }
    case "setSessionLength": {
      const student = await findStudent(db, String(op.student));
      if (!student)
        return { ...base, before: "—", after: "—", rollback: "—", blocked: noStudent(op) };
      const settings = (student.settings ?? {}) as {
        dailyMinutes?: number;
        sessionExercises?: number;
      };
      const wanted = Number(op.exercises);
      const effective = Math.max(MIN_SLOTS, Math.min(MAX_SLOTS, wanted));
      return {
        ...base,
        before: `${settings.sessionExercises ?? "theo thời lượng"} bài · ${settings.dailyMinutes ?? 15} phút/ngày`,
        after: `${effective} bài · ${Math.round(effective * MINUTES_PER_EXERCISE)} phút/ngày`,
        rollback: `đặt lại settings.sessionExercises = ${settings.sessionExercises ?? "(bỏ)"} và dailyMinutes = ${settings.dailyMinutes ?? 15}`,
        warning:
          effective !== wanted
            ? `planner giữ trong khoảng ${MIN_SLOTS}–${MAX_SLOTS} bài (docs/04 §4), nên ${wanted} thành ${effective}`
            : undefined,
      };
    }
    case "setPlannerWeight": {
      const current = await db.setting.findUnique({ where: { key: PLANNER_MIX_SETTING } });
      const value = (current?.value ?? {}) as { focus?: number; review?: number };
      return {
        ...base,
        before: `trọng tâm ${pct(value.focus ?? 0.5)} · ôn ${pct(value.review ?? 0.3)}${current ? "" : " (mặc định docs/04 §4)"}`,
        after: `trọng tâm ${pct(Number(op.focus ?? value.focus ?? 0.5))} · ôn ${pct(Number(op.review ?? value.review ?? 0.3))}`,
        rollback: current
          ? `đặt lại Setting["${PLANNER_MIX_SETTING}"] = ${JSON.stringify(value)}`
          : `xoá Setting["${PLANNER_MIX_SETTING}"] để trở về 50/30 của docs/04 §4`,
      };
    }
    case "remapSkill": {
      const exercise = await db.exercise.findUnique({
        where: { stableId: String(op.stableId) },
        select: { id: true, skills: { select: { skill: { select: { code: true } } } } },
      });
      if (!exercise)
        return {
          ...base,
          before: "—",
          after: "—",
          rollback: "—",
          blocked: `không có bài nào stableId = ${op.stableId}`,
        };
      const to = op.toSkillCodes as string[];
      const found = await db.skill.findMany({
        where: { code: { in: to } },
        select: { code: true },
      });
      const missing = to.filter((code) => !found.some((f) => f.code === code));
      const had = exercise.skills.map((s) => s.skill.code);
      return {
        ...base,
        before: `kỹ năng: ${had.join(", ") || "chưa gắn gì"}`,
        after: `kỹ năng: ${to.join(", ")}`,
        rollback: `gắn lại ${had.join(", ") || "(rỗng)"}`,
        blocked: missing.length > 0 ? `không có kỹ năng nào mã ${missing.join(", ")}` : undefined,
      };
    }
    case "noteForParent": {
      const student = op.student ? await findStudent(db, String(op.student)) : null;
      if (op.student && !student)
        return { ...base, before: "—", after: "—", rollback: "—", blocked: noStudent(op) };
      return {
        ...base,
        before: "chưa có thẻ này",
        after: `thẻ ${op.tone ?? "info"}${student ? ` cho ${student.slug}` : " cho cả hai bé"}`,
        rollback: "đặt dismissedAt cho ParentNotice vừa tạo (id ghi trong ops/applied)",
      };
    }
    default:
      return {
        ...base,
        before: "—",
        after: "—",
        rollback: "—",
        blocked: "thao tác không được phép",
      };
  }
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function noStudent(op: OpsOperation): string {
  return `không có bé nào tên gọi "${String(op.student)}" (dùng thy hoặc thanh)`;
}

async function findStudent(db: Db, key: string) {
  const value = key.trim().toLowerCase();
  return db.student.findFirst({
    where: { OR: [{ slug: value }, { nickname: { equals: value, mode: "insensitive" } }] },
    select: { id: true, slug: true, settings: true },
  });
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// apply
// ─────────────────────────────────────────────────────────────────────────────────────────────────

export interface AppliedOperation {
  describe: string;
  before: string;
  after: string;
  rollback: string;
  /** What the rollback needs: the row that was created, or the value that was overwritten. */
  rollbackData: Record<string, unknown>;
  rows: number;
}

export interface ApplyFileResult {
  file: string;
  outcome: "applied" | "rejected";
  applied: AppliedOperation[];
  issues: OpsIssue[];
  /** Where the file ended up. */
  movedTo: string;
}

export interface ApplyOpsResult {
  results: ApplyFileResult[];
  applied: number;
  rejected: number;
}

/**
 * Applies a plan the caller has already shown to a person, moves each request file to
 * `ops/applied/<day>/` or `ops/rejected/`, and writes one line into `ops/CHANGELOG.md`.
 */
export async function applyOpsPlan(
  db: Db,
  plan: OpsPlan,
  opts: { at?: Date } = {},
): Promise<ApplyOpsResult> {
  const at = opts.at ?? new Date();
  const day = dayKey(at);
  const out: ApplyOpsResult = { results: [], applied: 0, rejected: 0 };

  for (const file of plan.files) {
    const blocked = file.changes.filter((c) => c.blocked);
    const issues = [
      ...file.issues,
      ...blocked.map((c) => ({ path: c.describe, message: c.blocked as string })),
    ];
    if (issues.length > 0 || file.changes.length === 0) {
      const movedTo = moveRequest(plan.root, file.file, join(plan.root, "rejected"), {
        rejectedAt: at.toISOString(),
        issues,
        reason: file.request.reason,
      });
      out.results.push({ file: file.file, outcome: "rejected", applied: [], issues, movedTo });
      out.rejected++;
      appendChangelog(
        plan.root,
        `${day} · TỪ CHỐI \`${file.file}\` — ${issues[0]?.message ?? "không có thao tác nào hợp lệ"}`,
      );
      continue;
    }

    const applied: AppliedOperation[] = [];
    for (const change of file.changes) {
      const result = await runOperation(db, change.op, at);
      applied.push({
        describe: change.describe,
        before: change.before,
        after: change.after,
        rollback: change.rollback,
        rollbackData: result.rollbackData,
        rows: result.rows,
      });
    }
    const movedTo = moveRequest(plan.root, file.file, join(plan.root, "applied", day), {
      appliedAt: at.toISOString(),
      createdBy: file.request.createdBy,
      reason: file.request.reason,
      operations: applied,
    });
    out.results.push({ file: file.file, outcome: "applied", applied, issues: [], movedTo });
    out.applied++;
    appendChangelog(
      plan.root,
      `${day} · áp \`${file.file}\` (${file.request.createdBy}) — ${applied
        .map((a) => a.describe)
        .join("; ")} · lùi được: xem \`ops/applied/${day}/${file.file}\``,
    );
  }
  return out;
}

async function runOperation(
  db: Db,
  op: OpsOperation,
  at: Date,
): Promise<{ rows: number; rollbackData: Record<string, unknown> }> {
  switch (op.type) {
    case "planHint": {
      const student = await findStudent(db, String(op.student));
      if (!student) throw new Error(noStudent(op));
      const days = Number(op.validDays ?? 3);
      const from = op.date ? new Date(`${String(op.date)}T00:00:00+07:00`) : at;
      const hint = await db.planHint.create({
        data: {
          studentId: student.id,
          validFrom: from,
          validTo: new Date(from.getTime() + days * 86_400_000),
          focusSkills: ((op.focusSkills as string[] | undefined) ?? []).map((code) => ({
            code,
            weight: 1,
          })),
          focusErrors: (op.focusErrors as string[] | undefined) ?? [],
          avoidSkills: (op.avoidSkills as string[] | undefined) ?? [],
          note: String(op.note ?? "Đặt từ ops/requests"),
          createdBy: "CLAUDE_CODE",
        },
      });
      return { rows: 1, rollbackData: { deletePlanHintId: hint.id } };
    }
    case "retireExercise":
    case "reviveExercise": {
      const stableId = String(op.stableId);
      const before = await db.exercise.findUnique({
        where: { stableId },
        select: { status: true },
      });
      if (!before) throw new Error(`không có bài nào stableId = ${stableId}`);
      const status = op.type === "retireExercise" ? "RETIRED" : "PUBLISHED";
      await db.exercise.update({ where: { stableId }, data: { status } });
      return { rows: 1, rollbackData: { stableId, previousStatus: before.status } };
    }
    case "flagExercise": {
      const stableId = String(op.stableId);
      const before = await db.exercise.findUnique({
        where: { stableId },
        select: { qualityFlag: true },
      });
      if (!before) throw new Error(`không có bài nào stableId = ${stableId}`);
      await db.exercise.update({
        where: { stableId },
        data: { qualityFlag: op.flag as "BAD" },
      });
      return { rows: 1, rollbackData: { stableId, previousFlag: before.qualityFlag } };
    }
    case "setSkillStatus": {
      const code = String(op.skillCode);
      const before = await db.skill.findUnique({ where: { code }, select: { isActive: true } });
      if (!before) throw new Error(`không có kỹ năng nào mã ${code}`);
      await db.skill.update({ where: { code }, data: { isActive: Boolean(op.isActive) } });
      return { rows: 1, rollbackData: { skillCode: code, previousIsActive: before.isActive } };
    }
    case "setSessionLength": {
      const student = await findStudent(db, String(op.student));
      if (!student) throw new Error(noStudent(op));
      const settings = (student.settings ?? {}) as Record<string, unknown>;
      const wanted = Math.max(MIN_SLOTS, Math.min(MAX_SLOTS, Number(op.exercises)));
      await db.student.update({
        where: { id: student.id },
        data: {
          settings: {
            ...settings,
            sessionExercises: wanted,
            dailyMinutes: Math.round(wanted * MINUTES_PER_EXERCISE),
          },
        },
      });
      return {
        rows: 1,
        rollbackData: {
          student: student.slug,
          previousSettings: {
            sessionExercises: settings.sessionExercises ?? null,
            dailyMinutes: settings.dailyMinutes ?? null,
          },
        },
      };
    }
    case "setPlannerWeight": {
      const current = await db.setting.findUnique({ where: { key: PLANNER_MIX_SETTING } });
      const value = (current?.value ?? {}) as { focus?: number; review?: number };
      const next = {
        focus: Number(op.focus ?? value.focus ?? 0.5),
        review: Number(op.review ?? value.review ?? 0.3),
      };
      await db.setting.upsert({
        where: { key: PLANNER_MIX_SETTING },
        create: { key: PLANNER_MIX_SETTING, value: next },
        update: { value: next },
      });
      return {
        rows: 1,
        rollbackData: current
          ? { setting: PLANNER_MIX_SETTING, previousValue: value }
          : { setting: PLANNER_MIX_SETTING, deleteSetting: true },
      };
    }
    case "remapSkill": {
      const stableId = String(op.stableId);
      const exercise = await db.exercise.findUnique({
        where: { stableId },
        select: {
          id: true,
          skills: { select: { skillId: true, weight: true, skill: { select: { code: true } } } },
        },
      });
      if (!exercise) throw new Error(`không có bài nào stableId = ${stableId}`);
      const to = op.toSkillCodes as string[];
      const skills = await db.skill.findMany({
        where: { code: { in: to } },
        select: { id: true, code: true },
      });
      if (skills.length !== to.length) throw new Error(`không tìm đủ kỹ năng: ${to.join(", ")}`);
      const previous = exercise.skills.map((s) => ({ code: s.skill.code, weight: s.weight }));
      await db.exerciseSkill.deleteMany({ where: { exerciseId: exercise.id } });
      await db.exerciseSkill.createMany({
        data: skills.map((s) => ({ exerciseId: exercise.id, skillId: s.id, weight: 1 })),
      });
      return { rows: skills.length, rollbackData: { stableId, previousSkills: previous } };
    }
    case "noteForParent": {
      const student = op.student ? await findStudent(db, String(op.student)) : null;
      const notice = await db.parentNotice.create({
        data: {
          studentId: student?.id ?? null,
          title: String(op.title),
          body: String(op.body ?? ""),
          tone: op.tone === "warn" ? "warn" : "info",
          createdBy: "ops",
        },
      });
      return { rows: 1, rollbackData: { dismissParentNoticeId: notice.id } };
    }
    default:
      throw new Error(`thao tác không được phép: ${String(op.type)}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// files
// ─────────────────────────────────────────────────────────────────────────────────────────────────

function moveRequest(
  root: string,
  name: string,
  targetDir: string,
  result: Record<string, unknown>,
): string {
  mkdirSync(targetDir, { recursive: true });
  const from = join(root, "requests", name);
  const to = join(targetDir, name);
  const original = existsSync(from) ? readFileSync(from, "utf8") : "{}";
  let parsed: unknown = {};
  try {
    parsed = JSON.parse(original);
  } catch {
    parsed = { unreadable: original.slice(0, 2000) };
  }
  writeFileSync(to, `${JSON.stringify({ request: parsed, result }, null, 2)}\n`, "utf8");
  if (existsSync(from)) {
    try {
      renameSync(from, `${to}.orig`);
    } catch {
      // Same content is already in `to`; a failed move must not lose the result file.
    }
  }
  return to;
}

export function appendChangelog(root: string, line: string): void {
  mkdirSync(root, { recursive: true });
  const path = join(root, "CHANGELOG.md");
  const header = [
    "# Nhật ký thay đổi vận hành",
    "",
    "> Một dòng mỗi lần `pnpm ops:apply` chạy (docs/14 §4). Mới nhất ở dưới.",
    "",
  ].join("\n");
  const existing = existsSync(path) ? readFileSync(path, "utf8") : header;
  writeFileSync(path, `${existing.replace(/\n+$/, "")}\n- ${line}\n`, "utf8");
}

/** Human-readable diff of a plan — what the CLI prints and a person approves. */
export function formatPlan(plan: OpsPlan): string {
  if (plan.files.length === 0) return "Không có yêu cầu nào trong ops/requests/.";
  const lines: string[] = [];
  for (const file of plan.files) {
    lines.push(`=== ${file.file} ===`);
    if (file.request.reason) lines.push(`  vì sao : ${file.request.reason}`);
    if (file.request.createdBy) lines.push(`  người đặt: ${file.request.createdBy}`);
    if (file.issues.length > 0) {
      lines.push("  ✗ TỪ CHỐI CẢ FILE:");
      for (const issue of file.issues) lines.push(`     - ${issue.path}: ${issue.message}`);
      lines.push("");
      continue;
    }
    for (const change of file.changes) {
      lines.push(`  • ${change.describe}`);
      lines.push(`      trước: ${change.before}`);
      lines.push(`      sau  : ${change.after}`);
      lines.push(`      lùi  : ${change.rollback}`);
      if (change.warning) lines.push(`      ⚠ ${change.warning}`);
      if (change.blocked) lines.push(`      ✗ ${change.blocked}`);
    }
    const blocked = file.changes.filter((c) => c.blocked).length;
    if (blocked > 0)
      lines.push(`  ✗ ${blocked} thao tác không áp được → cả file sẽ sang ops/rejected/.`);
    lines.push("");
  }
  return lines.join("\n");
}

/** A request that is only shape-checked, for the test and for `--dry-run`. */
export function readRequestFile(root: string, name: string): ParsedOpsRequest {
  const raw = JSON.parse(readFileSync(join(root, "requests", name), "utf8"));
  const parsed = parseOpsRequest(raw);
  return { ...parsed, issues: [...parsed.issues, ...forbiddenTargetIssues(raw)] };
}
