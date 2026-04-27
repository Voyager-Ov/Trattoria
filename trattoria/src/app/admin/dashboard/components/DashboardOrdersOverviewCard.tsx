import { ChefHat } from "lucide-react";

interface OrderStatusItem {
    status: string;
    count: number;
}

interface DashboardOrdersOverviewCardProps {
    loading: boolean;
    ordersByStatus: OrderStatusItem[];
}

const STATUS_LABELS: Record<string, string> = {
    RECIBIDO: "Recibidos",
    PENDIENTE: "Pendientes",
    EN_PREPARACION: "En cocina",
    LISTO: "Listos",
    FINALIZADO: "Finalizados",
    CANCELADO: "Cancelados",
};

export function DashboardOrdersOverviewCard({
    loading,
    ordersByStatus,
}: DashboardOrdersOverviewCardProps) {
    const normalizedItems = Object.keys(STATUS_LABELS).map((status) => ({
        status,
        count: ordersByStatus.find((item) => item.status === status)?.count ?? 0,
    }));

    return (
        <section className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm md:rounded-[2rem]">
            <div className="border-b border-zinc-100 px-4 py-4 md:px-6 md:py-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                        <ChefHat className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight text-zinc-900">Pedidos por estado</h3>
                        <p className="mt-1 text-sm text-zinc-500">Resumen operativo de los pedidos recibidos hoy.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3 md:p-6">
                {loading
                    ? Array.from({ length: 6 }).map((_, index) => (
                          <div key={index} className="animate-pulse rounded-[1.25rem] bg-zinc-50 p-4">
                              <div className="h-4 w-20 rounded bg-zinc-100" />
                              <div className="mt-3 h-8 w-10 rounded bg-zinc-100" />
                          </div>
                      ))
                    : normalizedItems.map((item) => {
                          const isKitchen = item.status === "EN_PREPARACION";

                          return (
                              <div
                                  key={item.status}
                                  className={`rounded-[1.25rem] border p-4 ${
                                      isKitchen
                                          ? "border-orange-200 bg-orange-50"
                                          : "border-zinc-100 bg-zinc-50/80"
                                  }`}
                              >
                                  <p
                                      className={`text-[0.7rem] font-black uppercase tracking-[0.16em] ${
                                          isKitchen ? "text-orange-500" : "text-zinc-400"
                                      }`}
                                  >
                                      {STATUS_LABELS[item.status] || item.status}
                                  </p>
                                  <p className="mt-2 text-2xl font-black tracking-tight text-zinc-900">
                                      {item.count}
                                  </p>
                              </div>
                          );
                      })}
            </div>
        </section>
    );
}
