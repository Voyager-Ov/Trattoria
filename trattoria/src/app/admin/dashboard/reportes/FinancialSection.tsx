"use client";

import { useEffect, useState } from "react";
import {
    Bar,
    BarChart,
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
import {
    ArrowDown,
    ArrowUp,
    DollarSign,
    Loader2,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { useIsMobile } from "@/hooks/use-mobile";

import {
    DailyFinancialData,
    EgresoByCategoryData,
    getEgresosByCategoryData,
    getFinancialData,
    getPaymentMethodsData,
    PaymentMethodData,
} from "./analyticsActions";
import { ReportLegendList, ReportSurface, truncateLabel } from "./reportes-ui";

interface FinancialSectionProps {
    dateRange: {
        from: Date;
        to: Date;
    };
}

const PAYMENT_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#6366f1"];
const CATEGORY_COLORS: Record<string, string> = {
    INSUMOS: "#ef4444",
    SERVICIOS: "#f59e0b",
    NOMINA: "#8b5cf6",
    MANTENIMIENTO: "#3b82f6",
    OTROS: "#6b7280",
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(value);

function KPICard({
    title,
    value,
    change,
    changeType,
    icon: Icon,
    tone,
}: {
    title: string;
    value: string;
    change?: string;
    changeType?: "up" | "down";
    icon: React.ComponentType<{ className?: string }>;
    tone: "emerald" | "red" | "blue";
}) {
    const toneClasses = {
        emerald: "bg-emerald-100 text-emerald-600",
        red: "bg-red-100 text-red-600",
        blue: "bg-blue-100 text-blue-600",
    }[tone];

    return (
        <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses}`}>
                    <Icon className="h-5 w-5" />
                </div>
                {change ? (
                    <div
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${
                            changeType === "up" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                        }`}
                    >
                        {changeType === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {change}
                    </div>
                ) : null}
            </div>
            <p className="text-sm font-medium text-zinc-500">{title}</p>
            <p className="mt-1 break-words text-2xl font-black tracking-tight text-zinc-900 md:text-3xl">{value}</p>
        </div>
    );
}

export default function FinancialSection({ dateRange }: FinancialSectionProps) {
    const isMobile = useIsMobile();
    const [loading, setLoading] = useState(true);
    const [dailyData, setDailyData] = useState<DailyFinancialData[]>([]);
    const [totals, setTotals] = useState({ ingresos: 0, egresos: 0, balance: 0 });
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);
    const [egresosCategory, setEgresosCategory] = useState<EgresoByCategoryData[]>([]);

    useEffect(() => {
        let active = true;

        async function loadData() {
            setLoading(true);

            try {
                const [financialResult, paymentResult, egresosResult] = await Promise.all([
                    getFinancialData(dateRange.from, dateRange.to),
                    getPaymentMethodsData(dateRange.from, dateRange.to),
                    getEgresosByCategoryData(dateRange.from, dateRange.to),
                ]);

                if (!active) {
                    return;
                }

                if (financialResult.success && financialResult.data) {
                    setDailyData(financialResult.data.dailyData);
                    setTotals(financialResult.data.totals);
                }

                if (paymentResult.success && paymentResult.data) {
                    setPaymentMethods(paymentResult.data);
                }

                if (egresosResult.success && egresosResult.data) {
                    setEgresosCategory(egresosResult.data);
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
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    const paymentLegend = paymentMethods.map((method, index) => ({
        label: method.method,
        value: formatCurrency(method.amount),
        meta: `${method.percentage.toFixed(1)}%`,
        color: PAYMENT_COLORS[index % PAYMENT_COLORS.length],
    }));

    const egresosLegend = egresosCategory.map((entry) => ({
        label: entry.categoria,
        value: formatCurrency(entry.amount),
        meta: `${entry.percentage.toFixed(1)}%`,
        color: CATEGORY_COLORS[entry.categoria] || "#6b7280",
    }));

    return (
        <div className="space-y-5 md:space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 md:gap-6">
                <KPICard title="Ingresos Totales" value={formatCurrency(totals.ingresos)} icon={DollarSign} tone="emerald" />
                <KPICard title="Egresos Totales" value={formatCurrency(totals.egresos)} icon={TrendingDown} tone="red" />
                <KPICard
                    title="Balance Neto"
                    value={formatCurrency(totals.balance)}
                    changeType={totals.balance >= 0 ? "up" : "down"}
                    icon={totals.balance >= 0 ? TrendingUp : TrendingDown}
                    tone={totals.balance >= 0 ? "emerald" : "red"}
                />
            </div>

            <ReportSurface
                title="Flujo financiero"
                description="Evolucion de ingresos, egresos y balance en el tiempo."
            >
                {dailyData.length > 0 ? (
                    <div className="h-[260px] w-full md:h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="date"
                                    minTickGap={isMobile ? 28 : 16}
                                    tickFormatter={(date: string) => {
                                        const isSingleDay = dateRange.from.toDateString() === dateRange.to.toDateString();
                                        return isSingleDay
                                            ? format(new Date(date), "HH:mm")
                                            : format(new Date(date), "dd MMM", { locale: es });
                                    }}
                                    stroke="#71717a"
                                    style={{ fontSize: "12px" }}
                                />
                                <YAxis
                                    hide={isMobile}
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
                                    labelFormatter={(date) => {
                                        const isSingleDay = dateRange.from.toDateString() === dateRange.to.toDateString();
                                        return isSingleDay
                                            ? format(new Date(date), "HH:mm 'hs'", { locale: es })
                                            : format(new Date(date), "dd 'de' MMMM, yyyy", { locale: es });
                                    }}
                                />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Line type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={3} name="Ingresos" dot={false} />
                                <Line type="monotone" dataKey="egresos" stroke="#ef4444" strokeWidth={3} name="Egresos" dot={false} />
                                <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={3} name="Balance" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="py-12 text-center text-sm font-medium text-zinc-500">No hay datos financieros para este periodo.</div>
                )}
            </ReportSurface>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 md:gap-6">
                <ReportSurface
                    title="Metodos de pago"
                    description="Distribucion de ingresos por forma de pago."
                >
                    {paymentMethods.length > 0 ? (
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                            <div className="mx-auto h-[220px] w-full max-w-[260px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={paymentMethods}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={isMobile ? 72 : 92}
                                            dataKey="amount"
                                        >
                                            {paymentMethods.map((entry, index) => (
                                                <Cell key={`${entry.method}-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(Number(value || 0))} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <ReportLegendList items={paymentLegend} />
                        </div>
                    ) : (
                        <div className="py-12 text-center text-sm font-medium text-zinc-500">No hay datos de metodos de pago.</div>
                    )}
                </ReportSurface>

                <ReportSurface
                    title="Egresos por categoria"
                    description="Distribucion de gastos por tipo."
                >
                    {egresosCategory.length > 0 ? (
                        <div className="space-y-4">
                            <div className="h-[260px] w-full md:h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={egresosCategory} layout="vertical" margin={{ left: isMobile ? 8 : 20, right: 16 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis
                                            type="number"
                                            hide={isMobile}
                                            tickFormatter={(value) => formatCurrency(Number(value || 0))}
                                            stroke="#71717a"
                                            style={{ fontSize: "12px" }}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="categoria"
                                            width={isMobile ? 78 : 110}
                                            tickFormatter={(value: string) => truncateLabel(value, isMobile ? 8 : 12)}
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
                                                    key={`${entry.categoria}-${index}`}
                                                    fill={CATEGORY_COLORS[entry.categoria as keyof typeof CATEGORY_COLORS] || "#6b7280"}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            {isMobile ? <ReportLegendList items={egresosLegend} /> : null}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-sm font-medium text-zinc-500">No hay datos de egresos.</div>
                    )}
                </ReportSurface>
            </div>
        </div>
    );
}
