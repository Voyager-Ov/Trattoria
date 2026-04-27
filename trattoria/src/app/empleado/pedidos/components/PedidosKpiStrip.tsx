import { CheckCircle2, ChefHat, Clock } from "lucide-react";
import type { ReactNode } from "react";

function KpiCard({
    title,
    value,
    icon,
    headerClassName,
    description,
}: {
    title: string;
    value: number;
    icon: ReactNode;
    headerClassName: string;
    description: string;
}) {
    return (
        <article className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">
            <div className={`flex h-12 items-center px-5 text-sm font-medium text-white ${headerClassName}`}>
                {title}
                <div className="ml-auto opacity-80">{icon}</div>
            </div>
            <div className="space-y-1 p-5">
                <p className="text-3xl font-black tracking-tight text-zinc-950">{value}</p>
                <p className="text-xs font-medium text-zinc-400">{description}</p>
            </div>
        </article>
    );
}

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
            <KpiCard title="Recibidos" value={metrics.received} icon={<Clock size={16} />} headerClassName="bg-zinc-900" description="Ingresados hoy" />
            <KpiCard title="Pendientes" value={metrics.pending} icon={<Clock size={16} />} headerClassName="bg-amber-500" description="En espera" />
            <KpiCard title="En Cocina" value={metrics.preparing} icon={<ChefHat size={16} />} headerClassName="bg-blue-500" description="En preparacion" />
            <KpiCard title="Listos" value={metrics.ready} icon={<CheckCircle2 size={16} />} headerClassName="bg-emerald-500" description="Para entrega" />
        </section>
    );
}
