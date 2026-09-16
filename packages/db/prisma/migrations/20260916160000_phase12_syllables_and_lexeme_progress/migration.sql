-- Pha 12 (Xưởng Tiếng, ADR-24 + ADR-22 addendum):
--   1. WordProgress becomes LexemeProgress — one Leitner memory for English words (kind=word) and
--      Vietnamese syllables (kind=syllable). Existing rows are the children's real memory of
--      English words: they are renamed in place, never copied, and all become kind=word.
--   2. Syllable: the syllable dictionary, content like Word.

-- CreateEnum
CREATE TYPE "LexemeKind" AS ENUM ('word', 'syllable');

-- WordProgress -> LexemeProgress (rename, keep every row)
ALTER TABLE "WordProgress" DROP CONSTRAINT "WordProgress_wordId_fkey";
ALTER TABLE "WordProgress" RENAME TO "LexemeProgress";
ALTER TABLE "LexemeProgress" RENAME CONSTRAINT "WordProgress_pkey" TO "LexemeProgress_pkey";
ALTER TABLE "LexemeProgress" RENAME CONSTRAINT "WordProgress_studentId_fkey" TO "LexemeProgress_studentId_fkey";
ALTER TABLE "LexemeProgress" RENAME COLUMN "wordId" TO "lexemeId";
ALTER TABLE "LexemeProgress" ADD COLUMN "kind" "LexemeKind" NOT NULL DEFAULT 'word';
-- every row that exists today is an English word; from now on the writer always says which
ALTER TABLE "LexemeProgress" ALTER COLUMN "kind" DROP DEFAULT;

DROP INDEX "WordProgress_studentId_wordId_key";
DROP INDEX "WordProgress_studentId_dueAt_idx";
DROP INDEX "WordProgress_studentId_box_idx";
CREATE UNIQUE INDEX "LexemeProgress_studentId_kind_lexemeId_key" ON "LexemeProgress"("studentId", "kind", "lexemeId");
CREATE INDEX "LexemeProgress_studentId_kind_dueAt_idx" ON "LexemeProgress"("studentId", "kind", "dueAt");
CREATE INDEX "LexemeProgress_studentId_kind_box_idx" ON "LexemeProgress"("studentId", "kind", "box");

-- Phố Chữ's brick pile only ever grows (ADR-21: nothing in a city is taken away)
ALTER TABLE "StudentCity" ADD COLUMN "syllableBricks" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Syllable" (
    "id" TEXT NOT NULL,
    "stableId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "onset" TEXT NOT NULL,
    "rime" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "picture" JSONB,
    "meaning" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "lessonUnitCode" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "everyday" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "batchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Syllable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Syllable_stableId_key" ON "Syllable"("stableId");
CREATE INDEX "Syllable_skillId_isActive_idx" ON "Syllable"("skillId", "isActive");
CREATE INDEX "Syllable_week_isActive_idx" ON "Syllable"("week", "isActive");

-- AddForeignKey
ALTER TABLE "Syllable" ADD CONSTRAINT "Syllable_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Syllable" ADD CONSTRAINT "Syllable_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ContentBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
