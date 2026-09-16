-- AlterEnum
ALTER TYPE "ContentBatchKind" ADD VALUE 'LEXICON';

-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL,
    "stableId" TEXT NOT NULL,
    "en" TEXT NOT NULL,
    "vi" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "picture" JSONB NOT NULL,
    "phraseEn" TEXT NOT NULL,
    "phraseVi" TEXT NOT NULL,
    "unit" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "batchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordProgress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "box" INTEGER NOT NULL DEFAULT 0,
    "dueAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seen" INTEGER NOT NULL DEFAULT 0,
    "known" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3),
    "lastGame" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WordProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Word_stableId_key" ON "Word"("stableId");

-- CreateIndex
CREATE INDEX "Word_skillId_isActive_idx" ON "Word"("skillId", "isActive");

-- CreateIndex
CREATE INDEX "WordProgress_studentId_dueAt_idx" ON "WordProgress"("studentId", "dueAt");

-- CreateIndex
CREATE INDEX "WordProgress_studentId_box_idx" ON "WordProgress"("studentId", "box");

-- CreateIndex
CREATE UNIQUE INDEX "WordProgress_studentId_wordId_key" ON "WordProgress"("studentId", "wordId");

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ContentBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordProgress" ADD CONSTRAINT "WordProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordProgress" ADD CONSTRAINT "WordProgress_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

