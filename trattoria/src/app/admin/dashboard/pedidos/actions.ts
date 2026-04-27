"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { EstadoPedido, Prisma } from "@prisma/client";
import { getSessionCookie, verifySessionCookie } from "@/lib/auth";
import { registerCashboxPayment, voidCashboxPaymentForCancellation } from "@/app/actions/cashboxActions";
import { serializePrisma } from "@/lib/utils";
import { getSystemNow } from "@/lib/system-time";

type RecipeSupply = {
    supplyId: string;
    qtyPerUnit: Prisma.Decimal | number;
    supply: {
        stockActual: Prisma.Decimal | number;
        nombre?: string;
        unidad?: string;
        costoUnitario?: Prisma.Decimal | number | null;
    };
};

type OrderRecipeProduct = {
    recipeItems: RecipeSupply[];
};

type OrderPromotionItem = {
    quantity: number;
    product?: OrderRecipeProduct | null;
};

type OrderItemWithRecipes = {
    cantidad: Prisma.Decimal | number;
    product?: OrderRecipeProduct | null;
    promotion?: {
        items: OrderPromotionItem[];
    } | null;
};

type OrderWithRecipeItems = {
    items: OrderItemWithRecipes[];
};

// ============================================================================
// HELPER: collect ingredients required by all items in an order
// ============================================================================
function buildInsumosMap(
    order: OrderWithRecipeItems,
): Map<string, { supply: RecipeSupply["supply"]; cantidadTotal: number }> {
    const map = new Map<string, { supply: RecipeSupply["supply"]; cantidadTotal: number }>();

    for (const item of order.items) {
        const cantidadItem = Number(item.cantidad);

        if (item.product && item.product.recipeItems.length > 0) {
            for (const recipeItem of item.product.recipeItems) {
                const qty = Number(recipeItem.qtyPerUnit) * cantidadItem;
                const existing = map.get(recipeItem.supplyId);
                if (existing) {
                    existing.cantidadTotal += qty;
                } else {
                    map.set(recipeItem.supplyId, { supply: recipeItem.supply, cantidadTotal: qty });
                }
            }
        }

        if (item.promotion && item.promotion.items) {
            for (const promoItem of item.promotion.items) {
                if (promoItem.product && promoItem.product.recipeItems.length > 0) {
                    const cantidadPromo = promoItem.quantity * cantidadItem;
                    for (const recipeItem of promoItem.product.recipeItems) {
                        const qty = Number(recipeItem.qtyPerUnit) * cantidadPromo;
                        const existing = map.get(recipeItem.supplyId);
                        if (existing) {
                            existing.cantidadTotal += qty;
                        } else {
                            map.set(recipeItem.supplyId, { supply: recipeItem.supply, cantidadTotal: qty });
                        }
                    }
                }
            }
        }
    }

    return map;
}

// ============================================================================
// HELPER: include clause for stock-aware order queries
// ============================================================================
const itemsWithSuppliesInclude = {
    items: {
        include: {
            product: { include: { recipeItems: { include: { supply: true } } } },
            promotion: {
                include: {
                    items: {
                        include: { product: { include: { recipeItems: { include: { supply: true } } } } },
                    },
                },
            },
        },
    },
} as const;

// ============================================================================
// HELPER: resolve actor from session
// ============================================================================
async function resolveActor() {
    let actorId: string | null = null;
    let actorName: string | null = null;
    let actorRole: string | null = null;
    try {
        const session = await getSessionCookie();
        if (session) {
            const claims = await verifySessionCookie(session);
            if (claims?.uid) {
                const user = await prisma.user.findUnique({
                    where: { firebaseUid: claims.uid },
                    select: { id: true, displayName: true, email: true, rol: true },
                });
                if (user) {
                    actorId = user.id;
                    actorRole = user.rol;
                    actorName = user.displayName || user.email?.split("@")[0] || "Usuario";
                    if (user.rol) actorName += ` (${user.rol})`;
                }
            }
        }
    } catch (e) {
        console.warn("Could not identify user for order event.", e);
    }
    return { actorId, actorName, actorRole };
}

// ============================================================================
// updateOrderStatus
//
// Rules enforced:
//   - CANCELADO orders are immutable: no further state changes allowed.
//   - When CANCELADO: stock is always restored (it was deducted on creation).
//   - If the order has a registered cashbox payment, it is voided in the same transaction.
//   - All other transitions: just update estado and timestamps.
//   - Stock is NO LONGER deducted on FINALIZADO — it is deducted on creation.
// ============================================================================
export async function updateOrderStatus(
    id: string,
    status: EstadoPedido,
    motive?: string,
    deductStock?: boolean
) {
    try {
        const { actorId, actorName, actorRole } = await resolveActor();

        const currentOrder = await prisma.order.findUnique({
            where: { id },
            select: { estado: true },
        });

        if (!currentOrder) {
            throw new Error("Pedido no encontrado");
        }

        // ── Immutability guard ──────────────────────────────────────────────
        if (currentOrder.estado === "CANCELADO") {
            throw new Error("No se puede modificar un pedido cancelado");
        }

        // ── CANCELLATION: restore stock ─────────────────────────────────────
        if (status === "CANCELADO") {
            await prisma.$transaction(async (tx) => {
                const order = await tx.order.findUnique({
                    where: { id },
                    include: itemsWithSuppliesInclude,
                });
                if (!order) throw new Error("Pedido no encontrado");

                const insumosRequeridos = buildInsumosMap(order);

                // Solo restauramos stock si NO queremos descontar merma
                if (!deductStock) {
                    for (const [supplyId, { supply, cantidadTotal }] of insumosRequeridos) {
                        const nuevoStock = Number(supply.stockActual) + cantidadTotal;
                        await tx.supply.update({
                            where: { id: supplyId },
                            data: { stockActual: nuevoStock },
                        });
                        await tx.stockMovement.create({
                            data: {
                                supplyId,
                                tipo: "AJUSTE",
                                cantidad: cantidadTotal,
                                stockResultante: nuevoStock,
                                orderId: id,
                                motivo: `Restauración de stock por cancelación de pedido ${order.numero}`,
                            },
                        });
                    }
                }

                const voidedPayment = await voidCashboxPaymentForCancellation(tx, {
                    orderId: id,
                    reason: motive || "Pedido cancelado",
                    actorId,
                    actorName,
                    actorRole,
                });

                const updatedOrder = await tx.order.update({
                    where: { id },
                    data: {
                        estado: "CANCELADO",
                        canceladoEn: getSystemNow(),
                        cobrado: false,
                        cobradoEn: null,
                        metodoPago: null,
                        metodoPagoPreferido: null,
                        motivoCancelacion: motive,
                        events: {
                            create: {
                                tipo: "CANCELACION",
                                descripcion: `Pedido cancelado${voidedPayment ? " y cobro anulado" : ""}. Motivo: ${motive || "No especificado"}`,
                                actorId,
                                actorName,
                            },
                        },
                    },
                });

                await tx.auditLog.create({
                    data: {
                        actorId,
                        actorRole,
                        action: "CANCEL_ORDER",
                        objectType: "order",
                        objectId: id,
                        before: serializePrisma({
                            id: order.id,
                            numero: order.numero,
                            estado: order.estado,
                            cobrado: order.cobrado,
                            cobradoEn: order.cobradoEn,
                            metodoPago: order.metodoPago,
                            motivoCancelacion: order.motivoCancelacion,
                        }) as Prisma.InputJsonValue,
                        after: serializePrisma({
                            id: updatedOrder.id,
                            numero: updatedOrder.numero,
                            estado: updatedOrder.estado,
                            cobrado: updatedOrder.cobrado,
                            cobradoEn: updatedOrder.cobradoEn,
                            metodoPago: updatedOrder.metodoPago,
                            motivoCancelacion: updatedOrder.motivoCancelacion,
                        }) as Prisma.InputJsonValue,
                        notes: `Pedido ${order.numero} cancelado`,
                        reason: motive || "Pedido cancelado",
                        origin: "WEB",
                    },
                });
            });

        // ── ALL OTHER STATE TRANSITIONS ─────────────────────────────────────
        } else {
            await prisma.order.update({
                where: { id },
                data: {
                    estado: status,
                    ...(status === "EN_PREPARACION" ? { enPreparacionEn: getSystemNow() } : {}),
                    ...(status === "LISTO" ? { listoEn: getSystemNow() } : {}),
                    ...(status === "FINALIZADO" ? { finalizadoEn: getSystemNow() } : {}),
                    events: {
                        create: {
                            tipo: "CAMBIO_ESTADO",
                            descripcion: `Estado cambiado a ${status}`,
                            actorId,
                            actorName,
                        },
                    },
                },
            });
        }

        revalidatePath("/admin/dashboard/pedidos");
        revalidatePath("/empleado/pedidos");
        return { success: true };
    } catch (error) {
        console.error("Error updating order status:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Error al actualizar el estado",
        };
    }
}

// ============================================================================
// toggleOrderPayment
//
// Rules enforced:
//   - Cannot pay a CANCELADO order.
//   - Cobro requires an open cashbox for the current user.
//   - Order keeps a payment snapshot, but CobroCaja is the financial source of truth.
// ============================================================================
export async function toggleOrderPayment(
    id: string,
    cobrado: boolean,
    metodoPago?: string,
) {
    try {
        if (!cobrado) {
            throw new Error("No se puede quitar el pago manualmente; cancela el pedido para anular el cobro");
        }

        // Require payment method — default to EFECTIVO to prevent N/A
        if (!metodoPago?.trim()) {
            throw new Error("Debes seleccionar un metodo de pago");
        }

        const result = await registerCashboxPayment(id, metodoPago);
        if (!result.success) {
            throw new Error(result.error || "Error al registrar el cobro");
        }

        revalidatePath("/admin/dashboard/pedidos");
        revalidatePath("/empleado/pedidos");
        return { success: true, order: result.data };
    } catch (error) {
        console.error("Error toggling order payment:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Error al actualizar el pago",
        };
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
                    { nombre: { contains: query, mode: "insensitive" } },
                    { telefono: { contains: query, mode: "insensitive" } },
                ],
                activo: true,
                deletedAt: null,
            },
            take: 5,
        });
        return { success: true, data: customers };
    } catch (error) {
        console.error("Error searching customers:", error);
        return { success: false, error: "Error al buscar clientes" };
    }
}

// ============================================================================
// createOrder
//
// Rules enforced:
//   - Stock is deducted immediately upon order creation (not on finalization).
// ============================================================================
export async function createOrder(data: {
    customerId?: string | null;
    clienteNombre?: string;
    clienteTelefono?: string;
    clienteDireccion?: string;
    items: {
        productId: string;
        type?: "PRODUCTO" | "PROMOCION";
        cantidad: number;
        precioUnitario: number;
        nombreProduct: string;
    }[];
    notas?: string;
}) {
    try {
        let createdByUserId: string | null = null;
        let createdByUserName: string | null = null;
        try {
            const session = await getSessionCookie();
            if (session) {
                const claims = await verifySessionCookie(session);
                if (claims?.uid) {
                    const user = await prisma.user.findUnique({
                        where: { firebaseUid: claims.uid },
                        select: { id: true, displayName: true, email: true, rol: true },
                    });
                    if (user) {
                        createdByUserId = user.id;
                        createdByUserName =
                            user.displayName || user.email?.split("@")[0] || "Usuario";
                        if (user.rol) createdByUserName += ` (${user.rol})`;
                    }
                }
            }
        } catch (authError) {
            console.warn("Could not identify user for order creation:", authError);
        }

        const subtotal = data.items.reduce(
            (acc, item) => acc + item.cantidad * item.precioUnitario,
            0
        );
        const total = subtotal;

        // Get or generate order number
        const seq = await prisma.appSequence.upsert({
            where: { tipo: "order" },
            update: { ultimo: { increment: 1 } },
            create: { tipo: "order", prefijo: "ORD-", ultimo: 1 },
        });
        const numeroOrden = `${seq.prefijo}${seq.ultimo.toString().padStart(4, "0")}`;

        // Create order + deduct stock in a single atomic transaction
        const newOrder = await prisma.$transaction(async (tx) => {
            const orderData: Prisma.OrderCreateInput = {
                numero: numeroOrden,
                origen: "INTERNO",
                clienteNombre: data.clienteNombre,
                clienteTelefono: data.clienteTelefono,
                clienteDireccion: data.clienteDireccion,
                subtotal,
                total,
                notas: data.notas,
                estado: "PENDIENTE",
                ...(createdByUserId
                    ? { createdByUser: { connect: { id: createdByUserId } } }
                    : {}),
                events: {
                    create: {
                        tipo: "CREACION",
                        descripcion: "Pedido creado internamente",
                        actorId: createdByUserId,
                        actorName: createdByUserName || "Sistema",
                    },
                },
                items: {
                    create: data.items.map((item) => {
                        const isPromotion =
                            item.type === "PROMOCION" ||
                            (!!item.productId && item.productId.includes("-"));
                        return {
                            ...(isPromotion
                                ? { promotion: { connect: { id: item.productId } } }
                                : { product: { connect: { id: item.productId } } }),
                            nombreProduct: item.nombreProduct,
                            cantidad: item.cantidad,
                            precioUnitario: item.precioUnitario,
                            subtotal: item.cantidad * item.precioUnitario,
                        };
                    }),
                },
            };

            if (data.customerId) {
                orderData.customer = { connect: { id: data.customerId } };
            }

            // Create the order and load its items with full recipe data for stock deduction
            const order = await tx.order.create({
                data: orderData,
                include: itemsWithSuppliesInclude,
            });

            // ── Deduct stock immediately on creation ────────────────────────
            const insumosRequeridos = buildInsumosMap(order);

            for (const [supplyId, { supply, cantidadTotal }] of insumosRequeridos) {
                const nuevoStock = Number(supply.stockActual) - cantidadTotal;
                await tx.supply.update({
                    where: { id: supplyId },
                    data: { stockActual: nuevoStock },
                });
                await tx.stockMovement.create({
                    data: {
                        supplyId,
                        tipo: "OUT",
                        cantidad: cantidadTotal,
                        stockResultante: nuevoStock,
                        orderId: order.id,
                        motivo: `Consumo por creación de pedido ${order.numero}`,
                    },
                });
            }

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
            include: itemsWithSuppliesInclude,
        });

        if (!order) {
            return { success: false, error: "Pedido no encontrado" };
        }

        const insumosMap = new Map<
            string,
            {
                nombre: string;
                unidad: string;
                cantidadTotal: number;
                costoUnitario: number;
                costoTotal: number;
            }
        >();

        for (const item of order.items) {
            const cantidadItem = Number(item.cantidad);

            if (item.product && item.product.recipeItems.length > 0) {
                for (const recipeItem of item.product.recipeItems) {
                    const cantidadInsumo = Number(recipeItem.qtyPerUnit) * cantidadItem;
                    const supplyId = recipeItem.supplyId;
                    const costoUnitario = Number(recipeItem.supply.costoUnitario || 0);

                    const existing = insumosMap.get(supplyId);
                    if (existing) {
                        existing.cantidadTotal += cantidadInsumo;
                        existing.costoTotal = existing.cantidadTotal * existing.costoUnitario;
                    } else {
                        insumosMap.set(supplyId, {
                            nombre: recipeItem.supply.nombre,
                            unidad: recipeItem.supply.unidad,
                            cantidadTotal: cantidadInsumo,
                            costoUnitario,
                            costoTotal: cantidadInsumo * costoUnitario,
                        });
                    }
                }
            }

            if (item.promotion && item.promotion.items) {
                for (const promoItem of item.promotion.items) {
                    if (promoItem.product && promoItem.product.recipeItems.length > 0) {
                        const cantidadPromoProduct = promoItem.quantity * cantidadItem;
                        for (const recipeItem of promoItem.product.recipeItems) {
                            const cantidadInsumo =
                                Number(recipeItem.qtyPerUnit) * cantidadPromoProduct;
                            const supplyId = recipeItem.supplyId;
                            const costoUnitario = Number(recipeItem.supply.costoUnitario || 0);

                            const existing = insumosMap.get(supplyId);
                            if (existing) {
                                existing.cantidadTotal += cantidadInsumo;
                                existing.costoTotal =
                                    existing.cantidadTotal * existing.costoUnitario;
                            } else {
                                insumosMap.set(supplyId, {
                                    nombre: recipeItem.supply.nombre,
                                    unidad: recipeItem.supply.unidad,
                                    cantidadTotal: cantidadInsumo,
                                    costoUnitario,
                                    costoTotal: cantidadInsumo * costoUnitario,
                                });
                            }
                        }
                    }
                }
            }
        }

        const insumos = Array.from(insumosMap.values());
        const costoTotal = insumos.reduce((sum, insumo) => sum + insumo.costoTotal, 0);
        const totalPedido = Number(order.total);
        const ganancia = totalPedido - costoTotal;
        const margenGanancia = totalPedido > 0 ? (ganancia / totalPedido) * 100 : 0;

        return {
            success: true,
            data: { insumos, costoTotal, totalPedido, ganancia, margenGanancia },
        };
    } catch (error) {
        console.error("Error getting order supplies:", error);
        return { success: false, error: "Error al obtener detalles de insumos" };
    }
}
