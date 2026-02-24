"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { EstadoPedido } from "@prisma/client";
import { getSessionCookie, verifySessionCookie } from "@/lib/auth";

/**
 * Actualiza el estado de un pedido y registra el timestamp correspondiente.
 * Si el estado es FINALIZADO, descuenta los insumos del stock.
 */
export async function updateOrderStatus(id: string, status: EstadoPedido, motive?: string, descontarInsumos?: boolean) {
    try {
        // Identify Actor
        let actorId = null;
        let actorName = null;
        try {
            const session = await getSessionCookie();
            if (session) {
                const claims = await verifySessionCookie(session);
                if (claims?.uid) {
                    const user = await prisma.user.findUnique({
                        where: { firebaseUid: claims.uid },
                        select: { id: true, displayName: true, email: true, rol: true }
                    });
                    if (user) {
                        actorId = user.id;
                        actorName = user.displayName || user.email?.split("@")[0] || "Usuario";
                        if (user.rol) actorName += ` (${user.rol})`;
                    }
                }
            }
        } catch (e) {
            console.warn("Could not identify user for order event.", e);
        }

        // Obtener el estado actual del pedido
        const currentOrder = await prisma.order.findUnique({
            where: { id },
            select: { estado: true }
        });

        if (!currentOrder) {
            throw new Error("Pedido no encontrado");
        }

        // Determinar si el pedido ya estaba finalizado (stock ya fue descontado)
        const yaEstabaFinalizado = currentOrder.estado === 'FINALIZADO';

        // === CASO: FINALIZAR PEDIDO ===
        // Solo descontar stock si el pedido NO estaba ya finalizado
        if (status === 'FINALIZADO' && !yaEstabaFinalizado) {
            await prisma.$transaction(async (tx) => {
                const order = await tx.order.findUnique({
                    where: { id },
                    include: {
                        items: {
                            include: {
                                product: { include: { recipeItems: { include: { supply: true } } } },
                                promotion: { include: { items: { include: { product: { include: { recipeItems: { include: { supply: true } } } } } } } }
                            }
                        }
                    }
                });

                if (!order) throw new Error("Pedido no encontrado");

                const insumosRequeridos = new Map<string, { supply: any, cantidadTotal: number }>();

                for (const item of order.items) {
                    const cantidadItem = Number(item.cantidad);
                    if (item.product && item.product.recipeItems.length > 0) {
                        for (const recipeItem of item.product.recipeItems) {
                            const supplyId = recipeItem.supplyId;
                            const cantidadInsumo = Number(recipeItem.qtyPerUnit) * cantidadItem;
                            if (insumosRequeridos.has(supplyId)) {
                                insumosRequeridos.get(supplyId)!.cantidadTotal += cantidadInsumo;
                            } else {
                                insumosRequeridos.set(supplyId, { supply: recipeItem.supply, cantidadTotal: cantidadInsumo });
                            }
                        }
                    }
                    if (item.promotion && item.promotion.items) {
                        for (const promoItem of item.promotion.items) {
                            if (promoItem.product && promoItem.product.recipeItems.length > 0) {
                                const cantidadPromo = promoItem.quantity * cantidadItem;
                                for (const recipeItem of promoItem.product.recipeItems) {
                                    const supplyId = recipeItem.supplyId;
                                    const cantidadInsumo = Number(recipeItem.qtyPerUnit) * cantidadPromo;
                                    if (insumosRequeridos.has(supplyId)) {
                                        insumosRequeridos.get(supplyId)!.cantidadTotal += cantidadInsumo;
                                    } else {
                                        insumosRequeridos.set(supplyId, { supply: recipeItem.supply, cantidadTotal: cantidadInsumo });
                                    }
                                }
                            }
                        }
                    }
                }

                for (const [supplyId, { supply, cantidadTotal }] of insumosRequeridos) {
                    const nuevoStock = Number(supply.stockActual) - cantidadTotal;
                    await tx.supply.update({ where: { id: supplyId }, data: { stockActual: nuevoStock } });
                    await tx.stockMovement.create({
                        data: {
                            supplyId,
                            tipo: 'OUT',
                            cantidad: cantidadTotal,
                            stockResultante: nuevoStock,
                            orderId: id,
                            motivo: `Descuento automático por finalización de pedido ${order.numero}`
                        }
                    });
                }

                await tx.order.update({
                    where: { id },
                    data: {
                        estado: status,
                        finalizadoEn: new Date(),
                        events: {
                            create: {
                                tipo: 'CAMBIO_ESTADO',
                                descripcion: `Estado cambiado a ${status}`,
                                actorId,
                                actorName
                            }
                        }
                    }
                });
            });

            // === CASO: CANCELAR PEDIDO ===
        } else if (status === 'CANCELADO') {

            if (yaEstabaFinalizado && !descontarInsumos) {
                // El pedido estaba FINALIZADO (stock ya descontado) y se cancela SIN merma
                // → RESTAURAR el stock (devolver los insumos porque la orden fue anulada)
                await prisma.$transaction(async (tx) => {
                    const order = await tx.order.findUnique({
                        where: { id },
                        include: {
                            items: {
                                include: {
                                    product: { include: { recipeItems: { include: { supply: true } } } },
                                    promotion: { include: { items: { include: { product: { include: { recipeItems: { include: { supply: true } } } } } } } }
                                }
                            }
                        }
                    });

                    if (!order) throw new Error("Pedido no encontrado");

                    const insumosRequeridos = new Map<string, { supply: any, cantidadTotal: number }>();

                    for (const item of order.items) {
                        const cantidadItem = Number(item.cantidad);
                        if (item.product && item.product.recipeItems.length > 0) {
                            for (const recipeItem of item.product.recipeItems) {
                                const supplyId = recipeItem.supplyId;
                                const cantidadInsumo = Number(recipeItem.qtyPerUnit) * cantidadItem;
                                if (insumosRequeridos.has(supplyId)) {
                                    insumosRequeridos.get(supplyId)!.cantidadTotal += cantidadInsumo;
                                } else {
                                    insumosRequeridos.set(supplyId, { supply: recipeItem.supply, cantidadTotal: cantidadInsumo });
                                }
                            }
                        }
                        if (item.promotion && item.promotion.items) {
                            for (const promoItem of item.promotion.items) {
                                if (promoItem.product && promoItem.product.recipeItems.length > 0) {
                                    const cantidadPromo = promoItem.quantity * cantidadItem;
                                    for (const recipeItem of promoItem.product.recipeItems) {
                                        const supplyId = recipeItem.supplyId;
                                        const cantidadInsumo = Number(recipeItem.qtyPerUnit) * cantidadPromo;
                                        if (insumosRequeridos.has(supplyId)) {
                                            insumosRequeridos.get(supplyId)!.cantidadTotal += cantidadInsumo;
                                        } else {
                                            insumosRequeridos.set(supplyId, { supply: recipeItem.supply, cantidadTotal: cantidadInsumo });
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Restaurar el stock (sumar de vuelta)
                    for (const [supplyId, { supply, cantidadTotal }] of insumosRequeridos) {
                        const nuevoStock = Number(supply.stockActual) + cantidadTotal;
                        await tx.supply.update({ where: { id: supplyId }, data: { stockActual: nuevoStock } });
                        await tx.stockMovement.create({
                            data: {
                                supplyId,
                                tipo: 'AJUSTE',
                                cantidad: cantidadTotal,
                                stockResultante: nuevoStock,
                                orderId: id,
                                motivo: `Restauración de insumos por cancelación de pedido ${order.numero} (estaba finalizado, sin merma)`
                            }
                        });
                    }

                    await tx.order.update({
                        where: { id },
                        data: {
                            estado: 'CANCELADO',
                            canceladoEn: new Date(),
                            motivoCancelacion: motive,
                            events: {
                                create: {
                                    tipo: 'CANCELACION',
                                    descripcion: `Pedido cancelado (sin merma, insumos restaurados). Motivo: ${motive || 'No especificado'}`,
                                    actorId,
                                    actorName
                                }
                            }
                        }
                    });
                });

            } else if (yaEstabaFinalizado && descontarInsumos) {
                // El pedido estaba FINALIZADO (stock ya descontado) y se cancela CON merma
                // → NO hacer nada con el stock (ya está descontado, y la merma confirma que se usaron)
                await prisma.order.update({
                    where: { id },
                    data: {
                        estado: 'CANCELADO',
                        canceladoEn: new Date(),
                        motivoCancelacion: motive,
                        events: {
                            create: {
                                tipo: 'CANCELACION',
                                descripcion: `Pedido cancelado (con merma, insumos ya descontados previamente). Motivo: ${motive || 'No especificado'}`,
                                actorId,
                                actorName
                            }
                        }
                    }
                });

            } else if (!yaEstabaFinalizado && descontarInsumos) {
                // El pedido NO estaba finalizado (stock nunca descontado) y se cancela CON merma
                // → DESCONTAR stock (los insumos se usaron aunque no se entregó)
                await prisma.$transaction(async (tx) => {
                    const order = await tx.order.findUnique({
                        where: { id },
                        include: {
                            items: {
                                include: {
                                    product: { include: { recipeItems: { include: { supply: true } } } },
                                    promotion: { include: { items: { include: { product: { include: { recipeItems: { include: { supply: true } } } } } } } }
                                }
                            }
                        }
                    });

                    if (!order) throw new Error("Pedido no encontrado");

                    const insumosRequeridos = new Map<string, { supply: any, cantidadTotal: number }>();

                    for (const item of order.items) {
                        const cantidadItem = Number(item.cantidad);
                        if (item.product && item.product.recipeItems.length > 0) {
                            for (const recipeItem of item.product.recipeItems) {
                                const supplyId = recipeItem.supplyId;
                                const cantidadInsumo = Number(recipeItem.qtyPerUnit) * cantidadItem;
                                if (insumosRequeridos.has(supplyId)) {
                                    insumosRequeridos.get(supplyId)!.cantidadTotal += cantidadInsumo;
                                } else {
                                    insumosRequeridos.set(supplyId, { supply: recipeItem.supply, cantidadTotal: cantidadInsumo });
                                }
                            }
                        }
                        if (item.promotion && item.promotion.items) {
                            for (const promoItem of item.promotion.items) {
                                if (promoItem.product && promoItem.product.recipeItems.length > 0) {
                                    const cantidadPromo = promoItem.quantity * cantidadItem;
                                    for (const recipeItem of promoItem.product.recipeItems) {
                                        const supplyId = recipeItem.supplyId;
                                        const cantidadInsumo = Number(recipeItem.qtyPerUnit) * cantidadPromo;
                                        if (insumosRequeridos.has(supplyId)) {
                                            insumosRequeridos.get(supplyId)!.cantidadTotal += cantidadInsumo;
                                        } else {
                                            insumosRequeridos.set(supplyId, { supply: recipeItem.supply, cantidadTotal: cantidadInsumo });
                                        }
                                    }
                                }
                            }
                        }
                    }

                    for (const [supplyId, { supply, cantidadTotal }] of insumosRequeridos) {
                        const nuevoStock = Number(supply.stockActual) - cantidadTotal;
                        await tx.supply.update({ where: { id: supplyId }, data: { stockActual: nuevoStock } });
                        await tx.stockMovement.create({
                            data: {
                                supplyId,
                                tipo: 'OUT',
                                cantidad: cantidadTotal,
                                stockResultante: nuevoStock,
                                orderId: id,
                                motivo: `Merma por cancelación de pedido ${order.numero}`
                            }
                        });
                    }

                    await tx.order.update({
                        where: { id },
                        data: {
                            estado: 'CANCELADO',
                            canceladoEn: new Date(),
                            motivoCancelacion: motive,
                            events: {
                                create: {
                                    tipo: 'CANCELACION',
                                    descripcion: `Pedido cancelado (con merma). Motivo: ${motive || 'No especificado'}`,
                                    actorId,
                                    actorName
                                }
                            }
                        }
                    });
                });

            } else {
                // El pedido NO estaba finalizado y se cancela SIN merma
                // → No tocar el stock
                await prisma.order.update({
                    where: { id },
                    data: {
                        estado: 'CANCELADO',
                        canceladoEn: new Date(),
                        motivoCancelacion: motive,
                        events: {
                            create: {
                                tipo: 'CANCELACION',
                                descripcion: `Pedido cancelado. Motivo: ${motive || 'No especificado'}`,
                                actorId,
                                actorName
                            }
                        }
                    }
                });
            }

        } else {
            // Para otros cambios de estado (EN_PREPARACION, LISTO, etc.)
            await prisma.order.update({
                where: { id },
                data: {
                    estado: status,
                    ...(status === 'EN_PREPARACION' ? { enPreparacionEn: new Date() } : {}),
                    ...(status === 'LISTO' ? { listoEn: new Date() } : {}),
                    events: {
                        create: {
                            tipo: 'CAMBIO_ESTADO',
                            descripcion: `Estado cambiado a ${status}`,
                            actorId,
                            actorName
                        }
                    }
                }
            });
        }

        // Convert Decimal to plain number for serialization
        revalidatePath("/admin/dashboard/pedidos");
        revalidatePath("/empleado/pedidos");
        return { success: true };
    } catch (error) {
        console.error("Error updating order status:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error al actualizar el estado" };
    }
}

export async function toggleOrderPayment(id: string, cobrado: boolean, metodoPago?: string) {
    try {
        // Identify Actor
        let actorId = null;
        let actorName = null;
        try {
            const session = await getSessionCookie();
            if (session) {
                const claims = await verifySessionCookie(session);
                if (claims?.uid) {
                    const user = await prisma.user.findUnique({
                        where: { firebaseUid: claims.uid },
                        select: { id: true, displayName: true, email: true, rol: true }
                    });
                    if (user) {
                        actorId = user.id;
                        actorName = user.displayName || user.email?.split("@")[0] || "Usuario";
                        if (user.rol) actorName += ` (${user.rol})`;
                    }
                }
            }
        } catch (e) {
            console.warn("Could not identify user for order event.", e);
        }

        const order = await prisma.order.update({
            where: { id },
            data: {
                cobrado,
                cobradoEn: cobrado ? new Date() : null,
                metodoPago: cobrado ? (metodoPago || null) : null,
                events: {
                    create: {
                        tipo: 'COBRO',
                        descripcion: cobrado
                            ? `Pedido cobrado (${metodoPago || 'EFECTIVO'})`
                            : 'Marcado como no cobrado',
                        actorId,
                        actorName
                    }
                }
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
        let createdByUserName = null;
        try {
            const session = await getSessionCookie();
            if (session) {
                const claims = await verifySessionCookie(session);
                // Find user in DB to get the internal UUID
                if (claims && claims.uid) {
                    const user = await prisma.user.findUnique({
                        where: { firebaseUid: claims.uid },
                        select: { id: true, displayName: true, email: true, rol: true }
                    });
                    if (user) {
                        createdByUserId = user.id;
                        createdByUserName = user.displayName || user.email?.split("@")[0] || "Usuario";
                        if (user.rol) createdByUserName += ` (${user.rol})`;
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
        numeroOrden = `${seq.prefijo}${seq.ultimo.toString().padStart(4, '0')}`;

        // 2. Crear el pedido en una transacción
        const newOrder = await prisma.$transaction(async (tx) => {
            const orderData: any = {
                numero: numeroOrden,
                origen: "INTERNO",
                clienteNombre: data.clienteNombre,
                clienteTelefono: data.clienteTelefono,
                clienteDireccion: data.clienteDireccion,
                subtotal: subtotal,
                total: total,
                notas: data.notas,
                estado: "PENDIENTE",
                createdBy: createdByUserId,
                events: {
                    create: {
                        tipo: 'CREACION',
                        descripcion: 'Pedido creado internamente',
                        actorId: createdByUserId,
                        actorName: createdByUserName || 'Sistema'
                    }
                },
                items: {
                    create: data.items.map(item => {
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
            };

            if (data.customerId) {
                orderData.customer = { connect: { id: data.customerId } };
            }

            const order = await tx.order.create({
                data: orderData,
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

/**
 * Obtiene los detalles de insumos y costos de un pedido
 */
export async function getOrderSuppliesAndCost(orderId: string) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                recipeItems: {
                                    include: {
                                        supply: true
                                    }
                                }
                            }
                        },
                        promotion: {
                            include: {
                                items: {
                                    include: {
                                        product: {
                                            include: {
                                                recipeItems: {
                                                    include: {
                                                        supply: true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            return { success: false, error: "Pedido no encontrado" };
        }

        // Calcular los insumos totales necesarios
        const insumosMap = new Map<string, {
            nombre: string,
            unidad: string,
            cantidadTotal: number,
            costoUnitario: number,
            costoTotal: number
        }>();

        for (const item of order.items) {
            const cantidadItem = Number(item.cantidad);

            // Si es un producto directo
            if (item.product && item.product.recipeItems.length > 0) {
                for (const recipeItem of item.product.recipeItems) {
                    const cantidadInsumo = Number(recipeItem.qtyPerUnit) * cantidadItem;
                    const supplyId = recipeItem.supplyId;
                    const costoUnitario = Number(recipeItem.supply.costoUnitario || 0);

                    if (insumosMap.has(supplyId)) {
                        const existing = insumosMap.get(supplyId)!;
                        existing.cantidadTotal += cantidadInsumo;
                        existing.costoTotal = existing.cantidadTotal * existing.costoUnitario;
                    } else {
                        insumosMap.set(supplyId, {
                            nombre: recipeItem.supply.nombre,
                            unidad: recipeItem.supply.unidad,
                            cantidadTotal: cantidadInsumo,
                            costoUnitario: costoUnitario,
                            costoTotal: cantidadInsumo * costoUnitario
                        });
                    }
                }
            }

            // Si es una promoción
            if (item.promotion && item.promotion.items) {
                for (const promoItem of item.promotion.items) {
                    if (promoItem.product && promoItem.product.recipeItems.length > 0) {
                        const cantidadPromoProduct = promoItem.quantity * cantidadItem;

                        for (const recipeItem of promoItem.product.recipeItems) {
                            const cantidadInsumo = Number(recipeItem.qtyPerUnit) * cantidadPromoProduct;
                            const supplyId = recipeItem.supplyId;
                            const costoUnitario = Number(recipeItem.supply.costoUnitario || 0);

                            if (insumosMap.has(supplyId)) {
                                const existing = insumosMap.get(supplyId)!;
                                existing.cantidadTotal += cantidadInsumo;
                                existing.costoTotal = existing.cantidadTotal * existing.costoUnitario;
                            } else {
                                insumosMap.set(supplyId, {
                                    nombre: recipeItem.supply.nombre,
                                    unidad: recipeItem.supply.unidad,
                                    cantidadTotal: cantidadInsumo,
                                    costoUnitario: costoUnitario,
                                    costoTotal: cantidadInsumo * costoUnitario
                                });
                            }
                        }
                    }
                }
            }
        }

        // Convertir el mapa en un array
        const insumos = Array.from(insumosMap.values());

        // Calcular el costo total
        const costoTotal = insumos.reduce((sum, insumo) => sum + insumo.costoTotal, 0);

        // Calcular la ganancia (total del pedido - costo de insumos)
        const totalPedido = Number(order.total);
        const ganancia = totalPedido - costoTotal;
        const margenGanancia = totalPedido > 0 ? (ganancia / totalPedido) * 100 : 0;

        return {
            success: true,
            data: {
                insumos,
                costoTotal,
                totalPedido,
                ganancia,
                margenGanancia
            }
        };
    } catch (error) {
        console.error("Error getting order supplies:", error);
        return { success: false, error: "Error al obtener detalles de insumos" };
    }
}
