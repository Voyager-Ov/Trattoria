import { EstadoPedido } from "@prisma/client";
import {
    CheckCircle2,
    ChefHat,
    Clock,
    ShoppingBag,
    XCircle,
    type LucideIcon,
} from "lucide-react";
import { formatSystemDateTime } from "@/lib/system-time";

export interface OrderItem {
    id: string;
    nombreProduct: string;
    cantidad: number;
    precioUnitario: number | string;
    subtotal: number | string;
    configSnapshot?: any;
}

export interface Order {
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
    total: number | string;
    items: OrderItem[];
    customer?: {
        nombre: string;
    } | null;
}

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
        label: "Recibido",
        shortLabel: "Recibido",
        color: "text-blue-600",
        border: "border-blue-100",
        bg: "bg-blue-50/50",
        icon: ShoppingBag,
    },
    PENDIENTE: {
        label: "Pendiente",
        shortLabel: "Pendiente",
        color: "text-amber-600",
        border: "border-amber-100",
        bg: "bg-amber-50/50",
        icon: Clock,
    },
    EN_PREPARACION: {
        label: "En cocina",
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
    return formatSystemDateTime(date, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

export function formatOrderTotal(total: number | string) {
    return `$${Number(total).toLocaleString("es-AR")}`;
}

export function getOrderItemsPreview(items: OrderItem[]) {
    if (items.length === 0) {
        return "Sin items";
    }

    const firstItem = items[0]?.nombreProduct ?? "Sin items";
    const remaining = items.length - 1;

    return remaining > 0 ? `${firstItem} +${remaining}` : firstItem;
}
