"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { EstadoPedido } from "@prisma/client";
import { getSessionCookie, verifySessionCookie } from "@/lib/auth";

/**
 * Actualiza el estado de un pedido y registra el timestamp correspondiente.
 */
export async function updateOrderStatus(id: string, status: EstadoPedido, motive?: string) {
    try {
        const order = await prisma.order.update({
            where: { id },
            data: {
                estado: status,
                ...(status === 'EN_PREPARACION' ? { enPreparacionEn: new Date() } : {}),
                ...(status === 'LISTO' ? { listoEn: new Date() } : {}),
                ...(status === 'FINALIZADO' ? { finalizadoEn: new Date() } : {}),
                ...(status === 'CANCELADO' ? {
                    canceladoEn: new Date(),
                    motivoCancelacion: motive
                } : {}),
            }
        });

        // Convert Decimal to plain number for serialization
        revalidatePath("/admin/dashboard/pedidos");
        revalidatePath("/empleado/pedidos");
        return { success: true, order: JSON.parse(JSON.stringify(order)) };
    } catch (error) {
        console.error("Error updating order status:", error);
        return { success: false, error: "Error al actualizar el estado" };
    }
}

export async function toggleOrderPayment(id: string, cobrado: boolean, metodoPago?: string) {
    try {
        const order = await prisma.order.update({
            where: { id },
            data: {
                cobrado,
                cobradoEn: cobrado ? new Date() : null,
                metodoPago: cobrado ? (metodoPago || null) : null
            }
        });

        revalidatePath("/admin/dashboard/pedidos");
        revalidatePath("/empleado/pedidos");
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
        console.error("Error searching customers:", error);
        return { success: false, error: "Error al buscar clientes" };
    }
}

/**
 * Crea un nuevo pedido con sus ítems y registra quién lo creó
 */
export async function createOrder(data: {
    customerId?: string | null;
    clienteNombre?: string;
    clienteTelefono?: string;
    clienteDireccion?: string;
    items: { productId: string, type?: 'PRODUCTO' | 'PROMOCION', cantidad: number, precioUnitario: number, nombreProduct: string }[];
    notas?: string;
}) {
    try {
        // Identify Creator
        let createdByUserId = null;
        try {
            const session = await getSessionCookie();
            if (session) {
                const claims = await verifySessionCookie(session);
                // Find user in DB to get the internal UUID
                if (claims && claims.uid) {
                    const user = await prisma.user.findUnique({
                        where: { firebaseUid: claims.uid },
                        select: { id: true }
                    });
                    if (user) {
                        createdByUserId = user.id;
                    }
                }
            }
        } catch (authError) {
            console.warn("Could not identify user for order creation (likely guest or error):", authError);
            // Proceed without throwing, creating as guest/system
        }

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
                    estado: "PENDIENTE",
                    createdBy: createdByUserId, // <--- Link to Creator
                    items: {
                        create: data.items.map(item => {
                            // Hardened check: use explicit type if available, fallback to ID format (UUIDs for promos have dashes, CUIDs for products don't)
                            const isPromotion = item.type === 'PROMOCION' || (!!item.productId && item.productId.includes('-'));

                            return {
                                ...(isPromotion
                                    ? { promotion: { connect: { id: item.productId } } }
                                    : { product: { connect: { id: item.productId } } }
                                ),
                                nombreProduct: item.nombreProduct,
                                cantidad: item.cantidad,
                                precioUnitario: item.precioUnitario,
                                subtotal: item.cantidad * item.precioUnitario
                            };
                        })
                    }
                },
                include: {
                    items: true
                }
            });

            return order;
        });

        revalidatePath("/admin/dashboard/pedidos");
        revalidatePath("/empleado/pedidos");
        return { success: true, data: JSON.parse(JSON.stringify(newOrder)) };
    } catch (error) {
        console.error("Error creating order:", error);
        return { success: false, error: "No se pudo crear el pedido" };
    }
}
