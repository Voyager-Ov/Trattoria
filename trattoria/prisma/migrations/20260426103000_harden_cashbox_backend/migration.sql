ALTER TABLE "orders"
    ADD COLUMN IF NOT EXISTS "metodoPagoPreferido" TEXT;

UPDATE "orders"
SET
    "metodoPagoPreferido" = COALESCE("metodoPagoPreferido", "metodoPago"),
    "metodoPago" = NULL
WHERE
    "cobrado" = FALSE
    AND "metodoPago" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "cajas_one_open_per_user_idx"
    ON "cajas" ("usuarioId")
    WHERE "estado" = 'ABIERTA';

CREATE UNIQUE INDEX IF NOT EXISTS "cobros_caja_one_vigente_per_pedido_idx"
    ON "cobros_caja" ("pedidoId")
    WHERE "estado" = 'VIGENTE';
