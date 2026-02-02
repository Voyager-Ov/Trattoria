/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `categories` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "CategoriaEgreso" AS ENUM ('INSUMOS', 'SERVICIOS', 'NOMINA', 'MANTENIMIENTO', 'OTROS');

-- DropIndex
DROP INDEX "categories_activo_orden_idx";

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "esPromocion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "imagen" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "clienteDireccion" TEXT,
ADD COLUMN     "clienteNombre" TEXT,
ADD COLUMN     "clienteTelefono" TEXT,
ADD COLUMN     "cobrado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cobradoEn" TIMESTAMP(3),
ADD COLUMN     "metodoPago" TEXT,
ADD COLUMN     "motivoCancelacion" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "stockActual" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stockMaximo" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stockMinimo" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "daysOfWeek" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "imagen" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_products" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "promotion_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "egresos" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "categoria" "CategoriaEgreso" NOT NULL DEFAULT 'OTROS',
    "proveedor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "egresos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryToPromotion" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoryToPromotion_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "promotions_code_key" ON "promotions"("code");

-- CreateIndex
CREATE INDEX "promotions_deletedAt_idx" ON "promotions"("deletedAt");

-- CreateIndex
CREATE INDEX "promotions_isActive_deletedAt_idx" ON "promotions"("isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "promotions_startDate_endDate_deletedAt_idx" ON "promotions"("startDate", "endDate", "deletedAt");

-- CreateIndex
CREATE INDEX "promotion_products_promotionId_idx" ON "promotion_products"("promotionId");

-- CreateIndex
CREATE INDEX "promotion_products_productId_idx" ON "promotion_products"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_products_promotionId_productId_key" ON "promotion_products"("promotionId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "egresos_numero_key" ON "egresos"("numero");

-- CreateIndex
CREATE INDEX "egresos_fecha_idx" ON "egresos"("fecha" DESC);

-- CreateIndex
CREATE INDEX "egresos_categoria_idx" ON "egresos"("categoria");

-- CreateIndex
CREATE INDEX "egresos_deletedAt_idx" ON "egresos"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "app_configs_key_key" ON "app_configs"("key");

-- CreateIndex
CREATE INDEX "_CategoryToPromotion_B_index" ON "_CategoryToPromotion"("B");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- AddForeignKey
ALTER TABLE "promotion_products" ADD CONSTRAINT "promotion_products_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_products" ADD CONSTRAINT "promotion_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToPromotion" ADD CONSTRAINT "_CategoryToPromotion_A_fkey" FOREIGN KEY ("A") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToPromotion" ADD CONSTRAINT "_CategoryToPromotion_B_fkey" FOREIGN KEY ("B") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
