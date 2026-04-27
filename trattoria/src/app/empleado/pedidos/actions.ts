"use server";

import { type EstadoPedido } from "@prisma/client";

import { requireEmployee } from "@/lib/serverAuth";
import {
    createOrder as adminCreateOrder,
    searchCustomers as adminSearchCustomers,
    updateOrderStatus as adminUpdateOrderStatus,
} from "@/app/admin/dashboard/pedidos/actions";

export async function searchCustomers(query: string) {
    await requireEmployee();
    return adminSearchCustomers(query);
}

export async function createOrder(data: {
    customerId?: string | null;
    clienteNombre?: string;
    clienteTelefono?: string;
    clienteDireccion?: string;
    items: {
        productId: string;
        type: "PRODUCTO" | "PROMOCION";
        nombreProduct: string;
        cantidad: number;
        precioUnitario: number;
    }[];
}) {
    await requireEmployee();
    return adminCreateOrder(data);
}

export async function updateOrderStatus(
    id: string,
    status: EstadoPedido,
    motive?: string,
    deductStock?: boolean
) {
    await requireEmployee();
    return adminUpdateOrderStatus(id, status, motive, deductStock);
}
