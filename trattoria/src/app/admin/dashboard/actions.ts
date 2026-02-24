"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";
import { getConfigs } from "@/app/actions/configActions";

export async function getDashboardMetrics() {
    try {
        const today = new Date();
        const startOfToday = startOfDay(today);
        const endOfToday = endOfDay(today);
        const startOfYesterday = startOfDay(subDays(today, 1));
        const endOfYesterday = endOfDay(subDays(today, 1));

        // 1. Venture Totals (Finalized orders)
        const finalizedOrders = await prisma.order.findMany({
            where: {
                estado: "FINALIZADO",
                deletedAt: null
            },
            select: {
                total: true,
                recibidoEn: true
            }
        });

        const totalSales = finalizedOrders.reduce((acc, order) => acc + Number(order.total), 0);

        // Sales today vs yesterday
        const salesToday = finalizedOrders
            .filter(o => o.recibidoEn >= startOfToday && o.recibidoEn <= endOfToday)
            .reduce((acc, order) => acc + Number(order.total), 0);

        const salesYesterday = finalizedOrders
            .filter(o => o.recibidoEn >= startOfYesterday && o.recibidoEn <= endOfYesterday)
            .reduce((acc, order) => acc + Number(order.total), 0);

        const salesGrowth = salesYesterday > 0
            ? ((salesToday - salesYesterday) / salesYesterday) * 100
            : salesToday > 0 ? 100 : 0;

        // 2. Orders Count (All except deleted)
        const totalOrdersToday = await prisma.order.count({
            where: {
                recibidoEn: {
                    gte: startOfToday,
                    lte: endOfToday
                },
                deletedAt: null
            }
        });

        const pendingOrders = await prisma.order.count({
            where: {
                estado: {
                    in: ["RECIBIDO", "PENDIENTE", "EN_PREPARACION"]
                },
                deletedAt: null
            }
        });

        // 3. Active Customers
        const activeCustomers = await prisma.customer.count({
            where: {
                activo: true,
                deletedAt: null
            }
        });

        // 4. Monthly Goal
        const configsResult = await getConfigs(["goals.monthly"]);
        let monthlyGoalSetting = { amount: 1000000, type: "revenue" };
        if (configsResult.success && configsResult.data && configsResult.data["goals.monthly"]) {
            monthlyGoalSetting = configsResult.data["goals.monthly"];
        }

        const monthlyGoalAmount = monthlyGoalSetting.amount;
        const monthlyGoalType = monthlyGoalSetting.type;

        // Calculate revenue for current month
        const currentMonthStart = startOfMonth(today);
        const currentMonthEnd = endOfMonth(today);

        let currentAmount = 0;

        const currentMonthSales = finalizedOrders
            .filter(o => o.recibidoEn >= currentMonthStart && o.recibidoEn <= currentMonthEnd)
            .reduce((acc, order) => acc + Number(order.total), 0);

        if (monthlyGoalType === "profit") {
            // Need to calculate profit = revenue - expenses
            const currentMonthEgresos = await prisma.egreso.aggregate({
                _sum: {
                    monto: true
                },
                where: {
                    fecha: {
                        gte: currentMonthStart,
                        lte: currentMonthEnd
                    },
                    deletedAt: null
                }
            });
            const totalEgresos = Number(currentMonthEgresos._sum.monto || 0);
            currentAmount = currentMonthSales - totalEgresos;
        } else {
            // Default is revenue
            currentAmount = currentMonthSales;
        }

        const goalProgress = monthlyGoalAmount > 0
            ? Math.min(Math.round((currentAmount / monthlyGoalAmount) * 100), 100)
            : 0;

        // 5. Weekly Revenue (Last 7 days)
        const weeklyRevenueData = [];
        for (let i = 6; i >= 0; i--) {
            const date = subDays(today, i);
            const start = startOfDay(date);
            const end = endOfDay(date);

            const daySales = finalizedOrders
                .filter(o => o.recibidoEn >= start && o.recibidoEn <= end)
                .reduce((acc, order) => acc + Number(order.total), 0);

            weeklyRevenueData.push({
                day: format(date, 'eee', { locale: es }).substring(0, 3).toUpperCase(),
                revenue: daySales
            });
        }

        return {
            success: true,
            data: {
                totalSales,
                salesToday,
                salesGrowth: salesGrowth.toFixed(1),
                totalOrdersToday,
                pendingOrders,
                activeCustomers,
                monthlyGoal: {
                    amount: monthlyGoalAmount,
                    type: monthlyGoalType,
                    currentAmount,
                    progress: goalProgress
                },
                weeklyRevenue: weeklyRevenueData
            }
        };
    } catch (error) {
        console.error("Error fetching dashboard metrics:", error);
        return { success: false, error: "Error al cargar métricas" };
    }
}

export async function getRecentActivity() {
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
