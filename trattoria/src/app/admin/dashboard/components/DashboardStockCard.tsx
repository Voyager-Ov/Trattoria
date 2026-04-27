import Link from "next/link";
import { ArrowRight, Boxes, PackageX } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CriticalSupplyPreview {
    id: string;
    nombre: string;
    stockActual: number;
    stockMinimo: number;
    unidad: string;
}

interface UnavailableProductPreview {
    id: string;
    nombre: string;
    categoryName: string | null;
}

interface DashboardStockCardProps {
    loading: boolean;
    criticalSupplies: CriticalSupplyPreview[];
    unavailableProducts: UnavailableProductPreview[];
}

export function DashboardStockCard({
    loading,
    criticalSupplies,
    unavailableProducts,
}: DashboardStockCardProps) {
    return (
        <section className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm md:rounded-[2rem]">
            <div className="border-b border-zinc-100 px-4 py-4 md:px-6 md:py-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                        <Boxes className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight text-zinc-900">Stock critico</h3>
                        <p className="mt-1 text-sm text-zinc-500">Insumos y productos que pueden afectar ventas.</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 p-4 md:grid-cols-2 md:p-6">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black uppercase tracking-[0.16em] text-zinc-400">
                            Insumos criticos
                        </h4>
                        <Link href="/admin/dashboard/insumos">
                            <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 text-xs font-bold">
                                Ver stock
                            </Button>
                        </Link>
                    </div>

                    {loading ? (
                        Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="animate-pulse rounded-[1.25rem] bg-zinc-50 p-4">
                                <div className="h-4 w-28 rounded bg-zinc-100" />
                            </div>
                        ))
                    ) : criticalSupplies.length === 0 ? (
                        <div className="rounded-[1.25rem] border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center">
                            <p className="text-sm font-semibold text-zinc-600">No hay insumos criticos ahora.</p>
                        </div>
                    ) : (
                        criticalSupplies.map((supply) => (
                            <div key={supply.id} className="rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4">
                                <p className="text-sm font-bold text-zinc-900">{supply.nombre}</p>
                                <p className="mt-1 text-xs text-zinc-600">
                                    Actual: {supply.stockActual} {supply.unidad.toLowerCase()} · Minimo:{" "}
                                    {supply.stockMinimo} {supply.unidad.toLowerCase()}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black uppercase tracking-[0.16em] text-zinc-400">
                            Productos sin disponibilidad
                        </h4>
                        <Link href="/admin/dashboard/productos">
                            <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 text-xs font-bold">
                                Ver menu
                            </Button>
                        </Link>
                    </div>

                    {loading ? (
                        Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="animate-pulse rounded-[1.25rem] bg-zinc-50 p-4">
                                <div className="h-4 w-28 rounded bg-zinc-100" />
                            </div>
                        ))
                    ) : unavailableProducts.length === 0 ? (
                        <div className="rounded-[1.25rem] border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center">
                            <p className="text-sm font-semibold text-zinc-600">
                                Todos los productos siguen disponibles.
                            </p>
                        </div>
                    ) : (
                        unavailableProducts.map((product) => (
                            <div key={product.id} className="rounded-[1.25rem] border border-rose-200 bg-rose-50 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-rose-600">
                                        <PackageX className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-zinc-900">{product.nombre}</p>
                                        <p className="mt-1 text-xs text-zinc-600">
                                            {product.categoryName || "Sin categoria"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="border-t border-zinc-100 bg-zinc-50/50 p-4 md:px-6 md:py-5">
                <div className="flex flex-col gap-3 md:flex-row">
                    <Link href="/admin/dashboard/insumos" className="block flex-1">
                        <Button className="h-11 w-full rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800">
                            Ir a Insumos
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href="/admin/dashboard/productos" className="block flex-1">
                        <Button variant="outline" className="h-11 w-full rounded-2xl border-zinc-200">
                            Ir a Productos
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
