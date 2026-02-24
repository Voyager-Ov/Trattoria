"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, eachDayOfInterval, format, differenceInMilliseconds } from "date-fns";
import { es } from "date-fns/locale";

// ============================================================================
// TYPES
// ============================================================================

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
    [key: string]: string | number; // Para categorías dinámicas
}

export interface ProfitabilityByCategoryData {
    categoria: string;
    ingresos: number;
    costos: number;
    beneficio: number;
    margenPorcentaje: number;
}

// ============================================================================
// FINANCIAL DATA
// ============================================================================

export async function getFinancialData(startDate: Date, endDate: Date) {
    try {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);

        // Obtener todos los días en el rango
        const daysInterval = eachDayOfInterval({ start, end });

        // Ingresos por día (pedidos finalizados y cobrados)
        const orders = await prisma.order.findMany({
            where: {
                estado: "FINALIZADO",
                cobrado: true,
                finalizadoEn: {
                    gte: start,
                    lte: end,
                },
                deletedAt: null,
            },
            select: {
                total: true,
                finalizadoEn: true,
            },
        });

        // Egresos por día
        const egresos = await prisma.egreso.findMany({
            where: {
                fecha: {
                    gte: start,
                    lte: end,
                },
                deletedAt: null,
            },
            select: {
                monto: true,
                fecha: true,
            },
        });

        // Agrupar por día (o por hora si es el mismo día)
        const isSingleDay = start.getTime() === startOfDay(end).getTime();
        let dailyData: DailyFinancialData[];

        if (isSingleDay) {
            dailyData = Array.from({ length: 24 }, (_, hour) => {
                const hourDate = new Date(start);
                hourDate.setHours(hour, 0, 0, 0);

                const dayIngresos = orders
                    .filter(o => o.finalizadoEn && o.finalizadoEn.getHours() === hour)
                    .reduce((sum, o) => sum + Number(o.total), 0);

                const dayEgresos = egresos
                    .filter(e => e.fecha.getHours() === hour)
                    .reduce((sum, e) => sum + Number(e.monto), 0);

                return {
                    date: hourDate.toISOString(),
                    ingresos: dayIngresos,
                    egresos: dayEgresos,
                    balance: dayIngresos - dayEgresos,
                };
            });
        } else {
            dailyData = daysInterval.map(day => {
                const dayStr = format(day, "yyyy-MM-dd");
                const dayStart = startOfDay(day);
                const dayEnd = endOfDay(day);

                const dayIngresos = orders
                    .filter(o => o.finalizadoEn && o.finalizadoEn >= dayStart && o.finalizadoEn <= dayEnd)
                    .reduce((sum, o) => sum + Number(o.total), 0);

                const dayEgresos = egresos
                    .filter(e => e.fecha >= dayStart && e.fecha <= dayEnd)
                    .reduce((sum, e) => sum + Number(e.monto), 0);

                return {
                    date: dayStr,
                    ingresos: dayIngresos,
                    egresos: dayEgresos,
                    balance: dayIngresos - dayEgresos,
                };
            });
        }

        // Totales
        const totalIngresos = dailyData.reduce((sum, d) => sum + d.ingresos, 0);
        const totalEgresos = dailyData.reduce((sum, d) => sum + d.egresos, 0);
        const totalBalance = totalIngresos - totalEgresos;

        return {
            success: true,
            data: {
                dailyData,
                totals: {
                    ingresos: totalIngresos,
                    egresos: totalEgresos,
                    balance: totalBalance,
                },
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

export async function getPaymentMethodsData(startDate: Date, endDate: Date) {
    try {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);

        const orders = await prisma.order.findMany({
            where: {
                estado: "FINALIZADO",
                cobrado: true,
                finalizadoEn: {
                    gte: start,
                    lte: end,
                },
                deletedAt: null,
            },
            select: {
                total: true,
                metodoPago: true,
            },
        });

        // Agrupar por método de pago
        const grouped = orders.reduce((acc, order) => {
            const method = order.metodoPago || "Sin especificar";
            if (!acc[method]) {
                acc[method] = { amount: 0, count: 0 };
            }
            acc[method].amount += Number(order.total);
            acc[method].count += 1;
            return acc;
        }, {} as Record<string, { amount: number; count: number }>);

        const total = Object.values(grouped).reduce((sum, g) => sum + g.amount, 0);

        const data: PaymentMethodData[] = Object.entries(grouped).map(([method, stats]) => ({
            method,
            amount: stats.amount,
            count: stats.count,
            percentage: total > 0 ? (stats.amount / total) * 100 : 0,
        }));

        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error("Error getting payment methods data:", error);
        return {
            success: false,
            error: "Error al obtener datos de métodos de pago",
        };
    }
}

export async function getEgresosByCategoryData(startDate: Date, endDate: Date) {
    try {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);

        const egresos = await prisma.egreso.findMany({
            where: {
                fecha: {
                    gte: start,
                    lte: end,
                },
                deletedAt: null,
            },
            select: {
                monto: true,
                categoria: true,
            },
        });

        // Agrupar por categoría
        const grouped = egresos.reduce((acc, egreso) => {
            const cat = egreso.categoria;
            if (!acc[cat]) {
                acc[cat] = 0;
            }
            acc[cat] += Number(egreso.monto);
            return acc;
        }, {} as Record<string, number>);

        const total = Object.values(grouped).reduce((sum, amount) => sum + amount, 0);

        const data: EgresoByCategoryData[] = Object.entries(grouped).map(([categoria, amount]) => ({
            categoria,
            amount,
            percentage: total > 0 ? (amount / total) * 100 : 0,
        }));

        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error("Error getting egresos by category:", error);
        return {
            success: false,
            error: "Error al obtener egresos por categoría",
        };
    }
}

// ============================================================================
// PRODUCT ANALYTICS
// ============================================================================

export async function getTopProductsData(startDate: Date, endDate: Date, limit: number = 10) {
    try {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);

        const orderItems = await prisma.orderItem.findMany({
            where: {
                order: {
                    estado: "FINALIZADO",
                    finalizadoEn: {
                        gte: start,
                        lte: end,
                    },
                    deletedAt: null,
                },
            },
            select: {
                productId: true,
                nombreProduct: true,
                cantidad: true,
                subtotal: true,
            },
        });

        // Agrupar por producto
        const grouped = orderItems.reduce((acc, item) => {
            const id = item.productId || "sin-producto";
            const nombre = item.nombreProduct;

            if (!acc[id]) {
                acc[id] = {
                    id,
                    nombre,
                    count: 0,
                    revenue: 0,
                };
            }
            acc[id].count += Number(item.cantidad);
            acc[id].revenue += Number(item.subtotal);
            return acc;
        }, {} as Record<string, { id: string; nombre: string; count: number; revenue: number }>);

        const totalCount = Object.values(grouped).reduce((sum, p) => sum + p.count, 0);

        const data: TopProductData[] = Object.values(grouped)
            .map(p => ({
                ...p,
                percentage: totalCount > 0 ? (p.count / totalCount) * 100 : 0,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);

        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error("Error getting top products:", error);
        return {
            success: false,
            error: "Error al obtener productos más vendidos",
        };
    }
}

export async function getProductMarginsData(startDate: Date, endDate: Date) {
    try {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);

        // Obtener productos con sus recetas e ítems vendidos
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
                        order: {
                            estado: "FINALIZADO",
                            finalizadoEn: {
                                gte: start,
                                lte: end,
                            },
                            deletedAt: null,
                        },
                    },
                    select: {
                        cantidad: true,
                    },
                },
            },
        });

        const data: ProductMarginData[] = products
            .map(product => {
                const precio = Number(product.precio);

                // Usar el costoUnitario del producto (definido por el usuario, ya sea manual o calculado desde insumos)
                // Si no tiene costoUnitario, calcular desde los insumos de la receta como fallback
                let costoFinal = 0;
                if (product.costoUnitario && Number(product.costoUnitario) > 0) {
                    costoFinal = Number(product.costoUnitario);
                } else if (product.recipeItems.length > 0) {
                    costoFinal = product.recipeItems.reduce((sum, item) => {
                        const costoInsumo = Number(item.supply.costoUnitario || 0);
                        const qty = Number(item.qtyPerUnit);
                        return sum + (costoInsumo * qty);
                    }, 0);
                }

                const margen = precio - costoFinal;
                const margenPorcentaje = precio > 0 ? (margen / precio) * 100 : 0;

                const vecesVendido = product.orderItems.length;
                const margenTotal = margen * vecesVendido;

                return {
                    id: product.id,
                    nombre: product.nombre,
                    precio,
                    costo: costoFinal,
                    margen,
                    margenPorcentaje,
                    vecesVendido,
                    margenTotal,
                };
            })
            .filter(p => p.vecesVendido > 0) // Solo productos vendidos
            .sort((a, b) => b.margenPorcentaje - a.margenPorcentaje);

        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error("Error getting product margins:", error);
        return {
            success: false,
            error: "Error al obtener márgenes de productos",
        };
    }
}

export async function getCategoryRevenueOverTime(startDate: Date, endDate: Date) {
    try {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);

        const daysInterval = eachDayOfInterval({ start, end });

        const orderItems = await prisma.orderItem.findMany({
            where: {
                order: {
                    estado: "FINALIZADO",
                    finalizadoEn: {
                        gte: start,
                        lte: end,
                    },
                    deletedAt: null,
                },
            },
            include: {
                product: {
                    include: {
                        category: true,
                    },
                },
                order: {
                    select: {
                        finalizadoEn: true,
                    },
                },
            },
        });

        // Obtener todas las categorías únicas
        const categories = await prisma.category.findMany({
            where: { deletedAt: null, activo: true },
            select: { nombre: true },
        });

        const categoryNames = categories.map(c => c.nombre);

        // Agrupar por día y categoría
        const data: CategoryRevenueData[] = daysInterval.map(day => {
            const dayStr = format(day, "yyyy-MM-dd");
            const dayStart = startOfDay(day);
            const dayEnd = endOfDay(day);

            const result: CategoryRevenueData = { date: dayStr };

            categoryNames.forEach(catName => {
                const revenue = orderItems
                    .filter(item =>
                        item.order.finalizadoEn &&
                        item.order.finalizadoEn >= dayStart &&
                        item.order.finalizadoEn <= dayEnd &&
                        item.product?.category?.nombre === catName
                    )
                    .reduce((sum, item) => sum + Number(item.subtotal), 0);

                result[catName] = revenue;
            });

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
            error: "Error al obtener ingresos por categoría",
        };
    }
}

// ============================================================================
// INVENTORY DATA
// ============================================================================

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

        const data: StockAlertData[] = supplies.map(supply => {
            const actual = Number(supply.stockActual);
            const minimo = Number(supply.stockMinimo || 0);

            let status: "critical" | "warning" | "ok" = "ok";
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
        });

        return {
            success: true,
            data: data.sort((a, b) => {
                // Ordenar por status (critical > warning > ok)
                const statusOrder = { critical: 0, warning: 1, ok: 2 };
                return statusOrder[a.status] - statusOrder[b.status];
            }),
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
            },
        });

        const data: StockMovementData[] = daysInterval.map(day => {
            const dayStr = format(day, "yyyy-MM-dd");
            const dayStart = startOfDay(day);
            const dayEnd = endOfDay(day);

            const dayMovements = movements.filter(m => m.createdAt >= dayStart && m.createdAt <= dayEnd);

            return {
                date: dayStr,
                in: dayMovements
                    .filter(m => m.tipo === "IN")
                    .reduce((sum, m) => sum + Number(m.cantidad), 0),
                out: dayMovements
                    .filter(m => m.tipo === "OUT")
                    .reduce((sum, m) => sum + Number(m.cantidad), 0),
                ajuste: dayMovements
                    .filter(m => m.tipo === "AJUSTE")
                    .reduce((sum, m) => sum + Number(m.cantidad), 0),
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

        const data = supplies.map(supply => {
            const stock = Number(supply.stockActual);
            const costo = Number(supply.costoUnitario || 0);
            const valor = stock * costo;

            return {
                id: supply.id,
                nombre: supply.nombre,
                stockActual: stock,
                costoUnitario: costo,
                valorTotal: valor,
            };
        });

        const totalValue = data.reduce((sum, s) => sum + s.valorTotal, 0);

        // Top 10 más costosos
        const top10 = [...data]
            .sort((a, b) => b.valorTotal - a.valorTotal)
            .slice(0, 10);

        return {
            success: true,
            data: {
                supplies: data,
                totalValue,
                top10,
            },
        };
    } catch (error) {
        console.error("Error getting inventory valuation:", error);
        return {
            success: false,
            error: "Error al obtener valorización de inventario",
        };
    }
}

// ============================================================================
// ORDERS ANALYTICS
// ============================================================================

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
            const estado = order.estado;
            if (!acc[estado]) {
                acc[estado] = 0;
            }
            acc[estado] += 1;
            return acc;
        }, {} as Record<string, number>);

        const total = orders.length;

        const data: OrderStatusData[] = Object.entries(grouped).map(([estado, count]) => ({
            estado,
            count,
            percentage: total > 0 ? (count / total) * 100 : 0,
        }));

        return {
            success: true,
            data,
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
                enPreparacionEn: {
                    not: null,
                },
                listoEn: {
                    not: null,
                },
                finalizadoEn: {
                    gte: start,
                    lte: end,
                },
                deletedAt: null,
            },
            select: {
                enPreparacionEn: true,
                listoEn: true,
                finalizadoEn: true,
            },
        });

        const data: PrepTimeData[] = daysInterval.map(day => {
            const dayStr = format(day, "yyyy-MM-dd");
            const dayStart = startOfDay(day);
            const dayEnd = endOfDay(day);

            const dayOrders = orders.filter(o =>
                o.finalizadoEn && o.finalizadoEn >= dayStart && o.finalizadoEn <= dayEnd
            );

            if (dayOrders.length === 0) {
                return {
                    date: dayStr,
                    avgMinutes: 0,
                };
            }

            const totalMinutes = dayOrders.reduce((sum, order) => {
                if (order.enPreparacionEn && order.listoEn) {
                    const diff = differenceInMilliseconds(order.listoEn, order.enPreparacionEn);
                    return sum + diff / 1000 / 60; // convertir a minutos
                }
                return sum;
            }, 0);

            return {
                date: dayStr,
                avgMinutes: totalMinutes / dayOrders.length,
            };
        });

        const overallAvg = data.reduce((sum, d) => sum + d.avgMinutes, 0) / data.length;

        return {
            success: true,
            data: {
                daily: data,
                overallAvg: isNaN(overallAvg) ? 0 : overallAvg,
            },
        };
    } catch (error) {
        console.error("Error getting prep time data:", error);
        return {
            success: false,
            error: "Error al obtener tiempos de preparación",
        };
    }
}

export async function getOrdersByOriginData(startDate: Date, endDate: Date) {
    try {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);

        const daysInterval = eachDayOfInterval({ start, end });

        const orders = await prisma.order.findMany({
            where: {
                finalizadoEn: {
                    gte: start,
                    lte: end,
                },
                estado: "FINALIZADO",
                deletedAt: null,
            },
            select: {
                origen: true,
                finalizadoEn: true,
            },
        });

        const data = daysInterval.map(day => {
            const dayStr = format(day, "yyyy-MM-dd");
            const dayStart = startOfDay(day);
            const dayEnd = endOfDay(day);

            const dayOrders = orders.filter(o =>
                o.finalizadoEn && o.finalizadoEn >= dayStart && o.finalizadoEn <= dayEnd
            );

            const interno = dayOrders.filter(o => o.origen === "INTERNO").length;
            const catalogo = dayOrders.filter(o => o.origen === "CATALOGO").length;

            return {
                date: dayStr,
                INTERNO: interno,
                CATALOGO: catalogo,
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

export async function getHeatmapData(startDate: Date, endDate: Date) {
    try {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);

        const orders = await prisma.order.findMany({
            where: {
                recibidoEn: {
                    gte: start,
                    lte: end,
                },
                deletedAt: null,
            },
            select: {
                recibidoEn: true,
            },
        });

        // Crear matriz de 7 días x 24 horas
        const heatmapMatrix: HeatmapData[] = [];

        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                const count = orders.filter(o => {
                    const orderDay = o.recibidoEn.getDay();
                    const orderHour = o.recibidoEn.getHours();
                    return orderDay === day && orderHour === hour;
                }).length;

                heatmapMatrix.push({
                    dayOfWeek: day,
                    hour,
                    count,
                });
            }
        }

        return {
            success: true,
            data: heatmapMatrix,
        };
    } catch (error) {
        console.error("Error getting heatmap data:", error);
        return {
            success: false,
            error: "Error al obtener mapa de calor",
        };
    }
}

export async function getTicketPromedioData(startDate: Date, endDate: Date) {
    try {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);

        const daysInterval = eachDayOfInterval({ start, end });

        const orders = await prisma.order.findMany({
            where: {
                estado: "FINALIZADO",
                finalizadoEn: {
                    gte: start,
                    lte: end,
                },
                deletedAt: null,
            },
            select: {
                total: true,
                origen: true,
                finalizadoEn: true,
            },
        });

        const data = daysInterval.map(day => {
            const dayStr = format(day, "yyyy-MM-dd");
            const dayStart = startOfDay(day);
            const dayEnd = endOfDay(day);

            const dayOrders = orders.filter(o =>
                o.finalizadoEn && o.finalizadoEn >= dayStart && o.finalizadoEn <= dayEnd
            );

            const internoOrders = dayOrders.filter(o => o.origen === "INTERNO");
            const catalogoOrders = dayOrders.filter(o => o.origen === "CATALOGO");

            const avgInterno = internoOrders.length > 0
                ? internoOrders.reduce((sum, o) => sum + Number(o.total), 0) / internoOrders.length
                : 0;

            const avgCatalogo = catalogoOrders.length > 0
                ? catalogoOrders.reduce((sum, o) => sum + Number(o.total), 0) / catalogoOrders.length
                : 0;

            const avgTotal = dayOrders.length > 0
                ? dayOrders.reduce((sum, o) => sum + Number(o.total), 0) / dayOrders.length
                : 0;

            return {
                date: dayStr,
                INTERNO: avgInterno,
                CATALOGO: avgCatalogo,
                TOTAL: avgTotal,
            };
        });

        // Promedios generales
        const allInterno = orders.filter(o => o.origen === "INTERNO");
        const allCatalogo = orders.filter(o => o.origen === "CATALOGO");

        const overallAvgInterno = allInterno.length > 0
            ? allInterno.reduce((sum, o) => sum + Number(o.total), 0) / allInterno.length
            : 0;

        const overallAvgCatalogo = allCatalogo.length > 0
            ? allCatalogo.reduce((sum, o) => sum + Number(o.total), 0) / allCatalogo.length
            : 0;

        const overallAvgTotal = orders.length > 0
            ? orders.reduce((sum, o) => sum + Number(o.total), 0) / orders.length
            : 0;

        return {
            success: true,
            data: {
                daily: data,
                overall: {
                    INTERNO: overallAvgInterno,
                    CATALOGO: overallAvgCatalogo,
                    TOTAL: overallAvgTotal,
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

// ============================================================================
// PROFITABILITY DATA
// ============================================================================

export async function getProfitabilityByCategoryData(startDate: Date, endDate: Date) {
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
                                order: {
                                    estado: "FINALIZADO",
                                    finalizadoEn: {
                                        gte: start,
                                        lte: end,
                                    },
                                    deletedAt: null,
                                },
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

        const data: ProfitabilityByCategoryData[] = categories.map(category => {
            let ingresos = 0;
            let costos = 0;

            category.products.forEach(product => {
                // Calcular ingresos
                const productIngresos = product.orderItems.reduce(
                    (sum, item) => sum + Number(item.subtotal),
                    0
                );
                ingresos += productIngresos;

                // Usar el costoUnitario del producto (definido por el usuario, ya sea manual o calculado desde insumos)
                // Si no tiene costoUnitario, calcular desde los insumos de la receta como fallback
                let costoUnitario = 0;
                if (product.costoUnitario && Number(product.costoUnitario) > 0) {
                    costoUnitario = Number(product.costoUnitario);
                } else if (product.recipeItems.length > 0) {
                    costoUnitario = product.recipeItems.reduce((sum, item) => {
                        const costoInsumo = Number(item.supply.costoUnitario || 0);
                        const qty = Number(item.qtyPerUnit);
                        return sum + (costoInsumo * qty);
                    }, 0);
                }

                const cantidadVendida = product.orderItems.reduce(
                    (sum, item) => sum + Number(item.cantidad),
                    0
                );

                costos += costoUnitario * cantidadVendida;
            });

            const beneficio = ingresos - costos;
            const margenPorcentaje = ingresos > 0 ? (beneficio / ingresos) * 100 : 0;

            return {
                categoria: category.nombre,
                ingresos,
                costos,
                beneficio,
                margenPorcentaje,
            };
        }).filter(c => c.ingresos > 0); // Solo categorías con ventas

        return {
            success: true,
            data: data.sort((a, b) => b.beneficio - a.beneficio),
        };
    } catch (error) {
        console.error("Error getting profitability by category:", error);
        return {
            success: false,
            error: "Error al obtener rentabilidad por categoría",
        };
    }
}

export async function getMonthlyROI(year: number) {
    try {
        const data = [];

        for (let month = 0; month < 12; month++) {
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

            // Ingresos del mes
            const orders = await prisma.order.findMany({
                where: {
                    estado: "FINALIZADO",
                    cobrado: true,
                    finalizadoEn: {
                        gte: startDate,
                        lte: endDate,
                    },
                    deletedAt: null,
                },
                select: {
                    total: true,
                },
            });

            const ingresos = orders.reduce((sum, o) => sum + Number(o.total), 0);

            // Egresos del mes
            const egresos = await prisma.egreso.findMany({
                where: {
                    fecha: {
                        gte: startDate,
                        lte: endDate,
                    },
                    deletedAt: null,
                },
                select: {
                    monto: true,
                },
            });

            const egresosTotal = egresos.reduce((sum, e) => sum + Number(e.monto), 0);

            // ROI = ((Ingresos - Egresos) / Egresos) * 100
            const roi = egresosTotal > 0 ? ((ingresos - egresosTotal) / egresosTotal) * 100 : 0;

            data.push({
                month: format(startDate, "MMM", { locale: es }),
                ingresos,
                egresos: egresosTotal,
                roi,
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
