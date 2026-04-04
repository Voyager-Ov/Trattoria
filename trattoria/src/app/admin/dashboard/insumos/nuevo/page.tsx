"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Save, X } from "lucide-react";
import { UnidadMedida } from "@prisma/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { createSupply, getSupplyCategories } from "../actions";

type SupplyCategory = { id: string; nombre: string };

export default function NuevoInsumoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<SupplyCategory[]>([]);
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [unidad, setUnidad] = useState<UnidadMedida>(UnidadMedida.GRAMO);
    const [stockMinimo, setStockMinimo] = useState("1");
    const [costoUnitario, setCostoUnitario] = useState("0");
    const [categoryId, setCategoryId] = useState("none");

    useEffect(() => {
        async function loadCategories() {
            const result = await getSupplyCategories();
            if (result.success && result.data) {
                setCategories(result.data as SupplyCategory[]);
            }
        }

        void loadCategories();
    }, []);

    const selectedCategory = useMemo(
        () => categories.find((category) => category.id === categoryId)?.nombre || "Sin categoria",
        [categories, categoryId]
    );

    async function handleSubmit(formData: FormData) {
        setLoading(true);

        const result = await createSupply({
            nombre: formData.get("nombre") as string,
            descripcion: (formData.get("descripcion") as string) || undefined,
            unidad: formData.get("unidad") as UnidadMedida,
            stockMinimo: Number(formData.get("stockMinimo")),
            costoUnitario: Number(formData.get("costoUnitario")),
            categoryId: (formData.get("categoryId") as string) !== "none" ? (formData.get("categoryId") as string) : undefined,
        });

        if (!result.success) {
            toast.error(result.error || "Error al crear el insumo");
            setLoading(false);
            return;
        }

        toast.success("Insumo creado correctamente");
        router.push("/admin/dashboard/insumos");
        router.refresh();
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
                            <Plus className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">Nuevo insumo</h1>
                            <p className="text-sm text-zinc-500">Carga el insumo, categoria y costos base para el inventario.</p>
                        </div>
                    </div>
                </div>
            </section>

            <form action={handleSubmit} className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.85fr)] xl:gap-6">
                <section className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm md:rounded-[2rem] md:p-7">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Nombre</Label>
                            <Input
                                name="nombre"
                                required
                                autoComplete="off"
                                value={nombre}
                                onChange={(event) => setNombre(event.target.value)}
                                className="h-14 rounded-[1.5rem] border-zinc-200 bg-zinc-50 px-5 font-semibold"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Unidad</Label>
                            <Select name="unidad" value={unidad} onValueChange={(value) => setUnidad(value as UnidadMedida)}>
                                <SelectTrigger className="h-14 rounded-[1.5rem] border-zinc-200 bg-zinc-50 px-5 font-semibold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(UnidadMedida).map((value) => (
                                        <SelectItem key={value} value={value}>
                                            {value}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Categoria</Label>
                            <Select name="categoryId" value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger className="h-14 rounded-[1.5rem] border-zinc-200 bg-zinc-50 px-5 font-semibold">
                                    <SelectValue placeholder="Seleccionar categoria" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[18rem]">
                                    <SelectItem value="none">Sin categoria</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Descripcion</Label>
                            <Input
                                name="descripcion"
                                value={descripcion}
                                onChange={(event) => setDescripcion(event.target.value)}
                                className="h-14 rounded-[1.5rem] border-zinc-200 bg-zinc-50 px-5"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Stock minimo</Label>
                            <Input
                                name="stockMinimo"
                                type="number"
                                step="0.01"
                                inputMode="decimal"
                                required
                                value={stockMinimo}
                                onChange={(event) => setStockMinimo(event.target.value)}
                                className="h-14 rounded-[1.5rem] border-zinc-200 bg-zinc-50 px-5 font-semibold"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Costo unitario</Label>
                            <Input
                                name="costoUnitario"
                                type="number"
                                step="any"
                                inputMode="decimal"
                                required
                                value={costoUnitario}
                                onChange={(event) => setCostoUnitario(event.target.value)}
                                className="h-14 rounded-[1.5rem] border-zinc-200 bg-zinc-50 px-5 font-semibold"
                            />
                        </div>
                    </div>
                </section>

                <div className="space-y-5">
                    <section className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm md:rounded-[2rem] md:p-6">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Vista previa</p>
                        <div className="mt-4 rounded-[1.5rem] border border-zinc-100 bg-zinc-50 p-5">
                            <p className="text-lg font-black tracking-tight text-zinc-900">{nombre || "Pendiente"}</p>
                            <p className="mt-2 text-sm text-zinc-500">{selectedCategory}</p>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Unidad</p>
                                    <p className="mt-1 text-sm font-semibold text-zinc-700">{unidad}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Stock minimo</p>
                                    <p className="mt-1 text-sm font-semibold text-zinc-700">{stockMinimo}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Costo unitario</p>
                                    <p className="mt-1 break-words text-sm font-semibold text-zinc-700">
                                        ${Number(costoUnitario || 0).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="sticky bottom-[calc(var(--admin-mobile-nav-height)+1rem)] z-10 space-y-3 rounded-[1.75rem] border border-zinc-200 bg-white/95 p-4 shadow-lg backdrop-blur md:static md:rounded-[2rem] md:bg-white md:p-0 md:shadow-none md:backdrop-blur-none">
                        <Button
                            type="submit"
                            disabled={loading || !nombre.trim()}
                            className="h-12 w-full rounded-2xl bg-zinc-900 text-sm font-black uppercase tracking-[0.14em] text-white"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {loading ? "Guardando..." : "Guardar insumo"}
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
