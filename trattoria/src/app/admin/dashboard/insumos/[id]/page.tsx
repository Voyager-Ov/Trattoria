import Link from "next/link";
import { notFound } from "next/navigation";
import {
    ArrowDownRight, ArrowUpRight, Box, Calendar, ChevronLeft, Edit,
    History, Layers, PackagePlus, Receipt, Scale, ShoppingCart,
    Tag, TrendingUp, TriangleAlert, Warehouse
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { getSupplyById } from "../actions";
import { formatArCurrencyDetailed, getCategoryColor } from "../components/supplies-shared";
import { RecipeCarousel } from "./RecipeCarousel";

/* ── Types ── */

type Movement = {
    id: string;
    tipo: string;
    cantidad: number;
    stockResultante?: number | null;
    motivo?: string | null;
    createdAt: string | Date;
};

type RecipeItem = {
    id: string;
    qtyPerUnit: number;
    unidad: string;
    product: { id: string; nombre: string; precio?: number | null; activo: boolean };
};

type PurchaseItem = {
    id: string;
    cantidad: number;
    precioUnit: number;
    purchase: {
        id: string;
        numero?: string | null;
        fecha: string | Date;
        estado: string;
        provider?: { id: string; nombre: string } | null;
    };
};

type SupplyDetail = {
    id: string;
    nombre: string;
    descripcion?: string | null;
    unidad: string;
    stockActual: number;
    stockMinimo?: number | null;
    costoUnitario?: number | null;
    activo: boolean;
    category?: { id: string; nombre: string } | null;
    createdAt: string | Date;
    updatedAt: string | Date;
    movements?: Movement[];
    recipeItems?: RecipeItem[];
    purchaseItems?: PurchaseItem[];
};

/* ── Helpers ── */

function movementMeta(tipo: string) {
    switch (tipo) {
        case "IN":
            return { label: "Entrada", icon: ArrowUpRight, bg: "bg-zinc-100", color: "text-emerald-600", sign: "+" };
        case "OUT":
            return { label: "Salida", icon: ArrowDownRight, bg: "bg-zinc-100", color: "text-rose-500", sign: "−" };
        default:
            return { label: "Ajuste", icon: Scale, bg: "bg-zinc-100", color: "text-amber-600", sign: "~" };
    }
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                <Icon className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">{label}</p>
                <p className="truncate font-bold text-zinc-900">{value}</p>
            </div>
        </div>
    );
}

function StockGauge({ current, min, unit }: { current: number; min: number; unit: string }) {
    const pct = min > 0 ? Math.min((current / min) * 100, 100) : 100;
    const critical = current <= min && min > 0;

    return (
        <div className="space-y-2">
            <div className="flex items-end justify-between">
                <span className={`text-3xl font-black tracking-tight ${critical ? "text-amber-600" : "text-zinc-900"}`}>
                    {current.toFixed(2)}
                </span>
                <span className="text-sm font-semibold text-zinc-400">{unit}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                    className={`h-full rounded-full transition-all ${critical ? "bg-amber-500" : "bg-zinc-900"}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <p className="text-xs font-medium text-zinc-400">
                Mínimo: {min.toFixed(2)} {unit} {critical && "— ⚠ Stock crítico"}
            </p>
        </div>
    );
}

/* ── Page ── */

export default async function InsumoDetallePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const result = await getSupplyById(id);
    if (!result.success || !result.data) notFound();

    const s = result.data as SupplyDetail;
    const stockActual = Number(s.stockActual);
    const stockMinimo = Number(s.stockMinimo || 0);
    const costoUnitario = Number(s.costoUnitario || 0);
    const inventoryValue = stockActual * costoUnitario;
    const isCritical = s.activo && stockActual <= stockMinimo;

    const movements = s.movements ?? [];
    const recipeItems = s.recipeItems ?? [];
    const purchaseItems = s.purchaseItems ?? [];

    const totalIn = movements.filter((m) => m.tipo === "IN").reduce((a, m) => a + Number(m.cantidad), 0);
    const totalOut = movements.filter((m) => m.tipo === "OUT").reduce((a, m) => a + Number(m.cantidad), 0);
    const lastMovement = movements[0];

    return (
        <div className="app-page-safe-bottom flex min-h-screen flex-col gap-6 bg-white px-4 py-4 sm:px-6 md:px-8 md:py-8">
            {/* ── HEADER ── */}
            <section className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <Link
                        href="/admin/dashboard/insumos"
                        className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-500 transition-colors hover:text-zinc-900"
                    >
                        <ChevronLeft className="h-4 w-4" /> Volver
                    </Link>
                    <div className="hidden items-center gap-3 sm:flex">
                        <Link href={`/admin/dashboard/insumos/stock?id=${s.id}`}>
                            <Button variant="outline" className="rounded-full border-zinc-200">
                                <PackagePlus className="mr-2 h-4 w-4" /> Registrar stock
                            </Button>
                        </Link>
                        <Link href={`/admin/dashboard/insumos/${s.id}/editar`}>
                            <Button variant="outline" className="rounded-full border-zinc-200">
                                <Edit className="mr-2 h-4 w-4" /> Editar
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm md:rounded-[2rem] md:p-7">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 space-y-3">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h1 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">{s.nombre}</h1>
                                {!s.activo && <Badge variant="secondary">Archivado</Badge>}
                                {isCritical && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                        <TriangleAlert className="h-3.5 w-3.5" /> Stock crítico
                                    </span>
                                )}
                            </div>
                            <p className="max-w-xl text-sm text-zinc-500">
                                {s.descripcion || "Sin descripción adicional para este insumo."}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {s.category && (
                                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getCategoryColor(s.category.nombre)}`}>
                                        {s.category.nombre}
                                    </span>
                                )}
                                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-600">
                                    Alta {format(new Date(s.createdAt), "dd/MM/yyyy", { locale: es })}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:hidden">
                            <Link href={`/admin/dashboard/insumos/stock?id=${s.id}`}>
                                <Button variant="outline" className="h-11 w-full rounded-2xl border-zinc-200">
                                    <PackagePlus className="mr-2 h-4 w-4" /> Stock
                                </Button>
                            </Link>
                            <Link href={`/admin/dashboard/insumos/${s.id}/editar`}>
                                <Button variant="outline" className="h-11 w-full rounded-2xl border-zinc-200">
                                    <Edit className="mr-2 h-4 w-4" /> Editar
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── STAT CARDS (zinc-only palette) ── */}
            <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Stock actual</p>
                    <div className="mt-3">
                        <StockGauge current={stockActual} min={stockMinimo} unit={s.unidad} />
                    </div>
                </div>
                <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Costo unitario</p>
                    <p className="mt-2 text-2xl font-black tracking-tight text-zinc-900">{formatArCurrencyDetailed(costoUnitario)}</p>
                    <p className="mt-1 text-xs font-medium text-zinc-400">por {s.unidad.toLowerCase()}</p>
                </div>
                <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Valor inventario</p>
                    <p className="mt-2 break-words text-2xl font-black tracking-tight text-zinc-900">{formatArCurrencyDetailed(inventoryValue)}</p>
                    <p className="mt-1 text-xs font-medium text-zinc-400">stock × costo</p>
                </div>
                <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Flujo total</p>
                    <div className="mt-2 flex items-baseline gap-4">
                        <div>
                            <p className="text-xs font-bold text-emerald-600">▲ Entradas</p>
                            <p className="text-lg font-black tracking-tight text-zinc-900">{totalIn.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-rose-500">▼ Salidas</p>
                            <p className="text-lg font-black tracking-tight text-zinc-900">{totalOut.toFixed(2)}</p>
                        </div>
                    </div>
                    <p className="mt-1 text-xs font-medium text-zinc-400">{movements.length} movimientos</p>
                </div>
            </section>

            {/* ── PRODUCTOS QUE LO USAN (horizontal GSAP carousel) ── */}
            <section className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm md:rounded-[2rem]">
                <div className="flex items-center gap-3 border-b border-zinc-100 px-6 py-4">
                    <ShoppingCart className="h-5 w-5 text-zinc-500" />
                    <div>
                        <h2 className="text-lg font-black tracking-tight text-zinc-900">Productos que lo usan</h2>
                        <p className="text-sm text-zinc-500">
                            {recipeItems.length > 0
                                ? `${recipeItems.length} producto${recipeItems.length > 1 ? "s" : ""} — pasa el cursor para desplazar`
                                : "Ningún producto referencia este insumo"}
                        </p>
                    </div>
                </div>
                <RecipeCarousel items={recipeItems} />
            </section>

            {/* ── MAIN 2-COL LAYOUT ── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left: Movements */}
                <div className="lg:col-span-2">
                    <section className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm md:rounded-[2rem]">
                        <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4 md:px-6">
                            <History className="h-5 w-5 text-zinc-500" />
                            <div>
                                <h2 className="text-lg font-black tracking-tight text-zinc-900">Historial de movimientos</h2>
                                <p className="text-sm text-zinc-500">Últimos {movements.length} registros.</p>
                            </div>
                        </div>
                        {movements.length > 0 ? (
                            <div className="divide-y divide-zinc-100">
                                {movements.slice(0, 15).map((m) => {
                                    const meta = movementMeta(m.tipo);
                                    const Icon = meta.icon;
                                    return (
                                        <div key={m.id} className="flex items-center gap-4 px-5 py-4 md:px-6">
                                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.bg}`}>
                                                <Icon className={`h-5 w-5 ${meta.color}`} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-zinc-900">
                                                    {meta.sign}{Number(m.cantidad).toFixed(2)} {s.unidad}
                                                    <span className="ml-2 text-xs font-semibold text-zinc-400">{meta.label}</span>
                                                </p>
                                                <p className="truncate text-sm text-zinc-500">{m.motivo || "Sin motivo"}</p>
                                            </div>
                                            <div className="hidden shrink-0 text-right sm:block">
                                                {m.stockResultante != null && (
                                                    <p className="text-sm font-semibold text-zinc-700">→ {Number(m.stockResultante).toFixed(2)}</p>
                                                )}
                                                <p className="text-xs font-medium text-zinc-400">
                                                    {format(new Date(m.createdAt), "dd/MM/yy HH:mm", { locale: es })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                {movements.length > 15 && (
                                    <div className="px-6 py-4 text-center text-sm font-semibold text-zinc-400">
                                        +{movements.length - 15} movimientos anteriores
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="px-6 py-12 text-center text-sm font-medium text-zinc-400">
                                No hay movimientos registrados aún.
                            </div>
                        )}
                    </section>
                </div>

                {/* Right sidebar */}
                <div className="space-y-6">
                    {/* Info */}
                    <section className="rounded-[1.75rem] border border-zinc-200 bg-white p-6 shadow-sm md:rounded-[2rem]">
                        <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-zinc-900">Información</h3>
                        <div className="space-y-3">
                            <InfoRow icon={Box} label="Nombre" value={s.nombre} />
                            <InfoRow icon={Layers} label="Unidad" value={s.unidad} />
                            <InfoRow icon={Tag} label="Categoría" value={s.category?.nombre || "Sin categoría"} />
                            <InfoRow icon={Receipt} label="Costo unit." value={formatArCurrencyDetailed(costoUnitario)} />
                            <InfoRow icon={TrendingUp} label="Valor inv." value={formatArCurrencyDetailed(inventoryValue)} />
                            <InfoRow
                                icon={Calendar}
                                label="Últ. movimiento"
                                value={lastMovement ? format(new Date(lastMovement.createdAt), "dd/MM/yy HH:mm", { locale: es }) : "N/A"}
                            />
                            <InfoRow
                                icon={Calendar}
                                label="Última edición"
                                value={format(new Date(s.updatedAt), "dd/MM/yy HH:mm", { locale: es })}
                            />
                        </div>
                    </section>

                    {/* Purchases */}
                    <section className="rounded-[1.75rem] border border-zinc-200 bg-white p-6 shadow-sm md:rounded-[2rem]">
                        <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-zinc-900">Últimas compras</h3>
                        {purchaseItems.length > 0 ? (
                            <div className="space-y-3">
                                {purchaseItems.slice(0, 8).map((pi) => (
                                    <div key={pi.id} className="flex items-start gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                                            <Receipt className="h-4 w-4 text-zinc-500" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-zinc-900">
                                                {Number(pi.cantidad).toFixed(2)} × {formatArCurrencyDetailed(Number(pi.precioUnit))}
                                            </p>
                                            <p className="text-xs font-medium text-zinc-500">
                                                {pi.purchase.provider?.nombre || "Sin proveedor"}
                                                {pi.purchase.numero && ` · ${pi.purchase.numero}`}
                                            </p>
                                            <p className="text-[11px] font-medium text-zinc-400">
                                                {format(new Date(pi.purchase.fecha), "dd/MM/yy", { locale: es })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm font-medium text-zinc-400 italic">No hay compras registradas.</p>
                        )}
                    </section>
                </div>
            </div>

            <div
                aria-hidden
                className="rounded-[1.75rem] bg-white/55 md:hidden"
                style={{ minHeight: "calc(var(--admin-mobile-nav-height) - 0.5rem)" }}
            />
        </div>
    );
}
