"use client";

import { useEffect, useState } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Clock, Loader2, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { useIsMobile } from "@/hooks/use-mobile";

import {
    getOrdersByOriginData,
    getOrdersByStatusData,
    getPrepTimeData,
    getTicketPromedioData,
    OrderStatusData,
    PrepTimeData,
} from "./analyticsActions";
import { ReportLegendList, ReportSurface } from "./reportes-ui";

interface OrdersSectionProps {
    dateRange: {
        from: Date;
        to: Date;
    };
}

const STATUS_COLORS: Record<string, string> = {
    RECIBIDO: "#3b82f6",
    PENDIENTE: "#f59e0b",
    EN_PREPARACION: "#8b5cf6",
    LISTO: "#10b981",
    FINALIZADO: "#059669",
    CANCELADO: "#ef4444",
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(value);

export default function OrdersSection({ dateRange }: OrdersSectionProps) {
    const isMobile = useIsMobile();
    const [loading, setLoading] = useState(true);
    const [ordersByStatus, setOrdersByStatus] = useState<OrderStatusData[]>([]);
    const [prepTimeData, setPrepTimeData] = useState<{ daily: PrepTimeData[]; overallAvg: number } | null>(null);
    const [ordersByOrigin, setOrdersByOrigin] = useState<Array<{ date: string; [key: string]: string | number }>>([]);
    const [ticketPromedio, setTicketPromedio] = useState<{
        daily: { date: string; INTERNO: number; CATALOGO: number; TOTAL: number }[];
        overall: { INTERNO: number; CATALOGO: number; TOTAL: number };
    } | null>(null);

    useEffect(() => {
        let active = true;

        async function loadData() {
            setLoading(true);

            try {
                const [statusResult, prepResult, originResult, ticketResult] = await Promise.all([
                    getOrdersByStatusData(dateRange.from, dateRange.to),
                    getPrepTimeData(dateRange.from, dateRange.to),
                    getOrdersByOriginData(dateRange.from, dateRange.to),
                    getTicketPromedioData(dateRange.from, dateRange.to),
                ]);

                if (!active) {
                    return;
                }

                if (statusResult.success && statusResult.data) {
                    setOrdersByStatus(statusResult.data);
                }

                if (prepResult.success && prepResult.data) {
                    setPrepTimeData(prepResult.data);
                }

                if (originResult.success && originResult.data) {
                    setOrdersByOrigin(originResult.data);
                }

                if (ticketResult.success && ticketResult.data) {
                    setTicketPromedio(ticketResult.data);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void loadData();

        return () => {
            active = false;
        };
    }, [dateRange]);

    if (loading) {
        return (
            <div className="flex h-72 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
        );
    }

    const totalOrders = ordersByStatus.reduce((sum, status) => sum + status.count, 0);
    const statusLegend = ordersByStatus.map((status) => ({
        label: status.estado,
        value: `${status.count}`,
        meta: `${status.percentage.toFixed(1)}%`,
        color: STATUS_COLORS[status.estado] || "#6b7280",
    }));

    return (
        <div className="space-y-5 md:space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 md:gap-6">
                <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                        <ShoppingCart className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-zinc-500">Total de pedidos</p>
                    <p className="mt-1 text-2xl font-black tracking-tight text-zinc-900 md:text-3xl">{totalOrders}</p>
                </div>

                <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                        <Clock className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-zinc-500">Tiempo promedio prep.</p>
                    <p className="mt-1 text-2xl font-black tracking-tight text-zinc-900 md:text-3xl">
                        {prepTimeData?.overallAvg ? `${prepTimeData.overallAvg.toFixed(1)} min` : "N/A"}
                    </p>
                </div>

                <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-6 sm:col-span-2 xl:col-span-1">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                        <ShoppingCart className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-zinc-500">Ticket promedio</p>
                    <p className="mt-1 text-2xl font-black tracking-tight text-zinc-900 md:text-3xl">
                        {ticketPromedio?.overall?.TOTAL ? formatCurrency(ticketPromedio.overall.TOTAL) : "N/A"}
                    </p>
                </div>
            </div>

            <ReportSurface
                title="Pedidos por estado"
                description="Distribucion actual de pedidos por etapa."
            >
                {ordersByStatus.length > 0 ? (
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                        <div className="mx-auto h-[220px] w-full max-w-[260px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={ordersByStatus}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={isMobile ? 72 : 92}
                                        labelLine={false}
                                        dataKey="count"
                                    >
                                        {ordersByStatus.map((entry, index) => (
                                            <Cell key={`${entry.estado}-${index}`} fill={STATUS_COLORS[entry.estado] || "#6b7280"} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <ReportLegendList items={statusLegend} />
                    </div>
                ) : (
                    <div className="py-12 text-center text-sm font-medium text-zinc-500">No hay datos de pedidos.</div>
                )}
            </ReportSurface>

            {ordersByOrigin.length > 0 ? (
                <ReportSurface
                    title="Pedidos por origen"
                    description="Comparativa entre interno y catalogo a lo largo del tiempo."
                >
                    <div className="h-[250px] w-full md:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={ordersByOrigin}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="date"
                                    minTickGap={isMobile ? 26 : 14}
                                    tickFormatter={(date: string) => format(new Date(date), "dd MMM", { locale: es })}
                                    stroke="#71717a"
                                    style={{ fontSize: "12px" }}
                                />
                                <YAxis hide={isMobile} stroke="#71717a" style={{ fontSize: "12px" }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#ffffff",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "12px",
                                        padding: "12px",
                                    }}
                                    labelFormatter={(date) => format(new Date(date), "dd 'de' MMMM, yyyy", { locale: es })}
                                />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Area type="monotone" dataKey="INTERNO" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Interno" />
                                <Area type="monotone" dataKey="CATALOGO" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Catalogo" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </ReportSurface>
            ) : null}

            {prepTimeData?.daily?.length ? (
                <ReportSurface
                    title="Tiempo promedio de preparacion"
                    description="Evolucion del tiempo promedio de cocina."
                >
                    <div className="h-[250px] w-full md:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={prepTimeData.daily}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="date"
                                    minTickGap={isMobile ? 26 : 14}
                                    tickFormatter={(date: string) => format(new Date(date), "dd MMM", { locale: es })}
                                    stroke="#71717a"
                                    style={{ fontSize: "12px" }}
                                />
                                <YAxis hide={isMobile} stroke="#71717a" style={{ fontSize: "12px" }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#ffffff",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "12px",
                                        padding: "12px",
                                    }}
                                    formatter={(value) => [`${Number(value || 0).toFixed(1)} min`, "Tiempo promedio"]}
                                    labelFormatter={(date) => format(new Date(date), "dd 'de' MMMM, yyyy", { locale: es })}
                                />
                                <Line type="monotone" dataKey="avgMinutes" stroke="#10b981" strokeWidth={3} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </ReportSurface>
            ) : null}

            {ticketPromedio?.daily?.length ? (
                <ReportSurface
                    title="Ticket promedio"
                    description="Evolucion del valor promedio por pedido."
                >
                    <div className="h-[250px] w-full md:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={ticketPromedio.daily}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="date"
                                    minTickGap={isMobile ? 26 : 14}
                                    tickFormatter={(date: string) => format(new Date(date), "dd MMM", { locale: es })}
                                    stroke="#71717a"
                                    style={{ fontSize: "12px" }}
                                />
                                <YAxis hide={isMobile} tickFormatter={(value) => formatCurrency(Number(value || 0))} stroke="#71717a" style={{ fontSize: "12px" }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#ffffff",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "12px",
                                        padding: "12px",
                                    }}
                                    formatter={(value) => [formatCurrency(Number(value || 0)), ""]}
                                    labelFormatter={(date) => format(new Date(date), "dd 'de' MMMM, yyyy", { locale: es })}
                                />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Line type="monotone" dataKey="INTERNO" stroke="#8b5cf6" strokeWidth={2} name="Interno" dot={false} />
                                <Line type="monotone" dataKey="CATALOGO" stroke="#3b82f6" strokeWidth={2} name="Catalogo" dot={false} />
                                <Line type="monotone" dataKey="TOTAL" stroke="#10b981" strokeWidth={3} name="Total" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </ReportSurface>
            ) : null}
        </div>
    );
}
