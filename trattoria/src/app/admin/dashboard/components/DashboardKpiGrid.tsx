import { SpectrumIcon } from "@/components/ui/spectrum-icons";

import { DashboardMetricCard } from "./DashboardMetricCard";
import type { DashboardMetrics } from "./dashboard-types";

interface DashboardKpiGridProps {
    loading: boolean;
    metrics: DashboardMetrics | null;
}

export function DashboardKpiGrid({ loading, metrics }: DashboardKpiGridProps) {
    return (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardMetricCard
                title="Ventas de Hoy"
                value={loading ? "..." : metrics?.salesToday ?? 0}
                change={metrics?.salesGrowth}
                headerColor="bg-zinc-900"
                icon={<SpectrumIcon variant="diamond" className="h-5 w-5" />}
            />
            <DashboardMetricCard
                title="Pedidos de Hoy"
                value={loading ? "..." : metrics?.totalOrdersToday ?? 0}
                description={`${metrics?.pendingOrders ?? 0} pendientes`}
                headerColor="bg-orange-500"
                icon={<SpectrumIcon variant="cube" className="h-5 w-5" />}
            />
            <DashboardMetricCard
                title="Clientes Activos"
                value={loading ? "..." : metrics?.activeCustomers ?? 0}
                headerColor="bg-indigo-600"
                icon={<SpectrumIcon variant="nodes" className="h-5 w-5" />}
            />
            <DashboardMetricCard
                isPrimary
                title="Meta Mensual"
                value={loading ? "..." : `${metrics?.monthlyGoal?.progress ?? 0}%`}
                description="Progreso del mes"
                headerColor="bg-emerald-600"
                icon={<SpectrumIcon variant="wave" className="h-5 w-5" />}
                monthlyGoal={metrics?.monthlyGoal}
            />
        </section>
    );
}
