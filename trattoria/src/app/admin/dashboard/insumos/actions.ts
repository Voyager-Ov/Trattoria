"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma, UnidadMedida, TipoMovimientoStock, CategoriaEgreso } from "@prisma/client";

// Helper to serialize Prisma Decimal objects
function serializePrisma(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'object') {
        const maybeDecimal = obj as {
            constructor?: { name?: string };
            _isDecimal?: boolean;
            s?: unknown;
            d?: unknown;
            toString?: () => string;
        };

        if (
            maybeDecimal.constructor?.name === 'Decimal' ||
            maybeDecimal._isDecimal === true ||
            (maybeDecimal.s !== undefined && maybeDecimal.d !== undefined && typeof maybeDecimal.toString === 'function')
        ) {
            return Number(maybeDecimal.toString?.() ?? obj);
        }
    }

    if (obj instanceof Date) return obj;

    if (Array.isArray(obj)) {
        return obj.map(serializePrisma);
    }

    if (typeof obj === 'object') {
        const serialized: Record<string, unknown> = {};
        for (const key in obj as Record<string, unknown>) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const value = (obj as Record<string, unknown>)[key];
                if (typeof value === 'function') continue;
                serialized[key] = serializePrisma(value);
            }
        }
        return serialized;
    }

    return obj;
}

async function findOrCreateProvider(tx: Prisma.TransactionClient, proveedor?: string) {
    const nombre = proveedor?.trim();
    if (!nombre) {
        return null;
    }

    const existing = await tx.provider.findFirst({
        where: {
            nombre: {
                equals: nombre,
                mode: "insensitive",
            },
        },
    });

    if (existing) {
        return existing;
    }

    return tx.provider.create({
        data: {
            nombre,
            activo: true,
        },
    });
}

export async function getSupplies() {
    try {
        const supplies = await prisma.supply.findMany({
            where: {
                deletedAt: null,
            },
            include: {
                category: true,
            },
            orderBy: {
                nombre: "asc",
            },
        });
        return { success: true, data: serializePrisma(supplies) };
    } catch (error) {
        console.error("Error fetching supplies:", error);
        return { success: false, error: "Error al obtener los insumos" };
    }
}

export async function createSupply(data: {
    nombre: string;
    unidad: UnidadMedida;
    stockMinimo?: number;
    costoUnitario?: number;
    categoryId?: string;
    descripcion?: string;
    activo?: boolean;
}) {
    try {
        const supply = await prisma.supply.create({
            data: {
                nombre: data.nombre,
                unidad: data.unidad,
                stockActual: 0,
                stockMinimo: data.stockMinimo || 0,
                costoUnitario: data.costoUnitario || 0,
                descripcion: data.descripcion,
                activo: data.activo ?? true,
                ...(data.categoryId ? { category: { connect: { id: data.categoryId } } } : {}),
            },
            include: {
                category: true,
            }
        });
        revalidatePath("/admin/dashboard/insumos");
        return { success: true, data: serializePrisma(supply) };
    } catch (error) {
        console.error("Error creating supply:", error);
        return { success: false, error: "Error al crear el insumo" };
    }
}

export async function registerStockEntry(data: {
    supplyId: string;
    cantidad: number;
    costoUnitario: number;
    motivo?: string;
    proveedor?: string;
}) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get current supply
            const supply = await tx.supply.findUnique({
                where: { id: data.supplyId }
            });

            if (!supply) throw new Error("Insumo no encontrado");

            const currentStock = Number(supply.stockActual);
            const currentAvgCost = Number(supply.costoUnitario || 0);
            const newQuantity = data.cantidad;
            const newCost = data.costoUnitario;

            // 2. Calculate Weighted Average Cost (WAC)
            // Formulas: New Avg Cost = (StockActual * CostoActual + CantidadNueva * CostoNuevo) / (StockActual + CantidadNueva)
            let newAvgCost = newCost;
            if (currentStock > 0) {
                newAvgCost = (currentStock * currentAvgCost + newQuantity * newCost) / (currentStock + newQuantity);
            }

            const newStock = currentStock + newQuantity;

            // 3. Update supply stock and average cost
            const updatedSupply = await tx.supply.update({
                where: { id: data.supplyId },
                data: {
                    stockActual: newStock,
                    costoUnitario: newAvgCost,
                }
            });

            // 4. Create stock movement record
            await tx.stockMovement.create({
                data: {
                    supplyId: data.supplyId,
                    tipo: "IN" as TipoMovimientoStock,
                    cantidad: data.cantidad,
                    stockResultante: newStock,
                    motivo: data.motivo || "Entrada de stock (Compra)",
                }
            });

            // 5. Persist Purchase + Egreso linked to a real provider for accounting analytics
            const montoTotal = newQuantity * newCost;
            const provider = await findOrCreateProvider(tx, data.proveedor);

            const egresoSeq = await tx.appSequence.upsert({
                where: { tipo: "egreso" },
                update: { ultimo: { increment: 1 } },
                create: { tipo: "egreso", prefijo: "E-", ultimo: 1 }
            });
            const numeroEgreso = `${egresoSeq.prefijo}${egresoSeq.ultimo.toString().padStart(3, '0')}`;

            const purchaseSeq = await tx.appSequence.upsert({
                where: { tipo: "purchase" },
                update: { ultimo: { increment: 1 } },
                create: { tipo: "purchase", prefijo: "C-", ultimo: 1 }
            });
            const numeroCompra = `${purchaseSeq.prefijo}${purchaseSeq.ultimo.toString().padStart(3, '0')}`;

            const egreso = await tx.egreso.create({
                data: {
                    numero: numeroEgreso,
                    descripcion: `Compra de ${supply.nombre} - ${newQuantity} ${supply.unidad.toLowerCase()}`,
                    monto: montoTotal,
                    categoria: CategoriaEgreso.INSUMOS,
                    fecha: new Date(),
                    proveedor: provider?.nombre || data.proveedor || null,
                    providerId: provider?.id || null,
                    metodoPago: "EFECTIVO",
                    estadoPago: "PAGADO",
                    fechaPago: new Date(),
                    fechaDevengado: new Date(),
                    neto: montoTotal,
                    impuestos: 0,
                    percepciones: 0,
                }
            });

            if (provider) {
                await tx.purchase.create({
                    data: {
                        numero: numeroCompra,
                        providerId: provider.id,
                        subtotal: montoTotal,
                        impuestos: 0,
                        total: montoTotal,
                        fecha: new Date(),
                        estado: "RECIBIDO",
                        observaciones: data.motivo || "Compra generada desde entrada de stock",
                        egresoId: egreso.id,
                        items: {
                            create: {
                                supplyId: data.supplyId,
                                cantidad: data.cantidad,
                                precioUnit: data.costoUnitario,
                            },
                        },
                    }
                });
            }

            return updatedSupply;
        });

        revalidatePath("/admin/dashboard/insumos");
        revalidatePath("/admin/dashboard/reportes/egresos");
        return { success: true, data: serializePrisma(result) };
    } catch (error) {
        console.error("Error registering stock entry:", error);
        return { success: false, error: "Error al registrar la entrada de stock" };
    }
}

export async function registerStockMovement(data: {
    supplyId: string;
    cantidad: number;
    tipo: TipoMovimientoStock;
    motivo: string;
}) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const supply = await tx.supply.findUnique({
                where: { id: data.supplyId }
            });

            if (!supply) throw new Error("Insumo no encontrado");

            const currentStock = Number(supply.stockActual);
            const factor = data.tipo === "IN" ? 1 : -1;
            const newStock = currentStock + (data.cantidad * factor);

            if (newStock < 0 && data.tipo !== "AJUSTE") {
                // We allow negative adjustment if explicit, but usually stock shouldn't be negative
                // For now, let's keep it simple and just update
            }

            const updatedSupply = await tx.supply.update({
                where: { id: data.supplyId },
                data: { stockActual: newStock }
            });

            await tx.stockMovement.create({
                data: {
                    supplyId: data.supplyId,
                    tipo: data.tipo,
                    cantidad: data.cantidad,
                    stockResultante: newStock,
                    motivo: data.motivo
                }
            });

            return updatedSupply;
        });

        revalidatePath("/admin/dashboard/insumos");
        return { success: true, data: serializePrisma(result) };
    } catch (error) {
        console.error("Error registering stock movement:", error);
        return { success: false, error: "Error al registrar el movimiento" };
    }
}

export async function softDeleteSupply(id: string) {
    try {
        await prisma.supply.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        revalidatePath("/admin/dashboard/insumos");
        return { success: true };
    } catch (error) {
        console.error("Error deleting supply:", error);
        return { success: false, error: "Error al eliminar el insumo" };
    }
}

export async function archiveSupply(id: string) {
    try {
        await prisma.supply.update({
            where: { id },
            data: { activo: false },
        });
        revalidatePath("/admin/dashboard/insumos");
        return { success: true };
    } catch (error) {
        console.error("Error archiving supply:", error);
        return { success: false, error: "Error al archivar el insumo" };
    }
}

export async function unarchiveSupply(id: string) {
    try {
        await prisma.supply.update({
            where: { id },
            data: { activo: true },
        });
        revalidatePath("/admin/dashboard/insumos");
        return { success: true };
    } catch (error) {
        console.error("Error unarchiving supply:", error);
        return { success: false, error: "Error al desarchivar el insumo" };
    }
}

export async function getSupplyById(id: string) {
    try {
        const supply = await prisma.supply.findUnique({
            where: { id },
            include: {
                category: true,
                movements: {
                    orderBy: { createdAt: "desc" },
                    take: 50,
                },
                recipeItems: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                nombre: true,
                                precio: true,
                                activo: true,
                            },
                        },
                    },
                },
                purchaseItems: {
                    include: {
                        purchase: {
                            select: {
                                id: true,
                                numero: true,
                                fecha: true,
                                estado: true,
                                provider: {
                                    select: {
                                        id: true,
                                        nombre: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: {
                        purchase: { fecha: "desc" },
                    },
                    take: 20,
                },
            }
        });
        if (!supply) return { success: false, error: "Insumo no encontrado" };
        return { success: true, data: serializePrisma(supply) };
    } catch (error) {
        console.error("Error fetching supply by id:", error);
        return { success: false, error: "Error al obtener el insumo" };
    }
}

export async function updateSupply(id: string, data: {
    nombre?: string;
    unidad?: UnidadMedida;
    stockMinimo?: number;
    costoUnitario?: number;
    categoryId?: string;
    descripcion?: string;
    activo?: boolean;
}) {
    try {
        const supply = await prisma.supply.update({
            where: { id },
            data: {
                nombre: data.nombre,
                unidad: data.unidad,
                stockMinimo: data.stockMinimo,
                costoUnitario: data.costoUnitario,
                descripcion: data.descripcion,
                activo: data.activo,
                category: data.categoryId
                    ? { connect: { id: data.categoryId } }
                    : { disconnect: true },
            },
            include: {
                category: true,
            }
        });
        revalidatePath("/admin/dashboard/insumos");
        // Also revalidate the detail page if we have one
        revalidatePath(`/admin/dashboard/insumos/${id}`);
        return { success: true, data: serializePrisma(supply) };
    } catch (error) {
        console.error("Error updating supply:", error);
        return { success: false, error: "Error al actualizar el insumo" };
    }
}

export async function getSupplyCategories() {
    try {
        const categories = await prisma.supplyCategory.findMany({
            orderBy: { nombre: 'asc' }
        });
        return { success: true, data: serializePrisma(categories) };
    } catch (error) {
        console.error("Error fetching supply categories:", error);
        return { success: false, error: "Error al obtener categorías" };
    }
}

export async function createSupplyCategory(nombre: string) {
    try {
        const category = await prisma.supplyCategory.create({
            data: { nombre }
        });
        return { success: true, data: serializePrisma(category) };
    } catch (error) {
        console.error("Error creating supply category:", error);
        return { success: false, error: "Error al crear la categoría" };
    }
}
