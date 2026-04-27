import { Clock3 } from "lucide-react";

import { formatCurrency } from "@/lib/utils";

interface RevenueByHourItem {
    hour: string;
    revenue: number;
    orders: number;
}

interface DashboardRevenueByHourCardProps {
    loading: boolean;
    revenueByHour: RevenueByHourItem[];
}

export function DashboardRevenueByHourCard({
    loading,
    revenueByHour,
}: DashboardRevenueByHourCardProps) {
    const visibleHours = revenueByHour.filter((item) => item.revenue > 0 || item.orders > 0);
    const chartHours = visibleHours.length > 0 ? visibleHours : revenueByHour.slice(10, 15);
    const maxRevenue = Math.max(...chartHours.map((item) => item.revenue), 1);

    return (
        <section className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm md:rounded-[2rem]">
            <div className="border-b border-zinc-100 px-4 py-4 md:px-6 md:py-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                        <Clock3 className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight text-zinc-900">Ventas por franja horaria</h3>
                        <p className="mt-1 text-sm text-zinc-500">Distribucion de ingresos a lo largo del dia.</p>
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-6">
                {loading ? (
                    <div className="flex h-56 items-end justify-between gap-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="flex flex-1 flex-col items-center gap-3">
                                <div className="h-32 w-full animate-pulse rounded-2xl bg-zinc-100" />
                                <div className="h-3 w-10 animate-pulse rounded-full bg-zinc-100" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex h-56 items-end justify-between gap-3">
                            {chartHours.map((item) => {
                                const height = item.revenue > 0 ? Math.max(10, (item.revenue / maxRevenue) * 100) : 8;

                                return (
                                    <div key={item.hour} className="flex flex-1 flex-col items-center gap-3">
                                        <div className="flex h-40 w-full items-end">
                                            <div className="w-full rounded-xl bg-sky-500/15 p-1">
                                                <div
                                                    className="w-full rounded-lg bg-sky-500 transition-all duration-500"
                                                    style={{ height: `${height}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-zinc-500">
                                                {item.hour}
                                            </p>
                                            <p className="mt-1 text-[0.7rem] font-semibold text-zinc-400">
                                                {item.orders} pedidos
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="rounded-[1.25rem] bg-zinc-50 p-4">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">
                                Franja mas fuerte del dia
                            </p>
                            {chartHours.length > 0 ? (
                                (() => {
                                    const bestHour = [...chartHours].sort((a, b) => b.revenue - a.revenue)[0];
                                    return (
                                        <div className="mt-2 flex items-center justify-between gap-3">
                                            <span className="text-sm font-bold text-zinc-900">{bestHour.hour}</span>
                                            <span className="text-sm font-black text-zinc-900">
                                                {formatCurrency(bestHour.revenue)}
                                            </span>
                                        </div>
                                    );
                                })()
                            ) : (
                                <p className="mt-2 text-sm font-semibold text-zinc-500">Sin ventas registradas hoy.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
