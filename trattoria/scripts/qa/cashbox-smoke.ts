import { CategoriaEgreso, EstadoPagoEgreso, Prisma, Rol, EstadoUsuario } from "@prisma/client";

import { calculateCashboxExpectedCash } from "../../src/lib/cashbox";
import { prisma } from "../../src/lib/prisma";

class ExpectedRollback extends Error {
    constructor() {
        super("QA_ROLLBACK");
    }
}

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) {
        throw new Error(message);
    }
}

async function assertSchemaReady() {
    const [preferredMethodColumn] = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'orders'
              AND column_name = 'metodoPagoPreferido'
        ) AS "exists"
    `;

    const [openCashboxIndex] = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
            SELECT 1
            FROM pg_indexes
            WHERE schemaname = current_schema()
              AND indexname = 'cajas_one_open_per_user_idx'
        ) AS "exists"
    `;

    const [activePaymentIndex] = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
            SELECT 1
            FROM pg_indexes
            WHERE schemaname = current_schema()
              AND indexname = 'cobros_caja_one_vigente_per_pedido_idx'
        ) AS "exists"
    `;

    assert(preferredMethodColumn?.exists, "Falta aplicar la migracion que agrega orders.metodoPagoPreferido");
    assert(openCashboxIndex?.exists, "Falta aplicar la migracion que endurece la unicidad de cajas abiertas");
    assert(activePaymentIndex?.exists, "Falta aplicar la migracion que endurece la unicidad de cobros vigentes");
}

async function expectUniqueViolation(label: string, action: () => Promise<unknown>) {
    try {
        await action();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            console.log(`OK: ${label}`);
            return;
        }

        throw error;
    }

    throw new Error(`Se esperaba una violacion de unicidad: ${label}`);
}

async function main() {
    await assertSchemaReady();

    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    try {
        await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    firebaseUid: `qa-cashbox-${suffix}`,
                    email: `qa-cashbox-${suffix}@example.test`,
                    rol: Rol.EMPLEADO,
                    estado: EstadoUsuario.ACTIVO,
                    displayName: "QA Cashbox",
                },
            });

            const cashbox = await tx.caja.create({
                data: {
                    usuarioId: user.id,
                    estado: "ABIERTA",
                    montoInicialSugerido: 750,
                    montoInicialReal: 1000,
                    observacionesApertura: "QA smoke test",
                },
            });

            console.log(`OK: caja abierta ${cashbox.id}`);

            await expectUniqueViolation("una sola caja ABIERTA por usuario", () =>
                tx.caja.create({
                    data: {
                        usuarioId: user.id,
                        estado: "ABIERTA",
                        montoInicialSugerido: 0,
                        montoInicialReal: 0,
                    },
                })
            );

            const cancelledOrder = await tx.order.create({
                data: {
                    numero: `QA-CANCEL-${suffix}`,
                    origen: "INTERNO",
                    estado: "PENDIENTE",
                    clienteNombre: "QA Cancel",
                    subtotal: 1500,
                    total: 1500,
                },
            });

            const initialPayment = await tx.cobroCaja.create({
                data: {
                    pedidoId: cancelledOrder.id,
                    cajaId: cashbox.id,
                    usuarioId: user.id,
                    monto: 1500,
                    metodoPago: "EFECTIVO",
                    estado: "VIGENTE",
                },
            });

            await tx.order.update({
                where: { id: cancelledOrder.id },
                data: {
                    cobrado: true,
                    cobradoEn: initialPayment.fechaCobro,
                    metodoPago: "EFECTIVO",
                },
            });

            await expectUniqueViolation("un solo cobro VIGENTE por pedido", () =>
                tx.cobroCaja.create({
                    data: {
                        pedidoId: cancelledOrder.id,
                        cajaId: cashbox.id,
                        usuarioId: user.id,
                        monto: 1500,
                        metodoPago: "EFECTIVO",
                        estado: "VIGENTE",
                    },
                })
            );

            const voidedPayment = await tx.cobroCaja.update({
                where: { id: initialPayment.id },
                data: {
                    estado: "ANULADO",
                    fechaAnulacion: new Date(),
                    motivoAnulacion: "QA cancellation",
                },
            });

            await tx.order.update({
                where: { id: cancelledOrder.id },
                data: {
                    estado: "CANCELADO",
                    cobrado: false,
                    cobradoEn: null,
                    metodoPago: null,
                    metodoPagoPreferido: null,
                },
            });

            assert(voidedPayment.estado === "ANULADO", "El cobro cancelado no quedo anulado");
            console.log(`OK: anulado cobro ${voidedPayment.id} por cancelacion`);

            const activeOrder = await tx.order.create({
                data: {
                    numero: `QA-CLOSE-${suffix}`,
                    origen: "INTERNO",
                    estado: "PENDIENTE",
                    clienteNombre: "QA Close",
                    subtotal: 800,
                    total: 800,
                },
            });

            const activePayment = await tx.cobroCaja.create({
                data: {
                    pedidoId: activeOrder.id,
                    cajaId: cashbox.id,
                    usuarioId: user.id,
                    monto: 800,
                    metodoPago: "EFECTIVO",
                    estado: "VIGENTE",
                },
            });

            await tx.order.update({
                where: { id: activeOrder.id },
                data: {
                    cobrado: true,
                    cobradoEn: activePayment.fechaCobro,
                    metodoPago: "EFECTIVO",
                },
            });

            const now = new Date();
            const expense = await tx.egreso.create({
                data: {
                    numero: `QA-EGR-${suffix}`,
                    descripcion: "QA cashbox expense",
                    monto: 125,
                    categoria: CategoriaEgreso.OTROS,
                    metodoPago: "EFECTIVO",
                    estadoPago: EstadoPagoEgreso.PAGADO,
                    fechaPago: now,
                    fechaDevengado: now,
                    cajaId: cashbox.id,
                },
            });

            assert(expense.cajaId === cashbox.id, "El egreso no quedo vinculado a la caja");
            console.log(`OK: egreso ${expense.numero} vinculado a caja`);

            const expectedCash = calculateCashboxExpectedCash({
                montoInicialReal: cashbox.montoInicialReal,
                payments: [voidedPayment, activePayment],
                expenses: [expense],
            });

            assert(Math.abs(expectedCash - 1675) < 0.0001, `Efectivo esperado invalido: ${expectedCash}`);
            console.log(`OK: efectivo esperado ${expectedCash}`);

            const efectivoContado = 1670;
            const difference = efectivoContado - expectedCash;

            const closedCashbox = await tx.caja.update({
                where: { id: cashbox.id },
                data: {
                    estado: "CERRADA",
                    fechaCierre: now,
                    efectivoContado,
                    diferenciaEfectivo: difference,
                    observacionesCierre: "QA close with difference",
                },
            });

            assert(closedCashbox.estado === "CERRADA", "La caja no quedo cerrada");
            assert(
                Math.abs(Number(closedCashbox.diferenciaEfectivo ?? 0) - difference) < 0.0001,
                "La diferencia de cierre no coincide con el arqueo"
            );
            console.log(`OK: cierre de caja con diferencia ${difference}`);

            throw new ExpectedRollback();
        });
    } catch (error) {
        if (error instanceof ExpectedRollback) {
            console.log("Smoke QA de caja completado; transaccion revertida intencionalmente.");
            return;
        }

        throw error;
    }
}

main()
    .catch((error) => {
        console.error("Smoke QA de caja fallo:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
