-- The children are called by their two-word names everywhere: "Mai Thy" and "Chí Thanh"
-- (owner's request, 15/09/2026). Data only, no schema change. Guarded by the old value, so running
-- it on a database that already has the new names changes nothing. Learning data is not touched.

UPDATE "Student" SET "nickname" = 'Mai Thy' WHERE "nickname" = 'Thy';
UPDATE "Student" SET "nickname" = 'Chí Thanh' WHERE "nickname" = 'Thanh';

UPDATE "User" SET "displayName" = 'Mai Thy' WHERE "role" = 'CHILD' AND "displayName" = 'Thy';
UPDATE "User" SET "displayName" = 'Chí Thanh' WHERE "role" = 'CHILD' AND "displayName" = 'Thanh';
