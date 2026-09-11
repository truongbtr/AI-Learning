/**
 * Coverage of the exercise bank per skill (docs/10 sec. 10 `content:stats`, FR-ADM-05).
 * Read-only: it answers "which skill still needs exercises, of which type, at which difficulty".
 */
import type { ExerciseStatus, PrismaClient, Subject } from "../../generated/client";

type Db = PrismaClient;

/** The six types the phase-3 kid renderer ships with (kept in sync with @mtct/content). */
export const PHASE3_TYPES = [
  "MCQ",
  "LISTEN_CHOOSE",
  "DRAG_DROP",
  "COUNT_TAP",
  "READ_ALOUD",
  "WRITE_PHOTO",
] as const;

export interface SkillCoverage {
  code: string;
  nameVi: string;
  subject: Subject;
  strand: string;
  expectedWeek: number | null;
  /** Types the skill map declares — the ones this skill is expected to have. */
  declaredTypes: string[];
  published: number;
  draft: number;
  retired: number;
  byType: Record<string, number>;
  byDifficulty: Record<string, number>;
  /** Declared phase-3 types with no PUBLISHED exercise. */
  missingTypes: string[];
  /** Difficulty levels 1-5 with no PUBLISHED exercise. */
  missingDifficulties: number[];
}

export interface BankCoverage {
  skills: SkillCoverage[];
  totals: {
    skillsWithExercises: number;
    published: number;
    draft: number;
    retired: number;
    byType: Record<string, number>;
    byDifficulty: Record<string, number>;
    bySubject: Record<string, number>;
  };
}

export interface CoverageOptions {
  subject?: Subject;
  /** Only these skill codes (the batch under review, for instance). */
  skillCodes?: string[];
  /** Include skills that have no exercise at all (default false — there are 359 of them). */
  includeEmpty?: boolean;
}

export async function bankCoverage(db: Db, opts: CoverageOptions = {}): Promise<BankCoverage> {
  const skills = await db.skill.findMany({
    where: {
      isActive: true,
      ...(opts.subject ? { subject: opts.subject } : {}),
      ...(opts.skillCodes ? { code: { in: opts.skillCodes } } : {}),
    },
    select: {
      id: true,
      code: true,
      nameVi: true,
      subject: true,
      strand: true,
      expectedWeek: true,
      exerciseTypes: true,
    },
    orderBy: [{ subject: "asc" }, { code: "asc" }],
  });
  const rows = await db.exerciseSkill.findMany({
    where: { skillId: { in: skills.map((s) => s.id) }, weight: { gt: 0.5 } },
    select: {
      skillId: true,
      exercise: { select: { status: true, type: true, difficulty: true, subject: true } },
    },
  });

  const perSkill = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = perSkill.get(row.skillId) ?? [];
    list.push(row);
    perSkill.set(row.skillId, list);
  }

  const totals: BankCoverage["totals"] = {
    skillsWithExercises: 0,
    published: 0,
    draft: 0,
    retired: 0,
    byType: {},
    byDifficulty: {},
    bySubject: {},
  };
  const out: SkillCoverage[] = [];

  for (const skill of skills) {
    const list = perSkill.get(skill.id) ?? [];
    if (list.length === 0 && !opts.includeEmpty) continue;
    const cover: SkillCoverage = {
      code: skill.code,
      nameVi: skill.nameVi,
      subject: skill.subject,
      strand: skill.strand,
      expectedWeek: skill.expectedWeek,
      declaredTypes: skill.exerciseTypes,
      published: 0,
      draft: 0,
      retired: 0,
      byType: {},
      byDifficulty: {},
      missingTypes: [],
      missingDifficulties: [],
    };
    for (const { exercise } of list) {
      const status = exercise.status as ExerciseStatus;
      if (status === "PUBLISHED") {
        cover.published++;
        cover.byType[exercise.type] = (cover.byType[exercise.type] ?? 0) + 1;
        cover.byDifficulty[exercise.difficulty] =
          (cover.byDifficulty[exercise.difficulty] ?? 0) + 1;
        totals.published++;
        totals.byType[exercise.type] = (totals.byType[exercise.type] ?? 0) + 1;
        totals.byDifficulty[exercise.difficulty] =
          (totals.byDifficulty[exercise.difficulty] ?? 0) + 1;
        totals.bySubject[exercise.subject] = (totals.bySubject[exercise.subject] ?? 0) + 1;
      } else if (status === "DRAFT") {
        cover.draft++;
        totals.draft++;
      } else {
        cover.retired++;
        totals.retired++;
      }
    }
    cover.missingTypes = PHASE3_TYPES.filter(
      (t) => skill.exerciseTypes.includes(t) && !cover.byType[t],
    );
    cover.missingDifficulties = [1, 2, 3, 4, 5].filter((d) => !cover.byDifficulty[d]);
    if (cover.published > 0 || cover.draft > 0) totals.skillsWithExercises++;
    out.push(cover);
  }
  return { skills: out, totals };
}
