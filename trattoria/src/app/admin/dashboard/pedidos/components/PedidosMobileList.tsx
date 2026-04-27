import { ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { PedidoMobileCard } from "./PedidoMobileCard";
import type { OrderListItem } from "./pedido-shared";

interface PedidosMobileListProps {
    orders: OrderListItem[];
    isLoading: boolean;
    total: number;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onOpenOrder: (orderId: string) => void;
    onClearFilters: () => void;
}

export function PedidosMobileList({
    orders,
    isLoading,
    total,
    page,
    totalPages,
    onPageChange,
    onOpenOrder,
    onClearFilters,
}: PedidosMobileListProps) {
    return (
        <section className="space-y-4 md:hidden">
            <div className="space-y-3">
                {isLoading && orders.length === 0 ? (
                    Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="animate-pulse rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm">
                            <div className="h-4 w-24 rounded bg-zinc-100" />
                            <div className="mt-3 h-5 w-2/3 rounded bg-zinc-100" />
                            <div className="mt-5 h-20 rounded-2xl bg-zinc-50" />
                        </div>
                    ))
                ) : orders.length === 0 ? (
                    <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-12 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-zinc-50">
                            <ShoppingBag className="h-8 w-8 text-zinc-300" />
                        </div>
                        <h3 className="text-lg font-black tracking-tight text-zinc-900">No se encontraron pedidos</h3>
                        <p className="mt-2 text-sm text-zinc-500">Prueba ajustando los filtros o la busqueda.</p>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClearFilters}
                            className="mt-5 rounded-2xl border-zinc-200"
                        >
                            Limpiar filtros
                        </Button>
                    </div>
                ) : (
                    orders.map((order) => <PedidoMobileCard key={order.id} order={order} onOpen={onOpenOrder} />)
                )}
            </div>

            {!isLoading && total > 0 && (
                <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 text-center text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                        Pagina {page} de {totalPages} · {total} pedidos
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={page === 1}
                            onClick={() => onPageChange(Math.max(1, page - 1))}
                            className={cn("h-11 rounded-2xl border-zinc-200 font-bold", page === 1 && "opacity-40")}
                        >
                            Anterior
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={page === totalPages}
                            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                            className={cn("h-11 rounded-2xl border-zinc-200 font-bold", page === totalPages && "opacity-40")}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}
        </section>
    );
}
