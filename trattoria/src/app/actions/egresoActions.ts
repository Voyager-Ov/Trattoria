"use server";

import { CategoriaEgreso, EstadoPagoEgreso, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getSystemNow } from "@/lib/system-time";
import { requireAdmin } from "@/lib/serverAuth";

export type EgresoFilter = {
    search?: string;
    categoria?: CategoriaEgreso;
    fechaInicio?: Date;
    fechaFin?: Date;
    estadoPago?: EstadoPagoEgreso;
};

export type EgresoPayload = {
    descripcion: string;
    monto: number;
    categoria: CategoriaEgreso;
    fecha?: Date;
    proveedor?: string;
    providerId?: string | null;
    metodoPago?: string;
    comprobante?: string;
    estadoPago?: EstadoPagoEgreso;
    tipoComprobante?: string;
    numeroComprobante?: string;
    centroCosto?: string;
    fechaDevengado?: Date;
    fechaPago?: Date;
    fechaVencimiento?: Date;
    periodoDesde?: Date;
    periodoHasta?: Date;
    neto?: number | null;
    impuestos?: number | null;
    percepciones?: number | null;
};

type PrismaTransaction = Prisma.TransactionClient;

function normalizeOptionalString(value?: string | null) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
}

async function resolveProvider(
    tx: PrismaTransaction,
    providerId?: string | null,
    proveedor?: string | null
) {
    const normalizedProviderId = normalizeOptionalString(providerId);
    const normalizedProveedor = normalizeOptionalString(proveedor);

    if (normalizedProviderId) {
        const provider = await tx.provider.findUnique({
            where: { id: normalizedProviderId },
            select: { id: true, nombre: true },
        });

        if (!provider) {
            throw new Error("Proveedor no encontrado");
        }

        return {
            providerId: provider.id,
            proveedor: normalizedProveedor ?? provider.nombre,
        };
    }

    if (!normalizedProveedor) {
        return {
            providerId: null,
            proveedor: null,
        };
    }

    const existingProvider = await tx.provider.findFirst({
        where: {
            nombre: {
                equals: normalizedProveedor,
                mode: "insensitive",
            },
        },
        select: { id: true, nombre: true },
    });

    if (existingProvider) {
        return {
            providerId: existingProvider.id,
            proveedor: existingProvider.nombre,
        };
    }

    const createdProvider = await tx.provider.create({
        data: {
            nombre: normalizedProveedor,
            activo: true,
        },
        select: { id: true, nombre: true },
    });

    return {
        providerId: createdProvider.id,
        proveedor: createdProvider.nombre,
    };
}

function buildDateFilter(fechaInicio?: Date, fechaFin?: Date) {
    if (!fechaInicio && !fechaFin) {
        return undefined;
    }

    return {
        ...(fechaInicio ? { gte: fechaInicio } : {}),
        ...(fechaFin ? { lte: fechaFin } : {}),
    };
}

function mapEgresoForClient(egreso: {
    monto: Prisma.Decimal;
    neto: Prisma.Decimal | null;
    impuestos: Prisma.Decimal | null;
    percepciones: Prisma.Decimal | null;
    provider?: { nombre: string } | null;
    proveedor?: string | null;
    [key: string]: unknown;
}) {
    return {
        ...egreso,
        monto: Number(egreso.monto),
        neto: egreso.neto != null ? Number(egreso.neto) : null,
        impuestos: egreso.impuestos != null ? Number(egreso.impuestos) : null,
        percepciones: egreso.percepciones != null ? Number(egreso.percepciones) : null,
        proveedor: egreso.provider?.nombre ?? egreso.proveedor ?? null,
    };
}

export async function getEgresos(filters: EgresoFilter = {}) {
    await requireAdmin();

    try {
        const { search, categoria, fechaInicio, fechaFin, estadoPago } = filters;
        const dateFilter = buildDateFilter(fechaInicio, fechaFin);

        const where: Prisma.EgresoWhereInput = {
            deletedAt: null,
            ...(categoria ? { categoria } : {}),
            ...(estadoPago ? { estadoPago } : {}),
            ...(dateFilter ? { fecha: dateFilter } : {}),
            ...(search
                ? {
                      OR: [
                          { descripcion: { contains: search, mode: "insensitive" } },
                          { numero: { contains: search, mode: "insensitive" } },
                          { proveedor: { contains: search, mode: "insensitive" } },
                          {
                              provider: {
                                  is: {
                                      nombre: { contains: search, mode: "insensitive" },
                                  },
                              },
                          },
                          { numeroComprobante: { contains: search, mode: "insensitive" } },
                          { centroCosto: { contains: search, mode: "insensitive" } },
                      ],
                  }
                : {}),
        };

        const egresos = await prisma.egreso.findMany({
            where,
            include: {
                provider: {
                    select: {
                        id: true,
                        nombre: true,
                    },
                },
            },
            orderBy: { fecha: "desc" },
        });

        return {
            success: true,
            data: egresos.map(mapEgresoForClient),
        };
    } catch (error) {
        console.error("Error fetching egresos:", error);
        return { success: false, error: "No se pudieron obtener los egresos" };
    }
}

export async function getEgresoStats(filters: EgresoFilter = {}) {
    await requireAdmin();

    try {
        const { fechaInicio, fechaFin, estadoPago } = filters;
        const dateFilter = buildDateFilter(fechaInicio, fechaFin);

        const egresos = await prisma.egreso.findMany({
            where: {
                deletedAt: null,
                ...(dateFilter ? { fecha: dateFilter } : {}),
                ...(estadoPago ? { estadoPago } : {}),
            },
            select: {
                monto: true,
                categoria: true,
                estadoPago: true,
            },
        });

        const fixedCategories = new Set<CategoriaEgreso>([
            CategoriaEgreso.ALQUILER,
            CategoriaEgreso.SERVICIOS,
            CategoriaEgreso.IMPUESTOS,
            CategoriaEgreso.NOMINA,
        ]);

        const stats = {
            total: 0,
            porCategoria: {} as Record<string, number>,
            count: egresos.length,
            totalFijo: 0,
            totalVariable: 0,
            pendientesPago: 0,
        };

        for (const egreso of egresos) {
            const monto = Number(egreso.monto);
            stats.total += monto;
            stats.porCategoria[egreso.categoria] = (stats.porCategoria[egreso.categoria] || 0) + monto;

            if (fixedCategories.has(egreso.categoria)) {
                stats.totalFijo += monto;
            } else {
                stats.totalVariable += monto;
            }

            if (egreso.estadoPago !== EstadoPagoEgreso.PAGADO) {
                stats.pendientesPago += monto;
            }
        }

        return { success: true, data: stats };
    } catch (error) {
        console.error("Error fetching egreso stats:", error);
        return { success: false, error: "No se pudieron obtener las estadisticas" };
    }
}

export async function createEgreso(data: EgresoPayload) {
    await requireAdmin();

    try {
        const newEgreso = await prisma.$transaction(async (tx) => {
            const seq = await tx.appSequence.upsert({
                where: { tipo: "egreso" },
                update: { ultimo: { increment: 1 } },
                create: { tipo: "egreso", prefijo: "E-", ultimo: 1 },
            });
            const numero = `${seq.prefijo}${seq.ultimo.toString().padStart(3, "0")}`;

            const provider = await resolveProvider(tx, data.providerId, data.proveedor);

            const egreso = await tx.egreso.create({
                data: {
                    numero,
                    descripcion: data.descripcion,
                    monto: data.monto,
                    categoria: data.categoria,
                    fecha: data.fecha || new Date(),
                    proveedor: provider.proveedor,
                    providerId: provider.providerId,
                    metodoPago: normalizeOptionalString(data.metodoPago) ?? "EFECTIVO",
                    comprobante: normalizeOptionalString(data.comprobante),
                    estadoPago: data.estadoPago ?? EstadoPagoEgreso.PAGADO,
                    tipoComprobante: normalizeOptionalString(data.tipoComprobante),
                    numeroComprobante: normalizeOptionalString(data.numeroComprobante),
                    centroCosto: normalizeOptionalString(data.centroCosto),
                    fechaDevengado: data.fechaDevengado ?? null,
                    fechaPago: data.fechaPago ?? null,
                    fechaVencimiento: data.fechaVencimiento ?? null,
                    periodoDesde: data.periodoDesde ?? null,
                    periodoHasta: data.periodoHasta ?? null,
                    neto: data.neto ?? null,
                    impuestos: data.impuestos ?? null,
                    percepciones: data.percepciones ?? null,
                },
                include: {
                    provider: {
                        select: {
                            id: true,
                            nombre: true,
                        },
                    },
                },
            });

            await tx.auditLog.create({
                data: {
                    action: "CREATE_EXPENSE",
                    objectType: "egreso",
                    objectId: egreso.id,
                    after: JSON.parse(JSON.stringify(egreso)),
                    notes: `Gasto ${numero} creado`,
                },
            });

            return egreso;
        });

        revalidatePath("/admin/dashboard/reportes/egresos");
        revalidatePath("/admin/dashboard/reportes");

        return {
            success: true,
            data: mapEgresoForClient(newEgreso),
        };
    } catch (error) {
        console.error("Error creating egreso:", error);
        return { success: false, error: "No se pudo crear el egreso" };
    }
}

export async function updateEgreso(id: string, data: Partial<EgresoPayload>) {
    await requireAdmin();

    try {
        const oldEgreso = await prisma.egreso.findUnique({ where: { id } });
        if (!oldEgreso) {
            return { success: false, error: "Egreso no encontrado" };
        }

        const updated = await prisma.$transaction(async (tx) => {
            let providerPatch: { providerId?: string | null; proveedor?: string | null } = {};

            if (data.providerId !== undefined || data.proveedor !== undefined) {
                providerPatch = await resolveProvider(tx, data.providerId, data.proveedor);
            }

            const egreso = await tx.egreso.update({
                where: { id },
                data: {
                    ...(data.descripcion !== undefined ? { descripcion: data.descripcion } : {}),
                    ...(data.monto !== undefined ? { monto: data.monto } : {}),
                    ...(data.categoria !== undefined ? { categoria: data.categoria } : {}),
                    ...(data.fecha !== undefined ? { fecha: data.fecha } : {}),
                    ...(data.metodoPago !== undefined ? { metodoPago: normalizeOptionalString(data.metodoPago) ?? "EFECTIVO" } : {}),
                    ...(data.comprobante !== undefined ? { comprobante: normalizeOptionalString(data.comprobante) } : {}),
                    ...(data.estadoPago !== undefined ? { estadoPago: data.estadoPago } : {}),
                    ...(data.tipoComprobante !== undefined ? { tipoComprobante: normalizeOptionalString(data.tipoComprobante) } : {}),
                    ...(data.numeroComprobante !== undefined ? { numeroComprobante: normalizeOptionalString(data.numeroComprobante) } : {}),
                    ...(data.centroCosto !== undefined ? { centroCosto: normalizeOptionalString(data.centroCosto) } : {}),
                    ...(data.fechaDevengado !== undefined ? { fechaDevengado: data.fechaDevengado } : {}),
                    ...(data.fechaPago !== undefined ? { fechaPago: data.fechaPago } : {}),
                    ...(data.fechaVencimiento !== undefined ? { fechaVencimiento: data.fechaVencimiento } : {}),
                    ...(data.periodoDesde !== undefined ? { periodoDesde: data.periodoDesde } : {}),
                    ...(data.periodoHasta !== undefined ? { periodoHasta: data.periodoHasta } : {}),
                    ...(data.neto !== undefined ? { neto: data.neto } : {}),
                    ...(data.impuestos !== undefined ? { impuestos: data.impuestos } : {}),
                    ...(data.percepciones !== undefined ? { percepciones: data.percepciones } : {}),
                    ...providerPatch,
                        updatedAt: getSystemNow(),
                },
                include: {
                    provider: {
                        select: {
                            id: true,
                            nombre: true,
                        },
                    },
                },
            });

            await tx.auditLog.create({
                data: {
                    action: "UPDATE_EXPENSE",
                    objectType: "egreso",
                    objectId: egreso.id,
                    before: JSON.parse(JSON.stringify(oldEgreso)),
                    after: JSON.parse(JSON.stringify(egreso)),
                    notes: `Gasto ${egreso.numero} actualizado`,
                },
            });

            return egreso;
        });

        revalidatePath("/admin/dashboard/reportes/egresos");
        revalidatePath("/admin/dashboard/reportes");

        return {
            success: true,
            data: mapEgresoForClient(updated),
        };
    } catch (error) {
        console.error("Error updating egreso:", error);
        return { success: false, error: "No se pudo actualizar el egreso" };
    }
}

export async function deleteEgreso(id: string) {
    await requireAdmin();

    try {
        const egreso = await prisma.egreso.findUnique({ where: { id } });
        if (!egreso) {
            return { success: false, error: "Egreso no encontrado" };
        }

        await prisma.$transaction(async (tx) => {
            await tx.egreso.update({
                where: { id },
                    data: { deletedAt: getSystemNow() },
            });

            await tx.auditLog.create({
                data: {
                    action: "DELETE_EXPENSE",
                    objectType: "egreso",
                    objectId: id,
                    before: JSON.parse(JSON.stringify(egreso)),
                    notes: `Gasto ${egreso.numero} eliminado`,
                },
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
