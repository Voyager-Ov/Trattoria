"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Clock,
    CheckCircle2,
    ChefHat,
    XCircle,
    Search,
    Eye,
    ShoppingBag,
    User,
    RefreshCw,
    Banknote,
    CreditCard,
    ChevronUp,
    ChevronDown,
    MapPin,
    Phone,
    Plus,
    type LucideIcon
} from "lucide-react";
import Link from "next/link";
import {
    RadioGroup,
    RadioGroupItem
} from "@/components/ui/radio-group";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { updateOrderStatus, toggleOrderPayment } from "@/app/admin/dashboard/pedidos/actions";
import { toast } from "sonner";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { EstadoPedido } from "@prisma/client";
import { getConfigs } from "@/app/actions/configActions";
import { DEFAULT_PAYMENT_METHODS } from "@/lib/configDefaults";

interface OrderItem {
    id: string;
    nombreProduct: string;
    cantidad: number;
    precioUnitario: number | string;
    subtotal: number | string;
}

interface Order {
    id: string;
    numero: string;
    origen: string;
    clienteNombre: string | null;
    clienteTelefono: string | null;
    clienteDireccion: string | null;
    recibidoEn: string;
    estado: EstadoPedido;
    cobrado: boolean;
    total: number | string;
    items: OrderItem[];
    customer?: {
        nombre: string;
    } | null;
}

// Native formatter for local dates
const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
};

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: LucideIcon, border: string, bg: string, variant: string }> = {
    RECIBIDO: {
        label: "Recibido (Web)",
        color: "text-blue-600",
        border: "border-blue-100",
        bg: "bg-blue-50/50",
        icon: ShoppingBag,
        variant: "info"
    },
    PENDIENTE: {
        label: "Pendiente (Caja)",
        color: "text-amber-600",
        border: "border-amber-100",
        bg: "bg-amber-50/50",
        icon: Clock,
        variant: "warning"
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

export default function EmpleadoPedidosPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
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

    // Cancellation Sheet State
    const [isCancelSheetOpen, setIsCancelSheetOpen] = useState(false);
    const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
    const [cancelMotive, setCancelMotive] = useState("");
    const [isCancelling, setIsCancelling] = useState(false);

    // Payment Sheet State
    const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
    const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
    const [isSavingPayment, setIsSavingPayment] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

    const fetchOrders = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const queryParams = new URLSearchParams({
                status: statusFilter,
                search: searchQuery,
                page: page.toString(),
                limit: limit.toString(),
                orderBy,
                orderDir,
            });
            // We use the same API as admin, as middleware allows it for EMPLEADO based on roleAccess logic
            // AND the API route itself doesn't check for admin specifically, it just fetches data.
            const res = await fetch(`/api/admin/dashboard/pedidos?${queryParams}`);
            const data = await res.json();
            if (data.orders) {
                setOrders(data.orders);
                setTotalPages(data.totalPages);
                setTotal(data.total);
            }
        } catch {
            toast.error("Error al cargar pedidos");
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [statusFilter, searchQuery, page, limit, orderBy, orderDir]);

    useEffect(() => {
        const loadConfigs = async () => {
            const res = await getConfigs(["payments.methods"]);
            let methods = DEFAULT_PAYMENT_METHODS;

            if (res.success && res.data && res.data["payments.methods"]) {
                const dbMethods = res.data["payments.methods"] as any[];
                if (dbMethods.length > 0) {
                    methods = dbMethods;
                }
            }

            const activeMethods = methods.filter(m => m.enabled);
            setPaymentMethods(activeMethods);

            if (activeMethods.length > 0 && !activeMethods.find(m => m.id === "EFECTIVO")) {
                setPaymentMethod(activeMethods[0].id);
            }
        };
        loadConfigs();
        fetchOrders();
        const interval = setInterval(() => fetchOrders(true), 15000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const handleStatusUpdate = async (id: string, newStatus: EstadoPedido) => {
        if (newStatus === 'CANCELADO') {
            setCancellingOrderId(id);
            setCancelMotive("");
            setIsCancelSheetOpen(true);
            return;
        }

        const result = await updateOrderStatus(id, newStatus);
        if (result.success) {
            toast.success("Estado actualizado");
            fetchOrders(true);
        } else {
            toast.error(result.error || "Error al actualizar");
        }
    };

    const handleConfirmCancel = async () => {
        if (!cancellingOrderId || !cancelMotive.trim()) {
            toast.error("Debes ingresar un motivo");
            return;
        }

        setIsCancelling(true);
        const result = await updateOrderStatus(cancellingOrderId, 'CANCELADO', cancelMotive);
        if (result.success) {
            toast.success("Pedido cancelado");
            setIsCancelSheetOpen(false);
            fetchOrders();
        } else {
            toast.error(result.error || "Error al cancelar");
        }
        setIsCancelling(false);
    };

    const handleTogglePayment = async (id: string, currentCobrado: boolean) => {
        if (!currentCobrado) {
            setPaymentOrderId(id);
            setPaymentMethod("EFECTIVO");
            setIsPaymentSheetOpen(true);
            return;
        }

        const result = await toggleOrderPayment(id, false);
        if (result.success) {
            toast.success("Marcado como pendiente");
            fetchOrders();
        } else {
            toast.error(result.error || "Error al actualizar pago");
        }
    };

    const handleConfirmPayment = async () => {
        if (!paymentOrderId) return;

        setIsSavingPayment(true);
        const result = await toggleOrderPayment(paymentOrderId, true, paymentMethod);
        if (result.success) {
            toast.success("Pedido cobrado");
            setIsPaymentSheetOpen(false);
            fetchOrders();
        } else {
            toast.error(result.error || "Error al registrar pago");
        }
        setIsSavingPayment(false);
    };

    const handleSort = (field: string) => {
        if (orderBy === field) {
            setOrderDir(orderDir === 'asc' ? 'desc' : 'asc');
        } else {
            setOrderBy(field);
            setOrderDir('desc');
        }
        setPage(1);
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

                    <Link href="/empleado/pedidos/nuevo">
                        <Button className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-[1.2rem] px-6 h-12 gap-2 shadow-lg shadow-zinc-200 transition-all active:scale-95">
                            <Plus size={18} />
                            <span className="font-bold tracking-tight">Nuevo Pedido</span>
                        </Button>
                    </Link>
                </div>

                {/* Filters Row */}
                <div className="mt-8 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-[1.5rem] border border-zinc-200 shadow-sm">
                        {["TODOS", "RECIBIDO", "PENDIENTE", "EN_PREPARACION", "LISTO", "FINALIZADO"].map((s) => (
                            <button
                                key={s}
                                onClick={() => { setStatusFilter(s); setPage(1); }}
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
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
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
                                    <th className="px-8 py-5 text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] text-center w-[120px]">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                                {isLoading && orders.length === 0 ? (
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
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => {
                                        const config = STATUS_CONFIG[order.estado];
                                        const Icon = config.icon;

                                        return (
                                            <tr
                                                key={order.id}
                                                className="group hover:bg-zinc-50/50 transition-colors duration-200 animate-in fade-in slide-in-from-top-1 duration-500"
                                            >
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
                                                            {new Date().getTime() - new Date(order.recibidoEn).getTime() < 60000 && (
                                                                <span className="ml-2 inline-flex items-center gap-1 bg-emerald-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                                                                    NUEVO
                                                                </span>
                                                            )}
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
                                                        {order.items.map((item: OrderItem) => (
                                                            <div key={item.id} className="flex items-center gap-1.5 min-w-[150px]">
                                                                <div className="h-5 w-5 rounded-md bg-zinc-100 flex items-center justify-center text-[10px] font-black text-zinc-500 shrink-0">
                                                                    {Number(item.cantidad)}
                                                                </div>
                                                                <span className="text-[11px] font-bold text-zinc-600 line-clamp-1">
                                                                    {item.nombreProduct}
                                                                </span>
                                                            </div>
                                                        ))}
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
                                                                        onClick={() => handleStatusUpdate(order.id, status as EstadoPedido)}
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
                                                    <div className="flex items-center justify-center gap-2">
                                                        {/* Single "Cobrar" Button outside menu */}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={order.cobrado}
                                                            onClick={() => handleTogglePayment(order.id, order.cobrado)}
                                                            className={cn(
                                                                "h-9 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-sm",
                                                                order.cobrado
                                                                    ? "bg-zinc-50 text-zinc-300 border-zinc-100 cursor-not-allowed"
                                                                    : "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white hover:border-emerald-600"
                                                            )}
                                                        >
                                                            {order.cobrado ? "Cobrado" : "Cobrar"}
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

            {/* Cancellation Sheet */}
            <Sheet open={isCancelSheetOpen} onOpenChange={setIsCancelSheetOpen}>
                <SheetContent className="sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle className="text-2xl font-black uppercase tracking-tight text-red-600">Cancelar Pedido</SheetTitle>
                        <SheetDescription className="font-medium">
                            Por favor ingresa el motivo de la cancelación. Esta acción es definitiva.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="py-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="motive" className="text-xs font-bold uppercase text-zinc-400 tracking-wider text-left block">
                                Motivo de Cancelación
                            </Label>
                            <Textarea
                                id="motive"
                                placeholder="Ej: Error en el pedido..."
                                className="min-h-[120px] rounded-2xl border-zinc-200 focus:ring-red-500"
                                value={cancelMotive}
                                onChange={(e) => setCancelMotive(e.target.value)}
                            />
                        </div>
                    </div>
                    <SheetFooter className="flex-col sm:flex-col gap-2">
                        <Button
                            onClick={handleConfirmCancel}
                            disabled={isCancelling || !cancelMotive.trim()}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-2xl w-full h-12 font-black uppercase tracking-wider shadow-lg shadow-red-100"
                        >
                            {isCancelling ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                            Confirmar Cancelación
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setIsCancelSheetOpen(false)}
                            className="rounded-2xl w-full h-12 font-bold text-zinc-400"
                        >
                            Volver
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Payment Sheet */}
            <Sheet open={isPaymentSheetOpen} onOpenChange={setIsPaymentSheetOpen}>
                <SheetContent className="sm:max-w-md p-0 overflow-hidden rounded-l-[2rem] border-none shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />
                    <div className="p-8">
                        <SheetHeader className="mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
                                    <Banknote size={24} />
                                </div>
                                <SheetTitle className="text-3xl font-black uppercase tracking-tighter text-zinc-900">Cobrar Pedido</SheetTitle>
                            </div>
                            <SheetDescription className="font-medium text-zinc-500">
                                Selecciona el método de pago utilizado para este pedido.
                            </SheetDescription>
                        </SheetHeader>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-[11px] font-black uppercase text-zinc-400 tracking-[0.2em] ml-1">
                                    Método de Pago
                                </Label>
                                {paymentMethods.length > 0 ? (
                                    <RadioGroup
                                        value={paymentMethod}
                                        onValueChange={setPaymentMethod}
                                        className="grid grid-cols-1 gap-3"
                                    >
                                        {paymentMethods.map((method) => (
                                            <div
                                                key={method.id}
                                                onClick={() => setPaymentMethod(method.id)}
                                                className={cn(
                                                    "relative flex items-center justify-between p-5 rounded-[1.5rem] border-2 transition-all duration-300 cursor-pointer group",
                                                    paymentMethod === method.id
                                                        ? "border-emerald-500 bg-emerald-50/50 shadow-lg shadow-emerald-500/10 scale-[1.02]"
                                                        : "border-zinc-100 hover:border-zinc-200 bg-white"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                                                        paymentMethod === method.id
                                                            ? "border-emerald-500 bg-white"
                                                            : "border-zinc-200 group-hover:border-zinc-300"
                                                    )}>
                                                        {paymentMethod === method.id && (
                                                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-in zoom-in duration-300" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={cn(
                                                            "font-black text-sm uppercase tracking-tight transition-colors",
                                                            paymentMethod === method.id ? "text-emerald-900" : "text-zinc-600"
                                                        )}>
                                                            {method.label}
                                                        </span>
                                                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                                                            Pago Instantáneo
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "p-2 rounded-xl transition-all duration-300",
                                                    paymentMethod === method.id ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "bg-zinc-50 text-zinc-300"
                                                )}>
                                                    <CreditCard size={16} />
                                                </div>
                                                <RadioGroupItem value={method.id} id={`modal-${method.id}`} className="sr-only" />
                                            </div>
                                        ))}
                                    </RadioGroup>
                                ) : (
                                    <div className="p-8 text-center bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-100">
                                        <p className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">No hay métodos configurados</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-12 space-y-3">
                            <Button
                                onClick={handleConfirmPayment}
                                disabled={isSavingPayment || paymentMethods.length === 0}
                                className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-[1.25rem] w-full h-14 font-black uppercase tracking-[0.1em] shadow-xl shadow-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {isSavingPayment ? (
                                    <RefreshCw className="h-5 w-5 animate-spin" />
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <CheckCircle2 size={20} />
                                        Confirmar Cobro
                                    </div>
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setIsPaymentSheetOpen(false)}
                                className="rounded-[1.25rem] w-full h-12 font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors"
                            >
                                Volver Atrás
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
