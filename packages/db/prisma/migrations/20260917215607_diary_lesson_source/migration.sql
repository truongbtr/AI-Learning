-- CreateEnum
CREATE TYPE "DiaryLessonSource" AS ENUM ('POST', 'PARENT');

-- DropIndex
DROP INDEX "Skill_searchVector_idx";

-- AlterTable
ALTER TABLE "DiaryLesson" ADD COLUMN     "source" "DiaryLessonSource" NOT NULL DEFAULT 'POST';
