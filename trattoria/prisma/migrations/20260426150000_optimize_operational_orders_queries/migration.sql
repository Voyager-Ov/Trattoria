CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "orders_operational_status_recibido_idx"
ON "public"."orders" ("estado", "recibidoEn" DESC)
WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "orders_operational_recibido_idx"
ON "public"."orders" ("recibidoEn" DESC)
WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "orders_operational_total_idx"
ON "public"."orders" ("total" DESC)
WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "orders_numero_trgm_idx"
ON "public"."orders" USING GIN ("numero" gin_trgm_ops)
WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "orders_cliente_nombre_trgm_idx"
ON "public"."orders" USING GIN ("clienteNombre" gin_trgm_ops)
WHERE "deletedAt" IS NULL AND "clienteNombre" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "orders_cliente_telefono_trgm_idx"
ON "public"."orders" USING GIN ("clienteTelefono" gin_trgm_ops)
WHERE "deletedAt" IS NULL AND "clienteTelefono" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "customers_nombre_trgm_idx"
ON "public"."customers" USING GIN ("nombre" gin_trgm_ops)
WHERE "deletedAt" IS NULL;
