"use server";

import { CategoriaEgreso, EstadoPagoEgreso, Prisma, type User } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { getConfigs } from "@/app/actions/configActions";
import { DEFAULT_PAYMENT_METHODS } from "@/lib/configDefaults";
import {
    ACTIVE_CASHBOX_PAYMENT_SELECT,
    accumulateAmountsByMethod,
    calculateCashboxExpectedCash,
    getActiveCashboxPayment,
} from "@/lib/cashbox";
import {
    CASHBOX_SCHEMA_REQUIRED_MESSAGE,
    ensureCashboxSchemaReady,
    isCashboxSchemaError,
    toCashboxSchemaError,
} from "@/lib/cashboxSchema";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/serverAuth";
import { serializePrisma } from "@/lib/utils";
import { getSystemNow } from "@/lib/system-time";

type PaymentMethodOption = {
    id: string;
    label: string;
    enabled: boolean;
};

type CashboxMovement = {
    id: string;
    type: "APERTURA" | "COBRO" | "ANULACION_COBRO" | "EGRESO" | "CIERRE";
    happenedAt: Date;
    title: string;
    description: string;
    amount: number;
    methodId: string | null;
    orderId?: string | null;
};

type CashboxSummary = {
    id: string;
    estado: "ABIERTA" | "CERRADA";
    usuarioId: string;
    usuarioNombre: string;
    fechaApertura: Date;
    fechaCierre: Date | null;
    montoInicialSugerido: number;
    montoInicialReal: number;
    efectivoContado: number | null;
    diferenciaEfectivo: number | null;
    observacionesApertura: string | null;
    observacionesCierre: string | null;
    totalCobrado: number;
    totalEgresos: number;
    efectivoEsperado: number;
    methodTotals: Array<{
        methodId: string;
        label: string;
        paymentsAmount: number;
        paymentsCount: number;
        expensesAmount: number;
        netAmount: number;
    }>;
    movements: CashboxMovement[];
};

const CASHBOX_INCLUDE = {
    usuario: {
        select: {
            id: true,
            displayName: true,
            email: true,
        },
    },
    cobros: {
        orderBy: {
            fechaCobro: "desc" as const,
        },
        include: {
            pedido: {
                select: {
                    id: true,
                    numero: true,
                    clienteNombre: true,
                },
            },
        },
    },
    egresos: {
        where: {
            deletedAt: null,
        },
        orderBy: {
            fecha: "desc" as const,
        },
        select: {
            id: true,
            numero: true,
            descripcion: true,
            categoria: true,
            monto: true,
            metodoPago: true,
            fecha: true,
        },
    },
} satisfies Prisma.CajaInclude;

async function getPaymentMethodOptions() {
    const result = await getConfigs(["payments.methods"]);
    const configuredMethods = result.success
        ? (result.data?.["payments.methods"] as PaymentMethodOption[] | undefined)
        : undefined;
    const methods = configuredMethods && configuredMethods.length > 0
        ? configuredMethods
        : DEFAULT_PAYMENT_METHODS;

    return methods.filter((method) => method.enabled);
}

function getUserLabel(user: Pick<User, "displayName" | "email">) {
    return user.displayName || user.email || "Usuario";
}

function getMethodLabel(methodId: string, methods: PaymentMethodOption[]) {
    return methods.find((method) => method.id === methodId)?.label || methodId;
}

function normalizeOptionalString(value?: string | null) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
}

function assertNonNegativeAmount(value: number, label: string) {
    if (!Number.isFinite(value) || value < 0) {
        throw new Error(`${label} debe ser mayor o igual a 0`);
    }
}

function assertPositiveAmount(value: number, label: string) {
    if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`${label} debe ser mayor a 0`);
    }
}

async function assertEnabledPaymentMethod(methodId: string) {
    const normalizedMethodId = normalizeOptionalString(methodId);

    if (!normalizedMethodId) {
        throw new Error("Debes seleccionar un metodo de pago");
    }

    const methods = await getPaymentMethodOptions();
    const selectedMethod = methods.find((method) => method.id === normalizedMethodId);

    if (!selectedMethod) {
        throw new Error("El metodo de pago seleccionado no esta habilitado");
    }

    return {
        methodId: normalizedMethodId,
        methods,
        label: selectedMethod.label,
    };
}

async function resolveProviderFromName(
    tx: Prisma.TransactionClient,
    proveedor?: string,
) {
    const normalizedProvider = normalizeOptionalString(proveedor);
    if (!normalizedProvider) {
        return {
            providerId: null,
            proveedor: null,
        };
    }

    const existingProvider = await tx.provider.findFirst({
        where: {
            nombre: {
                equals: normalizedProvider,
                mode: "insensitive",
            },
        },
        select: {
            id: true,
            nombre: true,
        },
    });

    if (existingProvider) {
        return {
            providerId: existingProvider.id,
            proveedor: existingProvider.nombre,
        };
    }

    const createdProvider = await tx.provider.create({
        data: {
            nombre: normalizedProvider,
            activo: true,
        },
        select: {
            id: true,
            nombre: true,
        },
    });

    return {
        providerId: createdProvider.id,
        proveedor: createdProvider.nombre,
    };
}

function buildCashboxSummary(
    caja: Prisma.CajaGetPayload<{ include: typeof CASHBOX_INCLUDE }>,
    methods: PaymentMethodOption[],
): CashboxSummary {
    const validPayments = caja.cobros.filter((payment) => payment.estado === "VIGENTE");
    const paymentTotals = accumulateAmountsByMethod(validPayments);
    const paymentCounts = validPayments.reduce((accumulator, payment) => {
        accumulator[payment.metodoPago] = (accumulator[payment.metodoPago] || 0) + 1;
        return accumulator;
    }, {} as Record<string, number>);
    const expenseTotals = accumulateAmountsByMethod(caja.egresos);
    const totalCobrado = validPayments.reduce((sum, payment) => sum + Number(payment.monto), 0);
    const totalEgresos = caja.egresos.reduce((sum, expense) => sum + Number(expense.monto), 0);
    const efectivoEsperado = calculateCashboxExpectedCash({
        montoInicialReal: caja.montoInicialReal,
        payments: validPayments,
        expenses: caja.egresos,
    });

    const methodIds = new Set<string>([
        ...methods.map((method) => method.id),
        ...Object.keys(paymentTotals),
        ...Object.keys(expenseTotals),
    ]);

    const methodTotals = Array.from(methodIds).map((methodId) => {
        const paymentsAmount = paymentTotals[methodId] || 0;
        const expensesAmount = expenseTotals[methodId] || 0;

        return {
            methodId,
            label: getMethodLabel(methodId, methods),
            paymentsAmount,
            paymentsCount: paymentCounts[methodId] || 0,
            expensesAmount,
            netAmount: paymentsAmount - expensesAmount,
        };
    }).sort((a, b) => b.paymentsAmount - a.paymentsAmount);

    const movements: CashboxMovement[] = [
        {
            id: `opening-${caja.id}`,
            type: "APERTURA" as const,
            happenedAt: caja.fechaApertura,
            title: "Apertura de caja",
            description: `Caja abierta por ${getUserLabel(caja.usuario)}`,
            amount: Number(caja.montoInicialReal),
            methodId: "EFECTIVO",
        },
        ...caja.cobros.flatMap((payment) => {
            const baseMovement: CashboxMovement = {
                id: payment.id,
                type: "COBRO",
                happenedAt: payment.fechaCobro,
                title: `Cobro ${payment.pedido.numero}`,
                description: payment.pedido.clienteNombre || "Venta de mostrador",
                amount: Number(payment.monto),
                methodId: payment.metodoPago,
                orderId: payment.pedidoId,
            };

            if (payment.estado !== "ANULADO" || !payment.fechaAnulacion) {
                return [baseMovement];
            }

                return [
                    baseMovement,
                    {
                        id: `${payment.id}-void`,
                        type: "ANULACION_COBRO" as const,
                        happenedAt: payment.fechaAnulacion,
                        title: `Anulacion ${payment.pedido.numero}`,
                        description: payment.motivoAnulacion || "Cobro anulado por cancelacion",
                        amount: Number(payment.monto),
                    methodId: payment.metodoPago,
                    orderId: payment.pedidoId,
                },
            ];
        }),
        ...caja.egresos.map((expense) => ({
            id: expense.id,
            type: "EGRESO" as const,
            happenedAt: expense.fecha,
            title: expense.numero,
            description: expense.descripcion,
            amount: Number(expense.monto),
            methodId: expense.metodoPago,
        })),
        ...(caja.fechaCierre ? [{
            id: `closing-${caja.id}`,
            type: "CIERRE" as const,
            happenedAt: caja.fechaCierre,
            title: "Cierre de caja",
            description: caja.observacionesCierre || "Caja cerrada",
            amount: Number(caja.efectivoContado || 0),
            methodId: "EFECTIVO",
        }] : []),
    ].sort((a, b) => b.happenedAt.getTime() - a.happenedAt.getTime());

    return {
        id: caja.id,
        estado: caja.estado,
        usuarioId: caja.usuarioId,
        usuarioNombre: getUserLabel(caja.usuario),
        fechaApertura: caja.fechaApertura,
        fechaCierre: caja.fechaCierre,
        montoInicialSugerido: Number(caja.montoInicialSugerido),
        montoInicialReal: Number(caja.montoInicialReal),
        efectivoContado: caja.efectivoContado != null ? Number(caja.efectivoContado) : null,
        diferenciaEfectivo: caja.diferenciaEfectivo != null ? Number(caja.diferenciaEfectivo) : null,
        observacionesApertura: caja.observacionesApertura,
        observacionesCierre: caja.observacionesCierre,
        totalCobrado,
        totalEgresos,
        efectivoEsperado,
        methodTotals,
        movements,
    };
}

async function getSuggestedOpeningAmount(tx: Prisma.TransactionClient | typeof prisma) {
    const lastClosedCashbox = await tx.caja.findFirst({
        where: {
            estado: "CERRADA",
            fechaCierre: {
                not: null,
            },
        },
        orderBy: {
            fechaCierre: "desc",
        },
        select: {
            efectivoContado: true,
            montoInicialReal: true,
        },
    });

    if (!lastClosedCashbox) {
        return 0;
    }

    return Number(lastClosedCashbox.efectivoContado ?? lastClosedCashbox.montoInicialReal ?? 0);
}

async function getOpenCashboxForUser(
    tx: Prisma.TransactionClient | typeof prisma,
    usuarioId: string,
) {
    return tx.caja.findFirst({
        where: {
            usuarioId,
            estado: "ABIERTA",
        },
        include: CASHBOX_INCLUDE,
        orderBy: {
            fechaApertura: "desc",
        },
    });
}

function revalidateCashboxSurfaces() {
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/dashboard/pedidos");
    revalidatePath("/empleado/pedidos");
    revalidatePath("/admin/dashboard/reportes");
    revalidatePath("/admin/dashboard/reportes/ingresos");
    revalidatePath("/admin/dashboard/reportes/egresos");
}

async function createAuditLog(
    tx: Prisma.TransactionClient,
    params: {
        actorId: string;
        actorRole: string;
        action: Prisma.AuditLogCreateInput["action"];
        objectType: string;
        objectId: string;
        notes: string;
        before?: Prisma.InputJsonValue;
        after?: Prisma.InputJsonValue;
        reason?: string;
    },
) {
    await tx.auditLog.create({
        data: {
            actorId: params.actorId,
            actorRole: params.actorRole,
            action: params.action,
            objectType: params.objectType,
            objectId: params.objectId,
            before: params.before,
            after: params.after,
            notes: params.notes,
            reason: params.reason,
            origin: "WEB",
        },
    });
}

export async function getCurrentCashbox() {
    const user = await requireEmployee();

    try {
        await ensureCashboxSchemaReady(prisma);

        const [methods, currentCashbox, suggestedOpeningAmount] = await Promise.all([
            getPaymentMethodOptions(),
            getOpenCashboxForUser(prisma, user.id),
            getSuggestedOpeningAmount(prisma),
        ]);

        return {
            success: true,
            data: serializePrisma({
                currentUser: {
                    id: user.id,
                    rol: user.rol,
                    displayName: user.displayName || user.email,
                },
                paymentMethods: methods,
                suggestedOpeningAmount,
                currentCashbox: currentCashbox ? buildCashboxSummary(currentCashbox, methods) : null,
            }),
        };
    } catch (error) {
        const normalizedError = toCashboxSchemaError(error);

        if (isCashboxSchemaError(normalizedError)) {
            console.error("Cashbox schema error while getting current cashbox:", normalizedError.message, normalizedError.missingRequirements);
            return { success: false, error: CASHBOX_SCHEMA_REQUIRED_MESSAGE };
        }

        console.error("Error getting current cashbox:", error);
        return { success: false, error: "No se pudo obtener la caja actual" };
    }
}

export async function getCashboxHistory(limit: number = 20) {
    // Note: requireEmployee validates the session but we don't filter by user.
    // ADMIN sees all cashboxes from all employees (global view).
    await requireEmployee();

    try {
        await ensureCashboxSchemaReady(prisma);

        const methods = await getPaymentMethodOptions();
        const history = await prisma.caja.findMany({
            // No usuarioId filter — return all cashboxes across all users
            include: CASHBOX_INCLUDE,
            orderBy: {
                fechaApertura: "desc",
            },
            take: limit,
        });

        return {
            success: true,
            data: serializePrisma(history.map((cashbox) => buildCashboxSummary(cashbox, methods))),
        };
    } catch (error) {
        const normalizedError = toCashboxSchemaError(error);

        if (isCashboxSchemaError(normalizedError)) {
            console.error("Cashbox schema error while getting cashbox history:", normalizedError.message, normalizedError.missingRequirements);
            return { success: false, error: CASHBOX_SCHEMA_REQUIRED_MESSAGE };
        }

        console.error("Error getting cashbox history:", error);
        return { success: false, error: "No se pudo obtener el historial de caja" };
    }
}

export async function getCashboxSummary() {
    const current = await getCurrentCashbox();

    if (!current.success) {
        return current;
    }

    const currentData = (current.data ?? {}) as {
        currentCashbox?: CashboxSummary | null;
    };

    return {
        success: true,
        data: currentData.currentCashbox || null,
    };
}

export async function openCashbox(input: {
    montoInicialReal: number;
    observacionesApertura?: string;
}) {
    const user = await requireEmployee();

    try {
        assertNonNegativeAmount(input.montoInicialReal, "El monto inicial real");
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "No se pudo abrir la caja",
        };
    }

    try {
        await ensureCashboxSchemaReady(prisma);

        const result = await prisma.$transaction(async (tx) => {
            const existing = await getOpenCashboxForUser(tx, user.id);
            if (existing) {
                throw new Error("Ya tienes una caja abierta");
            }

            const suggestedOpeningAmount = await getSuggestedOpeningAmount(tx);
            const cashbox = await tx.caja.create({
                data: {
                    usuarioId: user.id,
                    estado: "ABIERTA",
                    montoInicialSugerido: suggestedOpeningAmount,
                    montoInicialReal: input.montoInicialReal,
                    observacionesApertura: input.observacionesApertura?.trim() || null,
                },
                include: CASHBOX_INCLUDE,
            });

            await createAuditLog(tx, {
                actorId: user.id,
                actorRole: user.rol,
                action: "OPEN_CASHBOX",
                objectType: "caja",
                objectId: cashbox.id,
                after: serializePrisma(cashbox) as Prisma.InputJsonValue,
                notes: `Caja abierta por ${getUserLabel(user)}`,
            });

            return cashbox;
        });

        revalidateCashboxSurfaces();

        return {
            success: true,
            data: serializePrisma(result),
        };
    } catch (error) {
        const normalizedError = toCashboxSchemaError(error);
        if (isCashboxSchemaError(normalizedError)) {
            console.error("Cashbox schema error while opening cashbox:", normalizedError.message, normalizedError.missingRequirements);
            return {
                success: false,
                error: CASHBOX_SCHEMA_REQUIRED_MESSAGE,
            };
        }

        console.error("Error opening cashbox:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return {
                success: false,
                error: "Ya tienes una caja abierta",
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "No se pudo abrir la caja",
        };
    }
}

export async function registerCashboxPayment(orderId: string, metodoPago: string) {
    const user = await requireEmployee();

    try {
        await ensureCashboxSchemaReady(prisma);

        const paymentMethod = await assertEnabledPaymentMethod(metodoPago);
        const result = await prisma.$transaction(async (tx) => {
            const cashbox = await getOpenCashboxForUser(tx, user.id);
            if (!cashbox) {
                throw new Error("Debes abrir una caja antes de cobrar pedidos");
            }

            const order = await tx.order.findUnique({
                where: { id: orderId },
                select: {
                    id: true,
                    numero: true,
                    estado: true,
                    cobrado: true,
                    total: true,
                    cobrosCaja: {
                        select: ACTIVE_CASHBOX_PAYMENT_SELECT,
                    },
                },
            });

            if (!order) {
                throw new Error("Pedido no encontrado");
            }

            if (order.estado === "CANCELADO") {
                throw new Error("No se puede cobrar un pedido cancelado");
            }

            if (getActiveCashboxPayment(order.cobrosCaja) || order.cobrado) {
                throw new Error("El pedido ya tiene un cobro registrado");
            }

            const paidAt = getSystemNow();
            const payment = await tx.cobroCaja.create({
                data: {
                    pedidoId: order.id,
                    cajaId: cashbox.id,
                    usuarioId: user.id,
                    monto: order.total,
                    metodoPago: paymentMethod.methodId,
                    estado: "VIGENTE",
                    fechaCobro: paidAt,
                },
            });

            const updatedOrder = await tx.order.update({
                where: { id: order.id },
                data: {
                    cobrado: true,
                    cobradoEn: paidAt,
                    metodoPago: paymentMethod.methodId,
                    metodoPagoPreferido: null,
                    events: {
                        create: {
                            tipo: "COBRO",
                            descripcion: `Pedido cobrado (${paymentMethod.label})`,
                            actorId: user.id,
                            actorName: getUserLabel(user),
                        },
                    },
                },
            });

            await createAuditLog(tx, {
                actorId: user.id,
                actorRole: user.rol,
                action: "REGISTER_CASHBOX_PAYMENT",
                objectType: "cobro_caja",
                objectId: payment.id,
                after: serializePrisma(payment) as Prisma.InputJsonValue,
                notes: `Cobro registrado para pedido ${order.numero}`,
            });

            return { payment, order: updatedOrder, cashboxId: cashbox.id };
        });

        revalidateCashboxSurfaces();

        return {
            success: true,
            data: serializePrisma(result),
        };
    } catch (error) {
        const normalizedError = toCashboxSchemaError(error);
        if (isCashboxSchemaError(normalizedError)) {
            console.error("Cashbox schema error while registering payment:", normalizedError.message, normalizedError.missingRequirements);
            return {
                success: false,
                error: CASHBOX_SCHEMA_REQUIRED_MESSAGE,
            };
        }

        console.error("Error registering cashbox payment:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return {
                success: false,
                error: "El pedido ya tiene un cobro registrado",
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "No se pudo registrar el cobro",
        };
    }
}

export async function voidCashboxPaymentForCancellation(
    tx: Prisma.TransactionClient,
    params: {
        orderId: string;
        reason: string;
        actorId: string | null;
        actorName: string | null;
        actorRole?: string | null;
    },
) {
    const payment = await tx.cobroCaja.findFirst({
        where: {
            pedidoId: params.orderId,
            estado: "VIGENTE",
        },
        orderBy: {
            fechaCobro: "desc",
        },
    });

    if (!payment) {
        return null;
    }

    const voidedAt = getSystemNow();
    const updatedPayment = await tx.cobroCaja.update({
        where: { id: payment.id },
        data: {
            estado: "ANULADO",
            fechaAnulacion: voidedAt,
            motivoAnulacion: params.reason,
        },
    });

    await createAuditLog(tx, {
        actorId: params.actorId || payment.usuarioId,
        actorRole: params.actorRole || "EMPLEADO",
        action: "VOID_CASHBOX_PAYMENT",
        objectType: "cobro_caja",
        objectId: payment.id,
        before: serializePrisma(payment) as Prisma.InputJsonValue,
        after: serializePrisma(updatedPayment) as Prisma.InputJsonValue,
        notes: `Cobro anulado por cancelacion del pedido ${payment.pedidoId}`,
        reason: params.reason,
    });

    return updatedPayment;
}

export async function registerCashboxExpense(input: {
    descripcion: string;
    monto: number;
    categoria: CategoriaEgreso;
    metodoPago: string;
    proveedor?: string;
}) {
    const user = await requireEmployee();

    try {
        await ensureCashboxSchemaReady(prisma);

        const description = normalizeOptionalString(input.descripcion);
        if (!description) {
            throw new Error("La descripcion es obligatoria");
        }

        assertPositiveAmount(input.monto, "El monto");
        const paymentMethod = await assertEnabledPaymentMethod(input.metodoPago);

        const result = await prisma.$transaction(async (tx) => {
            const cashbox = await getOpenCashboxForUser(tx, user.id);
            if (!cashbox) {
                throw new Error("Debes abrir una caja antes de registrar egresos");
            }

            const provider = await resolveProviderFromName(tx, input.proveedor);
            const now = getSystemNow();

            const sequence = await tx.appSequence.upsert({
                where: { tipo: "egreso" },
                update: { ultimo: { increment: 1 } },
                create: { tipo: "egreso", prefijo: "E-", ultimo: 1 },
            });
            const numero = `${sequence.prefijo}${sequence.ultimo.toString().padStart(3, "0")}`;

            const expense = await tx.egreso.create({
                data: {
                    numero,
                    descripcion: description,
                    monto: input.monto,
                    categoria: input.categoria,
                    fecha: now,
                    proveedor: provider.proveedor,
                    providerId: provider.providerId,
                    metodoPago: paymentMethod.methodId,
                    estadoPago: EstadoPagoEgreso.PAGADO,
                    fechaPago: now,
                    fechaDevengado: now,
                    neto: input.monto,
                    impuestos: 0,
                    percepciones: 0,
                    cajaId: cashbox.id,
                },
            });

            await createAuditLog(tx, {
                actorId: user.id,
                actorRole: user.rol,
                action: "REGISTER_CASHBOX_EXPENSE",
                objectType: "egreso",
                objectId: expense.id,
                after: serializePrisma(expense) as Prisma.InputJsonValue,
                notes: `Egreso ${numero} registrado desde caja`,
            });

            return expense;
        });

        revalidateCashboxSurfaces();

        return {
            success: true,
            data: serializePrisma(result),
        };
    } catch (error) {
        const normalizedError = toCashboxSchemaError(error);
        if (isCashboxSchemaError(normalizedError)) {
            console.error("Cashbox schema error while registering expense:", normalizedError.message, normalizedError.missingRequirements);
            return {
                success: false,
                error: CASHBOX_SCHEMA_REQUIRED_MESSAGE,
            };
        }

        console.error("Error registering cashbox expense:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "No se pudo registrar el egreso",
        };
    }
}

export async function closeCashbox(input: {
    efectivoContado: number;
    observacionesCierre?: string;
}) {
    const user = await requireEmployee();

    try {
        assertNonNegativeAmount(input.efectivoContado, "El efectivo contado");
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "No se pudo cerrar la caja",
        };
    }

    try {
        await ensureCashboxSchemaReady(prisma);

        const result = await prisma.$transaction(async (tx) => {
            const cashbox = await getOpenCashboxForUser(tx, user.id);
            if (!cashbox) {
                throw new Error("No tienes una caja abierta");
            }

            const efectivoEsperado = calculateCashboxExpectedCash({
                montoInicialReal: cashbox.montoInicialReal,
                payments: cashbox.cobros,
                expenses: cashbox.egresos,
            });
            const diferenciaEfectivo = input.efectivoContado - efectivoEsperado;

            if (Math.abs(diferenciaEfectivo) > 0.009 && !input.observacionesCierre?.trim()) {
                throw new Error("Debes registrar una observacion cuando hay diferencia de efectivo");
            }

            const closedCashbox = await tx.caja.update({
                where: { id: cashbox.id },
                data: {
                    estado: "CERRADA",
                    fechaCierre: getSystemNow(),
                    efectivoContado: input.efectivoContado,
                    diferenciaEfectivo,
                    observacionesCierre: input.observacionesCierre?.trim() || null,
                },
                include: CASHBOX_INCLUDE,
            });

            await createAuditLog(tx, {
                actorId: user.id,
                actorRole: user.rol,
                action: "CLOSE_CASHBOX",
                objectType: "caja",
                objectId: cashbox.id,
                before: serializePrisma(cashbox) as Prisma.InputJsonValue,
                after: serializePrisma(closedCashbox) as Prisma.InputJsonValue,
                notes: `Caja cerrada por ${getUserLabel(user)}`,
            });

            return closedCashbox;
        });

        revalidateCashboxSurfaces();

        return {
            success: true,
            data: serializePrisma(result),
        };
    } catch (error) {
        const normalizedError = toCashboxSchemaError(error);
        if (isCashboxSchemaError(normalizedError)) {
            console.error("Cashbox schema error while closing cashbox:", normalizedError.message, normalizedError.missingRequirements);
            return {
                success: false,
                error: CASHBOX_SCHEMA_REQUIRED_MESSAGE,
            };
        }

        console.error("Error closing cashbox:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "No se pudo cerrar la caja",
        };
    }
}
