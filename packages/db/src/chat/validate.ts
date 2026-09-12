import type { PrismaClient } from "../../generated/client";
import { isKnownErrorCode } from "../mastery/service";
import {
  CHAT_CONFIDENCE_FLOOR,
  CHAT_CONTEXT_MAX_AGE_DAYS,
  type ChatIntakeInput,
  type ChatIntakeItem,
} from "./types";

/**
 * The gate in front of the chat door (docs/13 §7.4, §7.5).
 *
 * Two different answers, and the difference matters:
 *
 *   **Refused (400).** A skill code or an error code that does not exist. Nothing in the system
 *   means what the sender thought it meant, so there is nothing to store and nothing to review —
 *   the reply says which field and which code, and the phone can try again.
 *
 *   **Held.** Everything exists, but this is one of the three places a machine reading a page of
 *   a six-year-old's handwriting is wrong often enough to matter (docs/13 §7.3): it said so itself
 *   (`confidence < 0.6`), it cannot tell an empty box from a wrong answer, or it reached for a skill
 *   nobody offered it. Held items are stored in full and wait for a parent; they never become
 *   evidence on their own.
 */

type Db = PrismaClient;

export interface ChatFieldError {
  path: string;
  message: string;
}

export interface ChatValidation {
  errors: ChatFieldError[];
  /** Indexes into `items` that must not become evidence yet. */
  heldItems: number[];
  /** One Vietnamese line each, written for the parent's card. */
  heldReasons: string[];
  /** Skill id by code, for everything that survived. */
  skillIdByCode: Map<string, string>;
  /** Codes the context actually offered (empty when there was no usable context). */
  offeredCodes: Set<string>;
}

/** The code shapes docs/13 §2 fixes; anything else is a typo, not a skill. */
const SKILL_CODE = /^[A-Z]+\.[A-Z]+\.[A-Z0-9_]+$/;
const ERROR_CODE = /^[a-z][a-z0-9_]{2,40}$/;

const DAY_MS = 86_400_000;

export interface ValidateChatIntakeOptions {
  studentId: string;
  nickname: string;
  /** From `GET /api/internal/context`. Missing or stale → the whole batch is held. */
  contextId?: string | null;
  now?: Date;
}

export async function validateChatIntake(
  db: Db,
  input: ChatIntakeInput,
  opts: ValidateChatIntakeOptions,
): Promise<ChatValidation> {
  const now = opts.now ?? new Date();
  const out: ChatValidation = {
    errors: [],
    heldItems: [],
    heldReasons: [],
    skillIdByCode: new Map(),
    offeredCodes: new Set(),
  };
  const items = input.items ?? [];

  // ── the codes have to exist ────────────────────────────────────────────────────────────────
  const wanted = new Set<string>();
  for (const [i, item] of items.entries()) {
    for (const [j, code] of (item.skillCodes ?? []).entries()) {
      if (!SKILL_CODE.test(code)) {
        out.errors.push({
          path: `items[${i}].skillCodes[${j}]`,
          message: `"${code}" không đúng dạng mã kỹ năng (ví dụ VIET.HV.NHAM_LAN_B_D)`,
        });
        continue;
      }
      wanted.add(code);
    }
  }
  if (wanted.size > 0) {
    const rows = await db.skill.findMany({
      where: { code: { in: [...wanted] } },
      select: { id: true, code: true, isActive: true },
    });
    for (const row of rows) if (row.isActive) out.skillIdByCode.set(row.code, row.id);
    for (const [i, item] of items.entries())
      for (const [j, code] of (item.skillCodes ?? []).entries()) {
        if (!SKILL_CODE.test(code)) continue;
        if (out.skillIdByCode.has(code)) continue;
        const known = rows.find((r) => r.code === code);
        out.errors.push({
          path: `items[${i}].skillCodes[${j}]`,
          message: known
            ? `kỹ năng "${code}" đang bị ẩn trong bản đồ kỹ năng`
            : `không có kỹ năng nào mã "${code}" — chỉ dùng mã trong skillCandidates của /api/internal/context`,
        });
      }
  }

  for (const [i, item] of items.entries()) {
    const code = item.errorCode?.trim();
    if (!code) continue;
    if (!ERROR_CODE.test(code) || !(await isKnownErrorCode(db, code)))
      out.errors.push({
        path: `items[${i}].errorCode`,
        message: `mã lỗi "${code}" không có trong error-taxonomy.json — dùng mã trong errorCodes của /api/internal/context`,
      });
  }

  if (out.errors.length > 0) return out;

  // ── what the context offered ───────────────────────────────────────────────────────────────
  const context = opts.contextId
    ? await db.chatContext.findUnique({ where: { id: opts.contextId } })
    : null;
  const ageDays = context ? (now.getTime() - context.createdAt.getTime()) / DAY_MS : null;
  const contextUsable =
    context !== null &&
    (context.studentId === null || context.studentId === opts.studentId) &&
    (ageDays ?? 0) <= CHAT_CONTEXT_MAX_AGE_DAYS;
  if (context) for (const code of context.skillCodes) out.offeredCodes.add(code);

  const holdAll = (reason: string) => {
    out.heldReasons.push(reason);
    for (let i = 0; i < items.length; i++) if (!out.heldItems.includes(i)) out.heldItems.push(i);
  };
  const holdItem = (index: number, reason: string) => {
    if (!out.heldItems.includes(index)) out.heldItems.push(index);
    if (!out.heldReasons.includes(reason)) out.heldReasons.push(reason);
  };

  if (!contextUsable)
    holdAll(
      opts.contextId
        ? "ngữ cảnh đã cũ hoặc không phải của bé này — giữ lại để ba mẹ xem"
        : "chưa đọc ngữ cảnh (/api/internal/context) trước khi đọc ảnh — giữ lại để ba mẹ xem",
    );

  // ── 1. the reader said it was not sure ─────────────────────────────────────────────────────
  const confidence = input.confidence ?? 0.5;
  if (confidence < CHAT_CONFIDENCE_FLOOR)
    holdAll(
      `máy đọc chưa chắc (${confidence.toFixed(2)} < ${CHAT_CONFIDENCE_FLOOR}) — ba mẹ nhìn lại ảnh giúp`,
    );

  // ── 2. the photo may belong to the other child ─────────────────────────────────────────────
  const detected = input.detectedStudent?.trim();
  if (detected && !sameName(detected, opts.nickname))
    holdAll(`trên ảnh ghi tên "${detected}", không phải ${opts.nickname} — ba mẹ xác nhận giúp`);

  // The reader asking for a human outright. Cheap to honour, and the one signal nobody should have
  // to infer: the skill the owner runs on the phone is told to set it.
  if (input.needsParent) holdAll("người đọc đánh dấu cả trang cần ba mẹ xem");

  // ── 3. blank or wrong, and skills nobody offered ───────────────────────────────────────────
  for (const [i, item] of items.entries()) {
    if (item.needsParent) holdItem(i, `câu ${item.index + 1}: người đọc muốn ba mẹ xem giúp`);
    if (ambiguousBlank(item))
      holdItem(i, `câu ${item.index + 1}: chưa rõ con để trống hay làm chưa đúng`);
    if (!contextUsable) continue;
    for (const code of item.skillCodes ?? [])
      if (!out.offeredCodes.has(code))
        holdItem(
          i,
          `câu ${item.index + 1}: kỹ năng ${code} không nằm trong danh sách ngữ cảnh đã phát ra`,
        );
  }

  out.heldItems.sort((a, b) => a - b);
  return out;
}

/**
 * docs/13 §7.3 — "không phân biệt được BLANK với sai".
 *
 * Three shapes of the same doubt: the reader refused to grade it; it called the box empty but also
 * copied an answer out of it; or it called it wrong with nothing written down. Each one is a page
 * where the difference between "chưa làm" and "làm chưa đúng" was not legible, and that difference
 * is the whole of docs/07 §2.2 — one of them barely counts as evidence, the other counts fully.
 */
export function ambiguousBlank(item: ChatIntakeItem): boolean {
  const outcome = item.outcome ?? "UNGRADED";
  const written = (item.studentAnswer ?? "").trim();
  if (outcome === "UNGRADED") return true;
  if (outcome === "BLANK" && written.length > 0) return true;
  if (outcome === "INCORRECT" && written.length === 0) return true;
  return false;
}

/** "Thy" = "thy" = "Mai Thy" — the page is written by a six-year-old, not a database. */
function sameName(a: string, b: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase();
  const x = norm(a);
  const y = norm(b);
  return x === y || x.includes(y) || y.includes(x);
}
