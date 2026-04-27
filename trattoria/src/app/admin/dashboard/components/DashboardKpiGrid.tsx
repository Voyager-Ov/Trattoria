import { SpectrumIcon } from "@/components/ui/spectrum-icons";
import { formatCurrency } from "@/lib/utils";

import { DashboardMetricCard } from "./DashboardMetricCard";
import type { DashboardMetrics } from "./dashboard-types";

interface DashboardKpiGridProps {
    loading: boolean;
    metrics: DashboardMetrics | null;
}

export function DashboardKpiGrid({ loading, metrics }: DashboardKpiGridProps) {
    return (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <DashboardMetricCard
                title="Ingresos de Hoy"
                value={loading ? "..." : formatCurrency(metrics?.todayRevenue ?? 0)}
                description="Pedidos cobrados hoy"
                headerColor="bg-zinc-900"
                icon={<SpectrumIcon variant="diamond" className="h-5 w-5" />}
            />
            <DashboardMetricCard
                title="Pedidos de Hoy"
                value={loading ? "..." : metrics?.todayOrders ?? 0}
                description="Ingresados en el dia"
                headerColor="bg-orange-500"
                icon={<SpectrumIcon variant="cube" className="h-5 w-5" />}
            />
            <DashboardMetricCard
                title="Ticket Promedio"
                value={loading ? "..." : formatCurrency(metrics?.todayAverageTicket ?? 0)}
                description="Sobre ventas cobradas hoy"
                headerColor="bg-emerald-600"
                icon={<SpectrumIcon variant="wave" className="h-5 w-5" />}
            />
            <DashboardMetricCard
                title="En Cocina"
                value={loading ? "..." : metrics?.ordersInKitchen ?? 0}
                description="Pedidos en preparacion"
                headerColor="bg-indigo-600"
                icon={<SpectrumIcon variant="nodes" className="h-5 w-5" />}
            />
            <DashboardMetricCard
                title="Sin Disponibilidad"
                value={loading ? "..." : metrics?.unavailableProductsCount ?? 0}
                description="Productos no visibles para venta"
                headerColor="bg-rose-600"
                icon={<SpectrumIcon variant="starburst" className="h-5 w-5" />}
                tone={loading ? "default" : (metrics?.unavailableProductsCount ?? 0) > 0 ? "alert" : "default"}
            />
            <DashboardMetricCard
                title="Insumos Criticos"
                value={loading ? "..." : metrics?.criticalSuppliesCount ?? 0}
                description={
                    loading
                        ? undefined
                        : `${metrics?.suppliesBelowMinimumCount ?? 0} insumos requieren seguimiento`
                }
                headerColor="bg-amber-500"
                icon={<SpectrumIcon variant="organic" className="h-5 w-5" />}
                tone={loading ? "default" : (metrics?.criticalSuppliesCount ?? 0) > 0 ? "alert" : "default"}
            />
        </section>
    );
}
