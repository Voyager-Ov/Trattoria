import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Edit, History, PackagePlus, TriangleAlert } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { getSupplyById } from "../actions";
import { formatArCurrencyDetailed } from "../components/supplies-shared";

type SupplyMovement = {
    id: string;
    tipo: string;
    cantidad: number;
    motivo?: string | null;
    createdAt: string | Date;
};

export default async function InsumoDetallePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const result = await getSupplyById(id);

    if (!result.success || !result.data) {
        notFound();
    }

    const supply = result.data as {
        id: string;
        nombre: string;
        descripcion?: string | null;
        unidad: string;
        stockActual: number;
        stockMinimo?: number | null;
        costoUnitario?: number | null;
        activo: boolean;
        category?: { nombre: string } | null;
        createdAt: string | Date;
        movements?: SupplyMovement[];
    };

    const stockMinimo = Number(supply.stockMinimo || 0);
    const stockActual = Number(supply.stockActual);
    const costoUnitario = Number(supply.costoUnitario || 0);
    const inventoryValue = stockActual * costoUnitario;
    const isCritical = supply.activo && stockActual <= stockMinimo;

    return (
        <div className="app-page-safe-bottom flex min-h-screen flex-col gap-5 bg-white px-4 py-4 sm:px-6 md:gap-6 md:px-8 md:py-8">
            <section className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <Link
                        href="/admin/dashboard/insumos"
                        className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-500 transition-colors hover:text-zinc-900"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Volver
                    </Link>

                    <div className="hidden items-center gap-3 sm:flex">
                        <Link href={`/admin/dashboard/insumos/stock?id=${supply.id}`}>
                            <Button variant="outline" className="rounded-full border-zinc-200">
                                <PackagePlus className="mr-2 h-4 w-4" />
                                Registrar stock
                            </Button>
                        </Link>
                        <Link href={`/admin/dashboard/insumos/${supply.id}/editar`}>
                            <Button variant="outline" className="rounded-full border-zinc-200">
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm md:rounded-[2rem] md:p-7">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">{supply.nombre}</h1>
                                {!supply.activo && <Badge variant="secondary">Archivado</Badge>}
                                {isCritical && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                        <TriangleAlert className="h-3.5 w-3.5" />
                                        Stock critico
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-zinc-500">
                                {supply.descripcion || "Sin descripcion adicional para este insumo."}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-600">
                                    {supply.category?.nombre || "Sin categoria"}
                                </span>
                                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-600">
                                    Alta {format(new Date(supply.createdAt), "dd/MM/yyyy", { locale: es })}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:hidden">
                            <Link href={`/admin/dashboard/insumos/stock?id=${supply.id}`}>
                                <Button variant="outline" className="h-11 w-full rounded-2xl border-zinc-200">
                                    <PackagePlus className="mr-2 h-4 w-4" />
                                    Stock
                                </Button>
                            </Link>
                            <Link href={`/admin/dashboard/insumos/${supply.id}/editar`}>
                                <Button variant="outline" className="h-11 w-full rounded-2xl border-zinc-200">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[1.5rem] bg-zinc-50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Stock actual</p>
                    <p className={`mt-2 text-2xl font-black tracking-tight ${isCritical ? "text-amber-600" : "text-zinc-900"}`}>
                        {stockActual.toFixed(2)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">Minimo {stockMinimo.toFixed(2)} {supply.unidad}</p>
                </div>
                <div className="rounded-[1.5rem] bg-zinc-50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Unidad</p>
                    <p className="mt-2 text-xl font-black tracking-tight text-zinc-900">{supply.unidad}</p>
                </div>
                <div className="rounded-[1.5rem] bg-zinc-50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Costo unitario</p>
                    <p className="mt-2 text-xl font-black tracking-tight text-zinc-900">{formatArCurrencyDetailed(costoUnitario)}</p>
                </div>
                <div className="rounded-[1.5rem] bg-zinc-50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Valor inventario</p>
                    <p className="mt-2 break-words text-xl font-black tracking-tight text-zinc-900">
                        {formatArCurrencyDetailed(inventoryValue)}
                    </p>
                </div>
            </section>

            <section className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm md:rounded-[2rem]">
                <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4 md:px-6">
                    <History className="h-5 w-5 text-zinc-500" />
                    <div>
                        <h2 className="text-lg font-black tracking-tight text-zinc-900">Historial de movimientos</h2>
                        <p className="text-sm text-zinc-500">Entradas, salidas y ajustes del insumo.</p>
                    </div>
                </div>

                <div className="divide-y divide-zinc-100">
                    {supply.movements && supply.movements.length > 0 ? (
                        supply.movements.map((movement) => (
                            <div key={movement.id} className="space-y-3 px-5 py-4 md:grid md:grid-cols-[1.3fr_0.8fr_0.9fr_1.2fr] md:gap-4 md:space-y-0 md:px-6">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400 md:hidden">Fecha</p>
                                    <p className="font-semibold text-zinc-900">
                                        {format(new Date(movement.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400 md:hidden">Tipo</p>
                                    <p className="font-medium text-zinc-700">{movement.tipo}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400 md:hidden">Cantidad</p>
                                    <p className="font-medium text-zinc-700">
                                        {Number(movement.cantidad).toFixed(2)} {supply.unidad}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400 md:hidden">Motivo</p>
                                    <p className="text-sm text-zinc-500">{movement.motivo || "-"}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="px-5 py-10 text-sm font-medium text-zinc-500 md:px-6">
                            No hay movimientos registrados.
                        </div>
                    )}
                </div>
            </section>

            <div
                aria-hidden
                className="rounded-[1.75rem] bg-white/55 md:hidden"
                style={{ minHeight: "calc(var(--admin-mobile-nav-height) - 0.5rem)" }}
            />
        </div>
    );
}
