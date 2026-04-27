"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Plus, Save } from "lucide-react";
import { UnidadMedida } from "@prisma/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { createSupply, getSupplyCategories } from "../actions";

type SupplyCategory = { id: string; nombre: string };

export default function NuevoInsumoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<SupplyCategory[]>([]);
    const [unidad, setUnidad] = useState<UnidadMedida>(UnidadMedida.GRAMO);
    const [categoryId, setCategoryId] = useState("none");

    useEffect(() => {
        async function loadCategories() {
            const result = await getSupplyCategories();
            if (result.success && result.data) {
                setCategories(result.data as SupplyCategory[]);
            }
        }

        loadCategories();
    }, []);

    async function handleSubmit(formData: FormData) {
        setLoading(true);

        const result = await createSupply({
            nombre: formData.get("nombre") as string,
            descripcion: ((formData.get("descripcion") as string) || "").trim() || undefined,
            unidad: formData.get("unidad") as UnidadMedida,
            stockMinimo: Number(formData.get("stockMinimo")),
            costoUnitario: 0,
            categoryId: (formData.get("categoryId") as string) !== "none" ? (formData.get("categoryId") as string) : undefined,
        });

        if (!result.success) {
            toast.error(result.error || "Error al crear el insumo");
            setLoading(false);
            return;
        }

        toast.success("Insumo creado correctamente");
        router.push("/empleado/insumos");
        router.refresh();
    }

    return (
        <div className="app-page-safe-bottom flex min-h-screen flex-col gap-6 bg-white px-4 py-4 sm:px-6 md:gap-8 md:px-8 md:py-8">
            <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-3">
                    <Link href="/empleado/insumos" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition-colors hover:text-zinc-900">
                        <ChevronLeft className="h-4 w-4" />
                        Volver a insumos
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">Nuevo insumo</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
                            Registra el insumo con su unidad, categoria y stock minimo. El costo se completa cuando ingresas una compra de stock.
                        </p>
                    </div>
                </div>

                <Button form="new-supply-form" type="submit" disabled={loading} className="h-11 rounded-2xl bg-zinc-950 px-5 font-bold text-white hover:bg-zinc-800">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar insumo
                </Button>
            </section>

            <form id="new-supply-form" action={handleSubmit} className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_320px]">
                <section className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="nombre" className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                Nombre
                            </Label>
                            <Input id="nombre" name="nombre" required className="h-12 rounded-2xl border-zinc-200" />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="descripcion" className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                Descripcion
                            </Label>
                            <Input id="descripcion" name="descripcion" className="h-12 rounded-2xl border-zinc-200" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Unidad</Label>
                            <Select name="unidad" value={unidad} onValueChange={(value) => setUnidad(value as UnidadMedida)}>
                                <SelectTrigger className="h-12 rounded-2xl border-zinc-200">
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
                                <SelectTrigger className="h-12 rounded-2xl border-zinc-200">
                                    <SelectValue placeholder="Sin categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sin categoria</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="stockMinimo" className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                Stock minimo
                            </Label>
                            <Input
                                id="stockMinimo"
                                name="stockMinimo"
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue="1"
                                className="h-12 rounded-2xl border-zinc-200"
                            />
                        </div>
                    </div>
                </section>

                <aside className="space-y-4">
                    <div className="rounded-[2rem] border border-zinc-200 bg-zinc-950 p-5 text-white shadow-xl shadow-zinc-200">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                            <Plus className="h-5 w-5" />
                        </div>
                        <h2 className="mt-5 text-xl font-black tracking-tight">Alta operativa</h2>
                        <p className="mt-2 text-sm leading-6 text-white/70">
                            El insumo nace con costo cero y sin stock. Cuando registres una compra se guardan proveedor y costo unitario.
                        </p>
                    </div>

                    <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Siguiente paso</p>
                        <p className="mt-3 text-sm leading-6 text-zinc-600">
                            Despues del alta, usa <span className="font-semibold text-zinc-950">Registrar stock</span> para cargar la primera entrada y dejar trazado el movimiento.
                        </p>
                    </div>
                </aside>
            </form>
        </div>
    );
}
