import { Banknote, CreditCard, Eye, MapPin, Phone, ShoppingBag, XCircle } from "lucide-react";
import { EstadoPedido } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsivePanel } from "@/components/ui/responsive-panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getOrderDeliveryLabel, getOrderDisplayAddress } from "@/lib/orderDelivery";

import { STATUS_CONFIG, formatOrderDate, formatOrderTotal, getPaymentBadgeConfig, getPaymentMethodLabel, type OrderListItem } from "./pedido-shared";

const STATUS_CHANGE_OPTIONS: EstadoPedido[] = ["RECIBIDO", "PENDIENTE", "EN_PREPARACION", "LISTO", "FINALIZADO"];

interface PedidoDetailPanelProps {
    order: OrderListItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onViewDetail: (orderId: string) => void;
    onTogglePayment: (orderId: string, currentIsPaid: boolean) => void;
    onStatusChange: (orderId: string, status: EstadoPedido) => void;
    onCancelOrder: (orderId: string) => void;
}

export function PedidoDetailPanel({
    order,
    open,
    onOpenChange,
    onViewDetail,
    onTogglePayment,
    onStatusChange,
    onCancelOrder,
}: PedidoDetailPanelProps) {
    if (!order) {
        return null;
    }

    const statusConfig = STATUS_CONFIG[order.estado];
    const StatusIcon = statusConfig.icon;
    const paymentConfig = getPaymentBadgeConfig(order.payment);
    const PaymentIcon = paymentConfig.icon;
    const deliveryLabel = getOrderDeliveryLabel(order);
    const address = getOrderDisplayAddress(order);
    const customerName = order.clienteNombre || order.customer?.nombre || "Venta de Mostrador";

    return (
        <ResponsivePanel
            open={open}
            onOpenChange={onOpenChange}
            title={`Pedido ${order.numero}`}
            description={`Recibido ${formatOrderDate(order.recibidoEn)}`}
            mobileSide="bottom"
            desktopMode="sheet"
            desktopSide="right"
            contentClassName="sm:max-w-xl"
        >
            <div className="space-y-6">
                <section className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">{order.origen}</p>
                            <h3 className="mt-1 text-xl font-black tracking-tight text-zinc-950">{customerName}</h3>
                        </div>
                        <p className="text-xl font-black tracking-tight text-zinc-950">{formatOrderTotal(order.total)}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Badge className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] shadow-none ${statusConfig.border} ${statusConfig.bg} ${statusConfig.color}`}>
                            <StatusIcon className="mr-1 h-3.5 w-3.5" />
                            {statusConfig.label}
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
                </section>

                <section className="space-y-3 rounded-[1.5rem] border border-zinc-200 bg-white p-4">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Pago</h4>
                    <div className="space-y-2 text-sm text-zinc-600">
                        <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-zinc-500">Estado</span>
                            <Badge className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] shadow-none ${paymentConfig.className}`}>
                                <PaymentIcon className="mr-1 h-3.5 w-3.5" />
                                {paymentConfig.label}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-zinc-500">Metodo</span>
                            <span className="text-right font-semibold text-zinc-800">{getPaymentMethodLabel(order)}</span>
                        </div>
                        {order.payment.paidAt ? (
                            <div className="flex items-center justify-between gap-3">
                                <span className="font-medium text-zinc-500">Cobrado en</span>
                                <span className="text-right font-semibold text-zinc-800">{formatOrderDate(order.payment.paidAt)}</span>
                            </div>
                        ) : null}
                    </div>
                </section>

                <section className="space-y-3 rounded-[1.5rem] border border-zinc-200 bg-white p-4">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Cliente y entrega</h4>
                    <div className="space-y-2 text-sm text-zinc-600">
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-zinc-300" />
                            <span>{customerName}</span>
                        </div>
                        {order.clienteTelefono && (
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-zinc-300" />
                                <span>{order.clienteTelefono}</span>
                            </div>
                        )}
                        {address && (
                            <div className="flex items-start gap-2">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300" />
                                <span>{address}</span>
                            </div>
                        )}
                        {!order.clienteTelefono && !address && <p className="text-sm text-zinc-500">Consumo local / mostrador.</p>}
                    </div>
                </section>

                <section className="space-y-3 rounded-[1.5rem] border border-zinc-200 bg-white p-4">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Items del pedido</h4>
                    <div className="space-y-2">
                        {order.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-50 px-3 py-3">
                                <div className="min-w-0">
                                    <p className="truncate font-semibold text-zinc-800">{item.nombreProduct}</p>
                                    <p className="text-xs text-zinc-400">{Number(item.cantidad)} unidad(es)</p>
                                </div>
                                <Badge variant="outline" className="rounded-full border-zinc-200 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                    x{Number(item.cantidad)}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </section>

                {order.estado !== "CANCELADO" && (
                    <section className="space-y-3 rounded-[1.5rem] border border-zinc-200 bg-white p-4">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Cambiar estado</h4>
                        <Select
                            value={order.estado}
                            onValueChange={(value) => {
                                if (value !== order.estado) {
                                    onStatusChange(order.id, value as EstadoPedido);
                                }
                            }}
                        >
                            <SelectTrigger className="h-12 rounded-2xl border-zinc-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_CHANGE_OPTIONS.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {STATUS_CONFIG[status].label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </section>
                )}

                <section className="space-y-3">
                    <Button
                        type="button"
                        onClick={() => onViewDetail(order.id)}
                        className="h-12 w-full rounded-2xl bg-zinc-900 font-bold text-white hover:bg-zinc-800"
                    >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalle completo
                    </Button>

                    <Button
                        type="button"
                        variant={order.payment.isPaid ? "outline" : "default"}
                        disabled={order.payment.isPaid}
                        onClick={() => onTogglePayment(order.id, order.payment.isPaid)}
                        className={
                            order.payment.isPaid
                                ? "h-12 w-full rounded-2xl border-zinc-200 text-zinc-400"
                                : "h-12 w-full rounded-2xl bg-emerald-600 font-bold text-white hover:bg-emerald-700"
                        }
                    >
                        {order.payment.isPaid ? (
                            <>
                                <Banknote className="mr-2 h-4 w-4" />
                                Pedido cobrado
                            </>
                        ) : (
                            <>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Cobrar pedido
                            </>
                        )}
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        disabled={order.estado === "CANCELADO"}
                        onClick={() => onCancelOrder(order.id)}
                        className="h-12 w-full rounded-2xl border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancelar pedido
                    </Button>
                </section>
            </div>
        </ResponsivePanel>
    );
}
