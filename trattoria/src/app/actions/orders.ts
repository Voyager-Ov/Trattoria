"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createPublicOrder(data: {
    clienteNombre: string;
    clienteTelefono?: string;
    clienteDireccion: string;
    metodoPago: string;
    items: { productId: string, cantidad: number, precioUnitario: number, nombreProduct: string }[];
    total: number;
}) {
    try {
        // 1. Get next order number from AppSequence
        const seq = await prisma.appSequence.upsert({
            where: { tipo: "order" },
            update: { ultimo: { increment: 1 } },
            create: { tipo: "order", prefijo: "ORD-", ultimo: 1 }
        });
        const numeroOrden = `${seq.prefijo}${seq.ultimo.toString().padStart(3, '0')}`;

        // 2. Create the order in a transaction
        const newOrder = await prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    numero: numeroOrden,
                    origen: "CATALOGO",
                    estado: "RECIBIDO",
                    clienteNombre: data.clienteNombre,
                    clienteTelefono: data.clienteTelefono,
                    clienteDireccion: data.clienteDireccion,
                    subtotal: data.total,
                    total: data.total,
                    metodoPago: data.metodoPago,
                    notas: "", // or remove if not needed, but keep it clean
                    items: {
                        create: data.items.map(item => ({
                            product: { connect: { id: item.productId } },
                            nombreProduct: item.nombreProduct,
                            cantidad: item.cantidad,
                            precioUnitario: item.precioUnitario,
                            subtotal: item.cantidad * item.precioUnitario
                        }))
                    }
                } as any,
                include: {
                    items: true
                }
            });

            // 3. Optional: Create Audit Log
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
    } catch (error) {
        console.error("Error creating public order:", error);
        return { success: false, error: "No se pudo procesar el pedido en este momento" };
    }
}
