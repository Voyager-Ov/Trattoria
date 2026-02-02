"use client";

import { useEffect, useState, useCallback } from "react";
import {
    DollarSign,
    ShoppingBag,
    Users,
    TrendingUp,
    Calendar,
    ArrowUpRight,
    Clock,
    ChevronRight,
    ShoppingBasket
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DashboardMetricCard } from "./components/DashboardMetricCard";
import { getDashboardMetrics, getRecentActivity } from "./actions";
import Link from "next/link";

interface DashboardMetrics {
    totalSales: number;
    salesToday: number;
    salesGrowth: string;
    totalOrdersToday: number;
    pendingOrders: number;
    activeCustomers: number;
    goalProgress: number;
}

interface RecentActivityItem {
    id: string;
    numero: string;
    clienteNombre: string | null;
    total: number;
    estado: string;
    recibidoEn: string;
    items: {
        nombreProduct: string;
        cantidad: number;
    }[];
}

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [activity, setActivity] = useState<RecentActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [metricsRes, activityRes] = await Promise.all([
                getDashboardMetrics(),
                getRecentActivity()
            ]);

            if (metricsRes.success) setMetrics(metricsRes.data as DashboardMetrics);
            if (activityRes.success) setActivity(activityRes.data as RecentActivityItem[]);
        } catch (error) {
            console.error("Dashboard load error:", error);
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
                    <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Panel de Control</h1>
                    <p className="text-zinc-500 mt-2 text-lg">Resumen operativo y financiero de hoy.</p>
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

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardMetricCard
                    title="Ventas de Hoy"
                    value={loading ? "..." : formatCurrency(metrics?.salesToday || 0)}
                    change={metrics?.salesGrowth}
                    headerColor="bg-zinc-900"
                    icon={<DollarSign size={18} />}
                />
                <DashboardMetricCard
                    title="Pedidos de Hoy"
                    value={loading ? "..." : metrics?.totalOrdersToday || 0}
                    description={`${metrics?.pendingOrders || 0} pendientes`}
                    headerColor="bg-orange-500"
                    icon={<ShoppingBag size={18} />}
                />
                <DashboardMetricCard
                    title="Clientes Activos"
                    value={loading ? "..." : metrics?.activeCustomers || 0}
                    headerColor="bg-indigo-600"
                    icon={<Users size={18} />}
                />
                <DashboardMetricCard
                    isPrimary
                    title="Meta Mensual"
                    value={loading ? "..." : `${metrics?.goalProgress || 0}%`}
                    description="Progreso del mes"
                    headerColor="bg-emerald-600"
                    icon={<TrendingUp size={18} />}
                />
            </div>

            {/* Main Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">

                {/* Visual Chart Placeholder / Revenue Summary */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Rendimiento Semanal</h3>
                                <p className="text-zinc-400 text-sm mt-1">Comparativa de ingresos diarios</p>
                            </div>
                            <Button variant="outline" className="rounded-full border-zinc-200 text-zinc-600 text-xs font-bold uppercase tracking-widest">
                                Ver Reporte Completo
                            </Button>
                        </div>
                        <div className="p-8 flex-grow flex flex-col items-center justify-center bg-zinc-50/50">
                            <div className="h-64 w-full flex items-end justify-between px-4 gap-4">
                                {[40, 65, 45, 90, 55, 75, 85].map((height, i) => (
                                    <div key={i} className="flex flex-col items-center gap-3 flex-1 group">
                                        <div
                                            className="w-full bg-zinc-200 rounded-2xl group-hover:bg-zinc-900 transition-all duration-500 relative"
                                            style={{ height: `${height}%` }}
                                        >
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[0.65rem] font-bold py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                {height}k
                                            </div>
                                        </div>
                                        <span className="text-[0.65rem] font-bold text-zinc-400 uppercase tracking-widest">
                                            {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'][i]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-8 bg-zinc-900 text-white flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                    <ArrowUpRight className="text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-white font-bold text-lg">Ventas Totales Históricas</p>
                                    <p className="text-white/50 text-xs uppercase tracking-widest font-medium">Desde el inicio del sistema</p>
                                </div>
                            </div>
                            <div className="text-3xl font-black">{loading ? "..." : formatCurrency(metrics?.totalSales || 0)}</div>
                        </div>
                    </div>
                </div>

                {/* Recent Orders Side List */}
                <div className="lg:col-span-5">
                    <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Últimos Pedidos</h3>
                                <p className="text-zinc-400 text-sm mt-1">Actividad en tiempo real</p>
                            </div>
                            <Link href="/admin/dashboard/pedidos">
                                <Button variant="ghost" size="sm" className="rounded-full h-10 w-10 p-0 hover:bg-zinc-100">
                                    <ChevronRight className="h-5 w-5 text-zinc-400" />
                                </Button>
                            </Link>
                        </div>

                        <div className="p-6 space-y-4 flex-grow overflow-y-auto max-h-[500px]">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 rounded-3xl bg-zinc-50 animate-pulse">
                                        <div className="h-12 w-12 bg-zinc-100 rounded-2xl"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-zinc-100 rounded w-1/2"></div>
                                            <div className="h-3 bg-zinc-100 rounded w-1/3"></div>
                                        </div>
                                    </div>
                                ))
                            ) : activity.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center px-8">
                                    <div className="h-20 w-20 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                                        <ShoppingBasket size={32} className="text-zinc-200" />
                                    </div>
                                    <h4 className="font-bold text-zinc-900">Sin pedidos recientes</h4>
                                    <p className="text-zinc-500 text-sm mt-1">Los nuevos pedidos aparecerán aquí automáticamente.</p>
                                </div>
                            ) : (
                                activity.map((order) => (
                                    <div key={order.id} className="group p-4 rounded-[1.75rem] border border-transparent hover:border-zinc-100 hover:bg-zinc-50/50 transition-all duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 rounded-2xl bg-zinc-900 text-white flex flex-col items-center justify-center shadow-lg shadow-zinc-200">
                                                <Clock size={16} className="text-white/60 mb-1" />
                                                <span className="text-[0.65rem] font-bold">{format(new Date(order.recibidoEn), "HH:mm")}</span>
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="flex items-baseline justify-between gap-2">
                                                    <h4 className="font-bold text-zinc-900 truncate">{order.clienteNombre || "Cliente General"}</h4>
                                                    <span className="font-black text-zinc-900 whitespace-nowrap">{formatCurrency(Number(order.total))}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge className={`text-[0.6rem] font-black px-2 py-0 rounded-full border-none ${order.estado === 'FINALIZADO' ? 'bg-emerald-50 text-emerald-600' :
                                                        order.estado === 'CANCELADO' ? 'bg-rose-50 text-rose-600' :
                                                            'bg-orange-50 text-orange-600'
                                                        }`}>
                                                        {order.estado}
                                                    </Badge>
                                                    <span className="text-[0.7rem] text-zinc-400 font-medium tracking-tight truncate">
                                                        {order.items?.length || 0} ítems • {order.numero}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-6 bg-zinc-50/50 border-t border-zinc-100">
                            <Link href="/admin/dashboard/pedidos" className="w-full">
                                <Button className="w-full h-12 rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-200 transition-all font-bold group">
                                    Gestionar Todos los Pedidos
                                    <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
