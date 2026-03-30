"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";
import { getConfigs } from "@/app/actions/configActions";
import { requireAdmin } from "@/lib/serverAuth";

export async function getDashboardMetrics() {
    // F-04c: sensitive financial metrics — ADMIN only
    await requireAdmin();
    try {
        const today = new Date();
        const startOfToday = startOfDay(today);
        const endOfToday = endOfDay(today);
        const startOfYesterday = startOfDay(subDays(today, 1));
        const endOfYesterday = endOfDay(subDays(today, 1));
        const currentMonthStart = startOfMonth(today);
        const currentMonthEnd = endOfMonth(today);

        // F-12: All aggregations pushed to DB — run concurrently via Promise.all
        // Previously: prisma.order.findMany({ estado:FINALIZADO }) → filter + reduce in JS (loads ALL rows)
        // Now: 8 targeted aggregate queries, zero rows transferred to Node.js
        const [
            totalSalesResult,
            salesTodayResult,
            salesYesterdayResult,
            currentMonthSalesResult,
            totalOrdersToday,
            pendingOrders,
            activeCustomers,
            configsResult,
        ] = await Promise.all([
            // All-time total revenue: based on payment status only
            prisma.order.aggregate({
                _sum: { total: true },
                where: { cobrado: true, estado: { not: 'CANCELADO' }, deletedAt: null },
            }),
            // Today's revenue: orders paid today
            prisma.order.aggregate({
                _sum: { total: true },
                where: { cobrado: true, estado: { not: 'CANCELADO' }, deletedAt: null, cobradoEn: { gte: startOfToday, lte: endOfToday } },
            }),
            // Yesterday's revenue: orders paid yesterday
            prisma.order.aggregate({
                _sum: { total: true },
                where: { cobrado: true, estado: { not: 'CANCELADO' }, deletedAt: null, cobradoEn: { gte: startOfYesterday, lte: endOfYesterday } },
            }),
            // Current month's revenue: orders paid this month
            prisma.order.aggregate({
                _sum: { total: true },
                where: { cobrado: true, estado: { not: 'CANCELADO' }, deletedAt: null, cobradoEn: { gte: currentMonthStart, lte: currentMonthEnd } },
            }),
            // Orders received today (any state except deleted)
            prisma.order.count({
                where: { recibidoEn: { gte: startOfToday, lte: endOfToday }, deletedAt: null },
            }),
            // Active (non-finalized, non-cancelled) orders
            prisma.order.count({
                where: { estado: { in: ['RECIBIDO', 'PENDIENTE', 'EN_PREPARACION'] }, deletedAt: null },
            }),
            // Active customers
            prisma.customer.count({ where: { activo: true, deletedAt: null } }),
            // Monthly goal config
            getConfigs(['goals.monthly']),
        ]);

        const totalSales = Number(totalSalesResult._sum.total ?? 0);
        const salesToday = Number(salesTodayResult._sum.total ?? 0);
        const salesYesterday = Number(salesYesterdayResult._sum.total ?? 0);
        const currentMonthSales = Number(currentMonthSalesResult._sum.total ?? 0);

        const salesGrowth = salesYesterday > 0
            ? ((salesToday - salesYesterday) / salesYesterday) * 100
            : salesToday > 0 ? 100 : 0;

        // Monthly goal
        let monthlyGoalSetting = { amount: 1000000, type: 'revenue' };
        if (configsResult.success && configsResult.data?.['goals.monthly']) {
            monthlyGoalSetting = configsResult.data['goals.monthly'];
        }
        const { amount: monthlyGoalAmount, type: monthlyGoalType } = monthlyGoalSetting;

        let currentAmount = currentMonthSales;
        if (monthlyGoalType === 'profit') {
            const currentMonthEgresos = await prisma.egreso.aggregate({
                _sum: { monto: true },
                where: { fecha: { gte: currentMonthStart, lte: currentMonthEnd }, deletedAt: null },
            });
            currentAmount = currentMonthSales - Number(currentMonthEgresos._sum.monto ?? 0);
        }

        const goalProgress = monthlyGoalAmount > 0
            ? Math.min(Math.round((currentAmount / monthlyGoalAmount) * 100), 100)
            : 0;

        // Weekly revenue: 7 individual day aggregates in parallel
        const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
        const weeklyAggregates = await Promise.all(
            last7Days.map(date =>
                prisma.order.aggregate({
                    _sum: { total: true },
                    where: {
                        cobrado: true,
                        estado: { not: 'CANCELADO' },
                        deletedAt: null,
                        cobradoEn: { gte: startOfDay(date), lte: endOfDay(date) },
                    },
                })
            )
        );
        const weeklyRevenueData = last7Days.map((date, i) => ({
            day: format(date, 'eee', { locale: es }).substring(0, 3).toUpperCase(),
            revenue: Number(weeklyAggregates[i]._sum.total ?? 0),
        }));

        return {
            success: true,
            data: {
                totalSales,
                salesToday,
                salesGrowth: salesGrowth.toFixed(1),
                totalOrdersToday,
                pendingOrders,
                activeCustomers,
                monthlyGoal: { amount: monthlyGoalAmount, type: monthlyGoalType, currentAmount, progress: goalProgress },
                weeklyRevenue: weeklyRevenueData,
            }
        };
    } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        return { success: false, error: 'Error al cargar métricas' };
    }
}

export async function getRecentActivity() {
    // F-04c: order data with customer info — ADMIN only
    await requireAdmin();
    try {
        const recentOrders = await prisma.order.findMany({
            where: {
                deletedAt: null
            },
            take: 6,
            orderBy: {
                recibidoEn: 'desc'
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
                        cantidad: true
                    }
                }
            }
        });

        return {
            success: true,
            data: JSON.parse(JSON.stringify(recentOrders))
        };
    } catch (error) {
        console.error("Error fetching recent activity:", error);
        return { success: false, error: "Error al cargar actividad reciente" };
    }
}
