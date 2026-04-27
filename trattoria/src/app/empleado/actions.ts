"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { EstadoPedido } from "@prisma/client";
import { requireEmployee } from "@/lib/serverAuth";
import { getSystemNow } from "@/lib/system-time";

export async function getEmployeeDashboardMetrics() {
    // F-04d: Requires active employee or admin session
    await requireEmployee();
    try {
        const today = getSystemNow();
        const startOfToday = startOfDay(today);
        const endOfToday = endOfDay(today);

        // 1. Pending (Waiting for prep)
        const pendingCount = await prisma.order.count({
            where: {
                estado: {
                    in: ["RECIBIDO", "PENDIENTE"]
                },
                deletedAt: null
            }
        });

        // 2. In Preparation (Kitchen)
        const preparingCount = await prisma.order.count({
            where: {
                estado: "EN_PREPARACION",
                deletedAt: null
            }
        });

        // 3. Ready (Waiting for delivery/pickup)
        const readyCount = await prisma.order.count({
            where: {
                estado: "LISTO",
                deletedAt: null
            }
        });

        // 4. Completed Today (Personal or Shift total - simplifying to Store Total for now as user didn't specify personal stats)
        // Ideally this would be "Orders handled by me", but unrelated to specific shift logic yet.
        const completedTodayCount = await prisma.order.count({
            where: {
                estado: "FINALIZADO",
                updatedAt: {
                    gte: startOfToday,
                    lte: endOfToday
                },
                deletedAt: null
            }
        });

        return {
            success: true,
            data: {
                pendingCount,
                preparingCount,
                readyCount,
                completedTodayCount
            }
        };
    } catch (error) {
        console.error("Error fetching employee metrics:", error);
        return { success: false, error: "Error al cargar métricas" };
    }
}

export async function getRecentOrders() {
    // F-04d: Requires active employee or admin session
    await requireEmployee();
    try {
        const orders = await prisma.order.findMany({
            where: {
                // Show active orders primarily
                estado: {
                    in: ["RECIBIDO", "PENDIENTE", "EN_PREPARACION", "LISTO"]
                },
                deletedAt: null
            },
            take: 5,
            orderBy: {
                // Prioritize oldest active orders (FIFO)
                recibidoEn: 'asc'
            },
            select: {
                id: true,
                numero: true,
                clienteNombre: true,
                estado: true,
                recibidoEn: true,
                total: true,
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
            data: JSON.parse(JSON.stringify(orders))
        };
    } catch (error) {
        console.error("Error fetching recent orders:", error);
        return { success: false, error: "Error al cargar pedidos recientes" };
    }
}
