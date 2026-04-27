import { Prisma, PrismaClient } from "@prisma/client";

type SchemaExistenceRow = { exists: boolean };

export const CASHBOX_SCHEMA_REQUIRED_MESSAGE =
    "La base local no tiene las migraciones de Caja aplicadas. Ejecuta `npm run db:migrate`.";

export class CashboxSchemaError extends Error {
    readonly missingRequirements: string[];

    constructor(missingRequirements: string[]) {
        super(CASHBOX_SCHEMA_REQUIRED_MESSAGE);
        this.name = "CashboxSchemaError";
        this.missingRequirements = missingRequirements;
    }
}

export const CASHBOX_DB_UNREACHABLE_MESSAGE =
    "No se pudo conectar a la base de datos para verificar Caja. Revisa la conexion y vuelve a ejecutar `npm run db:migrate` o `npm run dev`.";

async function queryExists(
    prisma: PrismaClient | Prisma.TransactionClient,
    query: Prisma.Sql,
) {
    const [row] = await prisma.$queryRaw<SchemaExistenceRow[]>(query);
    return Boolean(row?.exists);
}

export async function checkCashboxSchema(prisma: PrismaClient | Prisma.TransactionClient) {
    await prisma.$queryRaw`SELECT 1`;

    const [hasCashboxesTable, hasCashboxPaymentsTable, hasPreferredMethodColumn, hasCashboxIdOnExpenses] = await Promise.all([
        queryExists(
            prisma,
            Prisma.sql`
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = current_schema()
                      AND table_name = 'cajas'
                ) AS "exists"
            `,
        ),
        queryExists(
            prisma,
            Prisma.sql`
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = current_schema()
                      AND table_name = 'cobros_caja'
                ) AS "exists"
            `,
        ),
        queryExists(
            prisma,
            Prisma.sql`
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = current_schema()
                      AND table_name = 'orders'
                      AND column_name = 'metodoPagoPreferido'
                ) AS "exists"
            `,
        ),
        queryExists(
            prisma,
            Prisma.sql`
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = current_schema()
                      AND table_name = 'egresos'
                      AND column_name = 'cajaId'
                ) AS "exists"
            `,
        ),
    ]);

    const missingRequirements: string[] = [];

    if (!hasCashboxesTable) {
        missingRequirements.push("tabla public.cajas");
    }
    if (!hasCashboxPaymentsTable) {
        missingRequirements.push("tabla public.cobros_caja");
    }
    if (!hasPreferredMethodColumn) {
        missingRequirements.push("columna orders.metodoPagoPreferido");
    }
    if (!hasCashboxIdOnExpenses) {
        missingRequirements.push("columna egresos.cajaId");
    }

    return {
        isReady: missingRequirements.length === 0,
        missingRequirements,
    };
}

export async function ensureCashboxSchemaReady(prisma: PrismaClient | Prisma.TransactionClient) {
    const result = await checkCashboxSchema(prisma);

    if (!result.isReady) {
        throw new CashboxSchemaError(result.missingRequirements);
    }
}

export function isCashboxSchemaError(error: unknown): error is CashboxSchemaError {
    return error instanceof CashboxSchemaError;
}

export function isMissingCashboxSchemaPrismaError(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

export function isCashboxDbConnectionError(error: unknown) {
    return error instanceof Prisma.PrismaClientInitializationError;
}

export function toCashboxSchemaError(error: unknown) {
    if (isCashboxSchemaError(error)) {
        return error;
    }

    if (isMissingCashboxSchemaPrismaError(error)) {
        return new CashboxSchemaError(["schema Prisma de Caja no disponible"]);
    }

    return error;
}
