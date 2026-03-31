export type DeliveryTypeValue = "DELIVERY" | "RETIRO";

type OrderDeliveryLike = {
    tipoEntrega?: DeliveryTypeValue | null;
    clienteDireccion?: string | null;
};

export function resolveOrderDeliveryType(order: OrderDeliveryLike): DeliveryTypeValue | null {
    if (order.tipoEntrega === "DELIVERY" || order.tipoEntrega === "RETIRO") {
        return order.tipoEntrega;
    }

    const address = order.clienteDireccion?.trim();

    if (!address) {
        return null;
    }

    if (address === "Retiro en Local") {
        return "RETIRO";
    }

    return "DELIVERY";
}

export function getOrderDeliveryLabel(order: OrderDeliveryLike) {
    const type = resolveOrderDeliveryType(order);

    if (type === "DELIVERY") {
        return "Delivery";
    }

    if (type === "RETIRO") {
        return "Retiro";
    }

    return null;
}

export function getOrderDisplayAddress(order: OrderDeliveryLike) {
    const type = resolveOrderDeliveryType(order);
    const address = order.clienteDireccion?.trim();

    if (!address || type === "RETIRO") {
        return null;
    }

    return address;
}
