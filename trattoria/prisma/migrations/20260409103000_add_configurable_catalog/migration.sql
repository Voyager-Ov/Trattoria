CREATE TYPE "ProductCatalogRole" AS ENUM ('STANDARD', 'CONFIGURABLE_BASE', 'OPTION_PRODUCT');

CREATE TYPE "ProductOptionPriceMode" AS ENUM ('ADD', 'OVERRIDE');

ALTER TABLE "products"
ADD COLUMN "catalogRole" "ProductCatalogRole" NOT NULL DEFAULT 'STANDARD';

ALTER TABLE "order_items"
ADD COLUMN "configSnapshot" JSONB;

CREATE TABLE "product_option_groups" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "priceMode" "ProductOptionPriceMode" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_option_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_option_group_assignments" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_option_group_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_options" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "optionProductId" TEXT,
    "metadata" JSONB,
    "recipeMultiplier" DECIMAL(10,3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "product_options_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_option_links" (
    "id" TEXT NOT NULL,
    "baseProductId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_option_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_option_groups_key_key" ON "product_option_groups"("key");
CREATE INDEX "product_option_groups_orden_idx" ON "product_option_groups"("orden");

CREATE UNIQUE INDEX "product_option_group_assignments_productId_groupId_key" ON "product_option_group_assignments"("productId", "groupId");
CREATE INDEX "product_option_group_assignments_productId_orden_idx" ON "product_option_group_assignments"("productId", "orden");
CREATE INDEX "product_option_group_assignments_groupId_idx" ON "product_option_group_assignments"("groupId");

CREATE UNIQUE INDEX "product_options_groupId_slug_key" ON "product_options"("groupId", "slug");
CREATE INDEX "product_options_groupId_activo_deletedAt_idx" ON "product_options"("groupId", "activo", "deletedAt");
CREATE INDEX "product_options_optionProductId_idx" ON "product_options"("optionProductId");

CREATE UNIQUE INDEX "product_option_links_baseProductId_optionId_key" ON "product_option_links"("baseProductId", "optionId");
CREATE INDEX "product_option_links_baseProductId_activo_orden_idx" ON "product_option_links"("baseProductId", "activo", "orden");
CREATE INDEX "product_option_links_optionId_idx" ON "product_option_links"("optionId");

CREATE INDEX "products_catalogRole_activo_disponible_idx" ON "products"("catalogRole", "activo", "disponible");

ALTER TABLE "product_option_group_assignments"
ADD CONSTRAINT "product_option_group_assignments_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_option_group_assignments"
ADD CONSTRAINT "product_option_group_assignments_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "product_option_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_options"
ADD CONSTRAINT "product_options_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "product_option_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_options"
ADD CONSTRAINT "product_options_optionProductId_fkey" FOREIGN KEY ("optionProductId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "product_option_links"
ADD CONSTRAINT "product_option_links_baseProductId_fkey" FOREIGN KEY ("baseProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_option_links"
ADD CONSTRAINT "product_option_links_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "product_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;
