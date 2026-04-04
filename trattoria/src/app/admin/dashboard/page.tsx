"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

import { getDashboardMetrics, getRecentActivity } from "./actions";
import { DashboardHero } from "./components/DashboardHero";
import { DashboardKpiGrid } from "./components/DashboardKpiGrid";
import { RecentOrdersCard } from "./components/RecentOrdersCard";
import { WeeklyRevenueCard } from "./components/WeeklyRevenueCard";
import type { DashboardMetrics, RecentActivityItem } from "./components/dashboard-types";

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [activity, setActivity] = useState<RecentActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);

        try {
            const [metricsRes, activityRes] = await Promise.all([
                getDashboardMetrics(),
                getRecentActivity(),
            ]);

            if (metricsRes.success) {
                setMetrics(metricsRes.data as DashboardMetrics);
            }

            if (activityRes.success) {
                setActivity(activityRes.data as RecentActivityItem[]);
            }
        } catch (error) {
            console.error("Dashboard load error:", error);
            toast.error("Error al cargar datos del dashboard");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const currentDateLabel = format(new Date(), "EEEE, dd 'de' MMMM", { locale: es });

    return (
        <div className="app-page-safe-bottom animate-in space-y-4 fade-in duration-700 md:space-y-6">
            <DashboardHero currentDateLabel={currentDateLabel} />

            <DashboardKpiGrid loading={loading} metrics={metrics} />

            <div className="grid grid-cols-1 gap-5 xl:mb-12 xl:grid-cols-12 xl:gap-6">
                <div className="xl:col-span-7">
                    <WeeklyRevenueCard
                        loading={loading}
                        weeklyRevenue={metrics?.weeklyRevenue ?? []}
                        totalSales={metrics?.totalSales ?? 0}
                    />
                </div>

                <div className="xl:col-span-5">
                    <RecentOrdersCard loading={loading} activity={activity} />
                </div>
            </div>

            <div
                aria-hidden
                className="rounded-[1.75rem] bg-white/55 md:hidden"
                style={{ minHeight: "calc(var(--admin-mobile-nav-height) - 0.5rem)" }}
            />
        </div>
    );
}
