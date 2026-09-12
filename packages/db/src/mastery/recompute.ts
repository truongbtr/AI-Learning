import {
  applyDecay,
  computeTrend14d,
  DAY_MS,
  DECAY_AFTER_DAYS,
  emptyMasteryState,
  type MasteryState,
  SOURCE_WEIGHT,
  updateMastery,
} from "@mtct/core";
import type { PrismaClient } from "../../generated/client";
import { loadTrendPoints } from "./service";

/**
 * Rebuilding one (child, skill) mastery from the evidence that is left (docs/14 §4: every change
 * must have a way back).
 *
 * Used by "Hoàn tác lô này" (docs/13 §7.3). Restoring a snapshot would have been less code, but it
 * would also have thrown away anything the child did *after* the batch — a quest finished at eight
 * while the photos were read at nine. So the undo deletes the batch's `Evidence` and then asks the
 * only question that has a right answer: **what does the remaining evidence say?** Mastery is a
 * function of the evidence (docs/04 §3.1), so replaying it is not an approximation of the old
 * value, it *is* the value — and it stays correct no matter what else has happened since.
 *
 * Two things are not in `Evidence` and are read back from where they live:
 *   - `hintsUsed` / `tries` — on the `Attempt` the evidence came from (docs/04 §3.1 penalties).
 *   - `weightFactor` — folded into the stored `weight`, so it is divided back out.
 *
 * Decay (docs/04 §3.2) is applied once at the end rather than step by step: it is a function of the
 * days since the last evidence, which is exactly what the nightly job converges to.
 */

type Db = PrismaClient;

export interface RecomputeResult {
  studentId: string;
  skillId: string;
  masteryBefore: number;
  masteryAfter: number;
  evidenceCount: number;
  changed: boolean;
}

/** The rows `recomputeSkillMastery` needs; exported so a test can replay by hand. */
interface EvidenceRow {
  source: string;
  outcome: string;
  score: number;
  weight: number;
  difficulty: number;
  observedAt: Date;
  attempt: { hintsUsed: number; tries: number } | null;
}

function replay(rows: readonly EvidenceRow[]): MasteryState {
  let state = emptyMasteryState();
  for (const row of rows) {
    const source = row.source as keyof typeof SOURCE_WEIGHT;
    const sourceWeight = SOURCE_WEIGHT[source] ?? 1;
    // The weight column is `SOURCE_WEIGHT[source] * weightFactor` (docs/07 §2.2 blanks).
    const weightFactor = sourceWeight > 0 ? Math.min(1, Math.max(0, row.weight / sourceWeight)) : 1;
    state = updateMastery(state, {
      source,
      score: row.score,
      difficulty: row.difficulty,
      hintsUsed: row.attempt?.hintsUsed ?? 0,
      tries: row.attempt?.tries ?? 1,
      outcome: row.outcome as "CORRECT",
      observedAt: row.observedAt,
      weightFactor,
    }).state;
  }
  return state;
}

/**
 * Recomputes `SkillMastery` for one pair from every `Evidence` row still on record and writes it,
 * with a `MasteryHistory(RECALC)` line when the number moved. Returns what it did.
 */
export async function recomputeSkillMastery(
  db: Db,
  studentId: string,
  skillId: string,
  now: Date = new Date(),
): Promise<RecomputeResult> {
  const rows = await db.evidence.findMany({
    where: { studentId, skillId },
    orderBy: { observedAt: "asc" },
    select: {
      source: true,
      outcome: true,
      score: true,
      weight: true,
      difficulty: true,
      observedAt: true,
      attempt: { select: { hintsUsed: true, tries: true } },
    },
  });
  const existing = await db.skillMastery.findUnique({
    where: { studentId_skillId: { studentId, skillId } },
  });
  const masteryBefore = existing?.mastery ?? 0;

  if (rows.length === 0) {
    // Nothing left to say about this skill: back to NOT_STARTED, exactly as a child who never met
    // it. The row is kept rather than deleted so the parent's skill page stays stable.
    if (existing) {
      await db.skillMastery.update({
        where: { id: existing.id },
        data: {
          mastery: 0,
          confidence: 0,
          evidenceCount: 0,
          lastEvidenceAt: null,
          trend14d: 0,
          status: "NOT_STARTED",
          nextReviewAt: null,
          intervalDays: 0,
          easeFactor: 2.5,
        },
      });
      // A skill falling back to nothing is the largest move this function can make, so it is the
      // last one that should happen without a line in the history a parent can read.
      if (masteryBefore !== 0)
        await db.masteryHistory.create({
          data: {
            studentId,
            skillId,
            masteryBefore,
            masteryAfter: 0,
            confidenceAfter: 0,
            cause: "RECALC",
            at: now,
          },
        });
    }
    return {
      studentId,
      skillId,
      masteryBefore,
      masteryAfter: 0,
      evidenceCount: 0,
      changed: masteryBefore !== 0,
    };
  }

  let state = replay(rows as EvidenceRow[]);
  // Decay catch-up: the same total the nightly job would have applied by now (docs/04 §3.2).
  if (state.lastEvidenceAt) {
    const idleDays = Math.floor((now.getTime() - state.lastEvidenceAt.getTime()) / DAY_MS);
    const steps = idleDays - DECAY_AFTER_DAYS;
    if (steps > 0) state = applyDecay(state, now, steps);
  }
  const points = await loadTrendPoints(db, studentId, skillId, now);
  const trend14d = computeTrend14d(points, state.mastery, now);
  const after: MasteryState = { ...state, trend14d };
  if (after.status === "SOLID" && trend14d <= -8) after.status = "NEEDS_PRACTICE";

  const data = {
    mastery: after.mastery,
    confidence: after.confidence,
    evidenceCount: after.evidenceCount,
    lastEvidenceAt: after.lastEvidenceAt,
    trend14d: after.trend14d,
    status: after.status,
    nextReviewAt: after.nextReviewAt,
    intervalDays: after.intervalDays,
    easeFactor: after.easeFactor,
  };
  await db.skillMastery.upsert({
    where: { studentId_skillId: { studentId, skillId } },
    create: { studentId, skillId, ...data },
    update: data,
  });
  const changed = Math.abs(masteryBefore - after.mastery) > 0.001;
  if (changed)
    await db.masteryHistory.create({
      data: {
        studentId,
        skillId,
        masteryBefore,
        masteryAfter: after.mastery,
        confidenceAfter: after.confidence,
        cause: "RECALC",
        at: now,
      },
    });
  return {
    studentId,
    skillId,
    masteryBefore,
    masteryAfter: after.mastery,
    evidenceCount: after.evidenceCount,
    changed,
  };
}
