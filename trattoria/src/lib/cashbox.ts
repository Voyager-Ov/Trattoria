import { Prisma, type CobroCaja, type Egreso } from "@prisma/client";

export const ACTIVE_CASHBOX_PAYMENT_SELECT = Prisma.validator<Prisma.CobroCajaSelect>()({
    id: true,
    monto: true,
    metodoPago: true,
    fechaCobro: true,
    estado: true,
    fechaAnulacion: true,
    motivoAnulacion: true,
    cajaId: true,
});

export type ActiveCashboxPaymentSnapshot = Pick<
    CobroCaja,
    "id" | "monto" | "metodoPago" | "fechaCobro" | "estado" | "fechaAnulacion" | "motivoAnulacion" | "cajaId"
>;

export function buildFinanciallyPaidOrderWhere(start: Date, end: Date): Prisma.OrderWhereInput {
    return {
        deletedAt: null,
        estado: { not: "CANCELADO" },
        OR: [
            {
                cobrosCaja: {
                    some: {
                        estado: "VIGENTE",
                        fechaCobro: {
                            gte: start,
                            lte: end,
                        },
                    },
                },
            },
            {
                cobrado: true,
                cobradoEn: {
                    gte: start,
                    lte: end,
                },
                cobrosCaja: {
                    none: {},
                },
            },
        ],
    };
}

export function getActiveCashboxPayment<T extends { estado: string; fechaCobro: Date }>(
    payments: T[] | undefined | null,
): T | null {
    if (!payments || payments.length === 0) {
        return null;
    }

    return [...payments]
        .filter((payment) => payment.estado === "VIGENTE")
        .sort((a, b) => b.fechaCobro.getTime() - a.fechaCobro.getTime())[0] ?? null;
}

export function resolveFinancialPaymentSnapshot<
    T extends {
        total?: Prisma.Decimal | number;
        cobrado?: boolean;
        cobradoEn?: Date | null;
        metodoPago?: string | null;
        metodoPagoPreferido?: string | null;
        cobrosCaja?: ActiveCashboxPaymentSnapshot[];
    },
>(order: T) {
    const activePayment = getActiveCashboxPayment(order.cobrosCaja);

    if (activePayment) {
        return {
            amount: Number(activePayment.monto),
            paymentDate: activePayment.fechaCobro,
            paymentMethod: activePayment.metodoPago,
            source: "cashbox" as const,
        };
    }

    if (order.cobrado && order.cobradoEn) {
        return {
            amount: Number(order.total ?? 0),
            paymentDate: order.cobradoEn,
            paymentMethod: order.metodoPago || "EFECTIVO",
            source: "legacy" as const,
        };
    }

    return {
        amount: 0,
        paymentDate: null,
        paymentMethod: null,
        source: "none" as const,
    };
}

export function resolveOrderPaymentState<
    T extends {
        total?: Prisma.Decimal | number;
        cobrado?: boolean;
        cobradoEn?: Date | null;
        metodoPago?: string | null;
        metodoPagoPreferido?: string | null;
        cobrosCaja?: ActiveCashboxPaymentSnapshot[];
    },
>(order: T) {
    const snapshot = resolveFinancialPaymentSnapshot(order);
    const preferredMethod =
        order.metodoPagoPreferido ??
        (snapshot.source === "none" ? order.metodoPago ?? null : null);

    return {
        isPaid: snapshot.source !== "none",
        method: snapshot.paymentMethod,
        paidAt: snapshot.paymentDate,
        source: snapshot.source,
        preferredMethod,
        amount: snapshot.amount,
    };
}

export function accumulateAmountsByMethod<
    T extends {
        metodoPago: string;
        monto: Prisma.Decimal | number;
    },
>(entries: T[]) {
    return entries.reduce((accumulator, entry) => {
        const method = entry.metodoPago || "EFECTIVO";

        if (!accumulator[method]) {
            accumulator[method] = 0;
        }

        accumulator[method] += Number(entry.monto);
        return accumulator;
    }, {} as Record<string, number>);
}

export function calculateCashboxExpectedCash(params: {
    montoInicialReal: Prisma.Decimal | number;
    payments: Pick<CobroCaja, "monto" | "metodoPago" | "estado">[];
    expenses: Pick<Egreso, "monto" | "metodoPago">[];
}) {
    const initialCash = Number(params.montoInicialReal);
    const effectivePayments = params.payments.filter((payment) => payment.estado === "VIGENTE");
    const cashRevenue = effectivePayments
        .filter((payment) => payment.metodoPago === "EFECTIVO")
        .reduce((sum, payment) => sum + Number(payment.monto), 0);
    const cashExpenses = params.expenses
        .filter((expense) => expense.metodoPago === "EFECTIVO")
        .reduce((sum, expense) => sum + Number(expense.monto), 0);

    return initialCash + cashRevenue - cashExpenses;
}
