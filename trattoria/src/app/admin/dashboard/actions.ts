"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays } from "date-fns";

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

        // 4. Monthly Goal (Mock logic based on current data)
        // Let's assume a goal of 1,000,000 for the month
        const monthlyGoal = 1000000;
        const currentMonthSales = finalizedOrders
            .filter(o => o.recibidoEn.getMonth() === today.getMonth() && o.recibidoEn.getFullYear() === today.getFullYear())
            .reduce((acc, order) => acc + Number(order.total), 0);

        const goalProgress = Math.min(Math.round((currentMonthSales / monthlyGoal) * 100), 100);

        return {
            success: true,
            data: {
                totalSales,
                salesToday,
                salesGrowth: salesGrowth.toFixed(1),
                totalOrdersToday,
                pendingOrders,
                activeCustomers,
                goalProgress
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
