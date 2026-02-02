"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CategoriaEgreso } from "@prisma/client";

export type EgresoFilter = {
    search?: string;
    categoria?: CategoriaEgreso;
    fechaInicio?: Date;
    fechaFin?: Date;
};

export async function getEgresos(filters: EgresoFilter = {}) {
    try {
        const { search, categoria, fechaInicio, fechaFin } = filters;

        const where: any = {
            deletedAt: null,
        };

        if (search) {
            where.OR = [
                { descripcion: { contains: search, mode: "insensitive" } },
                { numero: { contains: search, mode: "insensitive" } },
                { proveedor: { contains: search, mode: "insensitive" } },
            ];
        }

        if (categoria) {
            where.categoria = categoria;
        }

        if (fechaInicio || fechaFin) {
            where.fecha = {};
            if (fechaInicio) where.fecha.gte = fechaInicio;
            if (fechaFin) where.fecha.lte = fechaFin;
        }

        const egresos = await prisma.egreso.findMany({
            where,
            orderBy: { fecha: "desc" },
        });

        // Convert Decimal to number for client components
        return {
            success: true,
            data: egresos.map(e => ({
                ...e,
                monto: Number(e.monto)
            }))
        };
    } catch (error) {
        console.error("Error fetching egresos:", error);
        return { success: false, error: "No se pudieron obtener los egresos" };
    }
}

export async function getEgresoStats(filters: EgresoFilter = {}) {
    try {
        const { fechaInicio, fechaFin } = filters;

        const where: any = {
            deletedAt: null,
        };

        if (fechaInicio || fechaFin) {
            where.fecha = {};
            if (fechaInicio) where.fecha.gte = fechaInicio;
            if (fechaFin) where.fecha.lte = fechaFin;
        }

        const egresos = await prisma.egreso.findMany({
            where,
            select: {
                monto: true,
                categoria: true
            }
        });

        const stats = {
            total: 0,
            porCategoria: {} as Record<string, number>,
            count: egresos.length
        };

        egresos.forEach(e => {
            const monto = Number(e.monto);
            stats.total += monto;
            stats.porCategoria[e.categoria] = (stats.porCategoria[e.categoria] || 0) + monto;
        });

        return { success: true, data: stats };
    } catch (error) {
        console.error("Error fetching egreso stats:", error);
        return { success: false, error: "No se pudieron obtener las estadísticas" };
    }
}

export async function createEgreso(data: {
    descripcion: string;
    monto: number;
    categoria: CategoriaEgreso;
    fecha?: Date;
    proveedor?: string;
}) {
    try {
        const newEgreso = await prisma.$transaction(async (tx) => {
            // 1. Get next sequence number
            const seq = await tx.appSequence.upsert({
                where: { tipo: "egreso" },
                update: { ultimo: { increment: 1 } },
                create: { tipo: "egreso", prefijo: "E-", ultimo: 1 }
            });
            const numero = `${seq.prefijo}${seq.ultimo.toString().padStart(3, '0')}`;

            // 2. Create egreso
            const egreso = await tx.egreso.create({
                data: {
                    numero,
                    descripcion: data.descripcion,
                    monto: data.monto,
                    categoria: data.categoria,
                    fecha: data.fecha || new Date(),
                    proveedor: data.proveedor,
                }
            });

            // 3. Create Audit Log
            await tx.auditLog.create({
                data: {
                    action: "CREATE_EXPENSE",
                    objectType: "egreso",
                    objectId: egreso.id,
                    after: JSON.parse(JSON.stringify(egreso)),
                    notes: `Gasto ${numero} creado`
                }
            });

            return egreso;
        });

        revalidatePath("/admin/dashboard/reportes/egresos");
        revalidatePath("/admin/dashboard/reportes"); // Revalidate dashboard too

        return {
            success: true,
            data: { ...newEgreso, monto: Number(newEgreso.monto) }
        };
    } catch (error) {
        console.error("Error creating egreso:", error);
        return { success: false, error: "No se pudo crear el egreso" };
    }
}

export async function updateEgreso(id: string, data: {
    descripcion?: string;
    monto?: number;
    categoria?: CategoriaEgreso;
    fecha?: Date;
    proveedor?: string;
}) {
    try {
        const oldEgreso = await prisma.egreso.findUnique({ where: { id } });
        if (!oldEgreso) return { success: false, error: "Egreso no encontrado" };

        const updated = await prisma.$transaction(async (tx) => {
            const egreso = await tx.egreso.update({
                where: { id },
                data: {
                    ...data,
                    updatedAt: new Date()
                }
            });

            await tx.auditLog.create({
                data: {
                    action: "UPDATE_EXPENSE",
                    objectType: "egreso",
                    objectId: egreso.id,
                    before: JSON.parse(JSON.stringify(oldEgreso)),
                    after: JSON.parse(JSON.stringify(egreso)),
                    notes: `Gasto ${egreso.numero} actualizado`
                }
            });

            return egreso;
        });

        revalidatePath("/admin/dashboard/reportes/egresos");
        revalidatePath("/admin/dashboard/reportes");

        return {
            success: true,
            data: { ...updated, monto: Number(updated.monto) }
        };
    } catch (error) {
        console.error("Error updating egreso:", error);
        return { success: false, error: "No se pudo actualizar el egreso" };
    }
}

export async function deleteEgreso(id: string) {
    try {
        const egreso = await prisma.egreso.findUnique({ where: { id } });
        if (!egreso) return { success: false, error: "Egreso no encontrado" };

        await prisma.$transaction(async (tx) => {
            await tx.egreso.update({
                where: { id },
                data: { deletedAt: new Date() }
            });

            await tx.auditLog.create({
                data: {
                    action: "DELETE_EXPENSE",
                    objectType: "egreso",
                    objectId: id,
                    before: JSON.parse(JSON.stringify(egreso)),
                    notes: `Gasto ${egreso.numero} eliminado`
                }
            });
        });

        revalidatePath("/admin/dashboard/reportes/egresos");
        revalidatePath("/admin/dashboard/reportes");

        return { success: true };
    } catch (error) {
        console.error("Error deleting egreso:", error);
        return { success: false, error: "No se pudo eliminar el egreso" };
    }
}
