"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Clock,
    CheckCircle2,
    ChefHat,
    XCircle,
    Search,
    Filter,
    MoreVertical,
    Eye,
    Calendar,
    ShoppingBag,
    User,
    ArrowRight,
    Plus,
    RefreshCw,
    AlertCircle,
    Banknote,
    CreditCard,
    ChevronUp,
    ChevronDown,
    MapPin,
    Phone,
    Package
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { updateOrderStatus, toggleOrderPayment } from "./actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Native formatter for local dates
const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
};

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any, border: string, bg: string, variant: string }> = {
    RECIBIDO: {
        label: "Recibido",
        color: "text-blue-600",
        border: "border-blue-100",
        bg: "bg-blue-50/50",
        icon: Clock,
        variant: "info"
    },
    EN_PREPARACION: {
        label: "Cocina",
        color: "text-orange-600",
        border: "border-orange-100",
        bg: "bg-orange-50/50",
        icon: ChefHat,
        variant: "warning"
    },
    LISTO: {
        label: "Listo",
        color: "text-emerald-600",
        border: "border-emerald-100",
        bg: "bg-emerald-50/50",
        icon: CheckCircle2,
        variant: "success"
    },
    FINALIZADO: {
        label: "Finalizado",
        color: "text-zinc-500",
        border: "border-zinc-200",
        bg: "bg-zinc-100/50",
        icon: CheckCircle2,
        variant: "zinc"
    },
    CANCELADO: {
        label: "Cancelado",
        color: "text-red-600",
        border: "border-red-100",
        bg: "bg-red-50/50",
        icon: XCircle,
        variant: "destructive"
    },
};

export default function PedidosPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("TODOS");

    // Pagination state
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Sorting state
    const [orderBy, setOrderBy] = useState("recibidoEn");
    const [orderDir, setOrderDir] = useState<'asc' | 'desc'>("desc");

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== "TODOS") params.append("status", statusFilter);
            if (searchQuery) params.append("search", searchQuery);
            params.append("page", page.toString());
            params.append("limit", limit.toString());
            params.append("orderBy", orderBy);
            params.append("orderDir", orderDir);

            const res = await fetch(`/api/admin/dashboard/pedidos?${params.toString()}`);
            if (!res.ok) throw new Error("Error al obtener pedidos");

            const data = await res.json();
            setOrders(data.orders);
            setTotal(data.total);
            setTotalPages(data.totalPages);
        } catch (err) {
            setError("No se pudieron cargar los pedidos. Intenta de nuevo.");
            toast.error("Error de conexión");
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter, searchQuery, page, limit, orderBy, orderDir]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleStatusUpdate = async (id: string, newStatus: any) => {
        const result = await updateOrderStatus(id, newStatus);
        if (result.success) {
            toast.success("Estado actualizado");
            fetchOrders();
        } else {
            toast.error(result.error || "Error al actualizar");
        }
    };

    const handleTogglePayment = async (id: string, currentCobrado: boolean) => {
        const result = await toggleOrderPayment(id, !currentCobrado);
        if (result.success) {
            toast.success(currentCobrado ? "Marcado como pendiente" : "Pedido cobrado");
            fetchOrders();
        } else {
            toast.error(result.error || "Error al actualizar pago");
        }
    };

    const handleSort = (field: string) => {
        if (orderBy === field) {
            setOrderDir(orderDir === 'asc' ? 'desc' : 'asc');
        } else {
            setOrderBy(field);
            setOrderDir('desc');
        }
        setPage(1); // Reset to first page on sort
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header Section */}
            <div className="px-8 pt-8 pb-4 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                                <ShoppingBag size={20} />
                            </div>
                            <h2 className="text-3xl font-black tracking-tighter text-zinc-900 uppercase">Gestión de Pedidos</h2>
                        </div>
                        <p className="text-zinc-500 font-medium ml-12">Monitorea y despacha las órdenes en tiempo real.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => router.push("/admin/dashboard/pedidos/nuevo")}
                            className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-2xl px-6 h-12 font-bold shadow-lg shadow-zinc-200 transition-all active:scale-95"
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            Nuevo Pedido
                        </Button>
                    </div>
                </div>

                {/* Filters Row - Refactored for Stability and Premium Look */}
                <div className="mt-8 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-[1.5rem] border border-zinc-200 shadow-sm">
                        {["TODOS", "RECIBIDO", "EN_PREPARACION", "LISTO", "FINALIZADO"].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={cn(
                                    "px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 uppercase tracking-wider",
                                    statusFilter === s
                                        ? "bg-zinc-900 text-white shadow-md shadow-zinc-200 scale-[1.02]"
                                        : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"
                                )}
                            >
                                {s === "TODOS" ? "Todos" : STATUS_CONFIG[s].label}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-[350px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 h-4 w-4" />
                        <Input
                            placeholder="Buscar por # de orden o cliente..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 h-12 bg-white border-zinc-200 rounded-2xl focus:ring-zinc-900 shadow-sm font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Areas */}
            <div className="px-8 pb-12 flex-1">
                <Card className="rounded-[2.5rem] border-zinc-200 shadow-xl shadow-zinc-200/50 overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-100 bg-zinc-50/30">
                                    <th
                                        className="px-8 py-5 text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] cursor-pointer hover:text-zinc-600 transition-colors"
                                        onClick={() => handleSort('numero')}
                                    >
                                        <div className="flex items-center gap-2">
                                            ID / Nro
                                            {orderBy === 'numero' && (orderDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                                        </div>
                                    </th>
                                    <th
                                        className="px-8 py-5 text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] cursor-pointer hover:text-zinc-600 transition-colors"
                                        onClick={() => handleSort('clienteNombre')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Cliente
                                            {orderBy === 'clienteNombre' && (orderDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                                        </div>
                                    </th>
                                    <th className="px-8 py-5 text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                                        Contacto / Dirección
                                    </th>
                                    <th className="px-8 py-5 text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                                        Productos
                                    </th>
                                    <th
                                        className="px-8 py-5 text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] cursor-pointer hover:text-zinc-600 transition-colors text-center"
                                        onClick={() => handleSort('estado')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Estado / Pago
                                            {orderBy === 'estado' && (orderDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                                        </div>
                                    </th>
                                    <th
                                        className="px-8 py-5 text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] cursor-pointer hover:text-zinc-600 transition-colors text-right"
                                        onClick={() => handleSort('total')}
                                    >
                                        <div className="flex items-center justify-end gap-2">
                                            Total
                                            {orderBy === 'total' && (orderDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                                        </div>
                                    </th>
                                    <th className="px-8 py-5 text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] text-center w-[100px]">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                                {isLoading ? (
                                    Array(limit).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={7} className="px-8 py-8 h-20 bg-zinc-50/10" />
                                        </tr>
                                    ))
                                ) : orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="h-20 w-20 bg-zinc-50 rounded-[2rem] flex items-center justify-center border border-zinc-100">
                                                    <ShoppingBag className="h-8 w-8 text-zinc-300" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-zinc-500 font-black text-lg uppercase tracking-tight">No se encontraron pedidos</p>
                                                    <p className="text-sm text-zinc-400 font-medium">Prueba ajustando los filtros o la búsqueda.</p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => { setStatusFilter("TODOS"); setSearchQuery(""); setPage(1); }}
                                                    className="rounded-xl border-zinc-200 text-zinc-500 font-bold px-6"
                                                >
                                                    Limpiar filtros
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => {
                                        const config = STATUS_CONFIG[order.estado];
                                        const Icon = config.icon;

                                        return (
                                            <tr key={order.id} className="group hover:bg-zinc-50/50 transition-colors duration-200">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-2xl bg-zinc-900 flex items-center justify-center text-white font-black text-[10px] shadow-lg shadow-zinc-200">
                                                            {order.numero.split('-')[1]}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-mono text-xs font-bold text-zinc-400 tracking-tighter">
                                                                {order.numero}
                                                            </span>
                                                            <span className="text-[9px] text-zinc-300 font-black uppercase tracking-widest">
                                                                {order.origen}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                                                            {order.clienteNombre || order.customer?.nombre || "Venta de Mostrador"}
                                                            {order.customer && <User size={12} className="text-primary/40" />}
                                                        </span>
                                                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">
                                                            Recibido {formatDate(order.recibidoEn)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1 max-w-[200px]">
                                                        {order.clienteTelefono && (
                                                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                                                <Phone size={10} className="text-zinc-300" />
                                                                {order.clienteTelefono}
                                                            </div>
                                                        )}
                                                        {order.clienteDireccion && (
                                                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium line-clamp-1">
                                                                <MapPin size={10} className="text-zinc-300 shrink-0" />
                                                                {order.clienteDireccion}
                                                            </div>
                                                        )}
                                                        {!order.clienteTelefono && !order.clienteDireccion && (
                                                            <span className="text-[10px] text-zinc-300 font-bold uppercase italic">Consumo Local</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <Package size={14} className="text-zinc-300" />
                                                            <span className="text-xs font-bold text-zinc-600">
                                                                {order.items.length} {order.items.length === 1 ? 'Producto' : 'Productos'}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-zinc-400 font-medium line-clamp-1 max-w-[150px]">
                                                            {order.items.map((item: any) => `${item.cantidad}x ${item.nombreProduct}`).join(', ')}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button className={cn(
                                                                    "inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl border-2 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm capitalize",
                                                                    config.border, config.bg, config.color
                                                                )}>
                                                                    <Icon className="h-3.5 w-3.5" />
                                                                    <span className="text-[10px] font-black uppercase tracking-[0.1em]">
                                                                        {config.label}
                                                                    </span>
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="center" className="w-[180px] p-2 rounded-2xl border-zinc-100 shadow-xl">
                                                                {Object.keys(STATUS_CONFIG).map((status) => (
                                                                    <DropdownMenuItem
                                                                        key={status}
                                                                        onClick={() => handleStatusUpdate(order.id, status)}
                                                                        className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer"
                                                                    >
                                                                        {React.createElement(STATUS_CONFIG[status].icon, { size: 14, className: STATUS_CONFIG[status].color })}
                                                                        <span className="text-xs font-bold text-zinc-600">{STATUS_CONFIG[status].label}</span>
                                                                    </DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>

                                                        {order.cobrado ? (
                                                            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-widest px-2 py-0.5 shadow-none">
                                                                <div className="flex items-center gap-1">
                                                                    <Banknote size={10} />
                                                                    Cobrado
                                                                </div>
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-amber-50 text-amber-600 border-amber-100 rounded-lg text-[9px] font-black uppercase tracking-widest px-2 py-0.5 shadow-none">
                                                                <div className="flex items-center gap-1">
                                                                    <CreditCard size={10} />
                                                                    Pendiente
                                                                </div>
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className="text-lg font-black text-zinc-900 tabular-nums tracking-tighter">
                                                        ${Number(order.total).toLocaleString('es-ES')}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center justify-center">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-10 w-10 p-0 rounded-2xl hover:bg-white hover:border border-zinc-100 shadow-sm transition-all duration-200 group-hover:bg-white">
                                                                    <MoreVertical className="h-4 w-4 text-zinc-400" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-[220px] p-2 rounded-3xl border-zinc-100 shadow-2xl">
                                                                <DropdownMenuLabel className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Acciones</DropdownMenuLabel>
                                                                <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer group">
                                                                    <div className="h-8 w-8 rounded-xl bg-zinc-50 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                                                                        <Eye size={16} />
                                                                    </div>
                                                                    <span className="font-bold text-zinc-600 group-hover:text-zinc-900">Ver Detalles</span>
                                                                </DropdownMenuItem>

                                                                <DropdownMenuItem
                                                                    className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer group"
                                                                    onClick={() => handleTogglePayment(order.id, order.cobrado)}
                                                                >
                                                                    <div className={cn(
                                                                        "h-8 w-8 rounded-xl flex items-center justify-center transition-colors",
                                                                        order.cobrado ? "bg-amber-50 text-amber-500 group-hover:bg-amber-500 group-hover:text-white" : "bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white"
                                                                    )}>
                                                                        <Banknote size={16} />
                                                                    </div>
                                                                    <span className="font-bold text-zinc-600 group-hover:text-zinc-900">
                                                                        {order.cobrado ? "Marcar como Pendiente" : "Marcar como Cobrado"}
                                                                    </span>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {!isLoading && total > 0 && (
                        <div className="px-8 py-6 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between">
                            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                                Mostrando {orders.length} de {total} pedidos
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className="rounded-xl border-zinc-200 text-zinc-500 font-black h-9 px-4 uppercase text-[10px] tracking-widest hover:bg-zinc-900 hover:text-white transition-all disabled:opacity-30"
                                >
                                    Anterior
                                </Button>
                                <div className="flex items-center gap-1 px-2">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={cn(
                                                "h-8 w-8 rounded-lg text-[10px] font-black transition-all",
                                                page === p
                                                    ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200 scale-110"
                                                    : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    className="rounded-xl border-zinc-200 text-zinc-500 font-black h-9 px-4 uppercase text-[10px] tracking-widest hover:bg-zinc-900 hover:text-white transition-all disabled:opacity-30"
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
