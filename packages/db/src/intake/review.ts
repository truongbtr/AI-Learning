import type { EvidenceOutcome, EvidenceSource } from "@mtct/core";
import type { BlankReason, DocType, IntakeItemOutcome, PrismaClient } from "../../generated/client";
import { commitEvidence } from "../mastery/service";

/**
 * P6 — what happens when a parent taps "Duyệt tất cả" (FR-INT-02).
 *
 * Until this runs, a photo has produced nothing but rows a parent can edit. Here the edits are
 * saved, the items become `Evidence`, the mastery moves, and a Raz-Kids or NAVIO screenshot
 * becomes `ExternalProgress`.
 *
 * The rule that shapes the whole file is docs/07 §2.2: **a blank is not a wrong answer.** A page
 * the child ran out of time on says almost nothing about what they know, and treating it as a
 * string of mistakes would tell a parent their child is failing on the very first evening.
 */

type Db = PrismaClient;

/** docs/07 §2.2 — how much a blank counts, and as what. */
export const BLANK_WEIGHT: Record<BlankReason, number> = {
  /** Ran out of time. Recorded so the parent can see it, all but ignored by the mastery. */
  NOT_FINISHED: 0.3,
  /** Left out in the middle of answered questions: worth knowing, still not a full mistake. */
  DOES_NOT_KNOW: 0.6,
};

const SOURCE_BY_DOC: Record<DocType, EvidenceSource> = {
  WORKBOOK: "INTAKE_PHOTO",
  TEST: "INTAKE_PHOTO",
  WORKSHEET: "INTAKE_PHOTO",
  TEACHER_NOTE: "INTAKE_TEACHER_NOTE",
  CLASS_DIARY: "INTAKE_TEACHER_NOTE",
  NAVIO_REPORT: "EXTERNAL_REPORT",
  KIDSAZ_REPORT: "EXTERNAL_REPORT",
  OTHER: "INTAKE_PHOTO",
};

/**
 * Which blanks are "did not finish" and which are "did not know" (docs/07 §2.2): a run of blanks
 * that reaches the end of the page is an unfinished page; a blank between two answered questions
 * is a question the child could not do.
 *
 * Exported and pure so the rule can be unit-tested — it is the rule this phase is judged on.
 */
export function inferBlankReasons(outcomes: readonly IntakeItemOutcome[]): (BlankReason | null)[] {
  const out: (BlankReason | null)[] = outcomes.map(() => null);
  let tailStart = outcomes.length;
  while (tailStart > 0 && outcomes[tailStart - 1] === "BLANK") tailStart--;
  for (let i = 0; i < outcomes.length; i++) {
    if (outcomes[i] !== "BLANK") continue;
    // A trailing run only counts as "ran out of time" when something *was* answered before it.
    const answeredBefore = outcomes.slice(0, i).some((o) => o !== "BLANK" && o !== "UNGRADED");
    out[i] = i >= tailStart && answeredBefore ? "NOT_FINISHED" : "DOES_NOT_KNOW";
  }
  return out;
}

/** How one reviewed item lands in the mastery model. */
export function evidenceFor(
  outcome: IntakeItemOutcome,
  blankReason: BlankReason | null,
): { outcome: EvidenceOutcome; score: number; weightFactor: number; note: string | null } | null {
  switch (outcome) {
    case "CORRECT":
      return { outcome: "CORRECT", score: 1, weightFactor: 1, note: null };
    case "PARTIAL":
      return { outcome: "PARTIAL", score: 0.5, weightFactor: 1, note: null };
    case "INCORRECT":
      return { outcome: "INCORRECT", score: 0, weightFactor: 1, note: null };
    case "BLANK": {
      const reason = blankReason ?? "DOES_NOT_KNOW";
      return reason === "NOT_FINISHED"
        ? {
            outcome: "OBSERVED",
            score: 0,
            weightFactor: BLANK_WEIGHT.NOT_FINISHED,
            note: "chưa làm xong",
          }
        : {
            outcome: "INCORRECT",
            score: 0,
            weightFactor: BLANK_WEIGHT.DOES_NOT_KNOW,
            note: "để trống — có thể chưa biết làm",
          };
    }
    default:
      // UNGRADED: the reader could not tell. Nothing is asserted about the child.
      return null;
  }
}

export interface ItemEdit {
  id: string;
  outcome?: IntakeItemOutcome;
  blankReason?: BlankReason | null;
  skillCodes?: string[];
  errorCode?: string | null;
  note?: string | null;
}

export interface ApproveResult {
  resultId: string;
  evidence: number;
  skipped: number;
  externals: number;
  corrections: number;
}

/**
 * Saves the parent's edits and turns the items into evidence. Idempotent: a result already
 * reviewed is left alone, so a double tap on a slow phone cannot double the evidence.
 */
export async function approveIntakeResult(
  db: Db,
  input: {
    resultId: string;
    reviewedById: string;
    studentId: string;
    edits?: ItemEdit[];
    /** Items the parent chose not to record at all. */
    skipIds?: string[];
    at?: Date;
  },
): Promise<ApproveResult> {
  const at = input.at ?? new Date();
  const result = await db.intakeResult.findUnique({
    where: { id: input.resultId },
    include: { items: { orderBy: { index: "asc" } }, job: true },
  });
  if (!result) throw new Error("Không tìm thấy kết quả đọc ảnh");
  const out: ApproveResult = {
    resultId: result.id,
    evidence: 0,
    skipped: 0,
    externals: 0,
    corrections: 0,
  };
  if (result.reviewedAt) return out;

  const edits = new Map((input.edits ?? []).map((e) => [e.id, e]));
  const skip = new Set(input.skipIds ?? []);
  const source = SOURCE_BY_DOC[result.docType];

  // Apply the edits first, so the blank rule sees the page as the parent left it.
  const items = result.items.map((item) => {
    const edit = edits.get(item.id);
    return {
      ...item,
      outcome: edit?.outcome ?? item.outcome,
      blankReason: edit && "blankReason" in edit ? (edit.blankReason ?? null) : item.blankReason,
      skillCodesFinal:
        edit?.skillCodes ?? (item.skillCodesFinal.length ? item.skillCodesFinal : item.skillCodes),
      errorCode: edit && "errorCode" in edit ? (edit.errorCode ?? null) : item.errorCode,
      note: edit?.note ?? item.note,
      changed: Boolean(edit),
    };
  });
  const inferred = inferBlankReasons(items.map((i) => i.outcome));

  for (const [index, item] of items.entries()) {
    const blankReason = item.blankReason ?? inferred[index] ?? null;
    const changedLabels =
      item.changed &&
      (JSON.stringify(item.skillCodesFinal) !== JSON.stringify(item.skillCodes) ||
        item.outcome !== result.items[index]?.outcome);
    if (changedLabels) out.corrections++;

    await db.intakeItem.update({
      where: { id: item.id },
      data: {
        outcome: item.outcome,
        blankReason,
        errorCode: item.errorCode,
        note: item.note,
        // Keeping both columns is what makes the few-shot examples of docs/07 §2.3 possible:
        // `skillCodes` stays what was read, `skillCodesFinal` is what the parent agreed to.
        skillCodesFinal: item.skillCodesFinal,
        editedByParent: item.changed,
      },
    });

    if (skip.has(item.id)) {
      out.skipped++;
      continue;
    }
    const evidence = evidenceFor(item.outcome, blankReason);
    if (!evidence || item.skillCodesFinal.length === 0) {
      out.skipped++;
      continue;
    }
    const evidenceIds: string[] = [];
    for (const code of item.skillCodesFinal) {
      const skill = await db.skill.findUnique({ where: { code }, select: { id: true } });
      if (!skill) continue;
      const committed = await commitEvidence(db, {
        studentId: input.studentId,
        skillId: skill.id,
        source,
        outcome: evidence.outcome,
        score: evidence.score,
        weightFactor: evidence.weightFactor,
        errorCode: item.errorCode,
        note: [item.note, evidence.note].filter(Boolean).join(" · ") || null,
        observedAt: result.job.dateHint ?? result.job.createdAt,
        intakeItemId: item.id,
        createdById: input.reviewedById,
      });
      evidenceIds.push(committed.evidenceId);
      out.evidence++;
    }
    if (evidenceIds.length > 0) {
      await db.intakeItem.update({ where: { id: item.id }, data: { evidenceIds } });
    }
  }

  out.externals = await recordExternals(db, result.id, input.studentId, at);

  await db.intakeResult.update({
    where: { id: result.id },
    data: { reviewedAt: at, reviewedById: input.reviewedById },
  });
  await db.intakeJob.update({ where: { id: result.jobId }, data: { status: "APPROVED" } });
  return out;
}

/** A parent decided the reading was not worth keeping. Nothing becomes evidence. */
export async function rejectIntakeResult(
  db: Db,
  input: { resultId: string; reviewedById: string; at?: Date },
): Promise<void> {
  const result = await db.intakeResult.findUnique({ where: { id: input.resultId } });
  if (!result || result.reviewedAt) return;
  await db.intakeResult.update({
    where: { id: result.id },
    data: { reviewedAt: input.at ?? new Date(), reviewedById: input.reviewedById },
  });
  await db.intakeJob.update({ where: { id: result.jobId }, data: { status: "REJECTED" } });
}

/**
 * A screenshot of Raz-Kids or NAVIO: the number on it becomes `ExternalProgress`, and a reading
 * level also moves the matching `ENL.RF.FLUENCY_LEVEL_*` skill (docs/05, FR-INT-02).
 */
async function recordExternals(
  db: Db,
  resultId: string,
  studentId: string,
  at: Date,
): Promise<number> {
  const result = await db.intakeResult.findUnique({ where: { id: resultId } });
  if (!result) return 0;
  const raw = (result.rawExtraction ?? {}) as {
    externals?: { platform?: string; metric?: string; value?: string; valueNum?: number }[];
  };
  const externals = Array.isArray(raw.externals) ? raw.externals : [];
  let written = 0;
  for (const e of externals) {
    const platform = e.platform === "NAVIO" ? "NAVIO" : e.platform === "KIDSAZ" ? "KIDSAZ" : null;
    if (!platform || !e.metric || e.value === undefined) continue;
    const already = await db.externalProgress.findFirst({
      where: {
        studentId,
        platform,
        metric: e.metric,
        value: String(e.value),
        sourceIntakeId: result.jobId,
      },
    });
    if (already) continue;
    await db.externalProgress.create({
      data: {
        studentId,
        platform,
        metric: e.metric,
        value: String(e.value),
        valueNum: typeof e.valueNum === "number" ? e.valueNum : numberIn(String(e.value)),
        observedAt: at,
        sourceIntakeId: result.jobId,
      },
    });
    written++;
    await applyReadingLevel(db, studentId, platform, e.metric, String(e.value), at);
  }
  return written;
}

function numberIn(value: string): number | null {
  const m = /-?\d+(\.\d+)?/.exec(value);
  return m ? Number(m[0]) : null;
}

/** The Raz-Kids ladder, in order (docs/05 §3.2). */
export const RAZ_LEVELS = ["AA", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] as const;

/**
 * docs/05 §5 mapping table: reaching a level says a great deal about the levels below it and a
 * little about the one above. Mastery is *set*, not nudged — a screenshot from Kids A-Z is a
 * measurement, so it goes in as `PARENT_OVERRIDE`, the one source docs/04 §3.1 lets set a value.
 *
 *   the level reached      → 70
 *   one below              → 85
 *   two or more below      → 95
 *   the next one up        → 30 (LEARNING)
 */
export function masteryForRazLevel(reached: string): { code: string; mastery: number }[] {
  const value = reached
    .trim()
    .toUpperCase()
    .replace(/^LEVEL\s*/, "");
  const index = RAZ_LEVELS.indexOf(value as (typeof RAZ_LEVELS)[number]);
  if (index < 0) return [];
  const out: { code: string; mastery: number }[] = [];
  for (const [i, level] of RAZ_LEVELS.entries()) {
    const code = `ENL.RF.FLUENCY_LEVEL_${level}`;
    if (i === index) out.push({ code, mastery: 70 });
    else if (i === index - 1) out.push({ code, mastery: 85 });
    else if (i < index - 1) out.push({ code, mastery: 95 });
    else if (i === index + 1) out.push({ code, mastery: 30 });
  }
  return out;
}

async function applyReadingLevel(
  db: Db,
  studentId: string,
  platform: "NAVIO" | "KIDSAZ",
  metric: string,
  value: string,
  at: Date,
): Promise<void> {
  if (platform !== "KIDSAZ" || metric !== "raz_level") return;
  for (const { code, mastery } of masteryForRazLevel(value)) {
    const skill = await db.skill.findUnique({ where: { code }, select: { id: true } });
    if (!skill) continue;
    await commitEvidence(db, {
      studentId,
      skillId: skill.id,
      source: "PARENT_OVERRIDE",
      outcome: mastery >= 70 ? "CORRECT" : "OBSERVED",
      score: mastery / 100,
      note: `Kids A-Z: con đang đọc ở mức ${value.trim().toUpperCase()}`,
      observedAt: at,
    });
  }
}
