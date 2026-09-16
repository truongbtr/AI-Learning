/**
 * The whitelist (docs/14 §4) — what an operations request is allowed to ask for, and nothing else.
 *
 * Hand-written validation rather than Zod because this package deliberately has no Zod (and no web
 * framework): the only consumer is a CLI a person watches, and what that person needs is not a
 * schema trace but a Vietnamese sentence saying which line was refused and why. Every refusal
 * message here is written to be read by the owner, not by a developer.
 *
 * The list of forbidden targets is the reason the whole mechanism exists: `Evidence`, `Attempt`,
 * `Session`, `SkillMastery` and `User` are the child's learning record, accumulated over years, with
 * no copy anywhere else. Nothing in this file can reach them — not because a check says so, but
 * because there is no operation that writes them.
 */

export const OPS_SCHEMA_VERSION = 1;

/** docs/14 §4 — the eight things a request may ask for. */
export const OPS_TYPES = [
  "planHint",
  "retireExercise",
  "reviveExercise",
  "flagExercise",
  "setSkillStatus",
  "setSessionLength",
  "setPlannerWeight",
  "remapSkill",
  "noteForParent",
] as const;
export type OpsType = (typeof OPS_TYPES)[number];

/**
 * Tables an operation may never touch, at any cost (docs/14 §4).
 *
 * Listed so the refusal can name them back to whoever asked: a request that tries is almost always
 * a reasonable idea aimed at the wrong place, and the message should say where the right place is
 * (`PARENT_OVERRIDE` on the web, with a trace).
 */
export const FORBIDDEN_TARGETS = [
  "Evidence",
  "Attempt",
  "Session",
  "SkillMastery",
  "MasteryHistory",
  // The child's memory of each English word and each Vietnamese syllable (ADR-22, pha 11–12) —
  // learning data like the rest. The old name stays listed so a request written before the rename
  // is refused just the same.
  "LexemeProgress",
  "WordProgress",
  "User",
  "StudentGuardian",
  "LoginAudit",
  ".env",
] as const;

/** docs/04 §4 and the 12/09/2026 reversal of ADR-18 §1: review never goes under this. */
export const MIN_REVIEW_SHARE = 0.3;
/** docs/14 §4 `setSessionLength`. */
export const MIN_SESSION_EXERCISES = 8;
export const MAX_SESSION_EXERCISES = 20;

export interface OpsRequestFile {
  schemaVersion?: number;
  createdBy?: string;
  createdAt?: string;
  reason?: string;
  ops?: unknown[];
}

export interface OpsOperation {
  type: OpsType;
  [key: string]: unknown;
}

export interface OpsIssue {
  /** `ops[2].student`, or `file` for a problem with the request itself. */
  path: string;
  message: string;
}

export interface ParsedOpsRequest {
  schemaVersion: number;
  createdBy: string;
  createdAt: string;
  reason: string;
  ops: OpsOperation[];
  issues: OpsIssue[];
}

/** Shape only: whether each operation *can* be applied is decided against the database later. */
export function parseOpsRequest(raw: unknown): ParsedOpsRequest {
  const issues: OpsIssue[] = [];
  const file = (raw ?? {}) as OpsRequestFile;
  const ops: OpsOperation[] = [];

  if (typeof file !== "object" || Array.isArray(file))
    return {
      schemaVersion: 0,
      createdBy: "",
      createdAt: "",
      reason: "",
      ops: [],
      issues: [{ path: "file", message: "file phải là một object JSON" }],
    };
  if (file.schemaVersion !== OPS_SCHEMA_VERSION)
    issues.push({
      path: "schemaVersion",
      message: `phải là ${OPS_SCHEMA_VERSION} (đang là ${String(file.schemaVersion)})`,
    });
  const reason = typeof file.reason === "string" ? file.reason.trim() : "";
  if (reason.length < 10)
    issues.push({
      path: "reason",
      message: "phải có ít nhất một câu nói vì sao — ba mẹ đọc dòng này trước khi đồng ý",
    });
  if (!Array.isArray(file.ops) || file.ops.length === 0)
    issues.push({ path: "ops", message: "phải có ít nhất một thao tác" });
  else if (file.ops.length > 20)
    issues.push({ path: "ops", message: "tối đa 20 thao tác một yêu cầu" });

  for (const [i, entry] of (Array.isArray(file.ops) ? file.ops : []).entries()) {
    const at = `ops[${i}]`;
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      issues.push({ path: at, message: "phải là một object" });
      continue;
    }
    const op = entry as Record<string, unknown>;
    const type = op.type;
    if (typeof type !== "string" || !(OPS_TYPES as readonly string[]).includes(type)) {
      issues.push({
        path: `${at}.type`,
        message: `"${String(type)}" không nằm trong danh sách được phép: ${OPS_TYPES.join(", ")}`,
      });
      continue;
    }
    const before = issues.length;
    validateOperation(type as OpsType, op, at, issues);
    if (issues.length === before) ops.push({ ...op, type: type as OpsType });
  }

  return {
    schemaVersion: typeof file.schemaVersion === "number" ? file.schemaVersion : 0,
    createdBy: typeof file.createdBy === "string" ? file.createdBy : "không ghi",
    createdAt: typeof file.createdAt === "string" ? file.createdAt : "",
    reason,
    ops,
    issues,
  };
}

const SKILL_CODE = /^[A-Z]+\.[A-Z]+\.[A-Z0-9_]+$/;
const ERROR_CODE = /^[a-z][a-z0-9_]{2,40}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function validateOperation(
  type: OpsType,
  op: Record<string, unknown>,
  at: string,
  issues: OpsIssue[],
): void {
  const str = (key: string, max = 200, required = true): string | null => {
    const value = op[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      if (required) issues.push({ path: `${at}.${key}`, message: "thiếu, phải là chữ" });
      return null;
    }
    if (value.length > max) issues.push({ path: `${at}.${key}`, message: `dài quá ${max} ký tự` });
    return value.trim();
  };
  const num = (key: string): number | null => {
    const value = op[key];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      issues.push({ path: `${at}.${key}`, message: "thiếu, phải là số" });
      return null;
    }
    return value;
  };
  const student = () => {
    const value = str("student", 20);
    if (value && !/^[\p{L}\p{N}_-]+$/u.test(value))
      issues.push({
        path: `${at}.student`,
        message: "chỉ dùng tên gọi ở nhà (thy, thanh) — không tên đầy đủ",
      });
  };
  const skillCode = (key = "skillCode") => {
    const value = str(key, 64);
    if (value && !SKILL_CODE.test(value))
      issues.push({ path: `${at}.${key}`, message: `"${value}" không đúng dạng mã kỹ năng` });
  };
  const stableId = () => str("stableId", 80);

  switch (type) {
    case "planHint": {
      student();
      const date = str("date", 10, false);
      if (date && !ISO_DATE.test(date))
        issues.push({ path: `${at}.date`, message: "ngày phải là YYYY-MM-DD" });
      const focusSkills = op.focusSkills;
      const focusErrors = op.focusErrors;
      const avoidSkills = op.avoidSkills;
      for (const [key, list] of [
        ["focusSkills", focusSkills],
        ["avoidSkills", avoidSkills],
      ] as const) {
        if (list === undefined) continue;
        if (!Array.isArray(list)) {
          issues.push({ path: `${at}.${key}`, message: "phải là danh sách mã kỹ năng" });
          continue;
        }
        for (const [j, code] of list.entries())
          if (typeof code !== "string" || !SKILL_CODE.test(code))
            issues.push({
              path: `${at}.${key}[${j}]`,
              message: `"${String(code)}" không đúng dạng mã kỹ năng`,
            });
      }
      if (focusErrors !== undefined) {
        if (!Array.isArray(focusErrors))
          issues.push({ path: `${at}.focusErrors`, message: "phải là danh sách mã lỗi" });
        else
          for (const [j, code] of focusErrors.entries())
            if (typeof code !== "string" || !ERROR_CODE.test(code))
              issues.push({
                path: `${at}.focusErrors[${j}]`,
                message: `"${String(code)}" không đúng dạng mã lỗi`,
              });
      }
      if (
        (!Array.isArray(focusSkills) || focusSkills.length === 0) &&
        (!Array.isArray(focusErrors) || focusErrors.length === 0) &&
        (!Array.isArray(avoidSkills) || avoidSkills.length === 0)
      )
        issues.push({
          path: at,
          message: "planHint rỗng: cần ít nhất một focusSkills / focusErrors / avoidSkills",
        });
      const days = op.validDays;
      if (days !== undefined && (typeof days !== "number" || days < 1 || days > 14))
        issues.push({ path: `${at}.validDays`, message: "từ 1 đến 14 ngày" });
      str("note", 300, false);
      break;
    }
    case "retireExercise":
    case "reviveExercise":
      stableId();
      break;
    case "flagExercise": {
      stableId();
      const flag = str("flag", 20);
      if (flag && !["OK", "GOOD", "BAD", "UNREVIEWED"].includes(flag))
        issues.push({ path: `${at}.flag`, message: "chỉ OK, GOOD, BAD hoặc UNREVIEWED" });
      break;
    }
    case "setSkillStatus": {
      skillCode();
      if (typeof op.isActive !== "boolean")
        issues.push({ path: `${at}.isActive`, message: "phải là true hoặc false" });
      break;
    }
    case "setSessionLength": {
      student();
      const n = num("exercises");
      if (n !== null && (n < MIN_SESSION_EXERCISES || n > MAX_SESSION_EXERCISES))
        issues.push({
          path: `${at}.exercises`,
          message: `từ ${MIN_SESSION_EXERCISES} đến ${MAX_SESSION_EXERCISES} bài (docs/14 §4)`,
        });
      break;
    }
    case "setPlannerWeight": {
      const focus = num("focus");
      const review = num("review");
      if (focus !== null && (focus < 0 || focus > 1))
        issues.push({ path: `${at}.focus`, message: "tỉ lệ từ 0 đến 1" });
      if (review !== null && (review < 0 || review > 1))
        issues.push({ path: `${at}.review`, message: "tỉ lệ từ 0 đến 1" });
      // The floor that exists because review pays off in November, when nobody is watching.
      if (review !== null && review < MIN_REVIEW_SHARE)
        issues.push({
          path: `${at}.review`,
          message: `ôn không xuống dưới ${Math.round(MIN_REVIEW_SHARE * 100)}% — docs/04 §4, và ADR-18 mục 1 đã bị đảo ngược 12/09/2026 đúng vì chỗ này (xin ${Math.round((review as number) * 100)}%)`,
        });
      if (focus !== null && review !== null && focus + review > 1)
        issues.push({ path: at, message: "focus + review không vượt quá 1" });
      break;
    }
    case "remapSkill": {
      stableId();
      const to = op.toSkillCodes;
      if (!Array.isArray(to) || to.length === 0)
        issues.push({ path: `${at}.toSkillCodes`, message: "cần ít nhất một mã kỹ năng" });
      else
        for (const [j, code] of to.entries())
          if (typeof code !== "string" || !SKILL_CODE.test(code))
            issues.push({
              path: `${at}.toSkillCodes[${j}]`,
              message: `"${String(code)}" không đúng dạng mã kỹ năng`,
            });
      break;
    }
    case "noteForParent": {
      str("title", 120);
      str("body", 600, false);
      const tone = op.tone;
      if (tone !== undefined && tone !== "info" && tone !== "warn")
        issues.push({ path: `${at}.tone`, message: 'chỉ "info" hoặc "warn"' });
      const who = op.student;
      if (who !== undefined && who !== null) student();
      break;
    }
  }
}

/** A one-line description of an operation, for the diff a person approves. */
export function describeOperation(op: OpsOperation): string {
  switch (op.type) {
    case "planHint":
      return `trọng tâm cho ${op.student}: ${[
        Array.isArray(op.focusSkills) && op.focusSkills.length > 0
          ? `kỹ năng ${(op.focusSkills as string[]).join(", ")}`
          : null,
        Array.isArray(op.focusErrors) && op.focusErrors.length > 0
          ? `lỗi ${(op.focusErrors as string[]).join(", ")}`
          : null,
        Array.isArray(op.avoidSkills) && op.avoidSkills.length > 0
          ? `tạm tránh ${(op.avoidSkills as string[]).join(", ")}`
          : null,
      ]
        .filter(Boolean)
        .join(" · ")} trong ${op.validDays ?? 3} ngày`;
    case "retireExercise":
      return `gỡ bài ${op.stableId}`;
    case "reviveExercise":
      return `trả lại bài ${op.stableId}`;
    case "flagExercise":
      return `đánh dấu bài ${op.stableId} = ${op.flag}`;
    case "setSkillStatus":
      return `${op.isActive ? "bỏ ẩn" : "ẩn"} kỹ năng ${op.skillCode}`;
    case "setSessionLength":
      return `phiên của ${op.student} còn ${op.exercises} bài`;
    case "setPlannerWeight":
      return `tỉ lệ planner: trọng tâm ${Math.round(Number(op.focus ?? 0.5) * 100)}% · ôn ${Math.round(Number(op.review ?? 0.3) * 100)}%`;
    case "remapSkill":
      return `gắn lại bài ${op.stableId} sang ${(op.toSkillCodes as string[]).join(", ")}`;
    case "noteForParent":
      return `thẻ nhắc trên dashboard: "${op.title}"`;
    default:
      return String(op.type);
  }
}
