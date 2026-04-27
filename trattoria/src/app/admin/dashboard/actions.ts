"use server";

import { getConfigs } from "@/app/actions/configActions";
import {
    ACTIVE_CASHBOX_PAYMENT_SELECT,
    buildFinanciallyPaidOrderWhere,
    resolveFinancialPaymentSnapshot,
} from "@/lib/cashbox";
import {
    CASHBOX_SCHEMA_REQUIRED_MESSAGE,
    ensureCashboxSchemaReady,
    isCashboxSchemaError,
    toCashboxSchemaError,
} from "@/lib/cashboxSchema";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/serverAuth";
import { endOfDay, format, startOfDay, subDays } from "date-fns";
import { es } from "date-fns/locale";

type TopProductSourceItem = {
    productId: string | null;
    nombreProduct: string;
    cantidad: unknown;
    subtotal: unknown;
};

function buildTopProduct(items: TopProductSourceItem[], periodLabel: string) {
    if (items.length === 0) {
        return null;
    }

    const grouped = items.reduce((accumulator, item) => {
        const productId = item.productId || item.nombreProduct;

        if (!accumulator[productId]) {
            accumulator[productId] = {
                id: productId,
                nombre: item.nombreProduct,
                count: 0,
                revenue: 0,
            };
        }

        accumulator[productId].count += Number(item.cantidad);
        accumulator[productId].revenue += Number(item.subtotal);

        return accumulator;
    }, {} as Record<string, { id: string; nombre: string; count: number; revenue: number }>);

    const bestProduct = Object.values(grouped).sort((a, b) => {
        if (b.count !== a.count) {
            return b.count - a.count;
        }

        return b.revenue - a.revenue;
    })[0];

    return bestProduct ? { ...bestProduct, periodLabel } : null;
}

export async function getDashboardMetrics() {
    await requireAdmin();

    try {
        await ensureCashboxSchemaReady(prisma);

        const today = new Date();
        const startOfToday = startOfDay(today);
        const endOfToday = endOfDay(today);
        const startOfWeekWindow = startOfDay(subDays(today, 6));

        const [
            paidOrdersToday,
            totalOrdersToday,
            ordersInKitchen,
            ordersByStatusToday,
            paymentMethodsConfig,
            unavailableProducts,
            supplies,
            finalizedUnpaid,
            paidUnfinalized,
            weeklyPaidOrders,
            topProductTodayItems,
            topProductWeekItems,
        ] = await Promise.all([
            prisma.order.findMany({
                where: buildFinanciallyPaidOrderWhere(startOfToday, endOfToday),
                select: {
                    id: true,
                    total: true,
                    cobrado: true,
                    cobradoEn: true,
                    metodoPago: true,
                    cobrosCaja: {
                        select: ACTIVE_CASHBOX_PAYMENT_SELECT,
                    },
                },
            }),
            prisma.order.count({
                where: {
                    recibidoEn: { gte: startOfToday, lte: endOfToday },
                    deletedAt: null,
                },
            }),
            prisma.order.count({
                where: {
                    estado: "EN_PREPARACION",
                    deletedAt: null,
                },
            }),
            prisma.order.groupBy({
                by: ["estado"],
                where: {
                    recibidoEn: { gte: startOfToday, lte: endOfToday },
                    deletedAt: null,
                },
                _count: { id: true },
            }),
            getConfigs(["payments.methods"]),
            prisma.product.findMany({
                where: {
                    activo: true,
                    disponible: false,
                    deletedAt: null,
                },
                take: 5,
                orderBy: { nombre: "asc" },
                select: {
                    id: true,
                    nombre: true,
                    category: {
                        select: {
                            nombre: true,
                        },
                    },
                },
            }),
            prisma.supply.findMany({
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
            }),
            prisma.order.count({
                where: {
                    estado: "FINALIZADO",
                    deletedAt: null,
                    NOT: {
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
                    },
                },
            }),
            prisma.order.count({
                where: {
                    estado: { notIn: ["FINALIZADO", "CANCELADO"] },
                    deletedAt: null,
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
                },
            }),
            prisma.order.findMany({
                where: buildFinanciallyPaidOrderWhere(startOfWeekWindow, endOfToday),
                select: {
                    total: true,
                    cobrado: true,
                    cobradoEn: true,
                    metodoPago: true,
                    cobrosCaja: {
                        select: ACTIVE_CASHBOX_PAYMENT_SELECT,
                    },
                },
            }),
            prisma.orderItem.findMany({
                where: {
                    order: buildFinanciallyPaidOrderWhere(startOfToday, endOfToday),
                },
                select: {
                    productId: true,
                    nombreProduct: true,
                    cantidad: true,
                    subtotal: true,
                },
            }),
            prisma.orderItem.findMany({
                where: {
                    order: buildFinanciallyPaidOrderWhere(startOfWeekWindow, endOfToday),
                },
                select: {
                    productId: true,
                    nombreProduct: true,
                    cantidad: true,
                    subtotal: true,
                },
            }),
        ]);

        const configuredMethods = (paymentMethodsConfig.success ? paymentMethodsConfig.data?.["payments.methods"] : []) as
            | Array<{ id: string; label: string; enabled: boolean }>
            | undefined;

        const paidOrdersTodayWithSnapshot = paidOrdersToday.map((order) => ({
            ...order,
            payment: resolveFinancialPaymentSnapshot(order),
        }));
        const weeklyPaidOrdersWithSnapshot = weeklyPaidOrders.map((order) => ({
            ...order,
            payment: resolveFinancialPaymentSnapshot(order),
        }));

        const todayRevenue = paidOrdersTodayWithSnapshot.reduce((sum, order) => sum + order.payment.amount, 0);
        const todayAverageTicket = paidOrdersToday.length > 0 ? todayRevenue / paidOrdersToday.length : 0;

        const todayPaymentMethodsMap = paidOrdersTodayWithSnapshot.reduce((accumulator, order) => {
            const methodId = order.payment.paymentMethod || "EFECTIVO";
            const configuredMethod = configuredMethods?.find((method) => method.id === methodId);

            if (!accumulator[methodId]) {
                accumulator[methodId] = {
                    methodId,
                    label: configuredMethod?.label || methodId,
                    amount: 0,
                    count: 0,
                };
            }

            accumulator[methodId].amount += order.payment.amount;
            accumulator[methodId].count += 1;

            return accumulator;
        }, {} as Record<string, { methodId: string; label: string; amount: number; count: number }>);

        const todayPaymentMethods = Object.values(todayPaymentMethodsMap).sort((a, b) => b.amount - a.amount);

        const todayRevenueByHour = Array.from({ length: 24 }, (_, hour) => {
            const hourOrders = paidOrdersTodayWithSnapshot.filter((order) => order.payment.paymentDate?.getHours() === hour);

            return {
                hour: `${hour.toString().padStart(2, "0")}:00`,
                revenue: hourOrders.reduce((sum, order) => sum + order.payment.amount, 0),
                orders: hourOrders.length,
            };
        });

        const todayOrdersByStatus = ordersByStatusToday
            .map((group) => ({
                status: group.estado,
                count: group._count.id,
            }))
            .sort((a, b) => b.count - a.count);

        const unavailableProductsPreview = unavailableProducts.map((product) => ({
            id: product.id,
            nombre: product.nombre,
            categoryName: product.category?.nombre ?? null,
        }));

        const supplyAlerts = supplies.map((supply) => {
            const stockActual = Number(supply.stockActual);
            const stockMinimo = Number(supply.stockMinimo ?? 0);
            const isCritical = supply.stockMinimo != null && stockActual <= stockMinimo;
            const isWarning = stockMinimo > 0 && stockActual <= stockMinimo * 1.5;

            return {
                id: supply.id,
                nombre: supply.nombre,
                stockActual,
                stockMinimo,
                unidad: supply.unidad,
                isCritical,
                isWarning,
            };
        });

        const criticalSupplies = supplyAlerts
            .filter((supply) => supply.isCritical)
            .sort((a, b) => a.stockActual - b.stockActual);
        const warningSupplies = supplyAlerts
            .filter((supply) => !supply.isCritical && supply.isWarning)
            .sort((a, b) => a.stockActual - b.stockActual);

        const criticalSuppliesPreview = [...criticalSupplies, ...warningSupplies]
            .slice(0, 5)
            .map((supply) => ({
                id: supply.id,
                nombre: supply.nombre,
                stockActual: supply.stockActual,
                stockMinimo: supply.stockMinimo,
                unidad: supply.unidad,
            }));

        const last7Days = Array.from({ length: 7 }, (_, index) => subDays(today, 6 - index));
        const weeklyRevenue = last7Days.map((date) => {
            const dayStart = startOfDay(date);
            const dayEnd = endOfDay(date);

            const revenue = weeklyPaidOrdersWithSnapshot
                .filter((order) => order.payment.paymentDate && order.payment.paymentDate >= dayStart && order.payment.paymentDate <= dayEnd)
                .reduce((sum, order) => sum + order.payment.amount, 0);

            return {
                day: format(date, "eee", { locale: es }).substring(0, 3).toUpperCase(),
                revenue,
            };
        });

        const topProduct =
            buildTopProduct(topProductTodayItems, "Hoy") ??
            buildTopProduct(topProductWeekItems, "Ultimos 7 dias");

        return {
            success: true,
            data: {
                todayRevenue,
                todayOrders: totalOrdersToday,
                todayAverageTicket,
                ordersInKitchen,
                unavailableProductsCount: unavailableProducts.length,
                criticalSuppliesCount: criticalSupplies.length,
                suppliesBelowMinimumCount: criticalSupplies.length + warningSupplies.length,
                todayPaymentMethods,
                todayRevenueByHour,
                todayOrdersByStatus,
                topProduct,
                criticalSuppliesPreview,
                unavailableProductsPreview,
                alertCounts: {
                    criticalSupplies: criticalSupplies.length,
                    unavailableProducts: unavailableProducts.length,
                    finalizedUnpaid,
                    paidUnfinalized,
                },
                weeklyRevenue,
            },
        };
    } catch (error) {
        const normalizedError = toCashboxSchemaError(error);

        if (isCashboxSchemaError(normalizedError)) {
            console.error(
                "Cashbox schema error while fetching dashboard metrics:",
                normalizedError.message,
                normalizedError.missingRequirements,
            );
            return { success: false, error: CASHBOX_SCHEMA_REQUIRED_MESSAGE };
        }

        console.error("Error fetching dashboard metrics:", error);
        return { success: false, error: "Error al cargar métricas" };
    }
}

export async function getRecentActivity() {
    await requireAdmin();

    try {
        const recentOrders = await prisma.order.findMany({
            where: {
                deletedAt: null,
            },
            take: 6,
            orderBy: {
                recibidoEn: "desc",
            },
            select: {
                id: true,
                numero: true,
                clienteNombre: true,
                total: true,
                estado: true,
                recibidoEn: true,
                items: {
                    select: {
                        nombreProduct: true,
                        cantidad: true,
                    },
                },
            },
        });

        return {
            success: true,
            data: JSON.parse(JSON.stringify(recentOrders)),
        };
    } catch (error) {
        console.error("Error fetching recent activity:", error);
        return { success: false, error: "Error al cargar actividad reciente" };
    }
}
