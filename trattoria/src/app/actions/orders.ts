"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getConfigs } from "./configActions";
import { getStoreStatus } from "@/lib/openingHours";
import { z } from "zod";

const PublicOrderSchema = z.object({
    clienteNombre: z.string().min(1, "Nombre requerido").max(100),
    clienteTelefono: z.string().regex(/^\+?[\d\s\-().]{6,25}$/, "Teléfono inválido").optional().or(z.literal("")),
    clienteDireccion: z.string().max(300).optional().or(z.literal("")),
    tipoEntrega: z.enum(["DELIVERY", "RETIRO"]),
    metodoPago: z.enum(["EFECTIVO", "TRANSFERENCIA", "MERCADOPAGO", "TARJETA", "DEBITO", "CREDITO"]),
    items: z.array(z.object({
        productId: z.string().min(1),
        cantidad: z.number().int().min(1).max(99),
        precioUnitario: z.number(),
        nombreProduct: z.string().max(200),
        options: z.array(z.object({
            groupId: z.string(),
            groupLabel: z.string(),
            optionId: z.string(),
            optionLabel: z.string(),
            priceDelta: z.number(),
        })).optional(),
    })).min(1, "El pedido no puede estar vacío").max(30, "Máximo 30 ítems por pedido"),
    total: z.number(),
}).superRefine((data, ctx) => {
    if (data.tipoEntrega === "DELIVERY" && !data.clienteDireccion?.trim()) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["clienteDireccion"],
            message: "Dirección requerida",
        });
    }
});

export async function createPublicOrder(data: {
    clienteNombre: string;
    clienteTelefono?: string;
    clienteDireccion?: string;
    tipoEntrega: "DELIVERY" | "RETIRO";
    metodoPago: string;
    items: { 
        productId: string, 
        cantidad: number, 
        precioUnitario: number, 
        nombreProduct: string,
        options?: { groupId: string, groupLabel: string, optionId: string, optionLabel: string, priceDelta: number }[]
    }[];
    total: number;
}) {
    try {
        const parseResult = PublicOrderSchema.safeParse(data);
        if (!parseResult.success) {
            const firstError = parseResult.error.errors[0];
            return { success: false, error: firstError.message || "Datos del pedido inválidos." };
        }
        const input = parseResult.data;

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

        const productIds = input.items.map((item) => item.productId);
        const dbProducts = await prisma.product.findMany({
            where: {
                id: { in: productIds },
                activo: true,
                deletedAt: null,
            },
            select: { id: true, precio: true, nombre: true },
        });

        if (dbProducts.length !== productIds.length) {
            return { success: false, error: "Uno o más productos no están disponibles actualmente." };
        }

        const priceMap = new Map(dbProducts.map((product) => [product.id, Number(product.precio)]));
        const verifiedItems = input.items.map((item) => {
            const basePrice = priceMap.get(item.productId) || 0;
            const optionsPrice = (item.options || []).reduce((sum, opt) => sum + opt.priceDelta, 0);
            const unitPrice = basePrice + optionsPrice;
            
            return {
                productId: item.productId,
                nombreProduct: item.nombreProduct,
                cantidad: item.cantidad,
                precioUnitario: unitPrice,
                subtotal: item.cantidad * unitPrice,
                options: item.options || [],
            };
        });
        const verifiedTotal = verifiedItems.reduce((sum, item) => sum + item.subtotal, 0);

        const seq = await prisma.appSequence.upsert({
            where: { tipo: "order" },
            update: { ultimo: { increment: 1 } },
            create: { tipo: "order", prefijo: "ORD-", ultimo: 1 }
        });
        const numeroOrden = `${seq.prefijo}${seq.ultimo.toString().padStart(4, "0")}`;

        const newOrder = await prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    numero: numeroOrden,
                    origen: "CATALOGO",
                    estado: "RECIBIDO",
                    clienteNombre: input.clienteNombre,
                    clienteTelefono: input.clienteTelefono,
                    clienteDireccion: input.tipoEntrega === "DELIVERY" ? input.clienteDireccion?.trim() : null,
                    tipoEntrega: input.tipoEntrega,
                    subtotal: verifiedTotal,
                    total: verifiedTotal,
                    metodoPago: null,
                    metodoPagoPreferido: input.metodoPago,
                    notas: "",
                    items: {
                        create: verifiedItems.map((item, index) => ({
                            productId: item.productId,
                            nombreProduct: item.nombreProduct,
                            cantidad: item.cantidad,
                            precioUnitario: item.precioUnitario,
                            subtotal: item.subtotal,
                            configSnapshot: item.options.length > 0 ? (item.options as any) : null,
                            orden: index
                        }))
                    }
                },
                include: {
                    items: true
                }
            });

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

    } catch (error: unknown) {
        const prismaError = error as { code?: string; message?: string } | null;
        console.error("Error creating public order:", prismaError?.code, prismaError?.message);

        if (prismaError?.code === "P2025") {
            return { success: false, error: "Uno o más productos ya no están disponibles" };
        }
        if (prismaError?.code === "P2002") {
            return { success: false, error: "Error de duplicación en el pedido" };
        }

        return { success: false, error: "No se pudo procesar el pedido. Por favor intenta nuevamente." };
    }
}
