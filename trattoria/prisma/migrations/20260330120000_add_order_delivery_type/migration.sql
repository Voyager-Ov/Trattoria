CREATE TYPE "TipoEntregaPedido" AS ENUM ('DELIVERY', 'RETIRO');

ALTER TABLE "orders"
ADD COLUMN "tipoEntrega" "TipoEntregaPedido";

UPDATE "orders"
SET "tipoEntrega" = 'RETIRO'
WHERE "clienteDireccion" = 'Retiro en Local';

UPDATE "orders"
SET "tipoEntrega" = 'DELIVERY'
WHERE "tipoEntrega" IS NULL
  AND "origen" = 'CATALOGO'
  AND "clienteDireccion" IS NOT NULL
  AND BTRIM("clienteDireccion") <> ''
  AND "clienteDireccion" <> 'Retiro en Local';
