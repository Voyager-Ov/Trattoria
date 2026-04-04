import Link from "next/link";
import { AlertTriangle, ArchiveX, Eye, Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

import { formatArCurrencyDetailed, getCategoryColor, isCriticalSupply, type Supply } from "./supplies-shared";

interface SuppliesDesktopTableProps {
    supplies: Supply[];
    loading: boolean;
    totalSupplies: number;
    onArchive: (id: string) => void;
}

export function SuppliesDesktopTable({ supplies, loading, totalSupplies, onArchive }: SuppliesDesktopTableProps) {
    return (
        <div className="hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="border-b border-zinc-100">
                        <tr>
                            {["Insumo", "Categoria", "Stock Actual", "Unidad", "Costo Unit.", "Valor Inv.", "Estado", "Acciones"].map((column, index) => (
                                <th
                                    key={column}
                                    className={`px-6 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400 ${
                                        index === 7 ? "text-right" : "text-left"
                                    }`}
                                >
                                    {column}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-zinc-100">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="p-12 text-center text-zinc-400">
                                    <div className="inline-flex items-center gap-3">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Cargando inventario...
                                    </div>
                                </td>
                            </tr>
                        ) : supplies.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-16 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search className="h-8 w-8 text-zinc-300" />
                                        <p className="text-sm text-blue-500">No se encontraron resultados</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            supplies.map((supply) => {
                                const critical = isCriticalSupply(supply);
                                const inventoryValue = Number(supply.stockActual) * Number(supply.costoUnitario || 0);
                                const categoryColor = getCategoryColor(supply.category?.nombre || "Sin categoria");

                                return (
                                    <tr key={supply.id} className="transition-colors hover:bg-zinc-50/60">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {critical && <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />}
                                                <span className="font-semibold text-zinc-900">{supply.nombre}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${categoryColor}`}>
                                                {supply.category?.nombre || "Sin categoria"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-semibold ${critical ? "text-amber-600" : "text-zinc-700"}`}>
                                                {Number(supply.stockActual).toFixed(2)}
                                            </span>
                                            <div className="text-xs text-zinc-400">Min: {Number(supply.stockMinimo || 0).toFixed(2)}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-500">{supply.unidad}</td>
                                        <td className="px-6 py-4 font-medium text-zinc-700">
                                            {formatArCurrencyDetailed(Number(supply.costoUnitario || 0))}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-zinc-700">
                                            {formatArCurrencyDetailed(inventoryValue)}
                                        </td>
                                        <td className="px-6 py-4">
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
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/admin/dashboard/insumos/${supply.id}`}>
                                                    <Button variant="outline" size="sm" className="h-8 gap-1 border-zinc-200">
                                                        <Eye className="h-3.5 w-3.5" />
                                                        Ver
                                                    </Button>
                                                </Link>
                                                {supply.activo && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 gap-1 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                                        onClick={() => onArchive(supply.id)}
                                                    >
                                                        <ArchiveX className="h-3.5 w-3.5" />
                                                        Archivar
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {!loading && supplies.length > 0 && (
                <div className="border-t border-zinc-100 bg-zinc-50/50 px-6 py-3">
                    <p className="text-xs text-zinc-400">
                        Mostrando {supplies.length} de {totalSupplies} insumos
                    </p>
                </div>
            )}
        </div>
    );
}
