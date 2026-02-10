"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { EstadoPedido } from "@prisma/client";
import { getSessionCookie, verifySessionCookie } from "@/lib/auth";

/**
 * Actualiza el estado de un pedido y registra el timestamp correspondiente.
 * Si el estado es FINALIZADO, descuenta los insumos del stock.
 */
export async function updateOrderStatus(id: string, status: EstadoPedido, motive?: string) {
    try {
        // Obtener el estado actual del pedido
        const currentOrder = await prisma.order.findUnique({
            where: { id },
            select: { estado: true }
        });

        if (!currentOrder) {
            throw new Error("Pedido no encontrado");
        }

        // Si ya está finalizado, no permitir volver a descontar insumos o cambiar estado a menos que sea necesario
        if (currentOrder.estado === 'FINALIZADO' && status === 'FINALIZADO') {
            return { success: true };
        }

        // Si el pedido se está finalizando, necesitamos descontar los insumos en una transacción
        if (status === 'FINALIZADO') {
            await prisma.$transaction(async (tx) => {
                // 1. Obtener el pedido con sus items y las recetas de cada producto
                const order = await tx.order.findUnique({
                    where: { id },
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
                    throw new Error("Pedido no encontrado");
                }

                // 2. Calcular los insumos totales necesarios
                const insumosRequeridos = new Map<string, { supply: any, cantidadTotal: number }>();

                for (const item of order.items) {
                    const cantidadItem = Number(item.cantidad);

                    // Si es un producto directo
                    if (item.product && item.product.recipeItems.length > 0) {
                        for (const recipeItem of item.product.recipeItems) {
                            const cantidadInsumo = Number(recipeItem.qtyPerUnit) * cantidadItem;
                            const supplyId = recipeItem.supplyId;

                            if (insumosRequeridos.has(supplyId)) {
                                const existing = insumosRequeridos.get(supplyId)!;
                                existing.cantidadTotal += cantidadInsumo;
                            } else {
                                insumosRequeridos.set(supplyId, {
                                    supply: recipeItem.supply,
                                    cantidadTotal: cantidadInsumo
                                });
                            }
                        }
                    }

                    // Si es una promoción, iterar por los productos de la promoción
                    if (item.promotion && item.promotion.items) {
                        for (const promoItem of item.promotion.items) {
                            if (promoItem.product && promoItem.product.recipeItems.length > 0) {
                                const cantidadPromoProduct = promoItem.quantity * cantidadItem;
                                
                                for (const recipeItem of promoItem.product.recipeItems) {
                                    const cantidadInsumo = Number(recipeItem.qtyPerUnit) * cantidadPromoProduct;
                                    const supplyId = recipeItem.supplyId;

                                    if (insumosRequeridos.has(supplyId)) {
                                        const existing = insumosRequeridos.get(supplyId)!;
                                        existing.cantidadTotal += cantidadInsumo;
                                    } else {
                                        insumosRequeridos.set(supplyId, {
                                            supply: recipeItem.supply,
                                            cantidadTotal: cantidadInsumo
                                        });
                                    }
                                }
                            }
                        }
                    }
                }

                // 3. Descontar los insumos del stock y registrar movimientos
                for (const [supplyId, { supply, cantidadTotal }] of insumosRequeridos) {
                    const nuevoStock = Number(supply.stockActual) - cantidadTotal;

                    // Actualizar el stock del insumo
                    await tx.supply.update({
                        where: { id: supplyId },
                        data: {
                            stockActual: nuevoStock
                        }
                    });

                    // Registrar el movimiento de stock
                    await tx.stockMovement.create({
                        data: {
                            supplyId: supplyId,
                            tipo: 'OUT',
                            cantidad: cantidadTotal,
                            stockResultante: nuevoStock,
                            orderId: id,
                            motivo: `Descuento automático por finalización de pedido ${order.numero}`
                        }
                    });
                }

                // 4. Actualizar el estado del pedido
                await tx.order.update({
                    where: { id },
                    data: {
                        estado: status,
                        finalizadoEn: new Date()
                    }
                });
            });
        } else {
            // Para otros estados, actualizar normalmente
            await prisma.order.update({
                where: { id },
                data: {
                    estado: status,
                    ...(status === 'EN_PREPARACION' ? { enPreparacionEn: new Date() } : {}),
                    ...(status === 'LISTO' ? { listoEn: new Date() } : {}),
                    ...(status === 'CANCELADO' ? {
                        canceladoEn: new Date(),
                        motivoCancelacion: motive
                    } : {}),
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
