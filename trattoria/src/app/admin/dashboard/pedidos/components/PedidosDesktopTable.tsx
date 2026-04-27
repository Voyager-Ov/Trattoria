import React from "react";
import { Banknote, ChevronDown, ChevronUp, CreditCard, Eye, MapPin, Phone, ShoppingBag, User } from "lucide-react";
import { EstadoPedido } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getOrderDeliveryLabel, getOrderDisplayAddress } from "@/lib/orderDelivery";

import { STATUS_CONFIG, formatOrderDate, formatOrderTotal, type OrderItem, type OrderListItem, type SortDirection, type SortField } from "./pedido-shared";

interface PedidosDesktopTableProps {
    orders: OrderListItem[];
    isLoading: boolean;
    limit: number;
    total: number;
    totalPages: number;
    page: number;
    orderBy: SortField;
    orderDir: SortDirection;
    onSort: (field: SortField) => void;
    onPageChange: (page: number) => void;
    onViewOrder: (orderId: string) => void;
    onTogglePayment: (orderId: string, currentIsPaid: boolean) => void;
    onStatusChange: (orderId: string, status: EstadoPedido) => void;
    onClearFilters: () => void;
}

function SortIndicator({ active, direction }: { active: boolean; direction: SortDirection }) {
    if (!active) {
        return null;
    }

    return direction === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
}

export function PedidosDesktopTable({
    orders,
    isLoading,
    limit,
    total,
    totalPages,
    page,
    orderBy,
    orderDir,
    onSort,
    onPageChange,
    onViewOrder,
    onTogglePayment,
    onStatusChange,
    onClearFilters,
}: PedidosDesktopTableProps) {
    return (
        <Card className="hidden overflow-hidden rounded-[2.5rem] border-zinc-200 bg-white shadow-xl shadow-zinc-200/50 md:block">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="border-b border-zinc-100 bg-zinc-50/30">
                            <th
                                className="cursor-pointer px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:text-zinc-600"
                                onClick={() => onSort("numero")}
                            >
                                <div className="flex items-center gap-2">
                                    ID / Nro
                                    <SortIndicator active={orderBy === "numero"} direction={orderDir} />
                                </div>
                            </th>
                            <th
                                className="cursor-pointer px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:text-zinc-600"
                                onClick={() => onSort("clienteNombre")}
                            >
                                <div className="flex items-center gap-2">
                                    Cliente
                                    <SortIndicator active={orderBy === "clienteNombre"} direction={orderDir} />
                                </div>
                            </th>
                            <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                Contacto / Direccion
                            </th>
                            <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                Productos
                            </th>
                            <th
                                className="cursor-pointer px-8 py-5 text-center text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:text-zinc-600"
                                onClick={() => onSort("estado")}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    Estado / Pago
                                    <SortIndicator active={orderBy === "estado"} direction={orderDir} />
                                </div>
                            </th>
                            <th
                                className="cursor-pointer px-8 py-5 text-right text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:text-zinc-600"
                                onClick={() => onSort("total")}
                            >
                                <div className="flex items-center justify-end gap-2">
                                    Total
                                    <SortIndicator active={orderBy === "total"} direction={orderDir} />
                                </div>
                            </th>
                            <th className="w-[100px] px-8 py-5 text-center text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {isLoading && orders.length === 0 ? (
                            Array.from({ length: limit }).map((_, index) => (
                                <tr key={index} className="animate-pulse">
                                    <td colSpan={7} className="h-20 bg-zinc-50/10 px-8 py-8" />
                                </tr>
                            ))
                        ) : orders.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-24 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] border border-zinc-100 bg-zinc-50">
                                            <ShoppingBag className="h-8 w-8 text-zinc-300" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-lg font-black uppercase tracking-tight text-zinc-500">No se encontraron pedidos</p>
                                            <p className="text-sm font-medium text-zinc-400">Prueba ajustando los filtros o la busqueda.</p>
                                        </div>
                                        <Button variant="outline" onClick={onClearFilters} className="rounded-xl border-zinc-200 px-6 font-bold text-zinc-500">
                                            Limpiar filtros
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            orders.map((order: OrderListItem) => {
                                const config = STATUS_CONFIG[order.estado];
                                const StatusIcon = config.icon;
                                const isPaid = order.payment.isPaid;

                                return (
                                    <tr key={order.id} className="group transition-colors duration-200 hover:bg-zinc-50/50">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-mono text-sm font-bold tracking-tight text-zinc-900">{order.numero}</span>
                                                <span className="mt-0.5 text-[9px] font-black uppercase tracking-widest text-zinc-400">{order.origen}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="flex items-center gap-2 font-bold tracking-tight text-zinc-900">
                                                    {order.clienteNombre || order.customer?.nombre || "Venta de Mostrador"}
                                                    {order.customer && <User size={12} className="text-primary/40" />}
                                                </span>
                                                <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                                                    Recibido {formatOrderDate(order.recibidoEn)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex max-w-[200px] flex-col gap-1">
                                                {getOrderDeliveryLabel(order) && (
                                                    <Badge variant="outline" className="w-fit rounded-full text-[9px] font-black uppercase tracking-widest">
                                                        {getOrderDeliveryLabel(order)}
                                                    </Badge>
                                                )}
                                                {order.clienteTelefono && (
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                                        <Phone size={10} className="text-zinc-300" />
                                                        {order.clienteTelefono}
                                                    </div>
                                                )}
                                                {getOrderDisplayAddress(order) && (
                                                    <div className="line-clamp-1 flex items-center gap-1.5 text-[10px] font-medium text-zinc-400">
                                                        <MapPin size={10} className="shrink-0 text-zinc-300" />
                                                        {getOrderDisplayAddress(order)}
                                                    </div>
                                                )}
                                                {!order.clienteTelefono && !getOrderDeliveryLabel(order) && !getOrderDisplayAddress(order) && (
                                                    <span className="text-[10px] font-bold uppercase italic text-zinc-300">Consumo Local</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                {order.items.map((item: OrderItem) => (
                                                    <div key={item.id} className="flex min-w-[150px] items-center gap-1.5">
                                                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-[10px] font-black text-zinc-500">
                                                            {Number(item.cantidad)}
                                                        </div>
                                                        <span className="line-clamp-1 text-[11px] font-bold text-zinc-600">{item.nombreProduct}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col items-center gap-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button
                                                            className={cn(
                                                                "inline-flex items-center gap-2.5 rounded-2xl border-2 px-4 py-2 shadow-sm transition-all duration-300 hover:scale-105 active:scale-95",
                                                                config.border,
                                                                config.bg,
                                                                config.color
                                                            )}
                                                        >
                                                            <StatusIcon className="h-3.5 w-3.5" />
                                                            <span className="text-[10px] font-black uppercase tracking-[0.1em]">{config.label}</span>
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="center" className="w-[180px] rounded-2xl border-zinc-100 p-2 shadow-xl">
                                                        {Object.keys(STATUS_CONFIG).map((status) => {
                                                            const statusKey = status as EstadoPedido;
                                                            const ItemIcon = STATUS_CONFIG[statusKey].icon;

                                                            return (
                                                                <DropdownMenuItem
                                                                    key={status}
                                                                    onClick={() => onStatusChange(order.id, statusKey)}
                                                                    className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2"
                                                                >
                                                                    <ItemIcon size={14} className={STATUS_CONFIG[statusKey].color} />
                                                                    <span className="text-xs font-bold text-zinc-600">{STATUS_CONFIG[statusKey].label}</span>
                                                                </DropdownMenuItem>
                                                            );
                                                        })}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>

                                                {isPaid ? (
                                                    <Badge className="rounded-lg border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-600 shadow-none">
                                                        <div className="flex items-center gap-1">
                                                            <Banknote size={10} />
                                                            Cobrado
                                                        </div>
                                                    </Badge>
                                                ) : (
                                                    <Badge className="rounded-lg border-amber-100 bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-600 shadow-none">
                                                        <div className="flex items-center gap-1">
                                                            <CreditCard size={10} />
                                                            Pendiente
                                                        </div>
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-lg font-black tracking-tighter text-zinc-900 tabular-nums">{formatOrderTotal(order.total)}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onViewOrder(order.id)}
                                                    className="h-9 gap-2 rounded-xl border border-transparent px-3 text-zinc-400 transition-all active:scale-95 hover:border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900"
                                                    title="Ver Detalles"
                                                >
                                                    <Eye size={14} />
                                                    <span className="hidden text-[10px] font-black uppercase tracking-widest lg:inline">Detalles</span>
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={isPaid}
                                                    onClick={() => onTogglePayment(order.id, isPaid)}
                                                    className={cn(
                                                        "h-9 rounded-xl px-4 text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all active:scale-95",
                                                        isPaid
                                                            ? "cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-300"
                                                            : "border-emerald-100 bg-emerald-50 text-emerald-600 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white"
                                                    )}
                                                >
                                                    {isPaid ? "Cobrado" : "Cobrar"}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {!isLoading && total > 0 && (
                <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 px-8 py-6">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                        Mostrando {orders.length} de {total} pedidos
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => onPageChange(Math.max(1, page - 1))}
                            className="h-9 rounded-xl border-zinc-200 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 transition-all hover:bg-zinc-900 hover:text-white disabled:opacity-30"
                        >
                            Anterior
                        </Button>
                        <div className="flex items-center gap-1 px-2">
                            {Array.from({ length: totalPages }, (_, index) => index + 1).map((paginationPage) => (
                                <button
                                    key={paginationPage}
                                    onClick={() => onPageChange(paginationPage)}
                                    className={cn(
                                        "h-8 w-8 rounded-lg text-[10px] font-black transition-all",
                                        page === paginationPage
                                            ? "scale-110 bg-zinc-900 text-white shadow-lg shadow-zinc-200"
                                            : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                                    )}
                                >
                                    {paginationPage}
                                </button>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === totalPages}
                            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                            className="h-9 rounded-xl border-zinc-200 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 transition-all hover:bg-zinc-900 hover:text-white disabled:opacity-30"
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
}
