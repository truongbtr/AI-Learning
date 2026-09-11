-- Phase 4: the photo intake pipeline and the class diary.
-- (The GIN index Skill_searchVector_idx is created by raw SQL in the phase-1 migration and is
-- invisible to the Prisma datamodel — it must stay, so it is deliberately not dropped here.)

-- docs/07 §2.2: a blank is never wrong, but why it is blank changes what it means.
CREATE TYPE "BlankReason" AS ENUM ('NOT_FINISHED', 'DOES_NOT_KNOW');

ALTER TABLE "IntakeJob" ADD COLUMN "docTypeHint" "DocType";
ALTER TABLE "IntakeJob" ADD COLUMN "note" TEXT;

ALTER TABLE "IntakeItem" ADD COLUMN "blankReason" "BlankReason";
ALTER TABLE "IntakeItem" ADD COLUMN "editedByParent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "IntakeItem" ADD COLUMN "note" TEXT;

ALTER TABLE "ClassDiary" ADD COLUMN "unmatched" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ClassDiary" ADD COLUMN "confirmedAt" TIMESTAMP(3);
ALTER TABLE "ClassDiary" ADD COLUMN "confirmedById" TEXT;
