"use client";

import { useEffect, useMemo, useState } from "react";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {
    BarChart3,
    Calendar,
    ChevronDown,
    DollarSign,
    Package,
    ShoppingCart,
    TrendingUp,
    Warehouse,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { getConfigs } from "@/app/actions/configActions";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ResponsivePanel } from "@/components/ui/responsive-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

import { getReportsData, type FinancialSummary, type ReportBasis } from "./actions";
import FinancialSection from "./FinancialSection";
import InventorySection from "./InventorySection";
import OrdersSection from "./OrdersSection";
import ProductsSection from "./ProductsSection";
import ProfitabilitySection from "./ProfitabilitySection";
import { ReportLegendList, ReportSurface } from "./reportes-ui";

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
type ReportTab = "resumen" | "financiero" | "productos" | "pedidos" | "inventario" | "rentabilidad";

const REPORT_TABS: Array<{
    value: ReportTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    activeClass: string;
}> = [
        { value: "resumen", label: "Resumen", icon: BarChart3, activeClass: "data-[state=active]:bg-emerald-500" },
        { value: "financiero", label: "Financiero", icon: DollarSign, activeClass: "data-[state=active]:bg-emerald-500" },
        { value: "productos", label: "Productos", icon: Package, activeClass: "data-[state=active]:bg-blue-500" },
        { value: "pedidos", label: "Pedidos", icon: ShoppingCart, activeClass: "data-[state=active]:bg-violet-500" },
        { value: "inventario", label: "Inventario", icon: Warehouse, activeClass: "data-[state=active]:bg-amber-500" },
        { value: "rentabilidad", label: "Rentabilidad", icon: TrendingUp, activeClass: "data-[state=active]:bg-pink-500" },
    ];

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(amount);

function SummaryMetricCard({
    title,
    value,
    subValue,
    icon: Icon,
    iconBgClass,
    iconColorClass,
}: {
    title: string;
    value: string;
    subValue?: string;
    icon: React.ComponentType<{ className?: string }>;
    iconBgClass: string;
    iconColorClass: string;
}) {
    return (
        <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl md:h-12 md:w-12">
                <div className={`flex h-full w-full items-center justify-center rounded-2xl ${iconBgClass}`}>
                    <Icon className={`h-5 w-5 ${iconColorClass}`} />
                </div>
            </div>
            <p className="text-sm font-medium text-zinc-500">{title}</p>
            <p className="mt-1 break-words text-2xl font-black tracking-tight text-zinc-900 md:text-3xl">{value}</p>
            {subValue ? <p className="mt-1 text-xs text-zinc-400">{subValue}</p> : null}
        </div>
    );
}

function RevenueChart({
    data,
    isMobile,
}: {
    data: ChartDataPoint[];
    isMobile: boolean;
}) {
    return (
        <ReportSurface title="Ingresos por periodo" description="Tendencia de ventas y volumen de ordenes.">
            <div className="h-[250px] w-full md:h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="day" minTickGap={isMobile ? 24 : 14} stroke="#71717a" style={{ fontSize: "12px" }} />
                        <YAxis hide={isMobile} tickFormatter={(value) => formatCurrency(Number(value || 0))} stroke="#71717a" style={{ fontSize: "12px" }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#ffffff",
                                border: "1px solid #e5e7eb",
                                borderRadius: "12px",
                                padding: "12px",
                            }}
                            formatter={(value: number | string | undefined) => [formatCurrency(Number(value || 0)), "Ingresos"]}
                            labelFormatter={(label) => `Periodo ${label}`}
                        />
                        <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </ReportSurface>
    );
}

function PaymentMethodsChart({ data }: { data: PaymentMethodData[] }) {
    return (
        <ReportSurface title="Metodos de pago" description="Distribucion de ventas por canal de cobro.">
            {data.length > 0 ? (
                <div className="space-y-5">
                    <div className="space-y-4">
                        {data.map((item) => (
                            <div key={item.method}>
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <span className="truncate text-sm font-semibold text-zinc-700">{item.method}</span>
                                    <span className="shrink-0 text-sm font-bold text-zinc-900">{formatCurrency(item.amount)}</span>
                                </div>
                                <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-zinc-400">{item.percentage.toFixed(1)}% del total</p>
                            </div>
                        ))}
                    </div>

                    <ReportLegendList
                        items={data.map((item) => ({
                            label: item.method,
                            value: `${item.percentage.toFixed(1)}%`,
                            meta: formatCurrency(item.amount),
                            color: item.color,
                        }))}
                    />
                </div>
            ) : (
                <div className="py-12 text-center text-sm font-medium text-zinc-500">No hay ventas por metodo de pago en este periodo.</div>
            )}
        </ReportSurface>
    );
}

export default function ReportesDashboardPage() {
    const isMobile = useIsMobile();
    const [isLoading, setIsLoading] = useState(true);
    const [summary, setSummary] = useState<FinancialSummary | null>(null);
    const [datePreset, setDatePreset] = useState<DatePreset>("hoy");
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
        const now = new Date();
        return {
            from: startOfDay(now),
            to: endOfDay(now),
        };
    });
    const [paymentMethodsConfig, setPaymentMethodsConfig] = useState<unknown[]>([]);
    const [activeTab, setActiveTab] = useState<ReportTab>("resumen");
    const [viewsOpen, setViewsOpen] = useState(false);
    const [basis, setBasis] = useState<ReportBasis>("caja");

    const updateDateRange = (preset: DatePreset) => {
        const now = new Date();
        const to = endOfDay(now);
        let from: Date;

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
        }

        setDateRange({ from, to });
        setDatePreset(preset);

        if (typeof window !== "undefined") {
            localStorage.setItem("reportes-date-preset", preset);
        }
    };

    useEffect(() => {
        const saved = typeof window !== "undefined" ? localStorage.getItem("reportes-date-preset") : null;
        if (saved && ["hoy", "7d", "30d", "90d", "year"].includes(saved)) {
            updateDateRange(saved as DatePreset);
        }
    }, []);

    useEffect(() => {
        let active = true;

        async function fetchConfig() {
            const res = await getConfigs(["payments.methods"]);
            if (active && res.success && res.data && res.data["payments.methods"]) {
                setPaymentMethodsConfig(res.data["payments.methods"]);
            }
        }

        void fetchConfig();

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;

        async function fetchData() {
            setIsLoading(true);

            try {
                const res = await getReportsData({
                    startDate: dateRange.from,
                    endDate: dateRange.to,
                    basis,
                });

                if (!active) {
                    return;
                }

                if (res.success && res.data) {
                    setSummary(res.data.summary);
                } else {
                    toast.error(res.error || "Error al cargar datos del dashboard");
                    setSummary(null);
                }
            } catch {
                toast.error("Error de conexion con el servidor");
                if (active) {
                    setSummary(null);
                }
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        }

        void fetchData();

        return () => {
            active = false;
        };
    }, [basis, dateRange]);

    const chartData = useMemo(() => {
        if (!summary?.revenueByDay) {
            return [];
        }

        if (datePreset === "hoy") {
            const todayStr = format(dateRange.from, "yyyy-MM-dd");
            return Array.from({ length: 24 }, (_, hour) => {
                const hourKey = `${todayStr}T${hour.toString().padStart(2, "0")}`;
                const hourStats = summary.revenueByDay[hourKey] || { revenue: 0, count: 0 };

                return {
                    day: `${hour.toString().padStart(2, "0")}:00`,
                    amount: hourStats.revenue || 0,
                    orders: hourStats.count || 0,
                };
            });
        }

        const days = datePreset === "7d" ? 7 : datePreset === "30d" ? 30 : datePreset === "90d" ? 90 : 365;
        const interval = eachDayOfInterval({
            start: subDays(dateRange.to, days - 1),
            end: dateRange.to,
        });

        return interval.map((day) => {
            const dayStr = format(day, "yyyy-MM-dd");
            const dayStats = summary.revenueByDay[dayStr] || { revenue: 0, count: 0 };

            return {
                day: days <= 7 ? format(day, "EEE", { locale: es }) : format(day, "dd/MM", { locale: es }),
                amount: dayStats.revenue || 0,
                orders: dayStats.count || 0,
            };
        });
    }, [summary, datePreset, dateRange]);

    const paymentData = useMemo((): PaymentMethodData[] => {
        if (!summary?.ordersByPaymentMethod) {
            return [];
        }

        const methods = summary.ordersByPaymentMethod;
        const total = Object.values(methods).reduce((sum, value) => sum + (value || 0), 0);
        const colors: Record<string, string> = {
            EFECTIVO: "#10b981",
            MERCADOPAGO: "#0ea5e9",
            TRANSFERENCIA: "#f59e0b",
            DEBITO: "#3b82f6",
            CREDITO: "#8b5cf6",
        };

        return Object.entries(methods)
            .filter(([, amount]) => amount > 0)
            .map(([methodId, amount]) => {
                const config = (paymentMethodsConfig as { id: string; label: string }[]).find((method) => method.id === methodId);
                return {
                    method: config ? config.label : methodId,
                    amount,
                    percentage: total > 0 ? (amount / total) * 100 : 0,
                    color: colors[methodId] || "#6b7280",
                };
            })
            .sort((a, b) => b.amount - a.amount);
    }, [summary, paymentMethodsConfig]);

    const orderStats = useMemo(() => {
        if (!summary?.ordersByStatus) {
            return { completed: 0, cancelled: 0, pending: 0, total: 0 };
        }

        const statuses = summary.ordersByStatus;
        const completed = statuses.FINALIZADO || 0;
        const cancelled = statuses.CANCELADO || 0;
        const pending = (statuses.PENDIENTE || 0) + (statuses.EN_PREPARACION || 0) + (statuses.RECIBIDO || 0);
        return { completed, cancelled, pending, total: summary.totalOrders || 0 };
    }, [summary]);

    const activeView = REPORT_TABS.find((tab) => tab.value === activeTab) || REPORT_TABS[0];
    const currentCash = summary?.ordersByPaymentMethod?.EFECTIVO || 0;
    const currentDigital = Math.max(0, (summary?.totalRevenue || 0) - currentCash);

    const getPresetLabel = (preset: DatePreset) => {
        const labels: Record<DatePreset, string> = {
            hoy: "Hoy",
            "7d": "Ultimos 7 dias",
            "30d": "Ultimos 30 dias",
            "90d": "Ultimos 90 dias",
            year: "Ultimo ano",
        };
        return labels[preset];
    };

    const getBasisLabel = (value: ReportBasis) => {
        const labels: Record<ReportBasis, string> = {
            operativo: "Operativo",
            caja: "Caja",
            devengado: "Devengado",
        };

        return labels[value];
    };

    if (isLoading && activeTab === "resumen") {
        return (
            <div className="flex h-72 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
                    <span className="text-sm font-medium text-zinc-500">Cargando reportes...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="app-page-safe-bottom animate-in space-y-5 fade-in duration-500 md:space-y-6">
            <section className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="mb-1 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-lg md:h-12 md:w-12">
                                <BarChart3 className="h-5 w-5 md:h-6 md:w-6" />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">Reportes y analytics</h2>
                        </div>
                        <p className="text-sm font-medium text-zinc-500 md:text-base">Analisis completo del negocio en una vista adaptable.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:flex md:items-center">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setViewsOpen(true)}
                            className="h-11 justify-between rounded-2xl border-zinc-200 bg-white px-4 text-left font-semibold text-zinc-700 shadow-sm md:hidden"
                        >
                            <span className="flex items-center gap-2">
                                <activeView.icon className="h-4 w-4" />
                                {activeView.label}
                            </span>
                            <ChevronDown className="h-4 w-4 text-zinc-400" />
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-11 w-full justify-between rounded-2xl border-zinc-200 bg-white px-4 font-medium text-zinc-600 shadow-sm md:w-auto md:rounded-full md:px-6"
                                >
                                    <span className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-zinc-400" />
                                        {getBasisLabel(basis)}
                                    </span>
                                    <ChevronDown className="h-3 w-3 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-2xl border-zinc-100 p-2 shadow-xl">
                                <DropdownMenuItem className="my-0.5 cursor-pointer rounded-xl" onClick={() => setBasis("operativo")}>
                                    Operativo
                                </DropdownMenuItem>
                                <DropdownMenuItem className="my-0.5 cursor-pointer rounded-xl" onClick={() => setBasis("caja")}>
                                    Caja
                                </DropdownMenuItem>
                                <DropdownMenuItem className="my-0.5 cursor-pointer rounded-xl" onClick={() => setBasis("devengado")}>
                                    Devengado
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-11 w-full justify-between rounded-2xl border-zinc-200 bg-white px-4 font-medium text-zinc-600 shadow-sm md:w-auto md:rounded-full md:px-6"
                                >
                                    <span className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-zinc-400" />
                                        {getPresetLabel(datePreset)}
                                    </span>
                                    <ChevronDown className="h-3 w-3 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl border-zinc-100 p-2 shadow-xl">
                                <DropdownMenuItem className="my-0.5 cursor-pointer rounded-xl" onClick={() => updateDateRange("hoy")}>
                                    Hoy
                                </DropdownMenuItem>
                                <DropdownMenuItem className="my-0.5 cursor-pointer rounded-xl" onClick={() => updateDateRange("7d")}>
                                    Ultimos 7 dias
                                </DropdownMenuItem>
                                <DropdownMenuItem className="my-0.5 cursor-pointer rounded-xl" onClick={() => updateDateRange("30d")}>
                                    Ultimos 30 dias
                                </DropdownMenuItem>
                                <DropdownMenuItem className="my-0.5 cursor-pointer rounded-xl" onClick={() => updateDateRange("90d")}>
                                    Ultimos 90 dias
                                </DropdownMenuItem>
                                <DropdownMenuItem className="my-0.5 cursor-pointer rounded-xl" onClick={() => updateDateRange("year")}>
                                    Ultimo ano
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </section>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportTab)} className="w-full">
                <div className="hidden md:block">
                    <TabsList className="h-auto flex-wrap rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm">
                        {REPORT_TABS.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <TabsTrigger key={tab.value} value={tab.value} className={`rounded-xl px-5 py-2.5 data-[state=active]:text-white ${tab.activeClass}`}>
                                    <Icon className="mr-2 h-4 w-4" />
                                    {tab.label}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>
                </div>

                <TabsContent value="resumen" className="mt-5 space-y-5 md:mt-6 md:space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
                        <SummaryMetricCard
                            title="Ventas netas"
                            value={formatCurrency(summary?.netSales || 0)}
                            subValue={`${summary?.totalOrders || 0} ordenes en base ${getBasisLabel(basis).toLowerCase()}`}
                            icon={DollarSign}
                            iconBgClass="bg-emerald-100"
                            iconColorClass="text-emerald-600"
                        />
                        <SummaryMetricCard
                            title="Egresos"
                            value={formatCurrency(summary?.totalExpenses || 0)}
                            subValue={`${formatCurrency(summary?.laborCost || 0)} en nomina`}
                            icon={DollarSign}
                            iconBgClass="bg-red-100"
                            iconColorClass="text-red-600"
                        />
                        <SummaryMetricCard
                            title="Resultado operativo"
                            value={formatCurrency(summary?.operatingResult || 0)}
                            subValue={`${formatCurrency(summary?.grossProfit || 0)} beneficio bruto`}
                            icon={TrendingUp}
                            iconBgClass="bg-blue-100"
                            iconColorClass="text-blue-600"
                        />
                        <SummaryMetricCard
                            title="Costo Primario"
                            value={`${(summary?.primeCostPct || 0).toFixed(1)}%`}
                            subValue={`${formatCurrency(summary?.primeCost || 0)} entre costo de la materia prima + nomina`}
                            icon={XCircle}
                            iconBgClass="bg-amber-100"
                            iconColorClass="text-amber-600"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
                        <SummaryMetricCard
                            title="Ventas brutas"
                            value={formatCurrency(summary?.grossSales || 0)}
                            subValue={`${(summary?.discountRate || 0).toFixed(1)}% en descuentos`}
                            icon={DollarSign}
                            iconBgClass="bg-zinc-100"
                            iconColorClass="text-zinc-700"
                        />
                        <SummaryMetricCard
                            title="Ticket promedio"
                            value={formatCurrency(summary?.averageTicket || 0)}
                            subValue={`${(summary?.avgItemsPerOrder || 0).toFixed(1)} items por pedido`}
                            icon={ShoppingCart}
                            iconBgClass="bg-violet-100"
                            iconColorClass="text-violet-600"
                        />
                        <SummaryMetricCard
                            title="Comparativo"
                            value={`${(summary?.comparisonPrevRevenuePct || 0).toFixed(1)}%`}
                            subValue={`${(summary?.comparisonPrevOrdersPct || 0).toFixed(1)}% en ordenes vs periodo previo`}
                            icon={TrendingUp}
                            iconBgClass="bg-sky-100"
                            iconColorClass="text-sky-600"
                        />
                        <SummaryMetricCard
                            title="Punto equilibrio"
                            value={`${(summary?.breakEvenProgressPct || 0).toFixed(0)}%`}
                            subValue={`${formatCurrency(summary?.breakEvenTarget || 0)} objetivo del periodo`}
                            icon={BarChart3}
                            iconBgClass="bg-lime-100"
                            iconColorClass="text-lime-600"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 md:gap-6">
                        <RevenueChart data={chartData} isMobile={isMobile} />
                        <PaymentMethodsChart data={paymentData} />
                    </div>

                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 md:gap-6">
                        <ReportSurface title="Estado de ordenes" description="Resumen operativo del periodo.">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center">
                                    <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                                        <span className="text-lg font-black text-emerald-600">{orderStats.completed}</span>
                                    </div>
                                    <p className="text-xs font-medium text-zinc-500">Completadas</p>
                                    <p className="text-[10px] text-emerald-600">
                                        {orderStats.total > 0 ? ((orderStats.completed / orderStats.total) * 100).toFixed(0) : 0}%
                                    </p>
                                </div>
                                <div className="text-center">
                                    <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
                                        <span className="text-lg font-black text-amber-600">{orderStats.pending}</span>
                                    </div>
                                    <p className="text-xs font-medium text-zinc-500">Pendientes</p>
                                    <p className="text-[10px] text-amber-600">
                                        {orderStats.total > 0 ? ((orderStats.pending / orderStats.total) * 100).toFixed(0) : 0}%
                                    </p>
                                </div>
                                <div className="text-center">
                                    <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
                                        <span className="text-lg font-black text-red-600">{orderStats.cancelled}</span>
                                    </div>
                                    <p className="text-xs font-medium text-zinc-500">Canceladas</p>
                                    <p className="text-[10px] text-red-600">
                                        {orderStats.total > 0 ? ((orderStats.cancelled / orderStats.total) * 100).toFixed(0) : 0}%
                                    </p>
                                </div>
                            </div>
                        </ReportSurface>

                        <ReportSurface
                            title="Resumen rapido"
                            description={`Corte financiero en base ${getBasisLabel(basis).toLowerCase()}.`}
                            className="border-zinc-900 bg-gradient-to-br from-zinc-900 to-zinc-800"
                            titleClassName="text-white"
                            descriptionClassName="text-zinc-300"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-white/10 py-2.5">
                                    <span className="text-sm text-zinc-300">Efectivo</span>
                                    <span className="text-sm font-bold text-white">{formatCurrency(currentCash)}</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-white/10 py-2.5">
                                    <span className="text-sm text-zinc-300">Digital</span>
                                    <span className="text-sm font-bold text-white">{formatCurrency(currentDigital)}</span>
                                </div>
                                <div className="flex items-center justify-between py-2.5">
                                    <span className="text-sm text-zinc-300">Margen neto</span>
                                    <span className="text-sm font-bold text-white">{(summary?.netMarginPct || 0).toFixed(1)}%</span>
                                </div>
                            </div>
                        </ReportSurface>
                    </div>
                </TabsContent>

                <TabsContent value="financiero" className="mt-5 md:mt-6">
                    <FinancialSection dateRange={dateRange} basis={basis} />
                </TabsContent>

                <TabsContent value="productos" className="mt-5 md:mt-6">
                    <ProductsSection dateRange={dateRange} basis={basis} />
                </TabsContent>

                <TabsContent value="pedidos" className="mt-5 md:mt-6">
                    <OrdersSection dateRange={dateRange} basis={basis} />
                </TabsContent>

                <TabsContent value="inventario" className="mt-5 md:mt-6">
                    <InventorySection dateRange={dateRange} />
                </TabsContent>

                <TabsContent value="rentabilidad" className="mt-5 md:mt-6">
                    <ProfitabilitySection dateRange={dateRange} basis={basis} />
                </TabsContent>
            </Tabs>

            <ResponsivePanel
                open={viewsOpen}
                onOpenChange={setViewsOpen}
                title="Vista"
                description="Selecciona la seccion del dashboard de reportes."
                mobileSide="bottom"
                desktopMode="sheet"
                contentClassName="sm:max-w-md"
            >
                <div className="space-y-2">
                    {REPORT_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = tab.value === activeTab;
                        return (
                            <button
                                key={tab.value}
                                type="button"
                                onClick={() => {
                                    setActiveTab(tab.value);
                                    setViewsOpen(false);
                                }}
                                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors ${isActive ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="font-semibold">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </ResponsivePanel>

            <div aria-hidden className="rounded-[1.75rem] bg-white/55 md:hidden" style={{ minHeight: "calc(var(--admin-mobile-nav-height) - 0.5rem)" }} />
        </div>
    );
}
