DO $$
BEGIN
    CREATE TYPE "EstadoPagoEgreso" AS ENUM ('PENDIENTE', 'PAGADO', 'VENCIDO', 'ANULADO');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "EstadoCompra" AS ENUM ('RECIBIDO', 'PAGADA', 'ANULADA');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "providers" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cuit" TEXT,
    "contacto" TEXT,
    "direccion" TEXT,
    "email" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "purchases" (
    "id" TEXT NOT NULL,
    "numero" TEXT,
    "providerId" TEXT NOT NULL,
    "subtotal" DECIMAL(10, 2),
    "impuestos" DECIMAL(10, 2),
    "total" DECIMAL(10, 2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoCompra" NOT NULL DEFAULT 'RECIBIDO',
    "observaciones" TEXT,
    "egresoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "purchases_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "purchases_egresoId_fkey" FOREIGN KEY ("egresoId") REFERENCES "egresos"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "purchase_items" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "supplyId" TEXT NOT NULL,
    "cantidad" DECIMAL(10, 3) NOT NULL,
    "precioUnit" DECIMAL(10, 2) NOT NULL,
    CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "purchase_items_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "purchase_items_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "supplies"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

ALTER TABLE "orders"
    ADD COLUMN IF NOT EXISTS "canalVenta" TEXT,
    ADD COLUMN IF NOT EXISTS "deliveryFee" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "costoCanal" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "promisedAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3);

ALTER TABLE "egresos"
    ADD COLUMN IF NOT EXISTS "providerId" TEXT,
    ADD COLUMN IF NOT EXISTS "metodoPago" TEXT NOT NULL DEFAULT 'EFECTIVO',
    ADD COLUMN IF NOT EXISTS "comprobante" TEXT,
    ADD COLUMN IF NOT EXISTS "estadoPago" "EstadoPagoEgreso" NOT NULL DEFAULT 'PAGADO',
    ADD COLUMN IF NOT EXISTS "tipoComprobante" TEXT,
    ADD COLUMN IF NOT EXISTS "numeroComprobante" TEXT,
    ADD COLUMN IF NOT EXISTS "centroCosto" TEXT,
    ADD COLUMN IF NOT EXISTS "fechaDevengado" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "fechaPago" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "fechaVencimiento" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "periodoDesde" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "periodoHasta" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "neto" DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS "impuestos" DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS "percepciones" DECIMAL(10, 2);

ALTER TABLE "purchases"
    ADD COLUMN IF NOT EXISTS "numero" TEXT,
    ADD COLUMN IF NOT EXISTS "subtotal" DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS "impuestos" DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS "observaciones" TEXT;

CREATE INDEX IF NOT EXISTS "orders_cobradoEn_idx" ON "orders"("cobradoEn" DESC);
CREATE INDEX IF NOT EXISTS "orders_finalizadoEn_idx" ON "orders"("finalizadoEn" DESC);
CREATE INDEX IF NOT EXISTS "egresos_providerId_fecha_idx" ON "egresos"("providerId", "fecha" DESC);
CREATE INDEX IF NOT EXISTS "egresos_estadoPago_fecha_idx" ON "egresos"("estadoPago", "fecha" DESC);
CREATE INDEX IF NOT EXISTS "purchases_providerId_fecha_idx" ON "purchases"("providerId", "fecha" DESC);
CREATE INDEX IF NOT EXISTS "purchases_estado_fecha_idx" ON "purchases"("estado", "fecha" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS "purchases_numero_key" ON "purchases"("numero");
CREATE UNIQUE INDEX IF NOT EXISTS "purchases_egresoId_key" ON "purchases"("egresoId");
CREATE UNIQUE INDEX IF NOT EXISTS "providers_cuit_key" ON "providers"("cuit");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'egresos_providerId_fkey'
    ) THEN
        ALTER TABLE "egresos"
            ADD CONSTRAINT "egresos_providerId_fkey"
            FOREIGN KEY ("providerId") REFERENCES "providers"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
