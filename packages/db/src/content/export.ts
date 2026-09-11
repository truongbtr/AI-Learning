/**
 * `content:export --skill <code>` (docs/10 sec. 10): rebuilds the authored pack from the DB rows,
 * so a quick edit made in /admin/content can go back into git instead of drifting.
 * Read-only on learning data.
 */
import type { PrismaClient } from "../../generated/client";

type Db = PrismaClient;

export interface ExportedPack {
  skillCode: string;
  subject: string;
  generatedBy: "claude-code";
  promptVersion: string;
  lessonRefs: string[];
  exercises: Record<string, unknown>[];
}

/**
 * Rebuilds a pack for one skill. The stored `spec` had `answerKey`, `errorTag` and
 * `countTarget.correctCount` removed for the client, so they are merged back in from the
 * `answerKey` column — the result round-trips through `content:validate`.
 */
export async function exportPack(db: Db, skillCode: string): Promise<ExportedPack | null> {
  const skill = await db.skill.findUnique({
    where: { code: skillCode },
    select: { id: true, code: true, subject: true },
  });
  if (!skill) return null;
  const rows = await db.exerciseSkill.findMany({
    where: { skillId: skill.id, weight: { gt: 0.5 } },
    select: {
      exercise: {
        select: {
          stableId: true,
          type: true,
          language: true,
          difficulty: true,
          spec: true,
          answerKey: true,
          explanation: true,
          assetTheme: true,
          targetsError: true,
          promptVersion: true,
          sourceRef: true,
          status: true,
          lessonUnit: { select: { code: true } },
          skills: { select: { weight: true, skill: { select: { code: true } } } },
        },
      },
    },
  });

  const exercises: Record<string, unknown>[] = [];
  const lessonRefs = new Set<string>();
  let promptVersion = "exercise-gen-v1";

  for (const { exercise } of rows) {
    if (exercise.status === "RETIRED") continue;
    if (exercise.lessonUnit?.code) lessonRefs.add(exercise.lessonUnit.code);
    promptVersion = exercise.promptVersion ?? promptVersion;
    const spec = (exercise.spec ?? {}) as Record<string, unknown>;
    const key = (exercise.answerKey ?? {}) as {
      value?: unknown;
      errorTags?: Record<string, string>;
      correctCount?: number;
    };
    const choices = (spec.choices as { id: string }[] | undefined)?.map((c) => {
      const tag = key.errorTags?.[c.id];
      return tag ? { ...c, errorTag: tag } : c;
    });
    const countTarget = spec.countTarget
      ? { ...(spec.countTarget as object), correctCount: key.correctCount }
      : undefined;
    exercises.push({
      id: exercise.stableId,
      type: exercise.type,
      language: exercise.language,
      difficulty: exercise.difficulty,
      skillCodes: exercise.skills.sort((a, b) => b.weight - a.weight).map((s) => s.skill.code),
      assetTheme: exercise.assetTheme.toLowerCase(),
      targetsError: exercise.targetsError,
      scaffold: spec.scaffold ?? "none",
      prompt: spec.prompt,
      ...(choices ? { choices } : {}),
      ...(spec.dragItems ? { dragItems: spec.dragItems } : {}),
      ...(spec.dropZones ? { dropZones: spec.dropZones } : {}),
      ...(spec.readTarget ? { readTarget: spec.readTarget } : {}),
      ...(countTarget ? { countTarget } : {}),
      ...(spec.traceTarget ? { traceTarget: spec.traceTarget } : {}),
      ...(spec.story ? { story: spec.story } : {}),
      ...(spec.rubric ? { rubric: spec.rubric } : {}),
      answerKey: key.value ?? null,
      hints: spec.hints ?? [],
      explanation: exercise.explanation ?? "",
      meta: spec.meta ?? { estSeconds: 30, sourceRef: exercise.sourceRef },
    });
  }

  exercises.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return {
    skillCode: skill.code,
    subject: skill.subject,
    generatedBy: "claude-code",
    promptVersion,
    lessonRefs: [...lessonRefs].sort(),
    exercises,
  };
}
