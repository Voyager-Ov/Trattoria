import { History, Plus, Settings, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SuppliesHeroProps {
    onOpenCategories: () => void;
    onGoToStock: () => void;
    onGoToCreate: () => void;
}

export function SuppliesHero({ onOpenCategories, onGoToStock, onGoToCreate }: SuppliesHeroProps) {
    return (
        <section className="space-y-4">
            <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
                        <Settings className="h-5 w-5" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">
                        Inventario de Insumos
                    </h1>
                </div>
                <p className="text-sm text-zinc-500 sm:text-base">
                    Gestiona las materias primas y el stock de tu trattoria.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:hidden">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onOpenCategories}
                    className="h-11 rounded-2xl border-zinc-200 bg-white font-semibold text-zinc-700 shadow-sm"
                >
                    <Tag className="mr-2 h-4 w-4" />
                    Categorias
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onGoToStock}
                    className="h-11 rounded-2xl border-zinc-200 bg-white font-semibold text-zinc-700 shadow-sm"
                >
                    <History className="mr-2 h-4 w-4" />
                    Stock
                </Button>
                <Button
                    type="button"
                    onClick={onGoToCreate}
                    className="col-span-2 h-11 rounded-2xl bg-zinc-900 font-bold text-white shadow-lg shadow-zinc-200 hover:bg-zinc-800"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Insumo
                </Button>
            </div>

            <div className="hidden items-center justify-end gap-3 md:flex">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onOpenCategories}
                    className="h-11 rounded-full border-2 border-zinc-200 bg-white px-4 font-medium text-zinc-600 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] transition-all hover:-translate-x-px hover:-translate-y-px hover:bg-zinc-50"
                >
                    <Tag className="mr-2 h-4 w-4" />
                    Categorias
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onGoToStock}
                    className="h-11 rounded-full border-2 border-zinc-200 bg-white px-4 font-medium text-zinc-600 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] transition-all hover:-translate-x-px hover:-translate-y-px hover:bg-zinc-50"
                >
                    <History className="mr-2 h-4 w-4" />
                    Registrar Stock
                </Button>
                <Button
                    type="button"
                    onClick={onGoToCreate}
                    className="h-11 rounded-full border-2 border-zinc-900 bg-zinc-900 px-5 font-semibold text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-px hover:-translate-y-px hover:bg-zinc-800"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Insumo
                </Button>
            </div>
        </section>
    );
}
