import { Plus, RefreshCw, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PedidosHeroProps {
    isLoading: boolean;
    onRefresh: () => void;
    onCreate: () => void;
}

export function PedidosHero({ isLoading, onRefresh, onCreate }: PedidosHeroProps) {
    return (
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
                        <ShoppingBag size={20} />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 sm:text-3xl">
                        Gestion de Pedidos
                    </h2>
                </div>
                <p className="text-sm font-medium text-zinc-500 sm:text-base">
                    Monitorea y despacha las ordenes en tiempo real.
                </p>
            </div>

            <div className="flex w-full items-center gap-3 md:w-auto">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={onRefresh}
                    className="h-11 w-11 shrink-0 rounded-2xl border-zinc-200 transition-all active:scale-95 hover:bg-zinc-50 md:h-12 md:w-12"
                    title="Refrescar pedidos"
                >
                    <RefreshCw className={cn("h-5 w-5 text-zinc-500", isLoading && "animate-spin")} />
                </Button>

                <Button
                    onClick={onCreate}
                    className="h-11 flex-1 rounded-2xl bg-zinc-900 px-5 font-bold text-white shadow-lg shadow-zinc-200 transition-all active:scale-95 hover:bg-zinc-800 md:h-12 md:flex-none md:px-6"
                >
                    <Plus className="mr-2 h-5 w-5" />
                    Nuevo Pedido
                </Button>
            </div>
        </section>
    );
}
