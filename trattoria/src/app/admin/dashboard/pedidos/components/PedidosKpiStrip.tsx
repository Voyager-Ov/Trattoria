import { CheckCircle2, ChefHat, Clock } from "lucide-react";

import { DashboardMetricCard } from "../../components/DashboardMetricCard";

interface PedidosKpiStripProps {
    metrics: {
        received: number;
        pending: number;
        preparing: number;
        ready: number;
    };
}

export function PedidosKpiStrip({ metrics }: PedidosKpiStripProps) {
    return (
        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <DashboardMetricCard
                title="Recibidos"
                value={metrics.received}
                icon={<Clock size={16} />}
                headerColor="bg-zinc-900"
                description="Ingresados hoy"
            />
            <DashboardMetricCard
                title="Pendientes"
                value={metrics.pending}
                icon={<Clock size={16} />}
                headerColor="bg-amber-500"
                description="En espera"
            />
            <DashboardMetricCard
                title="En Cocina"
                value={metrics.preparing}
                icon={<ChefHat size={16} />}
                headerColor="bg-blue-500"
                description="En preparacion"
            />
            <DashboardMetricCard
                title="Listos"
                value={metrics.ready}
                icon={<CheckCircle2 size={16} />}
                headerColor="bg-emerald-500"
                description="Para entrega"
            />
        </section>
    );
}
