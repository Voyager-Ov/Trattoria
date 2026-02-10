"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { 
    LineChart, 
    Line, 
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer 
} from "recharts";
import { 
    DollarSign, 
    TrendingUp, 
    TrendingDown,
    ArrowUp,
    ArrowDown,
    Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    getFinancialData,
    getPaymentMethodsData,
    getEgresosByCategoryData,
    DailyFinancialData,
    PaymentMethodData,
    EgresoByCategoryData,
} from "./analyticsActions";

interface FinancialSectionProps {
    dateRange: {
        from: Date;
        to: Date;
    };
}

// Utilidad de formato
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(value);
};

// Componente de KPI Card
function KPICard({
    title,
    value,
    change,
    changeType,
    icon: Icon,
    color = "emerald",
}: {
    title: string;
    value: string;
    change?: string;
    changeType?: "up" | "down";
    icon: React.ComponentType<{ className?: string }>;
    color?: string;
}) {
    const colorClasses = {
        emerald: "bg-emerald-100 text-emerald-600",
        red: "bg-red-100 text-red-600",
        blue: "bg-blue-100 text-blue-600",
    }[color];

    return (
        <Card className="p-6 rounded-3xl border border-zinc-200 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-start justify-between mb-4">
                <div className={`h-12 w-12 ${colorClasses} rounded-2xl flex items-center justify-center`}>
                    <Icon className="h-6 w-6" />
                </div>
                {change && (
                    <div
                        className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                            changeType === "up"
                                ? "text-emerald-600 bg-emerald-50"
                                : "text-red-600 bg-red-50"
                        }`}
                    >
                        {changeType === "up" ? (
                            <ArrowUp className="h-3 w-3" />
                        ) : (
                            <ArrowDown className="h-3 w-3" />
                        )}
                        {change}
                    </div>
                )}
            </div>
            <div>
                <p className="text-sm text-zinc-500 font-medium mb-1">{title}</p>
                <p className="text-2xl font-bold text-zinc-900">{value}</p>
            </div>
        </Card>
    );
}

export default function FinancialSection({ dateRange }: FinancialSectionProps) {
    const [loading, setLoading] = useState(true);
    const [dailyData, setDailyData] = useState<DailyFinancialData[]>([]);
    const [totals, setTotals] = useState({ ingresos: 0, egresos: 0, balance: 0 });
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);
    const [egresosCategory, setEgresosCategory] = useState<EgresoByCategoryData[]>([]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Cargar datos financieros
            const financialResult = await getFinancialData(dateRange.from, dateRange.to);
            if (financialResult.success && financialResult.data) {
                setDailyData(financialResult.data.dailyData);
                setTotals(financialResult.data.totals);
            }

            // Cargar métodos de pago
            const paymentResult = await getPaymentMethodsData(dateRange.from, dateRange.to);
            if (paymentResult.success && paymentResult.data) {
                setPaymentMethods(paymentResult.data);
            }

            // Cargar egresos por categoría
            const egresosResult = await getEgresosByCategoryData(dateRange.from, dateRange.to);
            if (egresosResult.success && egresosResult.data) {
                setEgresosCategory(egresosResult.data);
            }
        } catch (error) {
            console.error("Error loading financial data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange]);

    // Colores para gráficos
    const PAYMENT_COLORS = [
        "#10b981", // emerald
        "#3b82f6", // blue
        "#f59e0b", // amber
        "#8b5cf6", // violet
        "#ec4899", // pink
        "#6366f1", // indigo
    ];

    const CATEGORY_COLORS = {
        INSUMOS: "#ef4444", // red
        SERVICIOS: "#f59e0b", // amber
        NOMINA: "#8b5cf6", // violet
        MANTENIMIENTO: "#3b82f6", // blue
        OTROS: "#6b7280", // gray
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* KPIs principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard
                    title="Ingresos Totales"
                    value={formatCurrency(totals.ingresos)}
                    icon={DollarSign}
                    color="emerald"
                />
                <KPICard
                    title="Egresos Totales"
                    value={formatCurrency(totals.egresos)}
                    icon={TrendingDown}
                    color="red"
                />
                <KPICard
                    title="Balance Neto"
                    value={formatCurrency(totals.balance)}
                    changeType={totals.balance >= 0 ? "up" : "down"}
                    icon={totals.balance >= 0 ? TrendingUp : TrendingDown}
                    color={totals.balance >= 0 ? "emerald" : "red"}
                />
            </div>

            {/* Gráfico principal: Ingresos vs Egresos vs Balance */}
            <Card className="p-6 rounded-3xl border border-zinc-200">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-zinc-900">
                        Flujo Financiero
                    </h3>
                    <p className="text-sm text-zinc-500">
                        Evolución de ingresos, egresos y balance en el tiempo
                    </p>
                </div>
                
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={dailyData}>
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
                            labelFormatter={(date) => format(new Date(date), "dd 'de' MMMM, yyyy", { locale: es })}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="ingresos"
                            stroke="#10b981"
                            strokeWidth={3}
                            name="Ingresos"
                            dot={{ fill: "#10b981", r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="egresos"
                            stroke="#ef4444"
                            strokeWidth={3}
                            name="Egresos"
                            dot={{ fill: "#ef4444", r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="balance"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            name="Balance"
                            dot={{ fill: "#3b82f6", r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            {/* Segunda fila: Distribución de pagos y egresos por categoría */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribución de Ingresos por Método de Pago */}
                <Card className="p-6 rounded-3xl border border-zinc-200">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-zinc-900">
                            Métodos de Pago
                        </h3>
                        <p className="text-sm text-zinc-500">
                            Distribución de ingresos por forma de pago
                        </p>
                    </div>

                    {paymentMethods.length > 0 ? (
                        <div className="flex flex-col lg:flex-row items-center gap-8">
                            <ResponsiveContainer width="50%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={paymentMethods}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="amount"
                                    >
                                        {paymentMethods.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => formatCurrency(Number(value || 0))}
                                    />
                                </PieChart>
                            </ResponsiveContainer>

                            <div className="flex-1 space-y-3">
                                {paymentMethods.map((method, index) => (
                                    <div key={method.method} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: PAYMENT_COLORS[index % PAYMENT_COLORS.length] }}
                                            />
                                            <span className="text-sm font-medium text-zinc-700">
                                                {method.method}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-zinc-900">
                                                {formatCurrency(method.amount)}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                {method.percentage.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-zinc-500 py-12">
                            No hay datos de métodos de pago
                        </div>
                    )}
                </Card>

                {/* Egresos por Categoría */}
                <Card className="p-6 rounded-3xl border border-zinc-200">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-zinc-900">
                            Egresos por Categoría
                        </h3>
                        <p className="text-sm text-zinc-500">
                            Distribución de gastos por tipo
                        </p>
                    </div>

                    {egresosCategory.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={egresosCategory}
                                layout="vertical"
                                margin={{ left: 20, right: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    type="number"
                                    tickFormatter={(value) => formatCurrency(Number(value || 0))}
                                    stroke="#71717a"
                                    style={{ fontSize: "12px" }}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="categoria"
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
                                    formatter={(value) => [formatCurrency(Number(value || 0)), "Monto"]}
                                />
                                <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
                                    {egresosCategory.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={CATEGORY_COLORS[entry.categoria as keyof typeof CATEGORY_COLORS] || "#6b7280"}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-zinc-500 py-12">
                            No hay datos de egresos
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
