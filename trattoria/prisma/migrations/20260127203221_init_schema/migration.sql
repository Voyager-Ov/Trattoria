-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'EMPLEADO');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('ACTIVO', 'INACTIVO', 'SUSPENDIDO');

-- CreateEnum
CREATE TYPE "OrigenPedido" AS ENUM ('INTERNO', 'CATALOGO');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('RECIBIDO', 'PENDIENTE', 'EN_PREPARACION', 'LISTO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "UnidadMedida" AS ENUM ('UNIDAD', 'KILOGRAMO', 'GRAMO', 'LITRO', 'MILILITRO', 'PORCION');

-- CreateEnum
CREATE TYPE "TipoMovimientoStock" AS ENUM ('IN', 'OUT', 'AJUSTE');

-- CreateEnum
CREATE TYPE "TipoAuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'CREATE_USER', 'UPDATE_USER', 'DELETE_USER', 'CHANGE_PASSWORD', 'CREATE_PRODUCT', 'UPDATE_PRODUCT', 'DELETE_PRODUCT', 'CREATE_CATEGORY', 'UPDATE_CATEGORY', 'DELETE_CATEGORY', 'CREATE_ORDER', 'UPDATE_ORDER', 'CANCEL_ORDER', 'FINALIZE_ORDER', 'CHANGE_ORDER_STATUS', 'CREATE_STOCK_MOVEMENT', 'ADJUST_STOCK', 'UPDATE_SUPPLY', 'SYSTEM_ERROR', 'UNAUTHORIZED_ACCESS');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firebaseUid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'EMPLEADO',
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'ACTIVO',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "imagen" TEXT,
    "precio" DECIMAL(10,2) NOT NULL,
    "costoUnitario" DECIMAL(10,2),
    "unidad" "UnidadMedida" NOT NULL DEFAULT 'UNIDAD',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "origen" "OrigenPedido" NOT NULL,
    "customerId" TEXT,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'RECIBIDO',
    "recibidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enPreparacionEn" TIMESTAMP(3),
    "listoEn" TIMESTAMP(3),
    "finalizadoEn" TIMESTAMP(3),
    "canceladoEn" TIMESTAMP(3),
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "descuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notas" TEXT,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "nombreProduct" TEXT NOT NULL,
    "cantidad" DECIMAL(10,3) NOT NULL,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "notas" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplies" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "unidad" "UnidadMedida" NOT NULL,
    "stockActual" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "stockMinimo" DECIMAL(10,3),
    "costoUnitario" DECIMAL(10,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "supplies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "supplyId" TEXT NOT NULL,
    "tipo" "TipoMovimientoStock" NOT NULL,
    "cantidad" DECIMAL(10,3) NOT NULL,
    "stockResultante" DECIMAL(10,3) NOT NULL,
    "orderId" TEXT,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_recipe_items" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "supplyId" TEXT NOT NULL,
    "qtyPerUnit" DECIMAL(10,3) NOT NULL,
    "unidad" "UnidadMedida" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_recipe_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT,
    "action" "TipoAuditAction" NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "origin" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_sequences" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "prefijo" TEXT,
    "ultimo" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_firebaseUid_key" ON "users"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_rol_estado_idx" ON "users"("rol", "estado");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "customers_activo_idx" ON "customers"("activo");

-- CreateIndex
CREATE INDEX "customers_deletedAt_idx" ON "customers"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "categories_nombre_key" ON "categories"("nombre");

-- CreateIndex
CREATE INDEX "categories_activo_orden_idx" ON "categories"("activo", "orden");

-- CreateIndex
CREATE INDEX "categories_deletedAt_idx" ON "categories"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "products_nombre_key" ON "products"("nombre");

-- CreateIndex
CREATE INDEX "products_categoryId_activo_idx" ON "products"("categoryId", "activo");

-- CreateIndex
CREATE INDEX "products_activo_disponible_idx" ON "products"("activo", "disponible");

-- CreateIndex
CREATE INDEX "products_deletedAt_idx" ON "products"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "orders_numero_key" ON "orders"("numero");

-- CreateIndex
CREATE INDEX "orders_estado_updatedAt_idx" ON "orders"("estado", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "orders_createdBy_recibidoEn_idx" ON "orders"("createdBy", "recibidoEn" DESC);

-- CreateIndex
CREATE INDEX "orders_recibidoEn_idx" ON "orders"("recibidoEn" DESC);

-- CreateIndex
CREATE INDEX "orders_deletedAt_idx" ON "orders"("deletedAt");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_items_productId_idx" ON "order_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "supplies_nombre_key" ON "supplies"("nombre");

-- CreateIndex
CREATE INDEX "supplies_activo_idx" ON "supplies"("activo");

-- CreateIndex
CREATE INDEX "supplies_stockActual_idx" ON "supplies"("stockActual");

-- CreateIndex
CREATE INDEX "supplies_deletedAt_idx" ON "supplies"("deletedAt");

-- CreateIndex
CREATE INDEX "stock_movements_supplyId_createdAt_idx" ON "stock_movements"("supplyId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "stock_movements_tipo_createdAt_idx" ON "stock_movements"("tipo", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "stock_movements_orderId_idx" ON "stock_movements"("orderId");

-- CreateIndex
CREATE INDEX "product_recipe_items_productId_idx" ON "product_recipe_items"("productId");

-- CreateIndex
CREATE INDEX "product_recipe_items_supplyId_idx" ON "product_recipe_items"("supplyId");

-- CreateIndex
CREATE UNIQUE INDEX "product_recipe_items_productId_supplyId_key" ON "product_recipe_items"("productId", "supplyId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_objectType_objectId_createdAt_idx" ON "audit_logs"("objectType", "objectId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "app_sequences_tipo_key" ON "app_sequences"("tipo");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "supplies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_recipe_items" ADD CONSTRAINT "product_recipe_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_recipe_items" ADD CONSTRAINT "product_recipe_items_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "supplies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
