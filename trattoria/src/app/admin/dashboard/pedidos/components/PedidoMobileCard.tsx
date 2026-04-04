import { ChevronRight, MapPin, Phone, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getOrderDeliveryLabel, getOrderDisplayAddress } from "@/lib/orderDelivery";

import {
    STATUS_CONFIG,
    formatOrderDate,
    formatOrderTotal,
    getOrderItemsPreview,
    getPaymentBadgeConfig,
    type Order,
} from "./pedido-shared";

interface PedidoMobileCardProps {
    order: Order;
    onOpen: (orderId: string) => void;
}

export function PedidoMobileCard({ order, onOpen }: PedidoMobileCardProps) {
    const statusConfig = STATUS_CONFIG[order.estado];
    const StatusIcon = statusConfig.icon;
    const paymentConfig = getPaymentBadgeConfig(order.cobrado);
    const PaymentIcon = paymentConfig.icon;
    const deliveryLabel = getOrderDeliveryLabel(order);
    const address = getOrderDisplayAddress(order);
    const customerName = order.clienteNombre || order.customer?.nombre || "Venta de Mostrador";

    return (
        <button
            type="button"
            onClick={() => onOpen(order.id)}
            className="w-full rounded-[1.75rem] border border-zinc-200 bg-white p-4 text-left shadow-sm transition-all duration-200 active:scale-[0.99]"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black uppercase tracking-[0.18em] text-zinc-400">{order.numero}</span>
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                            {order.origen}
                        </span>
                    </div>
                    <h3 className="mt-2 truncate text-base font-black tracking-tight text-zinc-950">{customerName}</h3>
                    <p className="mt-1 text-xs font-medium text-zinc-400">Recibido {formatOrderDate(order.recibidoEn)}</p>
                </div>

                <div className="shrink-0 text-right">
                    <p className="text-lg font-black tracking-tight text-zinc-950">{formatOrderTotal(order.total)}</p>
                    <div className="mt-2 flex items-center justify-end gap-1 text-zinc-400">
                        <ChevronRight className="h-4 w-4" />
                    </div>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] shadow-none ${statusConfig.border} ${statusConfig.bg} ${statusConfig.color}`}>
                    <StatusIcon className="mr-1 h-3.5 w-3.5" />
                    {statusConfig.shortLabel}
                </Badge>
                <Badge className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] shadow-none ${paymentConfig.className}`}>
                    <PaymentIcon className="mr-1 h-3.5 w-3.5" />
                    {paymentConfig.label}
                </Badge>
                {deliveryLabel && (
                    <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]">
                        {deliveryLabel}
                    </Badge>
                )}
            </div>

            <div className="mt-4 space-y-2 text-sm text-zinc-500">
                <p className="truncate font-semibold text-zinc-600">{getOrderItemsPreview(order.items)}</p>
                {order.clienteTelefono && (
                    <div className="flex items-center gap-2 text-xs">
                        <Phone className="h-3.5 w-3.5 text-zinc-300" />
                        <span className="truncate">{order.clienteTelefono}</span>
                    </div>
                )}
                {address ? (
                    <div className="flex items-center gap-2 text-xs">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-300" />
                        <span className="truncate">{address}</span>
                    </div>
                ) : !order.clienteTelefono ? (
                    <div className="flex items-center gap-2 text-xs">
                        <User className="h-3.5 w-3.5 text-zinc-300" />
                        <span className="truncate">Consumo local</span>
                    </div>
                ) : null}
            </div>
        </button>
    );
}
