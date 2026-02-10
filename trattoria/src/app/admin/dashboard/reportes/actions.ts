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
        const where = {
            deletedAt: null,
            ...(startDate && endDate ? {
                recibidoEn: {
                    gte: startDate,
                    lte: endDate
                }
            } : {})
        };

        const whereNotCancelled = {
            ...where,
            estado: { not: EstadoPedido.CANCELADO }
        };

        const whereFinalized = {
            ...where,
            estado: EstadoPedido.FINALIZADO
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
            // Total Revenue summary (excluding cancelled orders)
            prisma.order.aggregate({
                where: whereNotCancelled,
                _sum: { total: true },
                _count: { id: true }
            }),
            // Total Orders Count (all orders in range)
            prisma.order.count({ where }),
            // Finalized orders for daily stats
            prisma.order.findMany({
                where: whereFinalized,
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
            where: whereNotCancelled,
            _sum: { total: true },
            _count: true
        });

        const ordersByStatus: { [key: string]: number } = {};
        statusGroups.forEach(g => {
            if (g.estado) {
                ordersByStatus[g.estado] = g._count || 0;
            }
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
            totalRevenue: totalRevenue || 0,
            totalOrders: totalOrdersAgg || 0,
            averageTicket: averageTicket || 0,
            ordersByStatus: ordersByStatus || {},
            ordersByPaymentMethod: ordersByPaymentMethod || {},
            revenueByDay: revenueByDay || {}
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
                    total: order.total?.toNumber() || 0,
                    metodoPago: order.metodoPago || "N/A",
                    estado: order.estado,
                    items: (order.items || []).map(item => ({
                        id: item.id,
                        productId: item.productId,
                        cantidad: item.cantidad?.toNumber() || 0,
                        precioUnitario: item.precioUnitario?.toNumber() || 0,
                        subtotal: item.subtotal?.toNumber() || 0
                    }))
                }))
            }
        };

    } catch (error) {
        console.error("Error fetching reports data:", error);
        return { 
            success: false, 
            error: "No se pudieron cargar los reportes",
            data: null
        };
    }
}
