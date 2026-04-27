import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface WeeklyRevenueDatum {
    day: string;
    revenue: number;
}

interface WeeklyRevenueCardProps {
    loading: boolean;
    weeklyRevenue: WeeklyRevenueDatum[];
    topProduct: {
        nombre: string;
        count: number;
        revenue: number;
        periodLabel: string;
    } | null;
}

function LoadingBars() {
    return (
        <div className="flex h-full items-end justify-between gap-2 px-1 sm:gap-3 md:gap-4">
            {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="flex flex-1 flex-col items-center gap-3">
                    <div className="flex h-40 w-full items-end rounded-2xl bg-zinc-100 px-1 py-2 sm:h-48">
                        <div
                            className="w-full animate-pulse rounded-xl bg-zinc-200"
                            style={{ height: `${35 + index * 6}%` }}
                        />
                    </div>
                    <div className="h-3 w-8 animate-pulse rounded-full bg-zinc-100" />
                </div>
            ))}
        </div>
    );
}

export function WeeklyRevenueCard({ loading, weeklyRevenue, topProduct }: WeeklyRevenueCardProps) {
    const safeWeeklyRevenue = weeklyRevenue.length > 0
        ? weeklyRevenue
        : [
            { day: "LUN", revenue: 0 },
            { day: "MAR", revenue: 0 },
            { day: "MIE", revenue: 0 },
            { day: "JUE", revenue: 0 },
            { day: "VIE", revenue: 0 },
            { day: "SAB", revenue: 0 },
            { day: "DOM", revenue: 0 },
        ];

    const maxRevenue = Math.max(...safeWeeklyRevenue.map((item) => item.revenue), 1);
    const weekTotal = safeWeeklyRevenue.reduce((sum, item) => sum + item.revenue, 0);
    const bestDay = safeWeeklyRevenue.reduce((best, item) => (item.revenue > best.revenue ? item : best), safeWeeklyRevenue[0]);

    return (
        <section className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm md:rounded-[2.5rem]">
            <div className="border-b border-zinc-100 px-4 py-4 sm:px-6 md:px-8 md:py-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="text-lg font-bold tracking-tight text-zinc-900 md:text-xl">Rendimiento Semanal</h3>
                        <p className="mt-1 text-sm text-zinc-400">Comparativa de ingresos diarios</p>
                    </div>

                    <Link href="/admin/dashboard/reportes" className="hidden md:inline-flex">
                        <Button variant="outline" className="rounded-full border-zinc-200 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-zinc-600">
                            Ver Reporte Completo
                        </Button>
                    </Link>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 md:mt-5">
                    <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 px-3 py-3">
                        <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-zinc-400">Mejor dia</p>
                        <p className="mt-1 text-sm font-bold text-zinc-900">{bestDay.day}</p>
                        <p className="text-xs text-zinc-500">{loading ? "..." : formatCurrency(bestDay.revenue)}</p>
                    </div>
                    <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 px-3 py-3">
                        <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-zinc-400">Semana</p>
                        <p className="mt-1 text-sm font-bold text-zinc-900">{loading ? "..." : formatCurrency(weekTotal)}</p>
                        <p className="text-xs text-zinc-500">Acumulado semanal</p>
                    </div>
                </div>

                <Link href="/admin/dashboard/reportes" className="mt-4 inline-flex md:hidden">
                    <Button variant="outline" className="w-full rounded-2xl border-zinc-200 text-sm font-semibold text-zinc-700">
                        Ver Reporte Completo
                    </Button>
                </Link>
            </div>

            <div className="bg-zinc-50/40 px-4 py-5 sm:px-6 md:px-8 md:py-8">
                <div className="h-56 sm:h-64">
                    {loading ? (
                        <LoadingBars />
                    ) : (
                        <div className="flex h-full items-end justify-between gap-2 px-1 sm:gap-3 md:gap-4">
                            {safeWeeklyRevenue.map((data) => {
                                const heightPercentage = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                                const finalHeight = data.revenue > 0 ? Math.max(8, heightPercentage) : 6;

                                return (
                                    <div key={data.day} className="group flex flex-1 flex-col items-center gap-2">
                                        <div className="flex h-44 w-full items-end sm:h-52">
                                            <div className="relative w-full">
                                                <div className="absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-2 py-1 text-[0.65rem] font-bold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:block">
                                                    {formatCurrency(data.revenue)}
                                                </div>
                                                <div
                                                    className="w-full rounded-xl bg-zinc-200 transition-all duration-500 group-hover:bg-zinc-900"
                                                    style={{ height: `${finalHeight}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-zinc-400">
                                            {data.day}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-4 bg-zinc-900 px-4 py-5 text-white sm:px-6 md:flex-row md:items-center md:justify-between md:px-8 md:py-6">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 md:h-12 md:w-12">
                        <ArrowUpRight className="text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-base font-bold md:text-lg">Producto mas vendido</p>
                        <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-white/50 md:text-xs">
                            {topProduct?.periodLabel || "Sin ventas recientes"}
                        </p>
                    </div>
                </div>
                <div className="min-w-0 text-left md:text-right">
                    <p className="truncate text-lg font-black md:text-2xl">
                        {loading ? "..." : topProduct?.nombre || "Sin datos"}
                    </p>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/60">
                        {loading
                            ? "..."
                            : topProduct
                                ? `${formatCurrency(topProduct.revenue)}`
                                : "Sin movimientos"}
                    </p>
                </div>
            </div>
        </section>
    );
}
