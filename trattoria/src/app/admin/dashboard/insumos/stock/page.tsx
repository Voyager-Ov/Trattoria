"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, History as HistoryIcon, Info, Loader2, Save, ShoppingCart, TrendingUp, X } from "lucide-react";
import { TipoMovimientoStock } from "@prisma/client";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { getSupplies, registerStockEntry, registerStockMovement } from "../actions";

interface Supply {
    id: string;
    nombre: string;
    unidad: string;
    stockActual: number;
    stockMinimo?: number;
    costoUnitario?: number;
}

function typeLabel(value: TipoMovimientoStock) {
    if (value === "IN") return "Entrada";
    if (value === "OUT") return "Salida";
    return "Ajuste";
}

function RegistrarStockContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedId = searchParams.get("id");

    const [loading, setLoading] = useState(false);
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [formData, setFormData] = useState({
        supplyId: preselectedId || "",
        cantidad: "",
        costoTotal: "",
        motivo: "Compra de insumos",
        proveedor: "",
        tipo: "IN" as TipoMovimientoStock,
    });

    useEffect(() => {
        async function loadSupplies() {
            const result = await getSupplies();
            if (result.success && result.data) {
                setSupplies(result.data as Supply[]);
            }
        }

        void loadSupplies();
    }, []);

    const selectedSupply = useMemo(
        () => supplies.find((supply) => supply.id === formData.supplyId),
        [formData.supplyId, supplies]
    );

    const quantity = Number.parseFloat(formData.cantidad) || 0;
    const totalCost = Number.parseFloat(formData.costoTotal) || 0;
    const estimatedStock =
        selectedSupply == null
            ? 0
            : formData.tipo === "OUT"
              ? Number(selectedSupply.stockActual) - quantity
              : formData.tipo === "AJUSTE"
                ? quantity
                : Number(selectedSupply.stockActual) + quantity;
    const estimatedUnitCost = quantity > 0 ? totalCost / quantity : 0;

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        if (!formData.supplyId) {
            toast.error("Seleccione un insumo");
            return;
        }

        if (!formData.cantidad || quantity <= 0) {
            toast.error("La cantidad debe ser mayor a 0");
            return;
        }

        setLoading(true);

        let result;

        if (formData.tipo === "IN") {
            result = await registerStockEntry({
                supplyId: formData.supplyId,
                cantidad: quantity,
                costoUnitario: quantity > 0 ? totalCost / quantity : 0,
                motivo: formData.motivo,
                proveedor: formData.proveedor || undefined,
            });
        } else {
            result = await registerStockMovement({
                supplyId: formData.supplyId,
                cantidad: quantity,
                tipo: formData.tipo,
                motivo: formData.motivo,
            });
        }

        if (result.success) {
            toast.success("Movimiento registrado correctamente");
            router.push("/admin/dashboard/insumos");
            router.refresh();
        } else {
            toast.error(result.error || "Error al registrar el movimiento");
        }

        setLoading(false);
    }

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
                    <Link href="/admin/dashboard/insumos">
                        <Button variant="outline" className="h-11 w-11 rounded-full border-zinc-200 p-0 sm:h-12 sm:w-12">
                            <X className="h-4 w-4 text-zinc-400" />
                        </Button>
                    </Link>
                </div>

                <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm md:rounded-[2rem] md:p-7">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-white">
                            <HistoryIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">Registrar stock</h1>
                            <p className="text-sm text-zinc-500">Actualiza entradas, salidas o ajustes del inventario.</p>
                        </div>
                    </div>
                </div>
            </section>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.85fr)] xl:gap-6">
                <div className="space-y-5">
                    <section className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm md:rounded-[2rem] md:p-7">
                        <div className="mb-6 flex items-center gap-3 border-b border-zinc-100 pb-5">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-500">
                                <ShoppingCart className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black tracking-tight text-zinc-900">Datos del movimiento</h2>
                                <p className="text-sm text-zinc-500">Completa el insumo, cantidad y referencia.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Tipo de movimiento</Label>
                                <Select
                                    value={formData.tipo}
                                    onValueChange={(value: TipoMovimientoStock) => {
                                        setFormData((current) => ({
                                            ...current,
                                            tipo: value,
                                            motivo:
                                                value === "IN"
                                                    ? "Compra de insumos"
                                                    : value === "OUT"
                                                      ? "Consumo / merma"
                                                      : "Ajuste de inventario",
                                        }));
                                    }}
                                >
                                    <SelectTrigger className="h-14 rounded-[1.5rem] border-zinc-200 bg-zinc-50 px-5 font-semibold">
                                        <SelectValue placeholder="Seleccionar tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="IN">Entrada (compra)</SelectItem>
                                        <SelectItem value="OUT">Salida (merma/consumo)</SelectItem>
                                        <SelectItem value="AJUSTE">Ajuste manual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Insumo</Label>
                                <Select
                                    value={formData.supplyId}
                                    onValueChange={(value) => {
                                        setFormData((current) => ({
                                            ...current,
                                            supplyId: value,
                                            costoTotal: "",
                                        }));
                                    }}
                                >
                                    <SelectTrigger className="h-14 rounded-[1.5rem] border-zinc-200 bg-zinc-50 px-5 font-semibold">
                                        <SelectValue placeholder="Seleccionar insumo" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[20rem]">
                                        {supplies.map((supply) => (
                                            <SelectItem key={supply.id} value={supply.id}>
                                                {supply.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                    {formData.tipo === "IN" ? "Cantidad comprada" : formData.tipo === "OUT" ? "Cantidad a descontar" : "Stock resultante"}
                                </Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        step="any"
                                        inputMode="decimal"
                                        placeholder="0.00"
                                        className="h-14 rounded-[1.5rem] border-zinc-200 bg-zinc-50 px-5 pr-16 font-semibold"
                                        value={formData.cantidad}
                                        onChange={(event) => setFormData((current) => ({ ...current, cantidad: event.target.value }))}
                                    />
                                    {selectedSupply && (
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">
                                            {selectedSupply.unidad}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {formData.tipo === "IN" && (
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Costo total</Label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">$</span>
                                        <Input
                                            type="number"
                                            step="any"
                                            inputMode="decimal"
                                            placeholder="0.00"
                                            className="h-14 rounded-[1.5rem] border-zinc-200 bg-zinc-50 pl-10 pr-5 font-semibold"
                                            value={formData.costoTotal}
                                            onChange={(event) => setFormData((current) => ({ ...current, costoTotal: event.target.value }))}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Motivo o referencia</Label>
                                <Input
                                    placeholder="Ej: compra semanal, merma, ajuste de conteo..."
                                    className="h-14 rounded-[1.5rem] border-zinc-200 bg-zinc-50 px-5 font-medium"
                                    value={formData.motivo}
                                    onChange={(event) => setFormData((current) => ({ ...current, motivo: event.target.value }))}
                                />
                            </div>

                            {formData.tipo === "IN" && (
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Proveedor</Label>
                                    <Input
                                        placeholder="Ej: distribuidora central"
                                        autoComplete="organization"
                                        className="h-14 rounded-[1.5rem] border-zinc-200 bg-zinc-50 px-5 font-medium"
                                        value={formData.proveedor}
                                        onChange={(event) => setFormData((current) => ({ ...current, proveedor: event.target.value }))}
                                    />
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <div className="space-y-5">
                    {selectedSupply ? (
                        <section className="overflow-hidden rounded-[1.75rem] bg-zinc-900 p-5 text-white shadow-lg md:rounded-[2rem] md:p-6">
                            <div className="relative">
                                <div className="absolute right-0 top-0 text-white/5">
                                    <TrendingUp className="h-24 w-24" />
                                </div>
                                <div className="relative space-y-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-emerald-400">
                                            <TrendingUp className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black tracking-tight">Impacto estimado</h3>
                                            <p className="text-sm text-zinc-400">{typeLabel(formData.tipo)} sobre {selectedSupply.nombre}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
                                        <div className="rounded-[1.4rem] bg-white/5 p-4">
                                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Stock actual</p>
                                            <p className="mt-2 text-xl font-black tracking-tight">
                                                {Number(selectedSupply.stockActual).toFixed(2)} {selectedSupply.unidad}
                                            </p>
                                        </div>
                                        <div className="rounded-[1.4rem] bg-white/5 p-4">
                                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Stock estimado</p>
                                            <p className="mt-2 text-xl font-black tracking-tight">
                                                {estimatedStock.toFixed(2)} {selectedSupply.unidad}
                                            </p>
                                        </div>
                                        {formData.tipo === "IN" && (
                                            <div className="rounded-[1.4rem] bg-white/5 p-4">
                                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Inversion total</p>
                                                <p className="mt-2 break-words text-2xl font-black tracking-tight text-emerald-400">
                                                    ${totalCost.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                                {quantity > 0 && (
                                                    <p className="mt-1 text-xs font-semibold text-zinc-400">
                                                        Costo unit. estimado ${estimatedUnitCost.toFixed(2)}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    ) : (
                        <section className="rounded-[1.75rem] border border-zinc-200 bg-white p-6 text-center shadow-sm md:rounded-[2rem]">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-300">
                                <Info className="h-7 w-7" />
                            </div>
                            <h3 className="mt-4 text-lg font-black tracking-tight text-zinc-900">Resumen pendiente</h3>
                            <p className="mt-2 text-sm text-zinc-500">Selecciona un insumo y carga una cantidad para ver el impacto del movimiento.</p>
                        </section>
                    )}

                    {selectedSupply && (
                        <section className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm md:rounded-[2rem]">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Insumo seleccionado</p>
                                    <h3 className="mt-1 text-lg font-black tracking-tight text-zinc-900">{selectedSupply.nombre}</h3>
                                </div>
                                <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-600">
                                    {selectedSupply.unidad}
                                </Badge>
                            </div>
                        </section>
                    )}

                    <div className="sticky bottom-[calc(var(--admin-mobile-nav-height)+1rem)] z-10 space-y-3 rounded-[1.75rem] border border-zinc-200 bg-white/95 p-4 shadow-lg backdrop-blur md:static md:rounded-[2rem] md:bg-white md:p-0 md:shadow-none md:backdrop-blur-none">
                        <Button
                            type="submit"
                            disabled={loading || !formData.supplyId}
                            className="h-12 w-full rounded-2xl bg-zinc-900 text-sm font-black uppercase tracking-[0.14em] text-white"
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Confirmar movimiento
                        </Button>
                        <Link href="/admin/dashboard/insumos" className="block">
                            <Button variant="outline" className="h-12 w-full rounded-2xl border-zinc-200 text-zinc-600">
                                Cancelar
                            </Button>
                        </Link>
                    </div>
                </div>
            </form>

            <div
                aria-hidden
                className="rounded-[1.75rem] bg-white/55 md:hidden"
                style={{ minHeight: "calc(var(--admin-mobile-nav-height) - 0.5rem)" }}
            />
        </div>
    );
}

export default function RegistrarStockPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                </div>
            }
        >
            <RegistrarStockContent />
        </Suspense>
    );
}
