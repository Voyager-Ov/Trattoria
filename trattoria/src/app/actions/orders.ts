"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getConfigs } from "./configActions";
import { getStoreStatus } from "@/lib/openingHours";

export async function createPublicOrder(data: {
    clienteNombre: string;
    clienteTelefono?: string;
    clienteDireccion: string;
    metodoPago: string;
    items: { productId: string, cantidad: number, precioUnitario: number, nombreProduct: string }[];
    total: number;
}) {
    try {
        console.log('📥 createPublicOrder llamada con:', { clienteNombre: data.clienteNombre, total: data.total, items: data.items.length });
        
        // 0. Validate Store Hours
        console.log('⏰ Validando horario del local...');
        const configRes = await getConfigs(["business.hours", "business.closedDays"]);
        if (configRes.success && configRes.data) {
            const status = getStoreStatus(
                configRes.data["business.hours"] || {},
                configRes.data["business.closedDays"] || []
            );

            console.log('🏪 Estado del local:', status);

            if (!status.isOpen) {
                console.error('❌ Local cerrado');
                return { success: false, error: status.message || "El local se encuentra cerrado en este momento." };
            }
        }

        // 1. Get next order number from AppSequence
        console.log('🔢 Obteniendo número de orden...');
        const seq = await prisma.appSequence.upsert({
            where: { tipo: "order" },
            update: { ultimo: { increment: 1 } },
            create: { tipo: "order", prefijo: "ORD-", ultimo: 1 }
        });
        const numeroOrden = `${seq.prefijo}${seq.ultimo.toString().padStart(4, '0')}`;
        console.log('📋 Número de orden:', numeroOrden);

        // 2. Create the order in a transaction
        console.log('💾 Creando orden en base de datos...');
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
                    notas: "",
                    items: {
                        create: data.items.map((item, index) => ({
                            productId: item.productId,
                            nombreProduct: item.nombreProduct,
                            cantidad: item.cantidad,
                            precioUnitario: item.precioUnitario,
                            subtotal: item.cantidad * item.precioUnitario,
                            orden: index
                        }))
                    }
                },
                include: {
                    items: true
                }
            });

            console.log('✅ Orden creada:', order.id);

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

            console.log('📝 Audit log creado');

            return order;
        });

        console.log('✅ Transacción completada');
        revalidatePath("/admin/dashboard/pedidos");
        return { success: true, orderNumber: numeroOrden, data: JSON.parse(JSON.stringify(newOrder)) };
    } catch (error: any) {
        console.error("❌ Error creating public order:", error);
        console.error("❌ Error code:", error?.code);
        console.error("❌ Error message:", error?.message);
        console.error("❌ Error stack:", error?.stack);
        
        // More specific error messages
        if (error?.code === 'P2025') {
            return { success: false, error: "Uno o más productos ya no están disponibles" };
        }
        if (error?.code === 'P2002') {
            return { success: false, error: "Error de duplicación en el pedido" };
        }
        if (error?.message) {
            console.error("Error details:", error.message);
        }
        
        return { success: false, error: "No se pudo procesar el pedido. Por favor intenta nuevamente." };
    }
}
