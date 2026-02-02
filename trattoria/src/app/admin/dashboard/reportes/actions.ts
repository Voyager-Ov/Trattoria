"use server";

import { prisma } from "@/lib/prisma";
import { EstadoPedido } from "@prisma/client";

export type FinancialSummary = {
    totalRevenue: number;
    totalOrders: number;
    averageTicket: number;
    ordersByStatus: { [key: string]: number };
    ordersByPaymentMethod: { [key: string]: number };
    revenueByDay: { [key: string]: { revenue: number, count: number } };
};

export async function getReportsData(startDate?: Date, endDate?: Date) {
    try {
        const where: any = {
            deletedAt: null,
            ...(startDate && endDate ? {
                recibidoEn: {
                    gte: startDate,
                    lte: endDate
                }
            } : {})
        };

        const [
            recentOrders,
            totalRevenueAgg,
            totalOrdersAgg,
            allValidOrdersInRange
        ] = await Promise.all([
            // Recent transactions for the table (limited to 50)
            prisma.order.findMany({
                where,
                orderBy: { recibidoEn: "desc" },
                take: 50,
                include: {
                    items: true
                }
            }),
            // Total Revenue summary
            prisma.order.aggregate({
                where: {
                    ...where,
                    estado: { not: "CANCELADO" as EstadoPedido }
                },
                _sum: { total: true },
                _count: { id: true }
            }),
            // Total Orders Count
            prisma.order.count({ where }),
            // All valid orders in range to calculate daily stats (only needed fields for performance)
            prisma.order.findMany({
                where: {
                    ...where,
                    estado: { in: ["FINALIZADO"] as EstadoPedido[] }
                },
                select: {
                    total: true,
                    recibidoEn: true
                }
            })
        ]);

        const totalRevenue = totalRevenueAgg._sum.total?.toNumber() || 0;
        const validOrdersCount = totalRevenueAgg._count.id || 0;
        const averageTicket = validOrdersCount > 0 ? totalRevenue / validOrdersCount : 0;

        // Group by Status
        const statusGroups = await prisma.order.groupBy({
            by: ['estado'],
            where: where,
            _count: true
        });

        // Group by Payment Method
        const paymentGroups = await prisma.order.groupBy({
            by: ['metodoPago'],
            where: {
                ...where,
                estado: { not: "CANCELADO" as EstadoPedido }
            },
            _sum: { total: true },
            _count: true
        });

        const ordersByStatus: { [key: string]: number } = {};
        statusGroups.forEach(g => {
            ordersByStatus[g.estado] = g._count;
        });

        const ordersByPaymentMethod: { [key: string]: number } = {};
        paymentGroups.forEach(g => {
            if (g.metodoPago) {
                ordersByPaymentMethod[g.metodoPago] = g._sum.total?.toNumber() || 0;
            }
        });

        // Group by Day (for charts)
        const revenueByDay: { [key: string]: { revenue: number, count: number } } = {};
        allValidOrdersInRange.forEach(order => {
            const dayKey = order.recibidoEn.toISOString().split('T')[0];
            if (!revenueByDay[dayKey]) {
                revenueByDay[dayKey] = { revenue: 0, count: 0 };
            }
            revenueByDay[dayKey].revenue += order.total.toNumber();
            revenueByDay[dayKey].count += 1;
        });

        const summary: FinancialSummary = {
            totalRevenue,
            totalOrders: totalOrdersAgg,
            averageTicket,
            ordersByStatus,
            ordersByPaymentMethod,
            revenueByDay
        };

        return {
            success: true,
            data: {
                summary,
                recentTransactions: recentOrders.map(order => ({
                    id: order.id,
                    numero: order.numero,
                    recibidoEn: order.recibidoEn.toISOString(),
                    clienteNombre: order.clienteNombre || "Cliente Final",
                    total: order.total.toNumber(),
                    metodoPago: order.metodoPago || "N/A",
                    estado: order.estado,
                    items: order.items.map(item => ({
                        ...item,
                        cantidad: item.cantidad.toNumber(),
                        precioUnitario: item.precioUnitario.toNumber(),
                        subtotal: item.subtotal.toNumber()
                    }))
                }))
            }
        };

    } catch (error) {
        console.error("Error fetching reports data:", error);
        return { success: false, error: "No se pudieron cargar los reportes" };
    }
}
