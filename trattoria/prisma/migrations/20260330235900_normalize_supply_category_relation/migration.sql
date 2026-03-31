CREATE TABLE IF NOT EXISTS "supply_categories" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supply_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "supply_categories_nombre_key" ON "supply_categories"("nombre");

ALTER TABLE "supplies"
ADD COLUMN IF NOT EXISTS "categoryId" TEXT;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'supplies'
          AND column_name = 'categoria'
    ) THEN
        ALTER TABLE "supplies" DROP COLUMN "categoria";
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "supplies_categoryId_idx" ON "supplies"("categoryId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'supplies_categoryId_fkey'
    ) THEN
        ALTER TABLE "supplies"
        ADD CONSTRAINT "supplies_categoryId_fkey"
        FOREIGN KEY ("categoryId") REFERENCES "supply_categories"("id")
        ON DELETE SET NULL
        ON UPDATE CASCADE;
    END IF;
END $$;
