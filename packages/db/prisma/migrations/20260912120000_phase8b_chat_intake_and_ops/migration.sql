-- Phase 8b: the door Claude chat comes in through (docs/13 sec. 7) and the operations data
-- (docs/14). Evidence gains a batch it can be taken back out of; every internal call is logged.
-- (The GIN index Skill_searchVector_idx is created by raw SQL in the phase-1 migration and is
-- invisible to the Prisma datamodel — it must stay, so the DropIndex prisma proposed was removed.)

-- CreateEnum
CREATE TYPE "ChatBatchKind" AS ENUM ('INTAKE', 'DIARY');

-- CreateEnum
CREATE TYPE "ChatBatchStatus" AS ENUM ('APPLIED', 'PARTIAL', 'HELD', 'UNDONE');

-- AlterEnum
ALTER TYPE "EvidenceSource" ADD VALUE 'CHAT_INTAKE';

-- AlterTable
ALTER TABLE "Evidence" ADD COLUMN     "chatBatchId" TEXT;

-- CreateTable
CREATE TABLE "ChatBatch" (
    "id" TEXT NOT NULL,
    "kind" "ChatBatchKind" NOT NULL DEFAULT 'INTAKE',
    "status" "ChatBatchStatus" NOT NULL DEFAULT 'APPLIED',
    "studentId" TEXT,
    "date" DATE,
    "summary" TEXT NOT NULL DEFAULT '',
    "subject" "Subject",
    "docType" "DocType",
    "photoCount" INTEGER NOT NULL DEFAULT 0,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "heldCount" INTEGER NOT NULL DEFAULT 0,
    "heldReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "resultRef" TEXT,
    "intakeResultId" TEXT,
    "masterySnapshot" JSONB NOT NULL DEFAULT '[]',
    "raw" JSONB NOT NULL DEFAULT '{}',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "undoneAt" TIMESTAMP(3),
    "undoneById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatIntakePhoto" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "key" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL DEFAULT 0,
    "sha256" TEXT NOT NULL,
    "usedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatIntakePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatContext" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "date" DATE NOT NULL,
    "skillCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalApiCall" (
    "id" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'POST',
    "status" INTEGER NOT NULL,
    "studentId" TEXT,
    "batchId" TEXT,
    "ip" TEXT,
    "bytes" INTEGER NOT NULL DEFAULT 0,
    "ms" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "error" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalApiCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentNotice" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "tone" TEXT NOT NULL DEFAULT 'info',
    "createdBy" TEXT NOT NULL DEFAULT 'ops',
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentNotice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatBatch_studentId_appliedAt_idx" ON "ChatBatch"("studentId", "appliedAt" DESC);

-- CreateIndex
CREATE INDEX "ChatBatch_status_appliedAt_idx" ON "ChatBatch"("status", "appliedAt" DESC);

-- CreateIndex
CREATE INDEX "ChatIntakePhoto_createdAt_idx" ON "ChatIntakePhoto"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "ChatContext_createdAt_idx" ON "ChatContext"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "InternalApiCall_at_idx" ON "InternalApiCall"("at" DESC);

-- CreateIndex
CREATE INDEX "ParentNotice_dismissedAt_createdAt_idx" ON "ParentNotice"("dismissedAt", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Evidence_chatBatchId_idx" ON "Evidence"("chatBatchId");

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_chatBatchId_fkey" FOREIGN KEY ("chatBatchId") REFERENCES "ChatBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatBatch" ADD CONSTRAINT "ChatBatch_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatBatch" ADD CONSTRAINT "ChatBatch_undoneById_fkey" FOREIGN KEY ("undoneById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatIntakePhoto" ADD CONSTRAINT "ChatIntakePhoto_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatContext" ADD CONSTRAINT "ChatContext_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentNotice" ADD CONSTRAINT "ParentNotice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
