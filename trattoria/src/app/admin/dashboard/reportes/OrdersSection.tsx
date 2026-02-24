"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Loader2, Clock, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    getOrdersByStatusData,
    getPrepTimeData,
    getOrdersByOriginData,
    getTicketPromedioData,
    OrderStatusData,
    PrepTimeData,
} from "./analyticsActions";

interface OrdersSectionProps {
    dateRange: {
        from: Date;
        to: Date;
    };
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(value);
};

const STATUS_COLORS: Record<string, string> = {
    RECIBIDO: "#3b82f6", // blue
    PENDIENTE: "#f59e0b", // amber
    EN_PREPARACION: "#8b5cf6", // violet
    LISTO: "#10b981", // emerald
    FINALIZADO: "#059669", // green
    CANCELADO: "#ef4444", // red
};

export default function OrdersSection({ dateRange }: OrdersSectionProps) {
    const [loading, setLoading] = useState(true);
    const [ordersByStatus, setOrdersByStatus] = useState<OrderStatusData[]>([]);
    const [prepTimeData, setPrepTimeData] = useState<{ daily: PrepTimeData[]; overallAvg: number } | null>(null);
    const [ordersByOrigin, setOrdersByOrigin] = useState<{ date: string;[key: string]: string | number }[]>([]);
    const [ticketPromedio, setTicketPromedio] = useState<{ daily: { date: string; INTERNO: number; CATALOGO: number; TOTAL: number }[]; overall: { INTERNO: number; CATALOGO: number; TOTAL: number } } | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            // Estados de pedidos
            const statusResult = await getOrdersByStatusData(dateRange.from, dateRange.to);
            if (statusResult.success && statusResult.data) {
                setOrdersByStatus(statusResult.data);
            }

            // Tiempos de preparación
            const prepResult = await getPrepTimeData(dateRange.from, dateRange.to);
            if (prepResult.success && prepResult.data) {
                setPrepTimeData(prepResult.data);
            }

            // Pedidos por origen
            const originResult = await getOrdersByOriginData(dateRange.from, dateRange.to);
            if (originResult.success && originResult.data) {
                setOrdersByOrigin(originResult.data);
            }

            // Ticket promedio
            const ticketResult = await getTicketPromedioData(dateRange.from, dateRange.to);
            if (ticketResult.success && ticketResult.data) {
                setTicketPromedio(ticketResult.data);
            }
        } catch (error) {
            console.error("Error loading orders data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 rounded-3xl border border-zinc-200">
                    <div className="flex items-start justify-between mb-4">
                        <div className="h-12 w-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
                            <ShoppingCart className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-sm text-zinc-500 font-medium mb-1">Total de Pedidos</p>
                    <p className="text-2xl font-bold text-zinc-900">
                        {ordersByStatus.reduce((sum, s) => sum + s.count, 0)}
                    </p>
                </Card>

                <Card className="p-6 rounded-3xl border border-zinc-200">
                    <div className="flex items-start justify-between mb-4">
                        <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                            <Clock className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-sm text-zinc-500 font-medium mb-1">Tiempo Promedio Prep.</p>
                    <p className="text-2xl font-bold text-zinc-900">
                        {prepTimeData?.overallAvg ? `${prepTimeData.overallAvg.toFixed(1)} min` : "N/A"}
                    </p>
                </Card>

                <Card className="p-6 rounded-3xl border border-zinc-200">
                    <div className="flex items-start justify-between mb-4">
                        <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                            <ShoppingCart className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-sm text-zinc-500 font-medium mb-1">Ticket Promedio</p>
                    <p className="text-2xl font-bold text-zinc-900">
                        {ticketPromedio?.overall?.TOTAL
                            ? formatCurrency(ticketPromedio.overall.TOTAL)
                            : "N/A"}
                    </p>
                </Card>
            </div>

            {/* Pedidos por Estado */}
            <Card className="p-6 rounded-3xl border border-zinc-200">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-zinc-900">Pedidos por Estado</h3>
                    <p className="text-sm text-zinc-500">Distribución actual de pedidos</p>
                </div>

                {ordersByStatus.length > 0 ? (
                    <div className="flex flex-col lg:flex-row items-center gap-8">
                        <ResponsiveContainer width="50%" height={250}>
                            <PieChart>
                                <Pie
                                    data={ordersByStatus}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {ordersByStatus.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={STATUS_COLORS[entry.estado] || "#6b7280"}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>

                        <div className="flex-1 space-y-3">
                            {ordersByStatus.map((status) => (
                                <div key={status.estado} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: STATUS_COLORS[status.estado] }}
                                        />
                                        <span className="text-sm font-medium text-zinc-700">
                                            {status.estado}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-zinc-900">{status.count}</p>
                                        <p className="text-xs text-zinc-500">
                                            {status.percentage.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-zinc-500 py-12">No hay datos de pedidos</div>
                )}
            </Card>

            {/* Pedidos por Origen */}
            {ordersByOrigin.length > 0 && (
                <Card className="p-6 rounded-3xl border border-zinc-200">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-zinc-900">Pedidos por Origen</h3>
                        <p className="text-sm text-zinc-500">Interno vs Catálogo en el tiempo</p>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={ordersByOrigin}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(date: string) => format(new Date(date), "dd MMM", { locale: es })}
                                stroke="#71717a"
                                style={{ fontSize: "12px" }}
                            />
                            <YAxis stroke="#71717a" style={{ fontSize: "12px" }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "12px",
                                    padding: "12px",
                                }}
                                labelFormatter={(date) =>
                                    format(new Date(date), "dd 'de' MMMM, yyyy", { locale: es })
                                }
                            />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="INTERNO"
                                stackId="1"
                                stroke="#8b5cf6"
                                fill="#8b5cf6"
                                fillOpacity={0.6}
                                name="Interno"
                            />
                            <Area
                                type="monotone"
                                dataKey="CATALOGO"
                                stackId="1"
                                stroke="#3b82f6"
                                fill="#3b82f6"
                                fillOpacity={0.6}
                                name="Catálogo"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>
            )}

            {/* Tiempo de Preparación */}
            {prepTimeData?.daily && prepTimeData.daily.length > 0 && (
                <Card className="p-6 rounded-3xl border border-zinc-200">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-zinc-900">
                            Tiempo Promedio de Preparación
                        </h3>
                        <p className="text-sm text-zinc-500">Evolución del tiempo de preparación</p>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={prepTimeData.daily}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(date: string) => format(new Date(date), "dd MMM", { locale: es })}
                                stroke="#71717a"
                                style={{ fontSize: "12px" }}
                            />
                            <YAxis
                                stroke="#71717a"
                                style={{ fontSize: "12px" }}
                                label={{ value: "Minutos", angle: -90, position: "insideLeft" }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "12px",
                                    padding: "12px",
                                }}
                                formatter={(value) => [`${Number(value || 0).toFixed(1)} min`, "Tiempo Promedio"]}
                                labelFormatter={(date) =>
                                    format(new Date(date), "dd 'de' MMMM, yyyy", { locale: es })
                                }
                            />
                            <Line
                                type="monotone"
                                dataKey="avgMinutes"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={{ fill: "#10b981", r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>
            )}

            {/* Ticket Promedio */}
            {ticketPromedio?.daily && ticketPromedio.daily.length > 0 && (
                <Card className="p-6 rounded-3xl border border-zinc-200">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-zinc-900">Ticket Promedio</h3>
                        <p className="text-sm text-zinc-500">
                            Evolución del valor promedio por pedido
                        </p>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={ticketPromedio.daily}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(date: string) => format(new Date(date), "dd MMM", { locale: es })}
                                stroke="#71717a"
                                style={{ fontSize: "12px" }}
                            />
                            <YAxis
                                tickFormatter={(value) => formatCurrency(Number(value || 0))}
                                stroke="#71717a"
                                style={{ fontSize: "12px" }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "12px",
                                    padding: "12px",
                                }}
                                formatter={(value) => [formatCurrency(Number(value || 0)), ""]}
                                labelFormatter={(date) =>
                                    format(new Date(date), "dd 'de' MMMM, yyyy", { locale: es })
                                }
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="INTERNO"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                name="Interno"
                                dot={{ fill: "#8b5cf6", r: 3 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="CATALOGO"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                name="Catálogo"
                                dot={{ fill: "#3b82f6", r: 3 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="TOTAL"
                                stroke="#10b981"
                                strokeWidth={3}
                                name="Total"
                                dot={{ fill: "#10b981", r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>
            )}
        </div>
    );
}
