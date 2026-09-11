-- ADR-16: the egg and the picture stop being weekly and start following the child.
-- Nothing already earned may be lost, so existing rows are renumbered in date order instead of
-- being dropped: the first week a child collected becomes egg 0 / picture 0.

-- ---------------------------------------------------------------- EggProgress
ALTER TABLE "EggProgress" ADD COLUMN "eggNo" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "EggProgress" ADD COLUMN "startedOn" DATE;
ALTER TABLE "EggProgress" ADD COLUMN "hatchedAt" TIMESTAMP(3);

WITH ordered AS (
  SELECT "id",
         ROW_NUMBER() OVER (PARTITION BY "studentId" ORDER BY "weekStart") - 1 AS "n",
         "weekStart"
  FROM "EggProgress"
)
UPDATE "EggProgress" e
   SET "eggNo" = o."n",
       "startedOn" = o."weekStart",
       "hatchedAt" = CASE WHEN e."hatchedPetCode" IS NOT NULL THEN e."updatedAt" END
  FROM ordered o
 WHERE e."id" = o."id";

UPDATE "EggProgress" SET "startedOn" = CURRENT_DATE WHERE "startedOn" IS NULL;
ALTER TABLE "EggProgress" ALTER COLUMN "startedOn" SET NOT NULL;

DROP INDEX "EggProgress_studentId_weekStart_key";
ALTER TABLE "EggProgress" DROP COLUMN "weekStart";
CREATE UNIQUE INDEX "EggProgress_studentId_eggNo_key" ON "EggProgress"("studentId", "eggNo");

-- ---------------------------------------------------------------- WeeklyPicture
-- The catalogue: one row per picture, in the order children collect them. `theme`/`imageKey` of
-- rows carried over may no longer match pictureByNumber(); the code reads the list in
-- packages/core, so the column is only a record of what was shown.
ALTER TABLE "WeeklyPicture" ADD COLUMN "pictureNo" INTEGER;

WITH ordered AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "weekStart") - 1 AS "n" FROM "WeeklyPicture"
)
UPDATE "WeeklyPicture" w SET "pictureNo" = o."n" FROM ordered o WHERE w."id" = o."id";

UPDATE "WeeklyPicture" SET "pictureNo" = 0 WHERE "pictureNo" IS NULL;
ALTER TABLE "WeeklyPicture" ALTER COLUMN "pictureNo" SET NOT NULL;

DROP INDEX "WeeklyPicture_weekStart_key";
ALTER TABLE "WeeklyPicture" DROP COLUMN "weekStart";
CREATE UNIQUE INDEX "WeeklyPicture_pictureNo_key" ON "WeeklyPicture"("pictureNo");

-- ---------------------------------------------------------------- StudentPicturePiece
ALTER TABLE "StudentPicturePiece" ADD COLUMN "pictureNo" INTEGER NOT NULL DEFAULT 0;

WITH weeks AS (
  SELECT DISTINCT "weekStart" FROM "StudentPicturePiece"
), ordered AS (
  SELECT "weekStart", ROW_NUMBER() OVER (ORDER BY "weekStart") - 1 AS "n" FROM weeks
)
UPDATE "StudentPicturePiece" p
   SET "pictureNo" = o."n"
  FROM ordered o
 WHERE p."weekStart" = o."weekStart";

DROP INDEX "StudentPicturePiece_studentId_weekStart_pieceIndex_key";
ALTER TABLE "StudentPicturePiece" DROP COLUMN "weekStart";
CREATE UNIQUE INDEX "StudentPicturePiece_studentId_pictureNo_pieceIndex_key"
    ON "StudentPicturePiece"("studentId", "pictureNo", "pieceIndex");
