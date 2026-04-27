"use server";

import { Prisma } from "@prisma/client";
import { differenceInMilliseconds, eachDayOfInterval, endOfDay, format, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

import {
    ACTIVE_CASHBOX_PAYMENT_SELECT,
    buildFinanciallyPaidOrderWhere,
    resolveFinancialPaymentSnapshot,
    resolveOrderPaymentState,
} from "@/lib/cashbox";
import { prisma } from "@/lib/prisma";

export type ReportBasis = "operativo" | "caja" | "devengado";

type FinancialPaymentOrder = Parameters<typeof resolveFinancialPaymentSnapshot>[0];

export interface DailyFinancialData {
    date: string;
    ingresos: number;
    egresos: number;
    balance: number;
}

export interface PaymentMethodData {
    method: string;
    amount: number;
    count: number;
    percentage: number;
}

export interface EgresoByCategoryData {
    categoria: string;
    amount: number;
    percentage: number;
}

export interface TopProductData {
    id: string;
    nombre: string;
    count: number;
    percentage: number;
    revenue: number;
}

export interface ProductMarginData {
    id: string;
    nombre: string;
    precio: number;
    costo: number;
    margen: number;
    margenPorcentaje: number;
    vecesVendido: number;
    margenTotal: number;
}

export interface StockAlertData {
    id: string;
    nombre: string;
    stockActual: number;
    stockMinimo: number;
    status: "critical" | "warning" | "ok";
    unidad: string;
}

export interface StockMovementData {
    date: string;
    in: number;
    out: number;
    ajuste: number;
}

export interface OrderStatusData {
    estado: string;
    count: number;
    percentage: number;
}

export interface PrepTimeData {
    date: string;
    avgMinutes: number;
}

export interface HeatmapData {
    hour: number;
    dayOfWeek: number;
    count: number;
}

export interface CategoryRevenueData {
    date: string;
    [key: string]: string | number;
}

export interface ProfitabilityByCategoryData {
    categoria: string;
    ingresos: number;
    costos: number;
    beneficio: number;
    margenPorcentaje: number;
}

function buildOrderWhere(start: Date, end: Date, basis: ReportBasis = "caja"): Prisma.OrderWhereInput {
    if (basis === "operativo") {
        return {
            deletedAt: null,
            estado: { not: "CANCELADO" },
            recibidoEn: { gte: start, lte: end },
        };
    }

    if (basis === "devengado") {
        return {
            deletedAt: null,
            estado: "FINALIZADO",
            finalizadoEn: { gte: start, lte: end },
        };
    }

    return {
        ...buildFinanciallyPaidOrderWhere(start, end),
    };
}

function buildExpenseWhere(start: Date, end: Date, basis: ReportBasis = "caja"): Prisma.EgresoWhereInput {
    if (basis === "operativo") {
        return {
            deletedAt: null,
            fecha: { gte: start, lte: end },
        };
    }

    if (basis === "devengado") {
        return {
            deletedAt: null,
            OR: [
                { fechaDevengado: { gte: start, lte: end } },
                { fechaDevengado: null, fecha: { gte: start, lte: end } },
            ],
        };
    }

    return {
        deletedAt: null,
        OR: [
            { fechaPago: { gte: start, lte: end } },
            { fechaPago: null, fecha: { gte: start, lte: end } },
        ],
    };
}

function getOrderReferenceDate(
    order: FinancialPaymentOrder & {
        recibidoEn?: Date | null;
        cobradoEn?: Date | null;
        finalizadoEn?: Date | null;
    },
    basis: ReportBasis
) {
    if (basis === "operativo") {
        return order.recibidoEn ?? order.cobradoEn ?? order.finalizadoEn;
    }

    if (basis === "devengado") {
        return order.finalizadoEn ?? order.recibidoEn ?? order.cobradoEn;
    }

    return resolveFinancialPaymentSnapshot(order).paymentDate ?? order.cobradoEn ?? order.recibidoEn ?? order.finalizadoEn;
}

function getExpenseReferenceDate(
    egreso: { fecha: Date; fechaPago?: Date | null; fechaDevengado?: Date | null },
    basis: ReportBasis
) {
    if (basis === "devengado") {
        return egreso.fechaDevengado ?? egreso.fecha;
    }

    if (basis === "caja") {
        return egreso.fechaPago ?? egreso.fecha;
    }

    return egreso.fecha;
}

function getOrderRecognizedAmount(
    order: FinancialPaymentOrder,
    basis: ReportBasis
) {
    if (basis === "caja") {
        return resolveFinancialPaymentSnapshot(order).amount;
    }

    return Number(order.total || 0);
}

function getReportedPaymentMethod(
    order: FinancialPaymentOrder,
    basis: ReportBasis
) {
    const payment = resolveOrderPaymentState(order);

    if (!payment.isPaid) {
        return "SIN_COBRO";
    }

    if (basis === "caja") {
        return payment.method || "SIN_COBRO";
    }

    return payment.method || "SIN_COBRO";
}

export async function getFinancialData(startDate: Date, endDate: Date, basis: ReportBasis = "caja") {
    try {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);
        const daysInterval = eachDayOfInterval({ start, end });

        const [orders, egresos] = await Promise.all([
            prisma.order.findMany({
                where: buildOrderWhere(start, end, basis),
                select: {
                    total: true,
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
            }),
            prisma.egreso.findMany({
                where: buildExpenseWhere(start, end, basis),
                select: {
                    monto: true,
                    fecha: true,
                    fechaPago: true,
                    fechaDevengado: true,
                },
            }),
        ]);

        const isSingleDay = start.getTime() === startOfDay(end).getTime();
        const dailyData: DailyFinancialData[] = (isSingleDay
            ? Array.from({ length: 24 }, (_, hour) => {
                  const bucketDate = new Date(start);
                  bucketDate.setHours(hour, 0, 0, 0);

                  const ingresos = orders
                      .filter((order) => getOrderReferenceDate(order, basis)?.getHours() === hour)
                      .reduce((sum, order) => sum + getOrderRecognizedAmount(order, basis), 0);

                  const egresosBucket = egresos
                      .filter((egreso) => getExpenseReferenceDate(egreso, basis).getHours() === hour)
                      .reduce((sum, egreso) => sum + Number(egreso.monto), 0);

                  return {
                      date: bucketDate.toISOString(),
                      ingresos,
                      egresos: egresosBucket,
                      balance: ingresos - egresosBucket,
                  };
              })
            : daysInterval.map((day) => {
                  const dayStart = startOfDay(day);
                  const dayEnd = endOfDay(day);

                  const ingresos = orders
                      .filter((order) => {
                          const date = getOrderReferenceDate(order, basis);
                          return date && date >= dayStart && date <= dayEnd;
                      })
                      .reduce((sum, order) => sum + getOrderRecognizedAmount(order, basis), 0);

                  const egresosBucket = egresos
                      .filter((egreso) => {
                          const date = getExpenseReferenceDate(egreso, basis);
                          return date >= dayStart && date <= dayEnd;
                      })
                      .reduce((sum, egreso) => sum + Number(egreso.monto), 0);

                  return {
                      date: format(day, "yyyy-MM-dd"),
                      ingresos,
                      egresos: egresosBucket,
                      balance: ingresos - egresosBucket,
                  };
              })) as DailyFinancialData[];

        const totals = dailyData.reduce(
            (acc, day) => ({
                ingresos: acc.ingresos + day.ingresos,
                egresos: acc.egresos + day.egresos,
                balance: acc.balance + day.balance,
            }),
            { ingresos: 0, egresos: 0, balance: 0 }
        );

        return {
            success: true,
            data: {
                dailyData,
                totals,
            },
        };
    } catch (error) {
        console.error("Error getting financial data:", error);
        return {
            success: false,
            error: "Error al obtener datos financieros",
        };
    }
}

export async function getPaymentMethodsData(startDate: Date, endDate: Date, basis: ReportBasis = "caja") {
    try {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);

        const orders = await prisma.order.findMany({
            where: buildOrderWhere(start, end, basis),
            select: {
                total: true,
                cobrado: true,
                metodoPago: true,
                metodoPagoPreferido: true,
                cobradoEn: true,
                cobrosCaja: {
                    select: ACTIVE_CASHBOX_PAYMENT_SELECT,
                },
            },
        });

        const grouped = orders.reduce((acc, order) => {
            const method = getReportedPaymentMethod(order, basis);
            if (!acc[method]) {
                acc[method] = { amount: 0, count: 0 };
            }
            acc[method].amount += getOrderRecognizedAmount(order, basis);
            acc[method].count += 1;
            return acc;
        }, {} as Record<string, { amount: number; count: number }>);

        const total = Object.values(grouped).reduce((sum, group) => sum + group.amount, 0);

        return {
            success: true,
            data: Object.entries(grouped).map(([method, stats]) => ({
                method,
                amount: stats.amount,
                count: stats.count,
                percentage: total > 0 ? (stats.amount / total) * 100 : 0,
            })),
        };
    } catch (error) {
        console.error("Error getting payment methods data:", error);
        return {
            success: false,
            error: "Error al obtener datos de metodos de pago",
        };
    }
}

export async function getEgresosByCategoryData(startDate: Date, endDate: Date, basis: ReportBasis = "caja") {
    try {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);

        const egresos = await prisma.egreso.findMany({
            where: buildExpenseWhere(start, end, basis),
            select: {
                monto: true,
                categoria: true,
            },
        });

        const grouped = egresos.reduce((acc, egreso) => {
            acc[egreso.categoria] = (acc[egreso.categoria] || 0) + Number(egreso.monto);
            return acc;
        }, {} as Record<string, number>);

        const total = Object.values(grouped).reduce((sum, amount) => sum + amount, 0);

        return {
            success: true,
            data: Object.entries(grouped).map(([categoria, amount]) => ({
                categoria,
                amount,
                percentage: total > 0 ? (amount / total) * 100 : 0,
            })),
        };
    } catch (error) {
        console.error("Error getting egresos by category:", error);
        return {
            success: false,
            error: "Error al obtener egresos por categoria",
        };
    }
}

export async function getTopProductsData(startDate: Date, endDate: Date, limit = 10, basis: ReportBasis = "caja") {
    try {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);

        const orderItems = await prisma.orderItem.findMany({
            where: {
                order: buildOrderWhere(start, end, basis),
            },
            select: {
                productId: true,
                nombreProduct: true,
                cantidad: true,
                subtotal: true,
            },
        });

        const grouped = orderItems.reduce((acc, item) => {
            const id = item.productId || `snapshot-${item.nombreProduct}`;
            if (!acc[id]) {
                acc[id] = {
                    id,
                    nombre: item.nombreProduct,
                    count: 0,
                    revenue: 0,
                };
            }

            acc[id].count += Number(item.cantidad);
            acc[id].revenue += Number(item.subtotal);
            return acc;
        }, {} as Record<string, { id: string; nombre: string; count: number; revenue: number }>);

        const totalCount = Object.values(grouped).reduce((sum, product) => sum + product.count, 0);

        return {
            success: true,
            data: Object.values(grouped)
                .map((product) => ({
                    ...product,
                    percentage: totalCount > 0 ? (product.count / totalCount) * 100 : 0,
                }))
                .sort((a, b) => b.count - a.count || b.revenue - a.revenue)
                .slice(0, limit),
        };
    } catch (error) {
        console.error("Error getting top products:", error);
        return {
            success: false,
            error: "Error al obtener productos mas vendidos",
        };
    }
}

export async function getProductMarginsData(startDate: Date, endDate: Date, basis: ReportBasis = "caja") {
    try {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);

        const products = await prisma.product.findMany({
            where: {
                deletedAt: null,
            },
            include: {
                recipeItems: {
                    include: {
                        supply: {
                            select: {
                                costoUnitario: true,
                            },
                        },
                    },
                },
                orderItems: {
                    where: {
                        order: buildOrderWhere(start, end, basis),
                    },
                    select: {
                        cantidad: true,
                    },
                },
            },
        });

        const data: ProductMarginData[] = products
            .map((product) => {
                const precio = Number(product.precio);
                const costo =
                    Number(product.costoUnitario || 0) > 0
                        ? Number(product.costoUnitario)
                        : product.recipeItems.reduce((sum, item) => {
                              return sum + Number(item.qtyPerUnit) * Number(item.supply.costoUnitario || 0);
                          }, 0);

                const margen = precio - costo;
                const margenPorcentaje = precio > 0 ? (margen / precio) * 100 : 0;
                const vecesVendido = product.orderItems.reduce((sum, item) => sum + Number(item.cantidad), 0);

                return {
                    id: product.id,
                    nombre: product.nombre,
                    precio,
                    costo,
                    margen,
                    margenPorcentaje,
                    vecesVendido,
                    margenTotal: margen * vecesVendido,
                };
            })
            .filter((product) => product.vecesVendido > 0)
            .sort((a, b) => b.margenTotal - a.margenTotal);

        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error("Error getting product margins:", error);
        return {
            success: false,
            error: "Error al obtener margenes de productos",
        };
    }
}

export async function getCategoryRevenueOverTime(startDate: Date, endDate: Date, basis: ReportBasis = "caja") {
    try {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);
        const daysInterval = eachDayOfInterval({ start, end });

        const [orderItems, categories] = await Promise.all([
            prisma.orderItem.findMany({
                where: {
                    order: buildOrderWhere(start, end, basis),
                },
                include: {
                    product: {
                        include: {
                            category: true,
                        },
                    },
                    order: {
                        select: {
                            cobrado: true,
                            recibidoEn: true,
                            cobradoEn: true,
                            finalizadoEn: true,
                            total: true,
                            metodoPago: true,
                            metodoPagoPreferido: true,
                            cobrosCaja: {
                                select: ACTIVE_CASHBOX_PAYMENT_SELECT,
                            },
                        },
                    },
                },
            }),
            prisma.category.findMany({
                where: { deletedAt: null, activo: true },
                select: { nombre: true },
            }),
        ]);

        const categoryNames = categories.map((category) => category.nombre);
        const data: CategoryRevenueData[] = daysInterval.map((day) => {
            const dayStart = startOfDay(day);
            const dayEnd = endOfDay(day);
            const result: CategoryRevenueData = {
                date: format(day, "yyyy-MM-dd"),
            };

            for (const categoryName of categoryNames) {
                result[categoryName] = orderItems
                    .filter((item) => {
                        const referenceDate = getOrderReferenceDate(item.order, basis);
                        return (
                            referenceDate &&
                            referenceDate >= dayStart &&
                            referenceDate <= dayEnd &&
                            item.product?.category?.nombre === categoryName
                        );
                    })
                    .reduce((sum, item) => sum + Number(item.subtotal), 0);
            }

            return result;
        });

        return {
            success: true,
            data,
            categories: categoryNames,
        };
    } catch (error) {
        console.error("Error getting category revenue over time:", error);
        return {
            success: false,
            error: "Error al obtener ingresos por categoria",
        };
    }
}

export async function getStockAlertsData() {
    try {
        const supplies = await prisma.supply.findMany({
            where: {
                activo: true,
                deletedAt: null,
            },
            select: {
                id: true,
                nombre: true,
                stockActual: true,
                stockMinimo: true,
                unidad: true,
            },
        });

        const data: StockAlertData[] = supplies
            .map((supply) => {
                const actual = Number(supply.stockActual);
                const minimo = Number(supply.stockMinimo || 0);
                let status: StockAlertData["status"] = "ok";

                if (minimo > 0) {
                    if (actual < minimo) {
                        status = "critical";
                    } else if (actual < minimo * 1.5) {
                        status = "warning";
                    }
                }

                return {
                    id: supply.id,
                    nombre: supply.nombre,
                    stockActual: actual,
                    stockMinimo: minimo,
                    status,
                    unidad: supply.unidad,
                };
            })
            .sort((a, b) => {
                const priority = { critical: 0, warning: 1, ok: 2 };
                return priority[a.status] - priority[b.status];
            });

        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error("Error getting stock alerts:", error);
        return {
            success: false,
            error: "Error al obtener alertas de stock",
        };
    }
}

export async function getStockMovementsData(startDate: Date, endDate: Date) {
    try {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);
        const daysInterval = eachDayOfInterval({ start, end });

        const movements = await prisma.stockMovement.findMany({
            where: {
                createdAt: {
                    gte: start,
                    lte: end,
                },
            },
            select: {
                tipo: true,
                cantidad: true,
                createdAt: true,
                supply: {
                    select: {
                        costoUnitario: true,
                    },
                },
            },
        });

        const data: StockMovementData[] = daysInterval.map((day) => {
            const dayStart = startOfDay(day);
            const dayEnd = endOfDay(day);
            const dayMovements = movements.filter((movement) => movement.createdAt >= dayStart && movement.createdAt <= dayEnd);

            const toValue = (movement: typeof dayMovements[number]) =>
                Number(movement.cantidad) * Number(movement.supply.costoUnitario || 0);

            return {
                date: format(day, "yyyy-MM-dd"),
                in: dayMovements.filter((movement) => movement.tipo === "IN").reduce((sum, movement) => sum + toValue(movement), 0),
                out: dayMovements.filter((movement) => movement.tipo === "OUT").reduce((sum, movement) => sum + toValue(movement), 0),
                ajuste: dayMovements.filter((movement) => movement.tipo === "AJUSTE").reduce((sum, movement) => sum + toValue(movement), 0),
            };
        });

        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error("Error getting stock movements:", error);
        return {
            success: false,
            error: "Error al obtener movimientos de stock",
        };
    }
}

export async function getInventoryValuation() {
    try {
        const supplies = await prisma.supply.findMany({
            where: {
                activo: true,
                deletedAt: null,
            },
            select: {
                id: true,
                nombre: true,
                stockActual: true,
                costoUnitario: true,
            },
        });

        const data = supplies.map((supply) => {
            const stock = Number(supply.stockActual);
            const costo = Number(supply.costoUnitario || 0);
            return {
                id: supply.id,
                nombre: supply.nombre,
                stockActual: stock,
                costoUnitario: costo,
                valorTotal: stock * costo,
            };
        });

        return {
            success: true,
            data: {
                supplies: data,
                totalValue: data.reduce((sum, item) => sum + item.valorTotal, 0),
                top10: [...data].sort((a, b) => b.valorTotal - a.valorTotal).slice(0, 10),
            },
        };
    } catch (error) {
        console.error("Error getting inventory valuation:", error);
        return {
            success: false,
            error: "Error al obtener valorizacion de inventario",
        };
    }
}

export async function getOrdersByStatusData(startDate: Date, endDate: Date) {
    try {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);

        const orders = await prisma.order.findMany({
            where: {
                deletedAt: null,
                recibidoEn: {
                    gte: start,
                    lte: end,
                },
            },
            select: {
                estado: true,
            },
        });

        const grouped = orders.reduce((acc, order) => {
            acc[order.estado] = (acc[order.estado] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const total = orders.length;

        return {
            success: true,
            data: Object.entries(grouped).map(([estado, count]) => ({
                estado,
                count,
                percentage: total > 0 ? (count / total) * 100 : 0,
            })),
        };
    } catch (error) {
        console.error("Error getting orders by status:", error);
        return {
            success: false,
            error: "Error al obtener pedidos por estado",
        };
    }
}

export async function getPrepTimeData(startDate: Date, endDate: Date) {
    try {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);
        const daysInterval = eachDayOfInterval({ start, end });

        const orders = await prisma.order.findMany({
            where: {
                deletedAt: null,
                enPreparacionEn: { not: null },
                listoEn: { not: null },
                finalizadoEn: { gte: start, lte: end },
            },
            select: {
                enPreparacionEn: true,
                listoEn: true,
                finalizadoEn: true,
            },
        });

        const daily = daysInterval.map((day) => {
            const dayStart = startOfDay(day);
            const dayEnd = endOfDay(day);
            const dayOrders = orders.filter(
                (order) => order.finalizadoEn && order.finalizadoEn >= dayStart && order.finalizadoEn <= dayEnd
            );

            if (dayOrders.length === 0) {
                return {
                    date: format(day, "yyyy-MM-dd"),
                    avgMinutes: 0,
                };
            }

            const totalMinutes = dayOrders.reduce((sum, order) => {
                return sum + differenceInMilliseconds(order.listoEn!, order.enPreparacionEn!) / 1000 / 60;
            }, 0);

            return {
                date: format(day, "yyyy-MM-dd"),
                avgMinutes: totalMinutes / dayOrders.length,
            };
        });

        return {
            success: true,
            data: {
                daily,
                overallAvg: daily.length > 0 ? daily.reduce((sum, day) => sum + day.avgMinutes, 0) / daily.length : 0,
            },
        };
    } catch (error) {
        console.error("Error getting prep time data:", error);
        return {
            success: false,
            error: "Error al obtener tiempos de preparacion",
        };
    }
}

export async function getOrdersByOriginData(startDate: Date, endDate: Date, basis: ReportBasis = "operativo") {
    try {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);
        const daysInterval = eachDayOfInterval({ start, end });

        const orders = await prisma.order.findMany({
            where: buildOrderWhere(start, end, basis),
            select: {
                origen: true,
                cobrado: true,
                recibidoEn: true,
                cobradoEn: true,
                finalizadoEn: true,
                total: true,
                metodoPago: true,
                metodoPagoPreferido: true,
                cobrosCaja: {
                    select: ACTIVE_CASHBOX_PAYMENT_SELECT,
                },
            },
        });

        const data = daysInterval.map((day) => {
            const dayStart = startOfDay(day);
            const dayEnd = endOfDay(day);
            const dayOrders = orders.filter((order) => {
                const referenceDate = getOrderReferenceDate(order, basis);
                return referenceDate && referenceDate >= dayStart && referenceDate <= dayEnd;
            });

            return {
                date: format(day, "yyyy-MM-dd"),
                INTERNO: dayOrders.filter((order) => order.origen === "INTERNO").length,
                CATALOGO: dayOrders.filter((order) => order.origen === "CATALOGO").length,
            };
        });

        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error("Error getting orders by origin:", error);
        return {
            success: false,
            error: "Error al obtener pedidos por origen",
        };
    }
}

export async function getHeatmapData(startDate: Date, endDate: Date, basis: ReportBasis = "operativo") {
    try {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);

        const orders = await prisma.order.findMany({
            where: buildOrderWhere(start, end, basis),
            select: {
                cobrado: true,
                recibidoEn: true,
                cobradoEn: true,
                finalizadoEn: true,
                total: true,
                metodoPago: true,
                metodoPagoPreferido: true,
                cobrosCaja: {
                    select: ACTIVE_CASHBOX_PAYMENT_SELECT,
                },
            },
        });

        const matrix: HeatmapData[] = [];

        for (let day = 0; day < 7; day += 1) {
            for (let hour = 0; hour < 24; hour += 1) {
                const count = orders.filter((order) => {
                    const referenceDate = getOrderReferenceDate(order, basis);
                    return referenceDate?.getDay() === day && referenceDate.getHours() === hour;
                }).length;

                matrix.push({
                    dayOfWeek: day,
                    hour,
                    count,
                });
            }
        }

        return {
            success: true,
            data: matrix,
        };
    } catch (error) {
        console.error("Error getting heatmap data:", error);
        return {
            success: false,
            error: "Error al obtener mapa de calor",
        };
    }
}

export async function getTicketPromedioData(startDate: Date, endDate: Date, basis: ReportBasis = "caja") {
    try {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);
        const daysInterval = eachDayOfInterval({ start, end });

        const orders = await prisma.order.findMany({
            where: buildOrderWhere(start, end, basis),
            select: {
                total: true,
                origen: true,
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
        });

        const daily = daysInterval.map((day) => {
            const dayStart = startOfDay(day);
            const dayEnd = endOfDay(day);

            const dayOrders = orders.filter((order) => {
                const referenceDate = getOrderReferenceDate(order, basis);
                return referenceDate && referenceDate >= dayStart && referenceDate <= dayEnd;
            });

            const internoOrders = dayOrders.filter((order) => order.origen === "INTERNO");
            const catalogoOrders = dayOrders.filter((order) => order.origen === "CATALOGO");

            const avg = (items: typeof dayOrders) =>
                items.length > 0 ? items.reduce((sum, item) => sum + getOrderRecognizedAmount(item, basis), 0) / items.length : 0;

            return {
                date: format(day, "yyyy-MM-dd"),
                INTERNO: avg(internoOrders),
                CATALOGO: avg(catalogoOrders),
                TOTAL: avg(dayOrders),
            };
        });

        const avg = (items: typeof orders) =>
            items.length > 0 ? items.reduce((sum, item) => sum + getOrderRecognizedAmount(item, basis), 0) / items.length : 0;

        return {
            success: true,
            data: {
                daily,
                overall: {
                    INTERNO: avg(orders.filter((order) => order.origen === "INTERNO")),
                    CATALOGO: avg(orders.filter((order) => order.origen === "CATALOGO")),
                    TOTAL: avg(orders),
                },
            },
        };
    } catch (error) {
        console.error("Error getting ticket promedio data:", error);
        return {
            success: false,
            error: "Error al obtener ticket promedio",
        };
    }
}

export async function getProfitabilityByCategoryData(startDate: Date, endDate: Date, basis: ReportBasis = "caja") {
    try {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);

        const categories = await prisma.category.findMany({
            where: {
                deletedAt: null,
                activo: true,
            },
            include: {
                products: {
                    include: {
                        orderItems: {
                            where: {
                                order: buildOrderWhere(start, end, basis),
                            },
                            select: {
                                subtotal: true,
                                cantidad: true,
                            },
                        },
                        recipeItems: {
                            include: {
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
        });

        const data: ProfitabilityByCategoryData[] = categories
            .map((category) => {
                let ingresos = 0;
                let costos = 0;

                for (const product of category.products) {
                    const ingresosProducto = product.orderItems.reduce((sum, item) => sum + Number(item.subtotal), 0);
                    const cantidadVendida = product.orderItems.reduce((sum, item) => sum + Number(item.cantidad), 0);
                    const costoUnitario =
                        Number(product.costoUnitario || 0) > 0
                            ? Number(product.costoUnitario)
                            : product.recipeItems.reduce((sum, item) => {
                                  return sum + Number(item.qtyPerUnit) * Number(item.supply.costoUnitario || 0);
                              }, 0);

                    ingresos += ingresosProducto;
                    costos += costoUnitario * cantidadVendida;
                }

                const beneficio = ingresos - costos;
                return {
                    categoria: category.nombre,
                    ingresos,
                    costos,
                    beneficio,
                    margenPorcentaje: ingresos > 0 ? (beneficio / ingresos) * 100 : 0,
                };
            })
            .filter((category) => category.ingresos > 0)
            .sort((a, b) => b.beneficio - a.beneficio);

        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error("Error getting profitability by category:", error);
        return {
            success: false,
            error: "Error al obtener rentabilidad por categoria",
        };
    }
}

export async function getMonthlyROI(year: number) {
    try {
        const data = [];

        for (let month = 0; month < 12; month += 1) {
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

            const [orders, egresos] = await Promise.all([
            prisma.order.findMany({
                where: buildOrderWhere(startDate, endDate, "caja"),
                select: {
                    total: true,
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
            }),
                prisma.egreso.findMany({
                    where: buildExpenseWhere(startDate, endDate, "caja"),
                    select: {
                        monto: true,
                    },
                }),
            ]);

            const ingresosReconocidos = orders.reduce((sum, order) => sum + getOrderRecognizedAmount(order, "caja"), 0);
            const egresosTotal = egresos.reduce((sum, egreso) => sum + Number(egreso.monto), 0);

            data.push({
                month: format(startDate, "MMM", { locale: es }),
                ingresos: ingresosReconocidos,
                egresos: egresosTotal,
                roi: egresosTotal > 0 ? ((ingresosReconocidos - egresosTotal) / egresosTotal) * 100 : 0,
            });
        }

        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error("Error getting monthly ROI:", error);
        return {
            success: false,
            error: "Error al obtener ROI mensual",
        };
    }
}
