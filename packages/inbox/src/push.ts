import { rmSync } from "node:fs";
import { join } from "node:path";
import { inferBlankReasons, type PrismaClient } from "@mtct/db";
import type { InboxResult, PlanHint } from "./schemas";
import { inboxRoot, type ValidatedItem, validateInbox } from "./service";

/**
 * `inbox:push` (docs/13 §2, last step). Loads every validated `result.json` into the tables the
 * app already has and leaves it **waiting for a parent** — nothing here turns into `Evidence` by
 * itself; that happens when the parent approves (P6, phase 4).
 */

export interface PushResult {
  pushed: { id: string; kind: string; ref: string }[];
  failed: { id: string; error: string }[];
  planHints: number;
}

export interface PushOptions {
  root?: string;
  /** Remove the item folder once it is in the database (default false — keep for inspection). */
  clean?: boolean;
}

export async function pushResults(db: PrismaClient, opts: PushOptions = {}): Promise<PushResult> {
  const root = opts.root ?? inboxRoot();
  const { ok, issues } = validateInbox(root);
  const out: PushResult = { pushed: [], failed: [], planHints: 0 };
  for (const issue of issues)
    if (issue.level === "error") out.failed.push({ id: issue.id, error: issue.message });
  if (out.failed.length > 0) return out; // never push a half-valid batch

  for (const item of ok) {
    const dbItem = await db.inboxItem.findUnique({ where: { id: item.id } });
    if (!dbItem) {
      out.failed.push({ id: item.id, error: "no such InboxItem (already cleaned up?)" });
      continue;
    }
    if (dbItem.status === "DONE") continue; // idempotent: pushing twice changes nothing
    try {
      const ref = await applyResult(db, dbItem, item.result);
      if (item.planHint) {
        await savePlanHint(db, dbItem.studentId, item.planHint);
        out.planHints++;
      }
      await db.inboxItem.update({
        where: { id: item.id },
        data: { status: "DONE", doneAt: new Date(), resultRef: ref, error: null },
      });
      out.pushed.push({ id: item.id, kind: dbItem.kind, ref });
      if (opts.clean) rmSync(item.dir, { recursive: true, force: true });
    } catch (err) {
      const message = (err as Error).message;
      await db.inboxItem.update({
        where: { id: item.id },
        data: { status: "FAILED", error: message.slice(0, 500) },
      });
      out.failed.push({ id: item.id, error: message });
    }
  }
  return out;
}

type DbInboxItem = { id: string; kind: string; studentId: string | null; payload: unknown };

async function applyResult(
  db: PrismaClient,
  item: DbInboxItem,
  result: InboxResult,
): Promise<string> {
  switch (result.kind) {
    case "PHOTO_INTAKE":
      return applyIntake(db, item, result);
    case "WRITE_PHOTO_GRADE":
    case "SPEAK_GRADE":
      return applyGrade(db, item, result);
    case "DIARY_HARD":
      return applyDiary(db, result);
    case "WEEKLY_REPORT":
      return applyReport(db, item, result);
    case "PLAN":
      return applyPlan(db, item, result);
  }
}

/**
 * A plan lands as `PROPOSED` and nothing else happens (FR-PAR-03, docs/08 pha 5 việc 3).
 *
 * The planner does not read it, no session changes, and the child's evening is unaffected until a
 * parent opens P9, reads the reason beside each skill, edits what they disagree with and approves.
 * Re-pushing the same week replaces the standing proposal rather than stacking a second one — but
 * a plan a parent has already approved is never overwritten.
 */
async function applyPlan(
  db: PrismaClient,
  item: DbInboxItem,
  result: Extract<InboxResult, { kind: "PLAN" }>,
): Promise<string> {
  const studentId =
    item.studentId ??
    (
      await db.student.findFirst({
        where: { nickname: result.studentNickname },
        select: { id: true },
      })
    )?.id;
  if (!studentId) throw new Error(`no student named "${result.studentNickname}"`);

  const weekStart = new Date(`${result.weekStart}T00:00:00Z`);
  const weekEnd = new Date(`${result.weekEnd}T00:00:00Z`);

  const skills = await db.skill.findMany({
    where: { code: { in: result.items.map((i) => i.skillCode) } },
    select: { id: true, code: true },
  });
  const idByCode = new Map(skills.map((s) => [s.code, s.id]));
  const unknown = result.items.filter((i) => !idByCode.has(i.skillCode));
  if (unknown.length > 0)
    throw new Error(`unknown skill codes: ${unknown.map((i) => i.skillCode).join(", ")}`);

  // A proposal for a week a parent has already decided on is not allowed to undo that decision.
  await db.plan.deleteMany({ where: { studentId, weekStart, status: "PROPOSED" } });

  const plan = await db.plan.create({
    data: {
      studentId,
      weekStart,
      weekEnd,
      status: "PROPOSED",
      rationale: result.rationale,
      createdBy: "AI",
      items: {
        create: result.items.map((i) => ({
          skillId: idByCode.get(i.skillCode) as string,
          priority: i.priority,
          reason: i.reason,
          targetMastery: i.targetMastery,
          sessionsPlanned: i.sessionsPlanned,
        })),
      },
    },
  });
  return `Plan:${plan.id}`;
}

async function applyIntake(
  db: PrismaClient,
  item: DbInboxItem,
  result: Extract<InboxResult, { kind: "PHOTO_INTAKE" }>,
): Promise<string> {
  const payload = (item.payload ?? {}) as { jobId?: string; files?: unknown[] };
  let jobId = payload.jobId;
  if (!jobId) {
    // No job yet (batch imported from disk, docs/10 §8): make one so the parent can review it.
    const admin = await db.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
    if (!admin) throw new Error("no ADMIN user to own the intake job");
    const job = await db.intakeJob.create({
      data: {
        studentId: item.studentId,
        createdById: admin.id,
        kind: "PHOTO_BATCH",
        status: "PENDING_REVIEW",
        subjectHint: result.subject,
        files: (payload.files ?? []) as object,
      },
    });
    jobId = job.id;
  } else {
    await db.intakeJob.update({ where: { id: jobId }, data: { status: "PENDING_REVIEW" } });
  }

  const intake = await db.intakeResult.create({
    data: {
      jobId,
      docType: result.docType,
      subject: result.subject,
      detectedStudent: result.detectedStudent,
      summary: result.summary,
      teacherComment: result.teacherComment,
      rawExtraction: result as object,
      confidence: result.confidence,
    },
  });
  if (result.items.length > 0) {
    // Why a blank is blank: what the reader said, else the rule of docs/07 §2.2 read off the page.
    const inferred = inferBlankReasons(result.items.map((i) => i.outcome));
    await db.intakeItem.createMany({
      data: result.items.map((i, n) => ({
        resultId: intake.id,
        index: i.index,
        questionText: i.questionText,
        studentAnswer: i.studentAnswer,
        expectedAnswer: i.expectedAnswer,
        outcome: i.outcome,
        blankReason: i.outcome === "BLANK" ? (i.blankReason ?? inferred[n] ?? null) : null,
        errorCode: i.errorCode,
        skillCodes: i.skillCodes,
        // skillCodesFinal stays empty until the parent confirms or changes the labels.
        bbox: i.bbox ? { x: i.bbox[0], y: i.bbox[1], w: i.bbox[2], h: i.bbox[3] } : undefined,
        fileIndex: i.fileIndex,
      })),
      skipDuplicates: true,
    });
  }
  return `IntakeResult:${intake.id}`;
}

async function applyGrade(
  db: PrismaClient,
  item: DbInboxItem,
  result: Extract<InboxResult, { kind: "WRITE_PHOTO_GRADE" | "SPEAK_GRADE" }>,
): Promise<string> {
  const payload = (item.payload ?? {}) as { attemptId?: string };
  if (!payload.attemptId) throw new Error("payload.attemptId is required to attach a grade");
  const attempt = await db.attempt.update({
    where: { id: payload.attemptId },
    data: {
      isCorrect: result.outcome === "CORRECT",
      score: result.score,
      gradedBy: "AI",
      gradedAt: new Date(),
      aiFeedback: result as object,
    },
  });
  return `Attempt:${attempt.id}`;
}

async function applyDiary(
  db: PrismaClient,
  result: Extract<InboxResult, { kind: "DIARY_HARD" }>,
): Promise<string> {
  const date = new Date(`${result.date}T00:00:00Z`);
  const diary = await db.classDiary.upsert({
    where: { className_date: { className: result.className, date } },
    create: { className: result.className, date, rawText: "", confidence: result.confidence },
    update: { parsedAt: new Date(), confidence: result.confidence },
  });
  await db.diaryLesson.deleteMany({ where: { diaryId: diary.id } });
  if (result.lessons.length > 0) {
    const units = await db.lessonUnit.findMany({
      where: {
        code: { in: result.lessons.map((l) => l.lessonUnitCode ?? "").filter(Boolean) },
      },
      select: { id: true, code: true },
    });
    const unitByCode = new Map(units.map((u) => [u.code, u.id]));
    await db.diaryLesson.createMany({
      data: result.lessons.map((l) => ({
        diaryId: diary.id,
        subject: l.subject,
        subjectLabel: l.subjectLabel,
        lessonRefText: l.lessonRefText,
        lessonUnitId: l.lessonUnitCode ? (unitByCode.get(l.lessonUnitCode) ?? null) : null,
        pages: l.pages,
        skillCodes: l.skillCodes,
      })),
    });
  }
  await db.classReminder.deleteMany({ where: { diaryId: diary.id } });
  if (result.reminders.length > 0)
    await db.classReminder.createMany({
      data: result.reminders.map((r) => ({
        diaryId: diary.id,
        kind: r.kind,
        text: r.text,
        forDate: r.forDate ? new Date(`${r.forDate}T00:00:00Z`) : null,
      })),
    });
  return `ClassDiary:${diary.id}`;
}

async function applyReport(
  db: PrismaClient,
  item: DbInboxItem,
  result: Extract<InboxResult, { kind: "WEEKLY_REPORT" }>,
): Promise<string> {
  if (!item.studentId) throw new Error("a weekly report needs a studentId");
  const report = await db.report.create({
    data: {
      studentId: item.studentId,
      kind: "WEEKLY",
      periodStart: new Date(`${result.periodStart}T00:00:00Z`),
      periodEnd: new Date(`${result.periodEnd}T00:00:00Z`),
      contentMd: result.contentMd,
      data: { highlights: result.highlights, attentionPoints: result.attentionPoints },
    },
  });
  return `Report:${report.id}`;
}

async function savePlanHint(
  db: PrismaClient,
  studentId: string | null,
  hint: PlanHint,
): Promise<void> {
  const id =
    studentId ??
    (
      await db.student.findFirst({
        where: { nickname: hint.studentNickname },
        select: { id: true },
      })
    )?.id;
  if (!id) throw new Error(`plan-hint.json: no student named "${hint.studentNickname}"`);
  const now = new Date();
  await db.planHint.create({
    data: {
      studentId: id,
      validFrom: now,
      validTo: new Date(now.getTime() + hint.validDays * 24 * 60 * 60 * 1000),
      focusSkills: hint.focusSkills,
      focusErrors: hint.focusErrors,
      avoidSkills: hint.avoidSkills,
      note: hint.note,
      createdBy: "CLAUDE_CODE",
    },
  });
}

/** Used by the CLI to report where the files are. */
export function itemPath(root: string, day: string, id: string): string {
  return join(root, day, id);
}

export type { ValidatedItem };
