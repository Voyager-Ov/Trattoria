import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { Prisma, EstadoPedido } from "@prisma/client";
import { requireEmployeeApiAuth } from "@/lib/serverAuth";
import { ACTIVE_CASHBOX_PAYMENT_SELECT, resolveOrderPaymentState } from "@/lib/cashbox";

const ALLOWED_ORDER_FIELDS = ["recibidoEn", "total", "estado", "numero", "clienteNombre", "updatedAt"] as const;
type AllowedOrderField = typeof ALLOWED_ORDER_FIELDS[number];

export async function GET(request: NextRequest) {
    const auth = await requireEmployeeApiAuth(request);
    if (auth.error) return auth.error;

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        // F-11 fix: whitelist allowed sort fields to prevent object injection
        const rawOrderBy = searchParams.get("orderBy") ?? 'recibidoEn';
        const orderBy: AllowedOrderField = (ALLOWED_ORDER_FIELDS as readonly string[]).includes(rawOrderBy)
            ? rawOrderBy as AllowedOrderField
            : 'recibidoEn';
        const orderDir = searchParams.get("orderDir") === 'asc' ? 'asc' : 'desc';

        const skip = (page - 1) * limit;

        // Construir filtros
        const where: Prisma.OrderWhereInput = {
            deletedAt: null,
        };

        if (status && status !== "TODOS") {
            where.estado = status as EstadoPedido;
        }

        if (search) {
            where.OR = [
                { numero: { contains: search, mode: 'insensitive' } },
                { clienteNombre: { contains: search, mode: 'insensitive' } },
                { clienteTelefono: { contains: search, mode: 'insensitive' } },
                { customer: { nombre: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                select: {
                    id: true,
                    numero: true,
                    origen: true,
                    clienteNombre: true,
                    clienteTelefono: true,
                    clienteDireccion: true,
                    tipoEntrega: true,
                    recibidoEn: true,
                    estado: true,
                    cobrado: true,
                    cobradoEn: true,
                    metodoPago: true,
                    metodoPagoPreferido: true,
                    total: true,
                    items: {
                        select: {
                            id: true,
                            nombreProduct: true,
                            cantidad: true,
                        },
                        orderBy: {
                            orden: "asc",
                        },
                    },
                    customer: {
                        select: {
                            nombre: true,
                        },
                    },
                    cobrosCaja: {
                        select: ACTIVE_CASHBOX_PAYMENT_SELECT,
                    },
                },
                orderBy: {
                    [orderBy]: orderDir
                },
                skip,
                take: limit,
            }),
            prisma.order.count({ where })
        ]);

        return NextResponse.json({
            orders: serializePrisma(orders.map((order) => {
                const payment = resolveOrderPaymentState(order);
                return {
                    ...order,
                    payment: {
                        isPaid: payment.isPaid,
                        method: payment.method,
                        paidAt: payment.paidAt,
                        source: payment.source,
                        preferredMethod: payment.preferredMethod,
                    },
                };
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json({ error: "Error al obtener los pedidos" }, { status: 500 });
    }
}
