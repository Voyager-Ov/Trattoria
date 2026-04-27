import { NextRequest, NextResponse } from "next/server";

import { ACTIVE_CASHBOX_PAYMENT_SELECT, resolveOrderPaymentState } from "@/lib/cashbox";
import { prisma } from "@/lib/prisma";
import { requireEmployeeApiAuth } from "@/lib/serverAuth";
import { serializePrisma } from "@/lib/utils";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireEmployeeApiAuth(request);
    if (auth.error) {
        return auth.error;
    }

    try {
        const { id } = await params;

        const order = await prisma.order.findFirst({
            where: {
                id,
                deletedAt: null,
            },
            include: {
                customer: true,
                events: {
                    orderBy: {
                        createdAt: "desc",
                    },
                },
                items: {
                    include: {
                        product: true,
                    },
                    orderBy: {
                        orden: "asc",
                    },
                },
                cobrosCaja: {
                    select: ACTIVE_CASHBOX_PAYMENT_SELECT,
                },
            },
        });

        if (!order) {
            return NextResponse.json(
                { success: false, error: "Pedido no encontrado" },
                { status: 404 }
            );
        }

        const payment = resolveOrderPaymentState(order);

        return NextResponse.json({
            success: true,
            order: serializePrisma({
                ...order,
                payment: {
                    isPaid: payment.isPaid,
                    method: payment.method,
                    paidAt: payment.paidAt,
                    source: payment.source,
                    preferredMethod: payment.preferredMethod,
                },
            }),
        });
    } catch (error) {
        console.error("Error fetching order detail:", error);
        return NextResponse.json(
            { success: false, error: "Error al obtener el pedido" },
            { status: 500 }
        );
    }
}
