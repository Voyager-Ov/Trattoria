import { EstadoPedido } from "@prisma/client";
import {
    Banknote,
    CheckCircle2,
    ChefHat,
    Clock,
    CreditCard,
    ShoppingBag,
    XCircle,
    type LucideIcon,
} from "lucide-react";

export interface OrderItem {
    id: string;
    nombreProduct: string;
    cantidad: number;
}

export interface OrderDetailItem extends OrderItem {
    precioUnitario: number | string;
    subtotal: number | string;
}

export interface OrderPaymentState {
    isPaid: boolean;
    method: string | null;
    paidAt: string | null;
    source: "cashbox" | "legacy" | "none";
    preferredMethod: string | null;
}

type OrderBase = {
    id: string;
    numero: string;
    origen: string;
    clienteNombre: string | null;
    clienteTelefono: string | null;
    clienteDireccion: string | null;
    tipoEntrega?: "DELIVERY" | "RETIRO" | null;
    recibidoEn: string;
    estado: EstadoPedido;
    cobrado: boolean;
    cobradoEn?: string | null;
    metodoPago?: string | null;
    total: number | string;
    customer?: {
        nombre: string;
    } | null;
    payment: OrderPaymentState;
};

export interface OrderListItem extends OrderBase {
    items: OrderItem[];
}

export interface OrderDetail extends OrderBase {
    subtotal: number | string;
    descuento: number | string;
    deliveryFee?: number | string;
    notas?: string | null;
    motivoCancelacion?: string | null;
    enPreparacionEn?: string | null;
    listoEn?: string | null;
    finalizadoEn?: string | null;
    canceladoEn?: string | null;
    items: OrderDetailItem[];
    events?: Array<{
        id: string;
        tipo: string;
        descripcion: string;
        actorName?: string | null;
        createdAt: string;
        actor?: {
            displayName?: string | null;
        } | null;
    }>;
}

export type Order = OrderListItem;

export type SortField = "recibidoEn" | "numero" | "clienteNombre" | "estado" | "total";
export type SortDirection = "asc" | "desc";

export type StatusUiConfig = {
    label: string;
    shortLabel: string;
    color: string;
    icon: LucideIcon;
    border: string;
    bg: string;
};

export const STATUS_CONFIG: Record<EstadoPedido, StatusUiConfig> = {
    RECIBIDO: {
        label: "Recibido (Web)",
        shortLabel: "Recibido",
        color: "text-blue-600",
        border: "border-blue-100",
        bg: "bg-blue-50/50",
        icon: ShoppingBag,
    },
    PENDIENTE: {
        label: "Pendiente (Caja)",
        shortLabel: "Pendiente",
        color: "text-amber-600",
        border: "border-amber-100",
        bg: "bg-amber-50/50",
        icon: Clock,
    },
    EN_PREPARACION: {
        label: "Cocina",
        shortLabel: "Cocina",
        color: "text-orange-600",
        border: "border-orange-100",
        bg: "bg-orange-50/50",
        icon: ChefHat,
    },
    LISTO: {
        label: "Listo",
        shortLabel: "Listo",
        color: "text-emerald-600",
        border: "border-emerald-100",
        bg: "bg-emerald-50/50",
        icon: CheckCircle2,
    },
    FINALIZADO: {
        label: "Finalizado",
        shortLabel: "Finalizado",
        color: "text-zinc-500",
        border: "border-zinc-200",
        bg: "bg-zinc-100/50",
        icon: CheckCircle2,
    },
    CANCELADO: {
        label: "Cancelado",
        shortLabel: "Cancelado",
        color: "text-red-600",
        border: "border-red-100",
        bg: "bg-red-50/50",
        icon: XCircle,
    },
};

export const ORDER_FILTER_OPTIONS: Array<"TODOS" | EstadoPedido> = [
    "TODOS",
    "RECIBIDO",
    "PENDIENTE",
    "EN_PREPARACION",
    "LISTO",
    "FINALIZADO",
    "CANCELADO",
];

export const SORT_OPTIONS: Array<{ value: SortField; label: string }> = [
    { value: "recibidoEn", label: "Recibido" },
    { value: "numero", label: "Numero" },
    { value: "clienteNombre", label: "Cliente" },
    { value: "estado", label: "Estado" },
    { value: "total", label: "Total" },
];

export function formatOrderDate(date: string | Date) {
    return new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(date));
}

export function formatOrderTotal(total: number | string) {
    return `$${Number(total).toLocaleString("es-ES")}`;
}

export function getOrderItemsPreview(items: OrderItem[]) {
    if (items.length === 0) {
        return "Sin items";
    }

    const firstItem = items[0]?.nombreProduct ?? "Sin items";
    const remaining = items.length - 1;

    return remaining > 0 ? `${firstItem} +${remaining}` : firstItem;
}

export function getPaymentBadgeConfig(payment: OrderPaymentState) {
    return payment.isPaid
        ? {
              label: "Cobrado",
              icon: Banknote,
              className: "bg-emerald-50 text-emerald-600 border-emerald-100",
          }
        : {
              label: "Pendiente",
              icon: CreditCard,
              className: "bg-amber-50 text-amber-600 border-amber-100",
          };
}

export function getPaymentMethodLabel(order: Pick<OrderListItem, "payment">) {
    if (order.payment.isPaid) {
        return order.payment.method || "Sin metodo";
    }

    if (order.payment.preferredMethod) {
        return `Preferencia: ${order.payment.preferredMethod}`;
    }

    return "Sin preferencia";
}
