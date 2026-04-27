import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { ACTIVE_CASHBOX_PAYMENT_SELECT, resolveOrderPaymentState } from "@/lib/cashbox";
import { serializePrisma } from "@/lib/utils";

import { PedidoDetailClient } from "./PedidoDetailClient";
import type { OrderDetail } from "../components/pedido-shared";

export default async function AdminPedidoDetailRoute({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const order = await prisma.order.findUnique({
        where: { id, deletedAt: null },
        include: {
            customer: true,
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
            events: {
                orderBy: {
                    createdAt: "desc",
                },
            },
        },
    });

    if (!order) {
        notFound();
    }

    const payment = resolveOrderPaymentState(order);
    const serializedOrder = serializePrisma({
        ...order,
        payment: {
            isPaid: payment.isPaid,
            method: payment.method,
            paidAt: payment.paidAt,
            source: payment.source,
            preferredMethod: payment.preferredMethod,
        },
    }) as OrderDetail;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PedidoDetailClient order={serializedOrder} />
        </div>
    );
}
