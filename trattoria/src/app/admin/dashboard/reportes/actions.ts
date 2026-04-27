"use server";

import { CategoriaEgreso, EstadoPedido, Prisma } from "@prisma/client";
import { endOfDay, startOfDay, subMilliseconds } from "date-fns";

import {
    ACTIVE_CASHBOX_PAYMENT_SELECT,
    buildFinanciallyPaidOrderWhere,
    resolveFinancialPaymentSnapshot,
    resolveOrderPaymentState,
} from "@/lib/cashbox";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/serverAuth";

export type FinancialSummary = {
    basis: ReportBasis;
    totalRevenue: number;
    grossSales: number;
    discounts: number;
    discountRate: number;
    netSales: number;
    totalExpenses: number;
    laborCost: number;
    cogs: number;
    grossProfit: number;
    operatingResult: number;
    primeCost: number;
    primeCostPct: number;
    netMarginPct: number;
    avgItemsPerOrder: number;
    comparisonPrevRevenuePct: number;
    comparisonPrevOrdersPct: number;
    breakEvenTarget: number;
    breakEvenProgressPct: number;
    completionRate: number;
    paymentRate: number;
    cancellationRate: number;
    totalOrders: number;
    averageTicket: number;
    ordersByStatus: { [key: string]: number };
    ordersByPaymentMethod: { [key: string]: number };
    ordersByDeliveryType: { [key: string]: number };
    revenueByDay: { [key: string]: { revenue: number; count: number } };
};

export type ReportBasis = "operativo" | "caja" | "devengado";

type FinancialPaymentOrder = Parameters<typeof resolveFinancialPaymentSnapshot>[0];
type CashboxPaymentSnapshot = NonNullable<FinancialPaymentOrder["cobrosCaja"]>[number];

type ReportOrderItem = {
    id: string;
    productId: string | null;
    cantidad: Prisma.Decimal | number;
    precioUnitario: Prisma.Decimal | number;
    subtotal: Prisma.Decimal | number;
    product: {
        costoUnitario: Prisma.Decimal | null;
        recipeItems: Array<{
            qtyPerUnit: Prisma.Decimal;
            supply: {
                costoUnitario: Prisma.Decimal | null;
            };
        }>;
    } | null;
};

type ReportOrderRecord = {
    id: string;
    numero: string;
    estado: EstadoPedido;
    clienteNombre: string | null;
    subtotal: Prisma.Decimal | number;
    descuento: Prisma.Decimal | number;
    total: Prisma.Decimal | number;
    cobrado: boolean;
    recibidoEn: Date;
    cobradoEn: Date | null;
    finalizadoEn: Date | null;
    tipoEntrega: string | null;
    metodoPago: string | null;
    metodoPagoPreferido: string | null;
    items: ReportOrderItem[];
    cobrosCaja: CashboxPaymentSnapshot[];
};

type ReportOrderSnapshot = Pick<
    ReportOrderRecord,
    "subtotal" | "descuento" | "total" | "cobrado" | "recibidoEn" | "cobradoEn" | "finalizadoEn" | "metodoPago" | "metodoPagoPreferido" | "cobrosCaja"
>;

function buildCashPaidOrdersWhere(startDate?: Date, endDate?: Date): Prisma.OrderWhereInput {
    if (startDate && endDate) {
        return buildFinanciallyPaidOrderWhere(startDate, endDate);
    }

    return {
        deletedAt: null,
        estado: { not: EstadoPedido.CANCELADO },
        OR: [
            {
                cobrosCaja: {
                    some: {
                        estado: "VIGENTE",
                    },
                },
            },
            {
                cobrado: true,
                cobrosCaja: {
                    none: {},
                },
            },
        ],
    };
}

function buildOperationalRevenueWhere(startDate?: Date, endDate?: Date): Prisma.OrderWhereInput {
    return {
        deletedAt: null,
        estado: { not: EstadoPedido.CANCELADO },
        ...(startDate && endDate
            ? {
                  recibidoEn: {
                      gte: startDate,
                      lte: endDate,
                  },
              }
            : {}),
    };
}

function buildAccruedRevenueWhere(startDate?: Date, endDate?: Date): Prisma.OrderWhereInput {
    return {
        deletedAt: null,
        estado: EstadoPedido.FINALIZADO,
        ...(startDate && endDate
            ? {
                  finalizadoEn: {
                      gte: startDate,
                      lte: endDate,
                  },
              }
            : {
                  finalizadoEn: { not: null },
              }),
    };
}

function buildRevenueWhere(startDate: Date | undefined, endDate: Date | undefined, basis: ReportBasis): Prisma.OrderWhereInput {
    if (basis === "operativo") {
        return buildOperationalRevenueWhere(startDate, endDate);
    }

    if (basis === "devengado") {
        return buildAccruedRevenueWhere(startDate, endDate);
    }

    return buildCashPaidOrdersWhere(startDate, endDate);
}

function getReportOrderAmount(
    order: ReportOrderSnapshot,
    basis: ReportBasis,
) {
    if (basis === "caja") {
        return resolveFinancialPaymentSnapshot(order).amount;
    }

    return Number(order.total);
}

function getReportOrderMethod(
    order: ReportOrderSnapshot,
    _basis: ReportBasis,
) {
    void _basis;
    const payment = resolveOrderPaymentState(order);

    if (!payment.isPaid) {
        return "SIN_COBRO";
    }

    return payment.method || "SIN_COBRO";
}

function getReportOrderDate(
    order: ReportOrderSnapshot,
    basis: ReportBasis,
) {
    if (basis === "operativo") {
        return order.recibidoEn;
    }

    if (basis === "devengado") {
        return order.finalizadoEn ?? order.recibidoEn;
    }

    return resolveFinancialPaymentSnapshot(order).paymentDate || order.cobradoEn || order.recibidoEn;
}

function getCashRecognitionRatio(order: ReportOrderSnapshot, basis: ReportBasis) {
    if (basis !== "caja") {
        return 1;
    }

    const total = Number(order.total || 0);
    if (total <= 0) {
        return 0;
    }

    return Math.min(1, getReportOrderAmount(order, basis) / total);
}

function getReportGrossSales(order: ReportOrderSnapshot, basis: ReportBasis) {
    const ratio = getCashRecognitionRatio(order, basis);
    return Number(order.subtotal || order.total || 0) * ratio;
}

function getReportDiscounts(order: ReportOrderSnapshot, basis: ReportBasis) {
    const ratio = getCashRecognitionRatio(order, basis);
    return Number(order.descuento || 0) * ratio;
}

function getOrderItemUnitCost(item: ReportOrderItem) {
    const explicitCost = Number(item.product?.costoUnitario || 0);
    if (explicitCost > 0) {
        return explicitCost;
    }

    return (
        item.product?.recipeItems.reduce((recipeSum, recipeItem) => {
            return recipeSum + Number(recipeItem.qtyPerUnit) * Number(recipeItem.supply.costoUnitario || 0);
        }, 0) || 0
    );
}

function getReportOrderCogs(order: ReportOrderRecord, basis: ReportBasis) {
    const ratio = getCashRecognitionRatio(order, basis);

    return order.items.reduce((itemSum, item) => {
        return itemSum + getOrderItemUnitCost(item) * Number(item.cantidad) * ratio;
    }, 0);
}

export async function getReportsData(input?: {
    startDate?: Date;
    endDate?: Date;
    basis?: ReportBasis;
}) {
    try {
        await requireAdmin();

        const basis = input?.basis ?? "caja";
        const startDate = input?.startDate ? startOfDay(input.startDate) : undefined;
        const endDate = input?.endDate ? endOfDay(input.endDate) : undefined;
        const operationalWhere = {
            deletedAt: null,
            ...(startDate && endDate
                ? {
                      recibidoEn: {
                          gte: startDate,
                          lte: endDate,
                      },
                  }
                : {}),
        } satisfies Prisma.OrderWhereInput;

        const revenueWhere = buildRevenueWhere(startDate, endDate, basis);

        const previousWindowStart =
            startDate && endDate
                ? new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime() + 1))
                : undefined;
        const previousWindowEnd =
            startDate && endDate
                ? subMilliseconds(startDate, 1)
                : undefined;

        const [revenueOrders, operationalOrders, expenses, previousRevenueOrders] = await Promise.all([
            prisma.order.findMany({
                where: revenueWhere,
                select: {
                    id: true,
                    numero: true,
                    estado: true,
                    clienteNombre: true,
                    total: true,
                    subtotal: true,
                    descuento: true,
                    cobrado: true,
                    recibidoEn: true,
                    cobradoEn: true,
                    finalizadoEn: true,
                    tipoEntrega: true,
                    metodoPago: true,
                    metodoPagoPreferido: true,
                    items: {
                        select: {
                            id: true,
                            productId: true,
                            cantidad: true,
                            precioUnitario: true,
                            subtotal: true,
                            product: {
                                select: {
                                    costoUnitario: true,
                                    recipeItems: {
                                        select: {
                                            qtyPerUnit: true,
                                            supply: {
                                                select: {
                                                    costoUnitario: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    cobrosCaja: {
                        select: ACTIVE_CASHBOX_PAYMENT_SELECT,
                    },
                },
            }),
            prisma.order.findMany({
                where: operationalWhere,
                select: {
                    estado: true,
                    cobrado: true,
                    cobradoEn: true,
                    recibidoEn: true,
                    finalizadoEn: true,
                    metodoPago: true,
                    metodoPagoPreferido: true,
                    tipoEntrega: true,
                    cobrosCaja: {
                        select: ACTIVE_CASHBOX_PAYMENT_SELECT,
                    },
                },
            }),
            prisma.egreso.findMany({
                where: {
                    deletedAt: null,
                    ...(startDate && endDate
                        ? {
                              OR:
                                  basis === "devengado"
                                      ? [
                                            { fechaDevengado: { gte: startDate, lte: endDate } },
                                            { fechaDevengado: null, fecha: { gte: startDate, lte: endDate } },
                                        ]
                                      : basis === "caja"
                                        ? [
                                              { fechaPago: { gte: startDate, lte: endDate } },
                                              { fechaPago: null, fecha: { gte: startDate, lte: endDate } },
                                          ]
                                        : [{ fecha: { gte: startDate, lte: endDate } }],
                          }
                        : {}),
                },
                select: {
                    monto: true,
                    categoria: true,
                    fecha: true,
                    fechaPago: true,
                    fechaDevengado: true,
                },
            }),
            previousWindowStart && previousWindowEnd
                ? prisma.order.findMany({
                      where: buildRevenueWhere(previousWindowStart, previousWindowEnd, basis),
                      select: {
                          id: true,
                        total: true,
                        subtotal: true,
                        descuento: true,
                        cobrado: true,
                        recibidoEn: true,
                        cobradoEn: true,
                        finalizadoEn: true,
                        metodoPago: true,
                        metodoPagoPreferido: true,
                        cobrosCaja: {
                            select: ACTIVE_CASHBOX_PAYMENT_SELECT,
                        },
                      },
                  })
                : Promise.resolve([]),
        ]);

        const sortedRevenueOrders = [...revenueOrders].sort(
            (left, right) => getReportOrderDate(right, basis).getTime() - getReportOrderDate(left, basis).getTime(),
        );
        const totalRevenue = revenueOrders.reduce((sum, order) => sum + getReportOrderAmount(order, basis), 0);
        const revenueOrdersCount = revenueOrders.length;
        const averageTicket = revenueOrdersCount > 0 ? totalRevenue / revenueOrdersCount : 0;
        const grossSales = revenueOrders.reduce((sum, order) => sum + getReportGrossSales(order, basis), 0);
        const discounts = revenueOrders.reduce((sum, order) => sum + getReportDiscounts(order, basis), 0);
        const discountRate = grossSales > 0 ? (discounts / grossSales) * 100 : 0;

        const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.monto), 0);
        const laborCost = expenses
            .filter((expense) => expense.categoria === "NOMINA")
            .reduce((sum, expense) => sum + Number(expense.monto), 0);
        const cogs = revenueOrders.reduce((sum, order) => sum + getReportOrderCogs(order, basis), 0);
        const primeCost = cogs + laborCost;
        const grossProfit = totalRevenue - cogs;
        const operatingResult = totalRevenue - totalExpenses;
        const netMarginPct = totalRevenue > 0 ? (operatingResult / totalRevenue) * 100 : 0;
        const primeCostPct = totalRevenue > 0 ? (primeCost / totalRevenue) * 100 : 0;
        const totalItems = revenueOrders.reduce(
            (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + Number(item.cantidad), 0),
            0,
        );
        const avgItemsPerOrder = revenueOrdersCount > 0 ? totalItems / revenueOrdersCount : 0;
        const previousRevenue = previousRevenueOrders.reduce(
            (sum, order) => sum + getReportOrderAmount(order, basis),
            0,
        );
        const previousOrdersCount = previousRevenueOrders.length;
        const comparisonPrevRevenuePct =
            previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
        const comparisonPrevOrdersPct =
            previousOrdersCount > 0 ? ((revenueOrdersCount - previousOrdersCount) / previousOrdersCount) * 100 : 0;
        const breakEvenTarget = expenses
            .filter((expense) => {
                const fixedCategories = new Set<CategoriaEgreso>([
                    CategoriaEgreso.ALQUILER,
                    CategoriaEgreso.SERVICIOS,
                    CategoriaEgreso.IMPUESTOS,
                    CategoriaEgreso.NOMINA,
                ]);
                return fixedCategories.has(expense.categoria);
            })
            .reduce((sum, expense) => sum + Number(expense.monto), 0);
        const breakEvenProgressPct = breakEvenTarget > 0 ? (totalRevenue / breakEvenTarget) * 100 : 0;

        const ordersByStatus: { [key: string]: number } = {};
        operationalOrders.forEach((order) => {
            ordersByStatus[order.estado] = (ordersByStatus[order.estado] || 0) + 1;
        });

        const ordersByPaymentMethod = revenueOrders.reduce((accumulator, order) => {
            const method = getReportOrderMethod(order, basis);
            accumulator[method] = (accumulator[method] || 0) + getReportOrderAmount(order, basis);
            return accumulator;
        }, {} as Record<string, number>);

        const ordersByDeliveryType = operationalOrders.reduce((accumulator, order) => {
            const type = order.tipoEntrega || "SIN_TIPO";
            accumulator[type] = (accumulator[type] || 0) + 1;
            return accumulator;
        }, {} as Record<string, number>);

        const isSingleDay =
            startDate &&
            endDate &&
            startDate.getDate() === endDate.getDate() &&
            startDate.getMonth() === endDate.getMonth() &&
            startDate.getFullYear() === endDate.getFullYear();

        const revenueByDay: { [key: string]: { revenue: number; count: number } } = {};
        revenueOrders.forEach((order) => {
            const dateSource = getReportOrderDate(order, basis);
            if (!dateSource) return;

            // Use a local-friendly key format: YYYY-MM-DD or YYYY-MM-DDTHH
            const YYYY = dateSource.getFullYear();
            const MM = String(dateSource.getMonth() + 1).padStart(2, '0');
            const DD = String(dateSource.getDate()).padStart(2, '0');
            const HH = String(dateSource.getHours()).padStart(2, '0');
            
            const dateStr = `${YYYY}-${MM}-${DD}`;
            const dayKey = isSingleDay ? `${dateStr}T${HH}` : dateStr;

            if (!revenueByDay[dayKey]) {
                revenueByDay[dayKey] = { revenue: 0, count: 0 };
            }

            revenueByDay[dayKey].revenue += getReportOrderAmount(order, basis);
            revenueByDay[dayKey].count += 1;
        });

        const totalOrders = operationalOrders.length;
        const nonCancelledOperationalOrders = operationalOrders.filter((order) => order.estado !== EstadoPedido.CANCELADO);
        const paidOperationalOrders = nonCancelledOperationalOrders.filter((order) => resolveOrderPaymentState(order).isPaid);
        const completionRate = totalOrders > 0 ? ((ordersByStatus.FINALIZADO || 0) / totalOrders) * 100 : 0;
        const paymentRate =
            nonCancelledOperationalOrders.length > 0 ? (paidOperationalOrders.length / nonCancelledOperationalOrders.length) * 100 : 0;
        const cancellationRate = totalOrders > 0 ? ((ordersByStatus.CANCELADO || 0) / totalOrders) * 100 : 0;

        const summary: FinancialSummary = {
            basis,
            totalRevenue,
            grossSales,
            discounts,
            discountRate,
            netSales: totalRevenue,
            totalExpenses,
            laborCost,
            cogs,
            grossProfit,
            operatingResult,
            primeCost,
            primeCostPct,
            netMarginPct,
            avgItemsPerOrder,
            comparisonPrevRevenuePct,
            comparisonPrevOrdersPct,
            breakEvenTarget,
            breakEvenProgressPct,
            completionRate,
            paymentRate,
            cancellationRate,
            totalOrders,
            averageTicket,
            ordersByStatus,
            ordersByPaymentMethod,
            ordersByDeliveryType,
            revenueByDay,
        };

        return {
            success: true,
            data: {
                summary,
                recentTransactions: sortedRevenueOrders.slice(0, 50).map((order) => {
                    return {
                        id: order.id,
                        numero: order.numero,
                        recibidoEn: order.recibidoEn.toISOString(),
                        fechaReferencia: getReportOrderDate(order, basis).toISOString(),
                        clienteNombre: order.clienteNombre || "Cliente Final",
                        total: getReportOrderAmount(order, basis) || Number(order.total) || 0,
                        metodoPago: getReportOrderMethod(order, basis),
                        estado: order.estado,
                        items: (order.items || []).map((item) => ({
                            id: item.id,
                            productId: item.productId,
                            cantidad: item.cantidad?.toNumber() || 0,
                            precioUnitario: item.precioUnitario?.toNumber() || 0,
                            subtotal: item.subtotal?.toNumber() || 0,
                        })),
                    };
                }),
            },
        };
    } catch (error) {
        console.error("Error fetching reports data:", error);
        return {
            success: false,
            error: "No se pudieron cargar los reportes",
            data: null,
        };
    }
}
