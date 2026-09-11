-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "confusableWith" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "searchVector" tsvector;

-- CreateTable
CREATE TABLE "ErrorCode" (
    "code" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "detection" TEXT NOT NULL DEFAULT '',
    "remediation" TEXT NOT NULL DEFAULT '',
    "remediationSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lessonRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "behavioural" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "source" "SkillSource" NOT NULL DEFAULT 'SEED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErrorCode_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE INDEX "ErrorCode_subject_group_idx" ON "ErrorCode"("subject", "group");

-- ---------------------------------------------------------------------------
-- Full-text search over skills (docs/08 phase 1 item 5, ADR-12/ADR-13):
-- unaccent + simple dictionary so Vietnamese works with or without diacritics and English
-- words match as typed. The vector is maintained by a trigger (unaccent() is not IMMUTABLE,
-- so a generated column is not allowed).
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION skill_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
      setweight(to_tsvector('simple', unaccent(coalesce(NEW."code", ''))), 'A')
   || setweight(to_tsvector('simple', unaccent(replace(replace(coalesce(NEW."code", ''), '.', ' '), '_', ' '))), 'A')
   || setweight(to_tsvector('simple', unaccent(coalesce(NEW."nameVi", ''))), 'A')
   || setweight(to_tsvector('simple', unaccent(coalesce(NEW."nameEn", ''))), 'A')
   || setweight(to_tsvector('simple', unaccent(coalesce(NEW."strand", ''))), 'B')
   || setweight(to_tsvector('simple', unaccent(coalesce(NEW."description", ''))), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS skill_search_vector_trg ON "Skill";
CREATE TRIGGER skill_search_vector_trg
  BEFORE INSERT OR UPDATE OF "code", "nameVi", "nameEn", "strand", "description" ON "Skill"
  FOR EACH ROW EXECUTE FUNCTION skill_search_vector_update();

-- Backfill any existing rows (Skill is empty after phase 0, but keep the migration self-contained).
UPDATE "Skill" SET "code" = "code";

CREATE INDEX "Skill_searchVector_idx" ON "Skill" USING GIN ("searchVector");
