import Link from "next/link";
import { AlertTriangle, ArchiveX, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";

import { formatArCurrency, formatArCurrencyDetailed, getCategoryColor, isCriticalSupply, type Supply } from "./supplies-shared";

interface SuppliesMobileListProps {
    supplies: Supply[];
    loading: boolean;
    totalSupplies: number;
    filterStatusLabel: string;
    onArchive: (id: string) => void;
}

export function SuppliesMobileList({
    supplies,
    loading,
    totalSupplies,
    filterStatusLabel,
    onArchive,
}: SuppliesMobileListProps) {
    return (
        <section className="space-y-4 md:hidden">
            {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="animate-pulse rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm">
                        <div className="h-4 w-24 rounded bg-zinc-100" />
                        <div className="mt-3 h-16 rounded-2xl bg-zinc-50" />
                    </div>
                ))
            ) : supplies.length === 0 ? (
                <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-12 text-center shadow-sm">
                    <p className="text-sm font-semibold text-zinc-500">No se encontraron resultados</p>
                </div>
            ) : (
                supplies.map((supply) => {
                    const critical = isCriticalSupply(supply);
                    const inventoryValue = Number(supply.stockActual) * Number(supply.costoUnitario || 0);
                    const categoryColor = getCategoryColor(supply.category?.nombre || "Sin categoria");

                    return (
                        <article key={supply.id} className="rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        {critical && <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />}
                                        <h3 className="truncate text-base font-black tracking-tight text-zinc-900">{supply.nombre}</h3>
                                    </div>
                                    <div className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${categoryColor}`}>
                                        {supply.category?.nombre || "Sin categoria"}
                                    </div>
                                </div>

                                {supply.activo ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        Activo
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500">
                                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                                        Archivado
                                    </span>
                                )}
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3 rounded-[1.25rem] bg-zinc-50/70 p-3">
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Stock</p>
                                    <p className={`mt-1 text-lg font-black ${critical ? "text-amber-600" : "text-zinc-900"}`}>
                                        {Number(supply.stockActual).toFixed(2)}
                                    </p>
                                    <p className="text-xs text-zinc-400">Min. {Number(supply.stockMinimo || 0).toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Unidad</p>
                                    <p className="mt-1 text-sm font-semibold text-zinc-700">{supply.unidad}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Costo</p>
                                    <p className="mt-1 text-sm font-semibold text-zinc-700">{formatArCurrencyDetailed(Number(supply.costoUnitario || 0))}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Valor</p>
                                    <p className="mt-1 text-sm font-semibold text-zinc-700">{formatArCurrency(inventoryValue)}</p>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <Link href={`/admin/dashboard/insumos/${supply.id}`}>
                                    <Button variant="outline" className="h-11 w-full rounded-2xl border-zinc-200">
                                        <Eye className="mr-2 h-4 w-4" />
                                        Ver
                                    </Button>
                                </Link>
                                <Button
                                    variant="ghost"
                                    disabled={!supply.activo}
                                    onClick={() => onArchive(supply.id)}
                                    className="h-11 rounded-2xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40"
                                >
                                    <ArchiveX className="mr-2 h-4 w-4" />
                                    Archivar
                                </Button>
                            </div>
                        </article>
                    );
                })
            )}

            {!loading && supplies.length > 0 && (
                <div className="rounded-[1.5rem] bg-white/70 px-4 py-3 text-center text-xs text-zinc-400 shadow-sm">
                    Mostrando {supplies.length} de {totalSupplies} insumos - {filterStatusLabel}
                </div>
            )}
        </section>
    );
}
