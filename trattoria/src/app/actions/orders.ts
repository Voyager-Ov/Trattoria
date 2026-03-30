"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getConfigs } from "./configActions";
import { getStoreStatus } from "@/lib/openingHours";
import { z } from "zod";

// F-08: Strict input schema for public orders
const PublicOrderSchema = z.object({
    clienteNombre: z.string().min(1, "Nombre requerido").max(100),
    clienteTelefono: z.string().regex(/^\+?[\d\s\-().]{6,25}$/, "Teléfono inválido").optional().or(z.literal("")),
    clienteDireccion: z.string().min(1, "Dirección requerida").max(300),
    metodoPago: z.enum(["EFECTIVO", "TRANSFERENCIA", "MERCADOPAGO", "TARJETA", "DEBITO", "CREDITO"]),
    items: z.array(z.object({
        productId: z.string().min(1),
        cantidad: z.number().int().min(1).max(99),
        precioUnitario: z.number(), // Will be overwritten by DB price (F-05)
        nombreProduct: z.string().max(200),
    })).min(1, "El pedido no puede estar vacío").max(30, "Máximo 30 ítems por pedido"),
    total: z.number(), // Ignored — recalculated server-side (F-05)
});

export async function createPublicOrder(data: {
    clienteNombre: string;
    clienteTelefono?: string;
    clienteDireccion: string;
    metodoPago: string;
    items: { productId: string, cantidad: number, precioUnitario: number, nombreProduct: string }[];
    total: number;
}) {
    try {
        // F-08: Validate and sanitize all inputs before touching the DB
        const parseResult = PublicOrderSchema.safeParse(data);
        if (!parseResult.success) {
            const firstError = parseResult.error.errors[0];
            return { success: false, error: firstError.message || "Datos del pedido inválidos." };
        }
        const input = parseResult.data;

        // 0. Validate Store Hours
        const configRes = await getConfigs(["business.hours", "business.closedDays"]);
        if (configRes.success && configRes.data) {
            const status = getStoreStatus(
                configRes.data["business.hours"] || {},
                configRes.data["business.closedDays"] || []
            );
            if (!status.isOpen) {
                return { success: false, error: status.message || "El local se encuentra cerrado en este momento." };
            }
        }

        // F-05: Verify product prices server-side — NEVER trust client-supplied prices
        const productIds = input.items.map(i => i.productId);
        const dbProducts = await prisma.product.findMany({
            where: {
                id: { in: productIds },
                activo: true,
                disponible: true,
                deletedAt: null,
            },
            select: { id: true, precio: true, nombre: true },
        });

        if (dbProducts.length !== productIds.length) {
            return { success: false, error: "Uno o más productos no están disponibles actualmente." };
        }

        const priceMap = new Map(dbProducts.map(p => [p.id, Number(p.precio)]));
        const verifiedItems = input.items.map(item => ({
            productId: item.productId,
            nombreProduct: item.nombreProduct,
            cantidad: item.cantidad,
            precioUnitario: priceMap.get(item.productId)!,
            subtotal: item.cantidad * priceMap.get(item.productId)!,
        }));
        const verifiedTotal = verifiedItems.reduce((sum, i) => sum + i.subtotal, 0);

        // 1. Get next order number from AppSequence
        const seq = await prisma.appSequence.upsert({
            where: { tipo: "order" },
            update: { ultimo: { increment: 1 } },
            create: { tipo: "order", prefijo: "ORD-", ultimo: 1 }
        });
        const numeroOrden = `${seq.prefijo}${seq.ultimo.toString().padStart(4, '0')}`;

        // 2. Create the order in a transaction
        const newOrder = await prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    numero: numeroOrden,
                    origen: "CATALOGO",
                    estado: "RECIBIDO",
                    clienteNombre: input.clienteNombre,
                    clienteTelefono: input.clienteTelefono,
                    clienteDireccion: input.clienteDireccion,
                    subtotal: verifiedTotal,
                    total: verifiedTotal,
                    metodoPago: input.metodoPago,
                    notas: "",
                    items: {
                        create: verifiedItems.map((item, index) => ({
                            productId: item.productId,
                            nombreProduct: item.nombreProduct,
                            cantidad: item.cantidad,
                            precioUnitario: item.precioUnitario,
                            subtotal: item.subtotal,
                            orden: index
                        }))
                    }
                },
                include: {
                    items: true
                }
            });

            // 3. Create Audit Log
            await tx.auditLog.create({
                data: {
                    action: "CREATE_ORDER",
                    objectType: "order",
                    objectId: order.id,
                    after: JSON.parse(JSON.stringify(order)),
                    origin: "CATALOGO",
                    notes: "Pedido creado desde el catálogo público"
                }
            });

            return order;
        });

        revalidatePath("/admin/dashboard/pedidos");
        return { success: true, orderNumber: numeroOrden, data: JSON.parse(JSON.stringify(newOrder)) };

    } catch (error: any) {
        console.error("Error creating public order:", error?.code, error?.message);

        if (error?.code === 'P2025') {
            return { success: false, error: "Uno o más productos ya no están disponibles" };
        }
        if (error?.code === 'P2002') {
            return { success: false, error: "Error de duplicación en el pedido" };
        }

        return { success: false, error: "No se pudo procesar el pedido. Por favor intenta nuevamente." };
    }
}
