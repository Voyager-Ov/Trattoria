import { AlertTriangle } from "lucide-react";

interface DashboardAlertsCardProps {
    loading: boolean;
    alertCounts: {
        criticalSupplies: number;
        unavailableProducts: number;
        finalizedUnpaid: number;
        paidUnfinalized: number;
    } | null;
}

export function DashboardAlertsCard({ loading, alertCounts }: DashboardAlertsCardProps) {
    const items = [
        {
            label: "Insumos criticos",
            value: alertCounts?.criticalSupplies ?? 0,
        },
        {
            label: "Productos sin disponibilidad",
            value: alertCounts?.unavailableProducts ?? 0,
        },
        {
            label: "Finalizado sin cobrar",
            value: alertCounts?.finalizedUnpaid ?? 0,
        },
        {
            label: "Cobrado sin finalizar",
            value: alertCounts?.paidUnfinalized ?? 0,
        },
    ];

    const totalAlerts = items.reduce((sum, item) => sum + item.value, 0);

    return (
        <section className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm md:rounded-[2rem]">
            <div className="border-b border-zinc-100 px-4 py-4 md:px-6 md:py-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight text-zinc-900">Alertas operativas</h3>
                        <p className="mt-1 text-sm text-zinc-500">Situaciones que requieren seguimiento inmediato.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-3 p-4 md:p-6">
                <div className="rounded-[1.25rem] bg-zinc-900 p-4 text-white">
                    <p className="text-[0.7rem] font-black uppercase tracking-[0.16em] text-white/50">
                        Alertas activas
                    </p>
                    <p className="mt-2 text-3xl font-black tracking-tight">{loading ? "..." : totalAlerts}</p>
                </div>

                <div className="space-y-2">
                    {loading
                        ? Array.from({ length: 4 }).map((_, index) => (
                              <div key={index} className="animate-pulse rounded-2xl bg-zinc-50 p-4">
                                  <div className="h-4 w-40 rounded bg-zinc-100" />
                              </div>
                          ))
                        : items.map((item) => (
                              <div
                                  key={item.label}
                                  className={`flex items-center justify-between rounded-2xl border p-4 ${
                                      item.value > 0
                                          ? "border-rose-200 bg-rose-50"
                                          : "border-zinc-100 bg-zinc-50/70"
                                  }`}
                              >
                                  <span className="text-sm font-semibold text-zinc-800">{item.label}</span>
                                  <span
                                      className={`rounded-full px-2.5 py-1 text-xs font-black uppercase ${
                                          item.value > 0 ? "bg-rose-600 text-white" : "bg-zinc-200 text-zinc-600"
                                      }`}
                                  >
                                      {item.value}
                                  </span>
                              </div>
                          ))}
                </div>
            </div>
        </section>
    );
}
