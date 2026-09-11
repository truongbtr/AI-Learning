import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { type PrismaClient, type Subject, searchSkills } from "@mtct/db";
import {
  EXPECTS,
  type InboxContext,
  type InboxKind,
  type InboxResult,
  type PlanHint,
  parseInboxContext,
  parseInboxResult,
  parsePlanHint,
} from "./schemas";

/**
 * The three moves of the AI queue (docs/13 §2):
 *   inbox:pull     DB  -> inbox/<date>/<id>/context.json
 *   inbox:validate            result.json must match its schema
 *   inbox:push     inbox/... -> DB, waiting for a parent to approve
 *
 * Nothing here calls an LLM (ADR-10). The reader in the middle is Claude Code today and could be
 * the optional worker of docs/13 §6 later — the files are the whole contract.
 */

export function inboxRoot(): string {
  return process.env.INBOX_ROOT ?? "./inbox";
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface PullOptions {
  limit?: number;
  kind?: InboxKind;
  root?: string;
  /** Re-export items already PULLED (default false — they are already on disk). */
  includePulled?: boolean;
}

export interface PullResult {
  dir: string;
  items: { id: string; kind: InboxKind; path: string }[];
}

/** Words worth searching skills by, from whatever text the item carries. */
function searchTermsOf(text: string | null, payload: Record<string, unknown>): string[] {
  const terms = new Set<string>();
  const add = (value: unknown) => {
    if (typeof value === "string" && value.trim().length > 2) terms.add(value.trim().slice(0, 120));
  };
  add(text);
  for (const key of ["lessonTitle", "questionText", "topic", "prompt", "note"]) add(payload[key]);
  return [...terms].slice(0, 4);
}

/**
 * Copies every PENDING item to disk with everything the reader needs — including skill candidates
 * from the phase-1 full-text search, so nobody has to invent a skill code.
 */
export async function pullPending(db: PrismaClient, opts: PullOptions = {}): Promise<PullResult> {
  const root = opts.root ?? inboxRoot();
  const dir = join(root, today());
  const items = await db.inboxItem.findMany({
    where: {
      status: opts.includePulled ? { in: ["PENDING", "PULLED"] } : "PENDING",
      ...(opts.kind ? { kind: opts.kind } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: opts.limit ?? 50,
    include: {
      student: { select: { nickname: true, grade: true, className: true, mascot: true } },
    },
  });
  if (items.length === 0) return { dir, items: [] };

  const errorCodes = (
    await db.errorCode.findMany({ select: { code: true, nameVi: true }, orderBy: { code: "asc" } })
  ).map((c) => ({ code: c.code, nameVi: c.nameVi }));

  // Skills the class is on right now: what the diary says, else the expected week.
  const currentSkills = await currentWeekSkills(db);

  mkdirSync(dir, { recursive: true });
  const written: PullResult["items"] = [];

  for (const item of items) {
    const payload = (item.payload ?? {}) as Record<string, unknown>;
    const itemDir = join(dir, item.id);
    mkdirSync(itemDir, { recursive: true });

    const text = typeof payload.text === "string" ? payload.text : null;
    const candidates = await skillCandidates(db, searchTermsOf(text, payload), payload);

    const context: InboxContext = {
      id: item.id,
      kind: item.kind as InboxKind,
      createdAt: item.createdAt.toISOString(),
      student: item.student
        ? {
            nickname: item.student.nickname,
            grade: item.student.grade,
            className: item.student.className,
            worldTheme: item.student.mascot === "OWL" ? "garden" : "robot",
          }
        : null,
      subjectHint: (payload.subject as InboxContext["subjectHint"]) ?? null,
      dateHint: (payload.date as string | undefined) ?? null,
      files: Array.isArray(payload.files)
        ? (payload.files as { key?: string }[]).map((f) => basename(String(f.key ?? f)))
        : [],
      text,
      skillCandidates: candidates,
      currentSkills,
      errorCodes,
      parentCorrections: await recentParentCorrections(db),
      payload,
      expects: EXPECTS[item.kind as InboxKind],
    };
    writeFileSync(join(itemDir, "context.json"), `${JSON.stringify(context, null, 2)}\n`, "utf8");
    written.push({ id: item.id, kind: item.kind as InboxKind, path: itemDir });
  }

  await db.inboxItem.updateMany({
    where: { id: { in: written.map((w) => w.id) }, status: "PENDING" },
    data: { status: "PULLED", pulledAt: new Date() },
  });
  writeFileSync(join(dir, "README.md"), readmeFor(written), "utf8");
  return { dir, items: written };
}

function readmeFor(items: PullResult["items"]): string {
  return [
    `# Hàng chờ AI — ${today()}`,
    "",
    `${items.length} việc. Với mỗi thư mục:`,
    "",
    "1. Đọc `context.json` (đã kèm ảnh/văn bản, ứng viên kỹ năng và bộ mã lỗi).",
    "2. Viết `result.json` đúng schema ghi ở `expects`.",
    "3. `pnpm inbox:validate` rồi `pnpm inbox:push`.",
    "",
    "Chỉ dùng mã kỹ năng và mã lỗi có trong `context.json`. Không dùng chữ “sai” trong câu nói với bé.",
    "",
    ...items.map((i) => `- \`${i.id}\` — ${i.kind}`),
    "",
  ].join("\n");
}

/** Uses the phase-1 full-text search (ADR-12) so the reader picks a code instead of inventing one. */
async function skillCandidates(
  db: PrismaClient,
  terms: string[],
  payload: Record<string, unknown>,
): Promise<InboxContext["skillCandidates"]> {
  const out = new Map<string, InboxContext["skillCandidates"][number]>();
  const subject = typeof payload.subject === "string" ? (payload.subject as Subject) : null;
  for (const term of terms) {
    for (const hit of await searchSkills(db, term, { subject, limit: 8 }))
      if (!out.has(hit.code))
        out.set(hit.code, {
          code: hit.code,
          nameVi: hit.nameVi,
          subject: hit.subject as "VIET",
          matchedOn: term,
        });
  }
  return [...out.values()].slice(0, 20);
}

/** Skills of the lessons the class covered in the last three days, else this week's expected set. */
async function currentWeekSkills(db: PrismaClient): Promise<InboxContext["currentSkills"]> {
  const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const diaryLessons = await db.diaryLesson.findMany({
    where: { diary: { date: { gte: since } } },
    select: { skillCodes: true },
    take: 30,
  });
  const codes = [...new Set(diaryLessons.flatMap((l) => l.skillCodes))];
  if (codes.length === 0) return [];
  const skills = await db.skill.findMany({
    where: { code: { in: codes } },
    select: { code: true, nameVi: true, subject: true },
  });
  return skills.map((s) => ({
    code: s.code,
    nameVi: s.nameVi,
    subject: s.subject as "VIET",
    matchedOn: "nhật ký lớp 3 ngày gần nhất",
  }));
}

/** Few-shot: labels a parent corrected before (docs/07 §3). */
async function recentParentCorrections(
  db: PrismaClient,
): Promise<InboxContext["parentCorrections"]> {
  const rows = await db.intakeItem.findMany({
    where: { skillCodesFinal: { isEmpty: false } },
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: { questionText: true, skillCodes: true, skillCodesFinal: true },
  });
  return rows
    .filter((r) => JSON.stringify(r.skillCodes) !== JSON.stringify(r.skillCodesFinal))
    .map((r) => ({ question: r.questionText, from: r.skillCodes, to: r.skillCodesFinal }));
}

// ---------------------------------------------------------------------------------------------
// validate
// ---------------------------------------------------------------------------------------------

export interface ValidationIssue {
  id: string;
  level: "error" | "warn";
  message: string;
}

export interface ValidatedItem {
  id: string;
  dir: string;
  result: InboxResult;
  planHint: PlanHint | null;
}

function itemDirs(root: string): string[] {
  if (!existsSync(root)) return [];
  const out: string[] = [];
  for (const day of readdirSync(root)) {
    const dayDir = join(root, day);
    if (!statSync(dayDir).isDirectory()) continue;
    for (const id of readdirSync(dayDir)) {
      const dir = join(dayDir, id);
      if (statSync(dir).isDirectory() && existsSync(join(dir, "context.json"))) out.push(dir);
    }
  }
  return out.sort();
}

/**
 * Reads every `result.json` under the inbox root and checks it against the schema of the kind the
 * matching `context.json` asked for. Items with no result yet are reported as warnings, not errors:
 * processing the queue in two sittings is normal.
 */
export function validateInbox(root = inboxRoot()): {
  ok: ValidatedItem[];
  issues: ValidationIssue[];
} {
  const ok: ValidatedItem[] = [];
  const issues: ValidationIssue[] = [];
  for (const dir of itemDirs(root)) {
    const id = basename(dir);
    let context: InboxContext;
    try {
      context = parseInboxContext(JSON.parse(readFileSync(join(dir, "context.json"), "utf8")));
    } catch (err) {
      issues.push({ id, level: "error", message: `context.json: ${(err as Error).message}` });
      continue;
    }
    const resultFile = join(dir, "result.json");
    if (!existsSync(resultFile)) {
      issues.push({ id, level: "warn", message: `no result.json yet (${context.kind})` });
      continue;
    }
    let result: InboxResult;
    try {
      result = parseInboxResult(JSON.parse(readFileSync(resultFile, "utf8")));
    } catch (err) {
      issues.push({ id, level: "error", message: `result.json: ${(err as Error).message}` });
      continue;
    }
    if (result.kind !== context.kind) {
      issues.push({
        id,
        level: "error",
        message: `result.json is a ${result.kind} but the item is a ${context.kind}`,
      });
      continue;
    }
    // Only codes the context offered may be used — that is what keeps the taxonomy closed.
    let rejected = false;
    const allowedErrors = new Set(context.errorCodes.map((c) => c.code));
    for (const code of collectErrorCodes(result))
      if (!allowedErrors.has(code)) {
        issues.push({ id, level: "error", message: `unknown error code "${code}"` });
        rejected = true;
      }
    for (const text of collectKidText(result))
      if (/\bsai\b/i.test(text)) {
        issues.push({
          id,
          level: "error",
          message: `the child must never read the word "sai": "${text}"`,
        });
        rejected = true;
      }
    if (rejected) continue;

    let planHint: PlanHint | null = null;
    const hintFile = join(dir, "plan-hint.json");
    if (existsSync(hintFile)) {
      try {
        planHint = parsePlanHint(JSON.parse(readFileSync(hintFile, "utf8")));
      } catch (err) {
        issues.push({ id, level: "error", message: `plan-hint.json: ${(err as Error).message}` });
        continue;
      }
    }
    ok.push({ id, dir, result, planHint });
  }
  return { ok, issues };
}

function collectErrorCodes(result: InboxResult): string[] {
  switch (result.kind) {
    case "PHOTO_INTAKE":
      return result.items.map((i) => i.errorCode).filter((c): c is string => Boolean(c));
    case "WRITE_PHOTO_GRADE":
    case "SPEAK_GRADE":
      return result.errorCodes;
    case "WEEKLY_REPORT":
      return result.attentionPoints.map((p) => p.errorCode).filter((c): c is string => Boolean(c));
    default:
      return [];
  }
}

/** Text a child will actually read or hear. */
function collectKidText(result: InboxResult): string[] {
  if (result.kind === "WRITE_PHOTO_GRADE" || result.kind === "SPEAK_GRADE")
    return [result.feedbackVi];
  return [];
}
