-- Pha 10 việc 3 (ADR-21): data for the subject cities of the kid UI.
-- Hand-edited: Prisma proposed `DROP INDEX "Skill_searchVector_idx"` — that raw-SQL GIN index powers
-- searchSkills (ADR-12) and must never be dropped; the line is removed.

-- AlterTable
ALTER TABLE "SkillMastery" ADD COLUMN     "masteredSince" TIMESTAMP(3);

-- Backfill: a skill that is MASTERED today has been MASTERED since the first history row at 85+
-- after its last dip below 85. Without history, count from its last update (the conservative end).
UPDATE "SkillMastery" sm
SET "masteredSince" = COALESCE(
  (
    SELECT MIN(h."at")
    FROM "MasteryHistory" h
    WHERE h."studentId" = sm."studentId"
      AND h."skillId" = sm."skillId"
      AND h."masteryAfter" >= 85
      AND h."at" > COALESCE(
        (
          SELECT MAX(d."at")
          FROM "MasteryHistory" d
          WHERE d."studentId" = sm."studentId"
            AND d."skillId" = sm."skillId"
            AND d."masteryAfter" < 85
        ),
        TIMESTAMP '1970-01-01'
      )
  ),
  sm."updatedAt"
)
WHERE sm."status" = 'MASTERED';

-- CreateTable
CREATE TABLE "StudentCity" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subject" "Subject" NOT NULL,
    "skillOrder" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "plotBuilds" JSONB NOT NULL DEFAULT '[]',
    "seen" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentCity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentCity_studentId_subject_key" ON "StudentCity"("studentId", "subject");

-- AddForeignKey
ALTER TABLE "StudentCity" ADD CONSTRAINT "StudentCity_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
