DO $$
BEGIN
    ALTER TYPE "TipoAuditAction" ADD VALUE IF NOT EXISTS 'OPEN_CASHBOX';
    ALTER TYPE "TipoAuditAction" ADD VALUE IF NOT EXISTS 'CLOSE_CASHBOX';
    ALTER TYPE "TipoAuditAction" ADD VALUE IF NOT EXISTS 'REGISTER_CASHBOX_PAYMENT';
    ALTER TYPE "TipoAuditAction" ADD VALUE IF NOT EXISTS 'VOID_CASHBOX_PAYMENT';
    ALTER TYPE "TipoAuditAction" ADD VALUE IF NOT EXISTS 'REGISTER_CASHBOX_EXPENSE';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "CajaEstado" AS ENUM ('ABIERTA', 'CERRADA');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "EstadoCobroCaja" AS ENUM ('VIGENTE', 'ANULADO');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "egresos"
    ADD COLUMN IF NOT EXISTS "cajaId" TEXT;

CREATE TABLE IF NOT EXISTS "cajas" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "estado" "CajaEstado" NOT NULL DEFAULT 'ABIERTA',
    "fechaApertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaCierre" TIMESTAMP(3),
    "montoInicialSugerido" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "montoInicialReal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "efectivoContado" DECIMAL(10,2),
    "diferenciaEfectivo" DECIMAL(10,2),
    "observacionesApertura" TEXT,
    "observacionesCierre" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cajas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "cobros_caja" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "cajaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "estado" "EstadoCobroCaja" NOT NULL DEFAULT 'VIGENTE',
    "fechaCobro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaAnulacion" TIMESTAMP(3),
    "motivoAnulacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cobros_caja_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
    ALTER TABLE "egresos"
        ADD CONSTRAINT "egresos_cajaId_fkey"
        FOREIGN KEY ("cajaId") REFERENCES "cajas"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "cajas"
        ADD CONSTRAINT "cajas_usuarioId_fkey"
        FOREIGN KEY ("usuarioId") REFERENCES "users"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "cobros_caja"
        ADD CONSTRAINT "cobros_caja_pedidoId_fkey"
        FOREIGN KEY ("pedidoId") REFERENCES "orders"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "cobros_caja"
        ADD CONSTRAINT "cobros_caja_cajaId_fkey"
        FOREIGN KEY ("cajaId") REFERENCES "cajas"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "cobros_caja"
        ADD CONSTRAINT "cobros_caja_usuarioId_fkey"
        FOREIGN KEY ("usuarioId") REFERENCES "users"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "egresos_cajaId_fecha_idx" ON "egresos"("cajaId", "fecha" DESC);
CREATE INDEX IF NOT EXISTS "cajas_usuarioId_estado_idx" ON "cajas"("usuarioId", "estado");
CREATE INDEX IF NOT EXISTS "cajas_estado_fechaApertura_idx" ON "cajas"("estado", "fechaApertura" DESC);
CREATE INDEX IF NOT EXISTS "cajas_fechaApertura_idx" ON "cajas"("fechaApertura" DESC);
CREATE INDEX IF NOT EXISTS "cobros_caja_cajaId_estado_fechaCobro_idx" ON "cobros_caja"("cajaId", "estado", "fechaCobro" DESC);
CREATE INDEX IF NOT EXISTS "cobros_caja_pedidoId_estado_idx" ON "cobros_caja"("pedidoId", "estado");
CREATE INDEX IF NOT EXISTS "cobros_caja_usuarioId_fechaCobro_idx" ON "cobros_caja"("usuarioId", "fechaCobro" DESC);
CREATE INDEX IF NOT EXISTS "cobros_caja_fechaCobro_idx" ON "cobros_caja"("fechaCobro" DESC);
