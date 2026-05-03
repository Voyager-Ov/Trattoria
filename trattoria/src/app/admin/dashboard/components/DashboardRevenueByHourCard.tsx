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
    // Show business hours (e.g., 09:00 to 01:00) or at least a wide range
    const chartHours = revenueByHour.filter((item) => {
        const hourInt = parseInt(item.hour);
        return hourInt >= 8 || hourInt <= 1; // 8 AM to 1 AM
    });

    const maxRevenue = Math.max(...chartHours.map((item) => item.revenue), 1);

    return (
        <section className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-100 px-4 py-4 md:px-6 md:py-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Clock3 className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight text-zinc-900">Ventas por franja horaria</h3>
                        <p className="mt-1 text-sm text-zinc-500">Distribución de ingresos a lo largo del día.</p>
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-6">
                {loading ? (
                    <div className="flex h-56 items-end justify-between gap-3">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div key={index} className="flex flex-1 flex-col items-center gap-3">
                                <div className="h-32 w-full animate-pulse rounded-2xl bg-zinc-100" />
                                <div className="h-3 w-10 animate-pulse rounded-full bg-zinc-100" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="no-scrollbar flex h-64 items-end justify-between gap-2 overflow-x-auto pb-2 md:gap-3">
                            {chartHours.map((item) => {
                                const height = item.revenue > 0 ? Math.max(10, (item.revenue / maxRevenue) * 100) : 8;

                                return (
                                    <div key={item.hour} className="flex min-w-[3.5rem] flex-1 flex-col items-center gap-3">
                                        <div className="flex h-44 w-full items-end">
                                            <div className="w-full rounded-xl bg-primary/5 p-1">
                                                <div
                                                    className="w-full rounded-lg bg-primary transition-all duration-500"
                                                    style={{ height: `${height}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-zinc-500">
                                                {item.hour}
                                            </p>
                                            <p className="mt-1 text-[0.7rem] font-bold text-zinc-400">
                                                {item.orders} p.
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="rounded-3xl bg-zinc-50 p-5">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                Franja más fuerte del día
                            </p>
                            {chartHours.length > 0 && Math.max(...chartHours.map(h => h.revenue)) > 0 ? (
                                (() => {
                                    const bestHour = [...chartHours].sort((a, b) => b.revenue - a.revenue)[0];
                                    return (
                                        <div className="mt-3 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[10px] font-black text-primary">
                                                    TOP
                                                </span>
                                                <span className="text-base font-black text-zinc-900">{bestHour.hour}</span>
                                            </div>
                                            <span className="text-lg font-black text-primary">
                                                {formatCurrency(bestHour.revenue)}
                                            </span>
                                        </div>
                                    );
                                })()
                            ) : (
                                <p className="mt-3 text-sm font-bold text-zinc-500">Sin ventas registradas hoy.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
