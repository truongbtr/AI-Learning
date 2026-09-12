import { vnDayDate } from "@mtct/core";
import type { ChatBatchStatus, IntakeItemOutcome, PrismaClient } from "../../generated/client";
import { evidenceFor, inferBlankReasons, recordExternals } from "../intake/review";
import { commitEvidence } from "../mastery/service";
import type { ChatIntakeInput } from "./types";
import { type ChatFieldError, validateChatIntake } from "./validate";

/**
 * Applying one evening's photos straight away (docs/13 §7.3).
 *
 * The decision behind this file: **áp luôn, hoàn tác được.** Phase 4 made a parent approve every
 * page before it counted, which was right while nobody trusted the reading — and wrong once the
 * owner started photographing homework on a phone every night, because a queue nobody empties is a
 * system that knows nothing. So a clear reading lands now, a card appears on the dashboard, and one
 * tap takes the whole batch back out (`undoChatBatch`).
 *
 * What does *not* land now is the third of a page where a machine is most often wrong: see
 * `validateChatIntake`. Those items go into exactly the rows phase 4 already built, so the parent
 * reviews them on the screen that already exists.
 */

type Db = PrismaClient;

export class ChatIntakeRejected extends Error {
  constructor(public fields: ChatFieldError[]) {
    super(fields.map((f) => `${f.path}: ${f.message}`).join(" · "));
    this.name = "ChatIntakeRejected";
  }
}

export interface ApplyChatIntakeInput {
  studentId: string;
  body: ChatIntakeInput;
  /** `ChatIntakePhoto.id`s uploaded beforehand, in the order they were taken. */
  photoIds?: string[];
  /** The school day the work belongs to (Vietnam calendar). Defaults to today. */
  date?: Date | null;
  contextId?: string | null;
  /** Who to record as the owner of the intake job; defaults to an ADMIN. */
  createdById?: string | null;
  now?: Date;
}

export interface ApplyChatIntakeResult {
  batchId: string;
  status: ChatBatchStatus;
  items: number;
  evidence: number;
  held: number;
  heldReasons: string[];
  externals: number;
  intakeResultId: string;
  /** What moved, for the reply the owner reads in chat. */
  mastery: { skillCode: string; before: number; after: number }[];
}

export async function applyChatIntake(
  db: Db,
  input: ApplyChatIntakeInput,
): Promise<ApplyChatIntakeResult> {
  const now = input.now ?? new Date();
  const student = await db.student.findUnique({
    where: { id: input.studentId },
    select: { id: true, nickname: true },
  });
  if (!student) throw new Error("Không tìm thấy học sinh");

  const check = await validateChatIntake(db, input.body, {
    studentId: student.id,
    nickname: student.nickname,
    contextId: input.contextId ?? null,
    now,
  });
  if (check.errors.length > 0) throw new ChatIntakeRejected(check.errors);

  const items = (input.body.items ?? []).map((item, n) => ({ ...item, index: item.index ?? n }));
  const held = new Set(check.heldItems);
  const observedAt = input.date ?? now;
  const day = vnDayDate(observedAt);

  // ── the photos, and the job they belong to ─────────────────────────────────────────────────
  const photos = input.photoIds?.length
    ? await db.chatIntakePhoto.findMany({ where: { id: { in: input.photoIds } } })
    : [];
  const ordered = (input.photoIds ?? [])
    .map((id) => photos.find((p) => p.id === id))
    .filter((p): p is (typeof photos)[number] => Boolean(p));
  const files = ordered.map((p) => ({
    key: p.key,
    originalKey: p.key,
    mime: p.mime,
    bytes: p.bytes,
    sha256: p.sha256,
  }));

  const owner =
    input.createdById ??
    (await db.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } }))?.id;
  if (!owner) throw new Error("Chưa có tài khoản ADMIN để gắn lô ảnh");

  const anythingHeld = held.size > 0;
  const job = await db.intakeJob.create({
    data: {
      studentId: student.id,
      createdById: owner,
      kind: "PHOTO_BATCH",
      // A batch with held items has to show up where a parent looks for work (docs/13 §7.3).
      status: anythingHeld ? "PENDING_REVIEW" : "APPROVED",
      subjectHint: input.body.subject ?? null,
      docTypeHint: input.body.docType ?? null,
      dateHint: day,
      note: "Claude chat đọc trên điện thoại (docs/13 §7)",
      files,
    },
  });

  const result = await db.intakeResult.create({
    data: {
      jobId: job.id,
      docType: input.body.docType ?? "OTHER",
      subject: input.body.subject ?? null,
      detectedStudent: input.body.detectedStudent ?? null,
      summary: input.body.summary ?? "",
      teacherComment: input.body.teacherComment ?? null,
      rawExtraction: input.body as object,
      confidence: input.body.confidence ?? 0.5,
    },
  });

  const inferred = inferBlankReasons(
    items.map((i) => (i.outcome ?? "UNGRADED") as IntakeItemOutcome),
  );
  const itemRows: { id: string; index: number; held: boolean }[] = [];
  for (const [n, item] of items.entries()) {
    const outcome = (item.outcome ?? "UNGRADED") as IntakeItemOutcome;
    const isHeld = held.has(n);
    const row = await db.intakeItem.create({
      data: {
        resultId: result.id,
        index: item.index,
        questionText: item.questionText ?? "",
        studentAnswer: item.studentAnswer ?? null,
        expectedAnswer: item.expectedAnswer ?? null,
        outcome,
        blankReason: outcome === "BLANK" ? (item.blankReason ?? inferred[n] ?? null) : null,
        errorCode: item.errorCode ?? null,
        skillCodes: item.skillCodes ?? [],
        // Held items keep `skillCodesFinal` empty: nothing is agreed to yet (docs/07 §2.3).
        skillCodesFinal: isHeld ? [] : (item.skillCodes ?? []),
        bbox: item.bbox
          ? { x: item.bbox[0], y: item.bbox[1], w: item.bbox[2], h: item.bbox[3] }
          : undefined,
        fileIndex: item.fileIndex ?? 0,
        note: isHeld ? "chờ ba mẹ xem" : null,
      },
    });
    itemRows.push({ id: row.id, index: item.index, held: isHeld });
  }

  // ── the way back, written down before anything moves (docs/14 §4) ──────────────────────────
  const touchedSkillIds = new Set<string>();
  for (const [n, item] of items.entries()) {
    if (held.has(n)) continue;
    for (const code of item.skillCodes ?? []) {
      const id = check.skillIdByCode.get(code);
      if (id) touchedSkillIds.add(id);
    }
  }
  const snapshot = await db.skillMastery.findMany({
    where: { studentId: student.id, skillId: { in: [...touchedSkillIds] } },
    select: {
      skillId: true,
      mastery: true,
      confidence: true,
      evidenceCount: true,
      status: true,
      skill: { select: { code: true } },
    },
  });
  const masteryBefore = new Map(snapshot.map((s) => [s.skillId, s.mastery]));

  const batch = await db.chatBatch.create({
    data: {
      kind: "INTAKE",
      status: "APPLIED", // corrected below once the counts are known
      studentId: student.id,
      date: day,
      summary: input.body.summary ?? "",
      subject: input.body.subject ?? null,
      docType: input.body.docType ?? "OTHER",
      photoCount: ordered.length,
      itemCount: items.length,
      heldCount: held.size,
      heldReasons: check.heldReasons,
      confidence: input.body.confidence ?? 0.5,
      resultRef: `IntakeResult:${result.id}`,
      intakeResultId: result.id,
      masterySnapshot: snapshot.map((s) => ({
        skillId: s.skillId,
        skillCode: s.skill.code,
        mastery: s.mastery,
        confidence: s.confidence,
        evidenceCount: s.evidenceCount,
        status: s.status,
      })),
      raw: input.body as object,
    },
  });

  // ── the clear items become evidence now ───────────────────────────────────────────────────
  let evidenceCount = 0;
  const movedSkillIds = new Set<string>();
  for (const [n, item] of items.entries()) {
    if (held.has(n)) continue;
    const row = itemRows[n];
    if (!row) continue;
    const outcome = (item.outcome ?? "UNGRADED") as IntakeItemOutcome;
    const blankReason =
      outcome === "BLANK" ? (item.blankReason ?? inferred[n] ?? "DOES_NOT_KNOW") : null;
    const evidence = evidenceFor(outcome, blankReason);
    if (!evidence) continue;
    const evidenceIds: string[] = [];
    for (const code of item.skillCodes ?? []) {
      const skillId = check.skillIdByCode.get(code);
      if (!skillId) continue;
      const committed = await commitEvidence(db, {
        studentId: student.id,
        skillId,
        source: "CHAT_INTAKE",
        outcome: evidence.outcome,
        score: evidence.score,
        weightFactor: evidence.weightFactor,
        errorCode: item.errorCode ?? null,
        note: evidence.note,
        observedAt,
        intakeItemId: row.id,
        chatBatchId: batch.id,
      });
      evidenceIds.push(committed.evidenceId);
      movedSkillIds.add(skillId);
      evidenceCount++;
    }
    if (evidenceIds.length > 0)
      await db.intakeItem.update({ where: { id: row.id }, data: { evidenceIds } });
  }

  // A NAVIO / Kids A-Z screenshot is a measurement, not a page of answers (docs/05 §5).
  const externals = anythingHeld ? 0 : await recordExternals(db, result.id, student.id, now);

  if (!anythingHeld)
    await db.intakeResult.update({
      where: { id: result.id },
      // Nobody pressed anything: `reviewedById` stays null so the audit shows the machine did it.
      data: { reviewedAt: now },
    });

  const status: ChatBatchStatus =
    held.size === 0 ? "APPLIED" : evidenceCount > 0 ? "PARTIAL" : "HELD";
  await db.chatBatch.update({
    where: { id: batch.id },
    data: { status, evidenceCount },
  });
  if (ordered.length > 0)
    await db.chatIntakePhoto.updateMany({
      where: { id: { in: ordered.map((p) => p.id) } },
      data: { usedBy: batch.id },
    });

  const after = await db.skillMastery.findMany({
    where: { studentId: student.id, skillId: { in: [...movedSkillIds] } },
    select: { skillId: true, mastery: true, skill: { select: { code: true } } },
  });

  return {
    batchId: batch.id,
    status,
    items: items.length,
    evidence: evidenceCount,
    held: held.size,
    heldReasons: check.heldReasons,
    externals,
    intakeResultId: result.id,
    mastery: after.map((row) => ({
      skillCode: row.skill.code,
      before: masteryBefore.get(row.skillId) ?? 0,
      after: row.mastery,
    })),
  };
}
