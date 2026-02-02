"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
    ShoppingBag,
    Clock,
    CheckCircle2,
    TrendingUp,
    UtensilsCrossed,
    ChevronRight,
    Calendar,
    ShoppingBasket
} from "lucide-react";
import Link from 'next/link';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ValueSkeleton } from "@/components/ui/value-skeleton";
import { getEmployeeDashboardMetrics, getRecentOrders } from "./actions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function EmpleadoPage() {
    const { userData } = useAuth();
    const [metrics, setMetrics] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [metricsRes, ordersRes] = await Promise.all([
                getEmployeeDashboardMetrics(),
                getRecentOrders()
            ]);

            if (metricsRes.success) setMetrics(metricsRes.data);
            if (ordersRes.success) setOrders(ordersRes.data);
        } catch (error) {
            toast.error("Error al cargar datos del dashboard");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="flex flex-col gap-8 p-8 bg-zinc-50 min-h-screen animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-black text-zinc-900 tracking-tight">
                        ¡Hola, {userData?.displayName?.split(' ')[0] || "Compañero"}! 👋
                    </h1>
                    <p className="text-zinc-500 mt-2 text-lg">Aquí tienes el resumen operativo de hoy.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-zinc-200 shadow-sm">
                    <div className="h-10 w-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white">
                        <Calendar size={18} />
                    </div>
                    <div className="pr-4">
                        <p className="text-[0.65rem] font-bold text-zinc-400 uppercase tracking-widest">Hoy</p>
                        <p className="font-bold text-zinc-900">{format(new Date(), "EEEE, dd 'de' MMMM", { locale: es })}</p>
                    </div>
                </div>
            </div>

            {/* Metrics Grid using Premium Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* 1. Pendientes Card */}
                <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Clock size={24} />
                        </div>
                        {metrics?.pendingCount > 0 && (
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="text-zinc-500 font-medium text-sm">Pendientes</p>
                        <h3 className="text-4xl font-black text-zinc-900 mt-1 tracking-tight">
                            {loading ? <ValueSkeleton /> : metrics?.pendingCount || 0}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-2 font-medium">Esperando preparación</p>
                    </div>
                </div>

                {/* 2. En Cocina Card */}
                <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <UtensilsCrossed size={24} />
                        </div>
                    </div>
                    <div>
                        <p className="text-zinc-500 font-medium text-sm">En Cocina</p>
                        <h3 className="text-4xl font-black text-zinc-900 mt-1 tracking-tight">
                            {loading ? <ValueSkeleton /> : metrics?.preparingCount || 0}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-2 font-medium">Siendo preparados</p>
                    </div>
                </div>

                {/* 3. Listos Card */}
                <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <CheckCircle2 size={24} />
                        </div>
                    </div>
                    <div>
                        <p className="text-zinc-500 font-medium text-sm">Listos</p>
                        <h3 className="text-4xl font-black text-zinc-900 mt-1 tracking-tight">
                            {loading ? <ValueSkeleton /> : metrics?.readyCount || 0}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-2 font-medium">Para entregar/servir</p>
                    </div>
                </div>

                {/* 4. Completados Card */}
                <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-900 shadow-xl shadow-zinc-200 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 text-white pointer-events-none">
                        <TrendingUp size={100} className="-rotate-12 translate-x-4 -translate-y-4" />
                    </div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="h-12 w-12 bg-white/10 text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-white/60 font-medium text-sm">Completados Hoy</p>
                        <h3 className="text-4xl font-black text-white mt-1 tracking-tight">
                            {loading ? <ValueSkeleton className="text-white/50" /> : metrics?.completedTodayCount || 0}
                        </h3>
                        <p className="text-xs text-white/40 mt-2 font-medium">Total de la jornada</p>
                    </div>
                </div>
            </div>

            {/* Main Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">

                {/* Quick Access Grid */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="p-8 border-b border-zinc-100">
                            <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Acceso Rápido</h3>
                            <p className="text-zinc-400 text-sm mt-1">Herramientas principales de tu turno</p>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50/50 flex-grow">
                            <Link href="/empleado/pedidos" className="group">
                                <div className="h-full bg-white border border-zinc-200 p-6 rounded-[2rem] hover:border-zinc-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between min-h-[160px]">
                                    <div className="h-12 w-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white transition-colors duration-300">
                                        <ShoppingBag size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-zinc-900 text-lg">Gestionar Pedidos</h4>
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-zinc-400 text-sm">Ver Kanban y estados</p>
                                            <div className="h-8 w-8 rounded-full bg-zinc-50 flex items-center justify-center -mr-2 group-hover:bg-zinc-100 transition-colors">
                                                <ChevronRight size={16} className="text-zinc-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <Link href="/catalogo" className="group">
                                <div className="h-full bg-white border border-zinc-200 p-6 rounded-[2rem] hover:border-zinc-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between min-h-[160px]">
                                    <div className="h-12 w-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                                        <UtensilsCrossed size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-zinc-900 text-lg">Nuevo Pedido</h4>
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-zinc-400 text-sm">Ir al catálogo digital</p>
                                            <div className="h-8 w-8 rounded-full bg-zinc-50 flex items-center justify-center -mr-2 group-hover:bg-zinc-100 transition-colors">
                                                <ChevronRight size={16} className="text-zinc-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Active Orders List */}
                <div className="lg:col-span-5">
                    <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Cola de Pedidos</h3>
                                <p className="text-zinc-400 text-sm mt-1">Próximos a salir</p>
                            </div>
                            <Link href="/empleado/pedidos">
                                <Button variant="ghost" size="sm" className="rounded-full h-10 w-10 p-0 hover:bg-zinc-100">
                                    <ChevronRight className="h-5 w-5 text-zinc-400" />
                                </Button>
                            </Link>
                        </div>

                        <div className="p-6 space-y-4 flex-grow overflow-y-auto max-h-[500px]">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 rounded-3xl bg-zinc-50 animate-pulse">
                                        <div className="h-12 w-12 bg-zinc-100 rounded-2xl"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-zinc-100 rounded w-1/2"></div>
                                            <div className="h-3 bg-zinc-100 rounded w-1/3"></div>
                                        </div>
                                    </div>
                                ))
                            ) : orders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center px-8">
                                    <div className="h-20 w-20 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                                        <ShoppingBasket size={32} className="text-zinc-200" />
                                    </div>
                                    <h4 className="font-bold text-zinc-900">Todo tranquilo</h4>
                                    <p className="text-zinc-500 text-sm mt-1">No hay pedidos activos en cola.</p>
                                </div>
                            ) : (
                                orders.map((order) => (
                                    <div key={order.id} className="group p-4 rounded-[1.75rem] border border-transparent hover:border-zinc-100 hover:bg-zinc-50/50 transition-all duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("h-14 w-14 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-zinc-100",
                                                order.estado === 'RECIBIDO' ? "bg-zinc-900 text-white" :
                                                    order.estado === 'EN_PREPARACION' ? "bg-blue-500 text-white" :
                                                        order.estado === 'LISTO' ? "bg-emerald-500 text-white" :
                                                            "bg-zinc-100 text-zinc-400"
                                            )}>
                                                <Clock size={16} className="text-white/60 mb-1" />
                                                <span className="text-[0.65rem] font-bold">{format(new Date(order.recibidoEn), "HH:mm")}</span>
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="flex items-baseline justify-between gap-2">
                                                    <h4 className="font-bold text-zinc-900 truncate">{order.clienteNombre || "Cliente General"}</h4>
                                                    <Badge className={cn("text-[0.6rem] font-black px-2 py-0 rounded-full border-none",
                                                        order.estado === 'RECIBIDO' ? 'bg-zinc-100 text-zinc-600' :
                                                            order.estado === 'EN_PREPARACION' ? 'bg-blue-50 text-blue-600' :
                                                                order.estado === 'LISTO' ? 'bg-emerald-50 text-emerald-600' :
                                                                    'bg-zinc-100 text-zinc-400'
                                                    )}>
                                                        {order.estado}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[0.7rem] text-zinc-400 font-medium tracking-tight truncate">
                                                        {order.items?.length || 0} ítems • {order.numero}
                                                    </span>
                                                    <span className="ml-auto font-bold text-xs text-zinc-900">
                                                        {formatCurrency(Number(order.total))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
