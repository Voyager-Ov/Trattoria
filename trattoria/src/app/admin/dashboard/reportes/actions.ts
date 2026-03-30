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

        // Financial filter: payment is the sole source of truth for revenue.
        // Operational status (FINALIZADO, etc.) must NOT affect financial calculations.
        const wherePaid = {
            ...where,
            cobrado: true,
            estado: { not: EstadoPedido.CANCELADO }
        };

        const [
            recentOrders,
            totalRevenueAgg,
            totalOrdersAgg,
            allPaidOrders
        ] = await Promise.all([
            // Recent transactions: ONLY paid, non-cancelled orders
            prisma.order.findMany({
                where: wherePaid,
                orderBy: { cobradoEn: "desc" },
                take: 50,
                include: {
                    items: true
                }
            }),
            // Total Revenue: only cobrado=true and not cancelled
            prisma.order.aggregate({
                where: wherePaid,
                _sum: { total: true },
                _count: { id: true }
            }),
            // Total Orders Count (all orders in range, for operational overview)
            prisma.order.count({ where }),
            // Paid orders for daily stats
            prisma.order.findMany({
                where: wherePaid,
                select: {
                    total: true,
                    cobradoEn: true
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

        // Group by Payment Method (only paid non-cancelled orders)
        const paymentGroups = await prisma.order.groupBy({
            by: ['metodoPago'],
            where: wherePaid,
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
        const isSingleDay = startDate && endDate && startDate.toISOString().split('T')[0] === endDate.toISOString().split('T')[0];

        const revenueByDay: { [key: string]: { revenue: number, count: number } } = {};
        allPaidOrders.forEach(order => {
            const dateSource = order.cobradoEn || order.cobradoEn;
            if (!dateSource) return;
            let dayKey = dateSource.toISOString().split('T')[0];
            if (isSingleDay) {
                dayKey = dateSource.toISOString().substring(0, 13);
            }
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
                    // metodoPago is always set when cobrado=true (enforced in actions.ts)
                    metodoPago: order.metodoPago || "EFECTIVO",
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
