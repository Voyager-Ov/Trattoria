"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { EstadoPedido, OrigenPedido } from "@prisma/client";

/**
 * Actualiza el estado de un pedido y registra el timestamp correspondiente.
 */
export async function updateOrderStatus(id: string, status: EstadoPedido) {
    try {
        const order = await prisma.order.update({
            where: { id },
            data: {
                estado: status,
                ...(status === 'EN_PREPARACION' ? { enPreparacionEn: new Date() } : {}),
                ...(status === 'LISTO' ? { listoEn: new Date() } : {}),
                ...(status === 'FINALIZADO' ? { finalizadoEn: new Date() } : {}),
                ...(status === 'CANCELADO' ? { canceladoEn: new Date() } : {}),
            }
        });

        // Convert Decimal to plain number for serialization
        return { success: true, order: JSON.parse(JSON.stringify(order)) };
    } catch (error) {
        console.error("Error updating order status:", error);
        return { success: false, error: "Error al actualizar el estado" };
    }
}

export async function toggleOrderPayment(id: string, cobrado: boolean) {
    try {
        const order = await prisma.order.update({
            where: { id },
            data: {
                cobrado,
                cobradoEn: cobrado ? new Date() : null
            }
        });

        return { success: true, order: JSON.parse(JSON.stringify(order)) };
    } catch (error) {
        console.error("Error toggling order payment:", error);
        return { success: false, error: "Error al actualizar el pago" };
    }
}

/**
 * Busca clientes por nombre o teléfono
 */
export async function searchCustomers(query: string) {
    try {
        const customers = await prisma.customer.findMany({
            where: {
                OR: [
                    { nombre: { contains: query, mode: 'insensitive' } },
                    { telefono: { contains: query, mode: 'insensitive' } },
                ],
                activo: true,
                deletedAt: null
            },
            take: 5
        });
        return { success: true, data: customers };
    } catch (error) {
        return { success: false, error: "Error al buscar clientes" };
    }
}

/**
 * Crea un nuevo pedido con sus ítems
 */
export async function createOrder(data: {
    customerId?: string | null;
    clienteNombre?: string;
    clienteTelefono?: string;
    clienteDireccion?: string;
    items: { productId: string, cantidad: number, precioUnitario: number, nombreProduct: string }[];
    notas?: string;
}) {
    try {
        const subtotal = data.items.reduce((acc, item) => acc + (item.cantidad * item.precioUnitario), 0);
        const total = subtotal;
        // 1. Obtener o generar siguiente número de orden
        // Usamos AppSequence si existe
        let numeroOrden = "";
        const seq = await prisma.appSequence.upsert({
            where: { tipo: "order" },
            update: { ultimo: { increment: 1 } },
            create: { tipo: "order", prefijo: "ORD-", ultimo: 1 }
        });
        numeroOrden = `${seq.prefijo}${seq.ultimo.toString().padStart(3, '0')}`;

        // 2. Crear el pedido en una transacción
        const newOrder = await prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    numero: numeroOrden,
                    origen: "INTERNO",
                    customer: data.customerId ? { connect: { id: data.customerId } } : undefined,
                    clienteNombre: data.clienteNombre,
                    clienteTelefono: data.clienteTelefono,
                    clienteDireccion: data.clienteDireccion,
                    subtotal: subtotal,
                    total: total,
                    notas: data.notas,
                    estado: "RECIBIDO",
                    items: {
                        create: data.items.map(item => ({
                            product: { connect: { id: item.productId } },
                            nombreProduct: item.nombreProduct,
                            cantidad: item.cantidad,
                            precioUnitario: item.precioUnitario,
                            subtotal: item.cantidad * item.precioUnitario
                        }))
                    }
                },
                include: {
                    items: true
                }
            });

            return order;
        });

        revalidatePath("/admin/dashboard/pedidos");
        return { success: true, data: JSON.parse(JSON.stringify(newOrder)) };
    } catch (error) {
        console.error("Error creating order:", error);
        return { success: false, error: "No se pudo crear el pedido" };
    }
}
