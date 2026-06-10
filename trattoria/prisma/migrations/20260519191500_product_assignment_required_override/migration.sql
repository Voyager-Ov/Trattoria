ALTER TABLE "product_option_group_assignments"
ADD COLUMN "required" BOOLEAN NOT NULL DEFAULT true;

UPDATE "product_option_group_assignments" AS poga
SET "required" = pog."required"
FROM "product_option_groups" AS pog
WHERE poga."groupId" = pog."id";
