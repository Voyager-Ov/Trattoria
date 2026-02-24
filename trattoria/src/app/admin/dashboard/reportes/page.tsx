"use client";

import { useState, useEffect, useMemo } from "react";
import {
    BarChart3, Calendar, ChevronDown, TrendingUp,
    DollarSign, ShoppingCart, XCircle,
    Clock, Package, Warehouse,
    CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getReportsData, FinancialSummary } from "./actions";
import { getConfigs } from "@/app/actions/configActions";
import { toast } from "sonner";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";

// Import analytics sections
import FinancialSection from "./FinancialSection";
import ProductsSection from "./ProductsSection";
import OrdersSection from "./OrdersSection";
import InventorySection from "./InventorySection";
import ProfitabilitySection from "./ProfitabilitySection";

// --- Types ---
interface Transaction {
    id: string;
    total: number;
    recibidoEn: string;
    metodoPago: string;
    estado: string;
}

interface ChartDataPoint {
    day: string;
    amount: number;
    orders: number;
}

interface PaymentMethodData {
    method: string;
    amount: number;
    percentage: number;
    color: string;
}

type DatePreset = "hoy" | "7d" | "30d" | "90d" | "year";

// --- Utility Functions ---
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(amount);
};

// --- Dashboard Card Component ---
function DashboardCard({
    title,
    value,
    subValue,
    icon: Icon,
    iconBgColor = "bg-zinc-100",
    iconColor = "text-zinc-600"
}: {
    title: string;
    value: string;
    subValue?: string;
    icon: React.ElementType;
    iconBgColor?: string;
    iconColor?: string;
}) {
    return (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
                <div className={`h-12 w-12 ${iconBgColor} rounded-2xl flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
            </div>
            <div>
                <p className="text-sm text-zinc-500 font-medium mb-1">{title}</p>
                <p className="text-2xl font-bold text-zinc-900">{value}</p>
                {subValue && <p className="text-xs text-zinc-400 mt-1">{subValue}</p>}
            </div>
        </div>
    );
}

// --- Revenue Chart Component ---
function RevenueChart({ data }: { data: ChartDataPoint[] }) {
    const maxAmount = Math.max(...data.map(d => d.amount), 1);

    return (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full">
            <div className="flex flex-shrink-0 items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-zinc-900">Ingresos por Día</h3>
                    <p className="text-sm text-zinc-500">Tendencia de ventas del período</p>
                </div>
                <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-emerald-600" />
                </div>
            </div>

            <div className="flex-1 w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent">
                <div className="h-48 flex items-end gap-2 min-w-max px-2 pt-16 mt-auto">
                    {data.map((point, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center group min-w-[32px]">
                            <div className="relative w-full flex justify-center">
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                    {formatCurrency(point.amount)}
                                    <br />
                                    <span className="text-zinc-400">{point.orders} órdenes</span>
                                </div>
                                <div
                                    className="w-full max-w-[40px] bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg transition-all duration-500 hover:from-emerald-600 hover:to-emerald-500 cursor-pointer"
                                    style={{ height: `${Math.max((point.amount / maxAmount) * 160, 8)}px` }}
                                />
                            </div>
                            <span className="text-[10px] text-zinc-400 mt-2 font-medium break-keep whitespace-nowrap capitalize">{point.day}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// --- Payment Methods Chart Component ---
function PaymentMethodsChart({ data }: { data: PaymentMethodData[] }) {
    return (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-zinc-900">Métodos de Pago</h3>
                    <p className="text-sm text-zinc-500">Distribución de ventas</p>
                </div>
                <div className="h-10 w-10 bg-violet-100 rounded-xl flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-violet-600" />
                </div>
            </div>

            <div className="space-y-4">
                {data.map((item, i) => (
                    <div key={i}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-zinc-700">{item.method}</span>
                            <span className="text-sm font-bold text-zinc-900">{formatCurrency(item.amount)}</span>
                        </div>
                        <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${item.color} rounded-full transition-all duration-700`}
                                style={{ width: `${item.percentage}%` }}
                            />
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">{item.percentage.toFixed(1)}% del total</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Main Dashboard Component ---
export default function ReportesDashboardPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [summary, setSummary] = useState<FinancialSummary | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [datePreset, setDatePreset] = useState<DatePreset>("hoy");
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
        const now = new Date();
        return {
            from: startOfDay(now),
            to: endOfDay(now),
        };
    });
    const [paymentMethodsConfig, setPaymentMethodsConfig] = useState<unknown[]>([]);
    const [activeTab, setActiveTab] = useState("resumen");

    const updateDateRange = (preset: DatePreset) => {
        const now = new Date();
        let from: Date;
        const to: Date = endOfDay(now);

        switch (preset) {
            case "hoy":
                from = startOfDay(now);
                break;
            case "7d":
                from = startOfDay(subDays(now, 7));
                break;
            case "30d":
                from = startOfDay(subDays(now, 30));
                break;
            case "90d":
                from = startOfDay(subDays(now, 90));
                break;
            case "year":
                from = startOfDay(subDays(now, 365));
                break;
            default:
                return;
        }

        setDateRange({ from, to });
        setDatePreset(preset);
        localStorage.setItem("reportes-date-preset", preset);
    };

    useEffect(() => {
        const saved = localStorage.getItem("reportes-date-preset");
        if (saved) {
            setDatePreset(saved as DatePreset);
            updateDateRange(saved as DatePreset);
        }
    }, []);

    useEffect(() => {
        async function fetchConfig() {
            const res = await getConfigs(["payments.methods"]);
            if (res.success && res.data && res.data["payments.methods"]) {
                setPaymentMethodsConfig(res.data["payments.methods"]);
            }
        }
        fetchConfig();
    }, []);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const res = await getReportsData(dateRange.from, dateRange.to);

                if (res.success && res.data) {
                    setSummary(res.data.summary);
                    setTransactions(res.data.recentTransactions as Transaction[]);
                } else {
                    console.error("Error loading dashboard:", res.error);
                    toast.error(res.error || "Error al cargar datos del dashboard");
                    setSummary({
                        totalRevenue: 0,
                        totalOrders: 0,
                        averageTicket: 0,
                        ordersByStatus: {},
                        ordersByPaymentMethod: {},
                        revenueByDay: {}
                    });
                    setTransactions([]);
                }
            } catch (err) {
                console.error("Dashboard fetch error:", err);
                toast.error("Error de conexión con el servidor");
                setSummary({
                    totalRevenue: 0,
                    totalOrders: 0,
                    averageTicket: 0,
                    ordersByStatus: {},
                    ordersByPaymentMethod: {},
                    revenueByDay: {}
                });
                setTransactions([]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [dateRange]);

    // Process chart data
    const chartData = useMemo(() => {
        if (!summary || !summary.revenueByDay) return [];

        if (datePreset === "hoy") {
            const todayStr = format(dateRange.from, "yyyy-MM-dd");
            const hours = Array.from({ length: 24 }, (_, i) => i);

            return hours.map(hour => {
                const hourStr = hour.toString().padStart(2, '0');
                const key = `${todayStr}T${hourStr}`;
                const hourStats = summary.revenueByDay[key] || { revenue: 0, count: 0 };

                return {
                    day: `${hourStr}:00`,
                    amount: hourStats.revenue || 0,
                    orders: hourStats.count || 0
                };
            });
        }

        const days = datePreset === "7d" ? 7 : datePreset === "30d" ? 30 : datePreset === "90d" ? 90 : 365;
        const interval = eachDayOfInterval({
            start: subDays(dateRange.to, days - 1),
            end: dateRange.to
        });

        return interval.map(day => {
            const dayStr = format(day, "yyyy-MM-dd");
            const dayStats = summary.revenueByDay[dayStr] || { revenue: 0, count: 0 };

            return {
                day: days <= 7 ? format(day, "EEE", { locale: es }) : format(day, "dd/MM", { locale: es }),
                amount: dayStats.revenue || 0,
                orders: dayStats.count || 0
            };
        });
    }, [summary, datePreset, dateRange]);

    // Process payment methods data
    const paymentData = useMemo((): PaymentMethodData[] => {
        if (!summary || !summary.ordersByPaymentMethod) return [];

        const methods = summary.ordersByPaymentMethod;
        const total = Object.values(methods).reduce((sum, val) => sum + (val || 0), 0);

        const colors: Record<string, string> = {
            "EFECTIVO": "bg-emerald-500",
            "MERCADOPAGO": "bg-sky-500",
            "TRANSFERENCIA": "bg-amber-500",
            "DEBITO": "bg-blue-500",
            "CREDITO": "bg-violet-500"
        };

        return Object.entries(methods)
            .filter(([, amount]) => amount > 0)
            .map(([methodId, amount]) => {
                const config = (paymentMethodsConfig as { id: string; label: string }[]).find(m => m.id === methodId);
                return {
                    method: config ? config.label : methodId,
                    amount: amount,
                    percentage: total > 0 ? (amount / total) * 100 : 0,
                    color: colors[methodId] || "bg-zinc-500"
                };
            })
            .sort((a, b) => b.amount - a.amount);
    }, [summary, paymentMethodsConfig]);

    // Order status counts
    const orderStats = useMemo(() => {
        if (!summary || !summary.ordersByStatus) {
            return { completed: 0, cancelled: 0, pending: 0, total: 0 };
        }
        const statuses = summary.ordersByStatus;
        const completed = statuses["FINALIZADO"] || 0;
        const cancelled = statuses["CANCELADO"] || 0;
        const pending = (statuses["PENDIENTE"] || 0) + (statuses["EN_PREPARACION"] || 0) + (statuses["RECIBIDO"] || 0);
        return { completed, cancelled, pending, total: summary.totalOrders || 0 };
    }, [summary]);

    const getPresetLabel = (preset: DatePreset) => {
        const labels = {
            "hoy": "Hoy",
            "7d": "Últimos 7 días",
            "30d": "Últimos 30 días",
            "90d": "Últimos 90 días",
            "year": "Último año",
        };
        return labels[preset];
    };

    if (isLoading && activeTab === "resumen") {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
                    <span className="text-sm text-zinc-500 font-medium">Cargando reportes...</span>
                </div>
            </div>
        );
    }


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center text-white shadow-lg">
                            <BarChart3 size={24} />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Reportes y Analytics</h2>
                    </div>
                    <p className="text-zinc-500 font-medium">Análisis completo de tu negocio</p>
                </div>

                <div className="flex items-center gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-11 rounded-full px-6 border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-medium bg-white shadow-sm">
                                <Calendar className="mr-2 h-4 w-4 text-zinc-400" />
                                {getPresetLabel(datePreset)}
                                <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-zinc-100">
                            <DropdownMenuItem className="rounded-xl my-0.5 cursor-pointer" onClick={() => updateDateRange("hoy")}>
                                Hoy
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl my-0.5 cursor-pointer" onClick={() => updateDateRange("7d")}>
                                Últimos 7 días
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl my-0.5 cursor-pointer" onClick={() => updateDateRange("30d")}>
                                Últimos 30 días
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl my-0.5 cursor-pointer" onClick={() => updateDateRange("90d")}>
                                Últimos 90 días
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl my-0.5 cursor-pointer" onClick={() => updateDateRange("year")}>
                                Último año
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-white border border-zinc-200 p-1 rounded-2xl shadow-sm h-auto flex-wrap">
                    <TabsTrigger value="resumen" className="rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white px-6 py-2.5">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Resumen
                    </TabsTrigger>
                    <TabsTrigger value="financiero" className="rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white px-6 py-2.5">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Financiero
                    </TabsTrigger>
                    <TabsTrigger value="productos" className="rounded-xl data-[state=active]:bg-blue-500 data-[state=active]:text-white px-6 py-2.5">
                        <Package className="h-4 w-4 mr-2" />
                        Productos
                    </TabsTrigger>
                    <TabsTrigger value="pedidos" className="rounded-xl data-[state=active]:bg-violet-500 data-[state=active]:text-white px-6 py-2.5">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Pedidos
                    </TabsTrigger>
                    <TabsTrigger value="inventario" className="rounded-xl data-[state=active]:bg-amber-500 data-[state=active]:text-white px-6 py-2.5">
                        <Warehouse className="h-4 w-4 mr-2" />
                        Inventario
                    </TabsTrigger>
                    <TabsTrigger value="rentabilidad" className="rounded-xl data-[state=active]:bg-pink-500 data-[state=active]:text-white px-6 py-2.5">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Rentabilidad
                    </TabsTrigger>
                </TabsList>

                {/* Resumen Tab */}
                <TabsContent value="resumen" className="space-y-6 mt-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <DashboardCard
                            title="Ingresos Totales"
                            value={formatCurrency(summary?.totalRevenue || 0)}
                            subValue={`${summary?.totalOrders || 0} órdenes procesadas`}
                            icon={DollarSign}
                            iconBgColor="bg-emerald-100"
                            iconColor="text-emerald-600"
                        />
                        <DashboardCard
                            title="Ticket Promedio"
                            value={formatCurrency(summary?.averageTicket || 0)}
                            subValue="por orden completada"
                            icon={TrendingUp}
                            iconBgColor="bg-blue-100"
                            iconColor="text-blue-600"
                        />
                        <DashboardCard
                            title="Órdenes Completadas"
                            value={orderStats.completed.toString()}
                            subValue={`${orderStats.cancelled} canceladas`}
                            icon={ShoppingCart}
                            iconBgColor="bg-violet-100"
                            iconColor="text-violet-600"
                        />
                        <DashboardCard
                            title="Tasa de Cancelación"
                            value={`${orderStats.total > 0 ? ((orderStats.cancelled / orderStats.total) * 100).toFixed(1) : 0}%`}
                            subValue={`${orderStats.pending} pendientes`}
                            icon={XCircle}
                            iconBgColor="bg-red-100"
                            iconColor="text-red-600"
                        />
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <RevenueChart data={chartData} />
                        <PaymentMethodsChart data={paymentData} />
                    </div>

                    {/* Bottom Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Order Status */}
                        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 hover:shadow-md transition-all duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-zinc-900">Estado de Órdenes</h3>
                                    <p className="text-sm text-zinc-500">Resumen del período</p>
                                </div>
                                <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center">
                                    <div className="h-16 w-16 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center mb-2">
                                        <span className="text-xl font-bold text-emerald-600">{orderStats.completed}</span>
                                    </div>
                                    <p className="text-xs text-zinc-500 font-medium">Completadas</p>
                                    <p className="text-[10px] text-emerald-600">
                                        {orderStats.total > 0 ? ((orderStats.completed / orderStats.total) * 100).toFixed(0) : 0}%
                                    </p>
                                </div>

                                <div className="text-center">
                                    <div className="h-16 w-16 mx-auto bg-amber-100 rounded-2xl flex items-center justify-center mb-2">
                                        <span className="text-xl font-bold text-amber-600">{orderStats.pending}</span>
                                    </div>
                                    <p className="text-xs text-zinc-500 font-medium">Pendientes</p>
                                    <p className="text-[10px] text-amber-600">
                                        {orderStats.total > 0 ? ((orderStats.pending / orderStats.total) * 100).toFixed(0) : 0}%
                                    </p>
                                </div>

                                <div className="text-center">
                                    <div className="h-16 w-16 mx-auto bg-red-100 rounded-2xl flex items-center justify-center mb-2">
                                        <span className="text-xl font-bold text-red-600">{orderStats.cancelled}</span>
                                    </div>
                                    <p className="text-xs text-zinc-500 font-medium">Canceladas</p>
                                    <p className="text-[10px] text-red-600">
                                        {orderStats.total > 0 ? ((orderStats.cancelled / orderStats.total) * 100).toFixed(0) : 0}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-6 text-white shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold">Resumen Rápido</h3>
                                    <p className="text-sm text-zinc-400">Métricas del período</p>
                                </div>
                                <Clock className="h-5 w-5 text-zinc-400" />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-3 border-b border-zinc-700">
                                    <span className="text-zinc-400">Efectivo</span>
                                    <span className="font-bold">{formatCurrency(summary?.ordersByPaymentMethod.EFECTIVO || 0)}</span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-zinc-700">
                                    <span className="text-zinc-400">Digital</span>
                                    <span className="font-bold">{formatCurrency((summary?.totalRevenue || 0) - (summary?.ordersByPaymentMethod.EFECTIVO || 0))}</span>
                                </div>
                                <div className="flex items-center justify-between py-3">
                                    <span className="text-zinc-400">Total Órdenes</span>
                                    <span className="font-bold">{summary?.totalOrders || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Analytics Tabs */}
                <TabsContent value="financiero" className="mt-6">
                    <FinancialSection dateRange={dateRange} />
                </TabsContent>

                <TabsContent value="productos" className="mt-6">
                    <ProductsSection dateRange={dateRange} />
                </TabsContent>

                <TabsContent value="pedidos" className="mt-6">
                    <OrdersSection dateRange={dateRange} />
                </TabsContent>

                <TabsContent value="inventario" className="mt-6">
                    <InventorySection dateRange={dateRange} />
                </TabsContent>

                <TabsContent value="rentabilidad" className="mt-6">
                    <ProfitabilitySection dateRange={dateRange} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
