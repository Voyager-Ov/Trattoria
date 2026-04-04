"use client";

import { useEffect, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { DollarSign, Loader2, Percent, TrendingUp } from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";

import { getMonthlyROI, getProfitabilityByCategoryData, type ProfitabilityByCategoryData } from "./analyticsActions";
import { ReportSurface, truncateLabel } from "./reportes-ui";

interface ProfitabilitySectionProps {
    dateRange: {
        from: Date;
        to: Date;
    };
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(value);

function StatCard({
    title,
    value,
    icon: Icon,
    accent,
}: {
    title: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
}) {
    return (
        <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-6">
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}>
                <Icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-zinc-500">{title}</p>
            <p className="mt-1 break-words text-2xl font-black tracking-tight text-zinc-900 md:text-3xl">{value}</p>
        </div>
    );
}

export default function ProfitabilitySection({ dateRange }: ProfitabilitySectionProps) {
    const isMobile = useIsMobile();
    const [loading, setLoading] = useState(true);
    const [profitabilityByCategory, setProfitabilityByCategory] = useState<ProfitabilityByCategoryData[]>([]);
    const [monthlyROI, setMonthlyROI] = useState<Array<{ month: string; roi: number; ingresos: number; egresos: number }>>([]);

    useEffect(() => {
        let active = true;

        async function loadData() {
            setLoading(true);

            try {
                const year = new Date().getFullYear();
                const [categoryResult, roiResult] = await Promise.all([
                    getProfitabilityByCategoryData(dateRange.from, dateRange.to),
                    getMonthlyROI(year),
                ]);

                if (!active) {
                    return;
                }

                if (categoryResult.success && categoryResult.data) {
                    setProfitabilityByCategory(categoryResult.data);
                }

                if (roiResult.success && roiResult.data) {
                    setMonthlyROI(roiResult.data);
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
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
        );
    }

    const totalIngresos = profitabilityByCategory.reduce((sum, category) => sum + category.ingresos, 0);
    const totalCostos = profitabilityByCategory.reduce((sum, category) => sum + category.costos, 0);
    const totalBeneficio = totalIngresos - totalCostos;
    const margenGlobal = totalIngresos > 0 ? (totalBeneficio / totalIngresos) * 100 : 0;

    return (
        <div className="space-y-5 md:space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
                <StatCard title="Ingresos totales" value={formatCurrency(totalIngresos)} icon={DollarSign} accent="bg-emerald-100 text-emerald-600" />
                <StatCard title="Costos totales" value={formatCurrency(totalCostos)} icon={DollarSign} accent="bg-red-100 text-red-600" />
                <StatCard title="Beneficio neto" value={formatCurrency(totalBeneficio)} icon={TrendingUp} accent="bg-blue-100 text-blue-600" />
                <StatCard title="Margen global" value={`${margenGlobal.toFixed(1)}%`} icon={Percent} accent="bg-lime-100 text-lime-600" />
            </div>

            <ReportSurface title="Rentabilidad por categoria" description="Comparativa entre ingresos, costos y beneficio por categoria.">
                {profitabilityByCategory.length > 0 ? (
                    <div className="space-y-5">
                        <div className="h-[250px] w-full md:h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={profitabilityByCategory} barGap={isMobile ? 8 : 16}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="categoria"
                                        tickFormatter={(value: string) => truncateLabel(value, isMobile ? 8 : 12)}
                                        stroke="#71717a"
                                        style={{ fontSize: "12px" }}
                                        interval={0}
                                        minTickGap={isMobile ? 26 : 14}
                                    />
                                    <YAxis
                                        hide={isMobile}
                                        tickFormatter={(value: number) => formatCurrency(value)}
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
                                        formatter={(value: number | string | undefined) => formatCurrency(Number(value || 0))}
                                    />
                                    {!isMobile ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
                                    <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="costos" fill="#ef4444" name="Costos" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="beneficio" fill="#3b82f6" name="Beneficio" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {isMobile ? (
                            <div className="space-y-3">
                                {profitabilityByCategory.map((category) => (
                                    <article key={category.categoria} className="rounded-[1.4rem] border border-zinc-200 bg-zinc-50 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h4 className="truncate text-base font-black tracking-tight text-zinc-900">{category.categoria}</h4>
                                                <p className="text-xs text-zinc-500">Categoria</p>
                                            </div>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                                    category.margenPorcentaje >= 40
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : category.margenPorcentaje >= 25
                                                          ? "bg-blue-100 text-blue-700"
                                                          : "bg-amber-100 text-amber-700"
                                                }`}
                                            >
                                                {category.margenPorcentaje.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="mt-4 grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Ingresos</p>
                                                <p className="mt-1 text-sm font-semibold text-emerald-700">{formatCurrency(category.ingresos)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Costos</p>
                                                <p className="mt-1 text-sm font-semibold text-red-600">{formatCurrency(category.costos)}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Beneficio</p>
                                                <p className="mt-1 text-sm font-bold text-blue-600">{formatCurrency(category.beneficio)}</p>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-zinc-200">
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-700">Categoria</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-700">Ingresos</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-700">Costos</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-700">Beneficio</th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-700">Margen %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {profitabilityByCategory.map((category) => (
                                            <tr key={category.categoria} className="border-b border-zinc-100 transition-colors hover:bg-zinc-50">
                                                <td className="px-4 py-3 text-sm font-medium text-zinc-900">{category.categoria}</td>
                                                <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-600">{formatCurrency(category.ingresos)}</td>
                                                <td className="px-4 py-3 text-right text-sm font-semibold text-red-600">{formatCurrency(category.costos)}</td>
                                                <td className="px-4 py-3 text-right text-sm font-bold text-blue-600">{formatCurrency(category.beneficio)}</td>
                                                <td className="px-4 py-3 text-right text-sm">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
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
                        )}
                    </div>
                ) : (
                    <div className="py-12 text-center text-sm font-medium text-zinc-500">No hay datos de rentabilidad.</div>
                )}
            </ReportSurface>

            {monthlyROI.length > 0 ? (
                <ReportSurface title="ROI mensual" description="Retorno sobre inversion por mes.">
                    <div className="space-y-5">
                        <div className="h-[260px] w-full md:h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyROI}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="month" stroke="#71717a" style={{ fontSize: "12px" }} />
                                    <YAxis hide={isMobile} stroke="#71717a" style={{ fontSize: "12px" }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#ffffff",
                                            border: "1px solid #e5e7eb",
                                            borderRadius: "12px",
                                            padding: "12px",
                                        }}
                                        formatter={(value: number | string | undefined, name?: string) => {
                                            if (name === "ROI") {
                                                return [`${Number(value || 0).toFixed(1)}%`, "ROI"];
                                            }

                                            return [formatCurrency(Number(value || 0)), name];
                                        }}
                                    />
                                    {!isMobile ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
                                    <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
                                    <Bar dataKey="roi" name="ROI" radius={[8, 8, 0, 0]}>
                                        {monthlyROI.map((entry, index) => (
                                            <Cell key={`${entry.month}-${index}`} fill={entry.roi >= 0 ? "#10b981" : "#ef4444"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            {monthlyROI
                                .filter((month) => month.ingresos > 0 || month.egresos > 0)
                                .map((month) => (
                                    <div key={month.month} className="rounded-[1.3rem] border border-zinc-200 bg-zinc-50 p-4">
                                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">{month.month}</p>
                                        <p className={`mt-2 text-lg font-black tracking-tight ${month.roi >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                            {month.roi.toFixed(1)}%
                                        </p>
                                        <div className="mt-2 space-y-1 text-xs">
                                            <p className="text-emerald-600">Ing: {formatCurrency(month.ingresos)}</p>
                                            <p className="text-red-600">Egr: {formatCurrency(month.egresos)}</p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </ReportSurface>
            ) : null}
        </div>
    );
}
