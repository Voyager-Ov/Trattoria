"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";
import { Loader2, TrendingUp, DollarSign, Percent } from "lucide-react";
import {
    getProfitabilityByCategoryData,
    getMonthlyROI,
    ProfitabilityByCategoryData,
} from "./analyticsActions";

interface ProfitabilitySectionProps {
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

export default function ProfitabilitySection({ dateRange }: ProfitabilitySectionProps) {
    const [loading, setLoading] = useState(true);
    const [profitabilityByCategory, setProfitabilityByCategory] = useState<
        ProfitabilityByCategoryData[]
    >([]);
    const [monthlyROI, setMonthlyROI] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, [dateRange]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Rentabilidad por categoría
            const categoryResult = await getProfitabilityByCategoryData(
                dateRange.from,
                dateRange.to
            );
            if (categoryResult.success && categoryResult.data) {
                setProfitabilityByCategory(categoryResult.data);
            }

            // ROI mensual (del año actual)
            const year = new Date().getFullYear();
            const roiResult = await getMonthlyROI(year);
            if (roiResult.success && roiResult.data) {
                setMonthlyROI(roiResult.data);
            }
        } catch (error) {
            console.error("Error loading profitability data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
        );
    }

    // Calcular totales
    const totalIngresos = profitabilityByCategory.reduce(
        (sum, c) => sum + c.ingresos,
        0
    );
    const totalCostos = profitabilityByCategory.reduce((sum, c) => sum + c.costos, 0);
    const totalBeneficio = totalIngresos - totalCostos;
    const margenGlobal =
        totalIngresos > 0 ? (totalBeneficio / totalIngresos) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6 rounded-3xl border border-zinc-200">
                    <div className="flex items-start justify-between mb-4">
                        <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                            <DollarSign className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-sm text-zinc-500 font-medium mb-1">Ingresos Totales</p>
                    <p className="text-2xl font-bold text-zinc-900">
                        {formatCurrency(totalIngresos)}
                    </p>
                </Card>

                <Card className="p-6 rounded-3xl border border-zinc-200">
                    <div className="flex items-start justify-between mb-4">
                        <div className="h-12 w-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                            <DollarSign className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-sm text-zinc-500 font-medium mb-1">Costos Totales</p>
                    <p className="text-2xl font-bold text-zinc-900">
                        {formatCurrency(totalCostos)}
                    </p>
                </Card>

                <Card className="p-6 rounded-3xl border border-zinc-200">
                    <div className="flex items-start justify-between mb-4">
                        <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-sm text-zinc-500 font-medium mb-1">Beneficio Neto</p>
                    <p className="text-2xl font-bold text-zinc-900">
                        {formatCurrency(totalBeneficio)}
                    </p>
                </Card>

                <Card className="p-6 rounded-3xl border border-zinc-200">
                    <div className="flex items-start justify-between mb-4">
                        <div className="h-12 w-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                            <Percent className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-sm text-zinc-500 font-medium mb-1">Margen Global</p>
                    <p className="text-2xl font-bold text-zinc-900">
                        {margenGlobal.toFixed(1)}%
                    </p>
                </Card>
            </div>

            {/* Rentabilidad por Categoría */}
            <Card className="p-6 rounded-3xl border border-zinc-200">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-zinc-900">
                        Rentabilidad por Categoría
                    </h3>
                    <p className="text-sm text-zinc-500">
                        Análisis de ingresos, costos y beneficios por categoría
                    </p>
                </div>

                {profitabilityByCategory.length > 0 ? (
                    <>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={profitabilityByCategory}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="categoria"
                                    stroke="#71717a"
                                    style={{ fontSize: "12px" }}
                                />
                                <YAxis
                                    tickFormatter={(value: any) => formatCurrency(value)}
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
                                    formatter={(value: any) => formatCurrency(Number(value))}
                                />
                                <Legend />
                                <Bar
                                    dataKey="ingresos"
                                    fill="#10b981"
                                    name="Ingresos"
                                    radius={[8, 8, 0, 0]}
                                />
                                <Bar
                                    dataKey="costos"
                                    fill="#ef4444"
                                    name="Costos"
                                    radius={[8, 8, 0, 0]}
                                />
                                <Bar
                                    dataKey="beneficio"
                                    fill="#3b82f6"
                                    name="Beneficio"
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>

                        {/* Tabla detallada */}
                        <div className="mt-8 overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-zinc-200">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">
                                            Categoría
                                        </th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-700">
                                            Ingresos
                                        </th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-700">
                                            Costos
                                        </th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-700">
                                            Beneficio
                                        </th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-700">
                                            Margen %
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {profitabilityByCategory.map((category) => (
                                        <tr
                                            key={category.categoria}
                                            className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
                                        >
                                            <td className="py-3 px-4 text-sm font-medium text-zinc-900">
                                                {category.categoria}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-right text-emerald-600 font-semibold">
                                                {formatCurrency(category.ingresos)}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-right text-red-600 font-semibold">
                                                {formatCurrency(category.costos)}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-right text-blue-600 font-bold">
                                                {formatCurrency(category.beneficio)}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-right">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                                        category.margenPorcentaje >= 40
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : category.margenPorcentaje >= 25
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-amber-100 text-amber-700"
                                                    }`}
                                                >
                                                    {category.margenPorcentaje.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-zinc-500 py-12">
                        No hay datos de rentabilidad
                    </div>
                )}
            </Card>

            {/* ROI Mensual */}
            {monthlyROI.length > 0 && (
                <Card className="p-6 rounded-3xl border border-zinc-200">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-zinc-900">ROI Mensual</h3>
                        <p className="text-sm text-zinc-500">
                            Retorno sobre inversión por mes
                        </p>
                    </div>

                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={monthlyROI}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="month"
                                stroke="#71717a"
                                style={{ fontSize: "12px" }}
                            />
                            <YAxis
                                stroke="#71717a"
                                style={{ fontSize: "12px" }}
                                label={{ value: "ROI %", angle: -90, position: "insideLeft" }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "12px",
                                    padding: "12px",
                                }}
                                formatter={(value: any, name?: string) => {
                                    if (name === "roi") return [`${Number(value).toFixed(1)}%`, "ROI"];
                                    return [formatCurrency(Number(value)), name];
                                }}
                            />
                            <Legend />
                            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
                            <Bar
                                dataKey="roi"
                                name="ROI"
                                radius={[8, 8, 0, 0]}
                                fill="#3b82f6"
                            >
                                {monthlyROI.map((entry, index) => (
                                    <rect
                                        key={`cell-${index}`}
                                        fill={entry.roi >= 0 ? "#10b981" : "#ef4444"}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Desglose mensual */}
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {monthlyROI.filter(m => m.ingresos > 0 || m.egresos > 0).map((month) => (
                            <div
                                key={month.month}
                                className="p-4 rounded-xl bg-zinc-50 border border-zinc-200"
                            >
                                <p className="text-xs font-semibold text-zinc-500 uppercase mb-2">
                                    {month.month}
                                </p>
                                <p className="text-lg font-bold text-zinc-900 mb-1">
                                    {month.roi.toFixed(1)}%
                                </p>
                                <div className="space-y-1">
                                    <p className="text-xs text-emerald-600">
                                        Ing: {formatCurrency(month.ingresos)}
                                    </p>
                                    <p className="text-xs text-red-600">
                                        Egr: {formatCurrency(month.egresos)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
