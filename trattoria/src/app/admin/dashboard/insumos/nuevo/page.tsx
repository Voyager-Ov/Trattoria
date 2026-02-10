"use client";

import React from "react";
import {
    ChevronRight,
    ArrowLeft,
    Save,
    X,
    AlertTriangle,
    Info,
    Package,
    Beaker,
    TrendingUp,
    Settings2,
    Plus
} from "lucide-react";
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
import { createSupply } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UnidadMedida } from "@prisma/client";

export default function NuevoInsumoPage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(false);
    
    // Estados para la vista previa
    const [nombre, setNombre] = React.useState("");
    const [unidad, setUnidad] = React.useState<UnidadMedida>(UnidadMedida.GRAMO);
    const [descripcion, setDescripcion] = React.useState("");
    const [stockMinimo, setStockMinimo] = React.useState("1");
    const [costoUnitario, setCostoUnitario] = React.useState("0");

    async function handleSubmit(formData: FormData) {
        setLoading(true);

        const data = {
            nombre: formData.get("nombre") as string,
            unidad: formData.get("unidad") as UnidadMedida,
            stockMinimo: Number(formData.get("stockMinimo")),
            costoUnitario: Number(formData.get("costoUnitario")),
        };

        const result = await createSupply(data);
        if (result.success) {
            toast.success("Insumo creado correctamente");
            router.push("/admin/dashboard/insumos");
            router.refresh();
        } else {
            toast.error(result.error);
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col gap-8 p-8 bg-zinc-50 min-h-screen">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                <Link href="/admin/dashboard" className="hover:text-zinc-600 transition-colors">Dashboard</Link>
                <ChevronRight className="h-4 w-4" />
                <Link href="/admin/dashboard/insumos" className="hover:text-zinc-600 transition-colors">Inventario</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-zinc-900 capitalize">Nuevo Insumo</span>
            </div>

            <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
                <div>
                    <h1 className="text-4xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                        <div className="h-12 w-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-white">
                            <Plus className="h-6 w-6" />
                        </div>
                        REGISTRAR INSUMO
                    </h1>
                    <p className="text-zinc-500 mt-2 font-medium">Define las propiedades básicas y niveles de stock crítico.</p>
                </div>
                <Link href="/admin/dashboard/insumos">
                    <Button variant="outline" className="h-14 w-14 rounded-full border-zinc-200 hover:bg-zinc-50 shadow-none p-0 transition-all active:scale-95">
                        <X className="h-6 w-6 text-zinc-400" />
                    </Button>
                </Link>
            </div>

            <form action={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-10 rounded-[3rem] border border-zinc-200 shadow-sm space-y-8">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Nombre del Insumo</Label>
                                    <Input
                                        name="nombre"
                                        placeholder="Ej: Harina 0000"
                                        required
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        className="h-16 bg-zinc-50 border-transparent rounded-[1.5rem] focus-visible:ring-zinc-900 transition-all text-base font-bold px-6 shadow-none"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Unidad de Medida</Label>
                                    <Select name="unidad" required value={unidad} onValueChange={(value) => setUnidad(value as UnidadMedida)}>
                                        <SelectTrigger className="h-16 bg-zinc-50 border-transparent rounded-[1.5rem] focus:ring-zinc-900 text-base font-bold px-6 shadow-none">
                                            <SelectValue placeholder="Seleccionar unidad" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-zinc-100 shadow-xl">
                                            {Object.values(UnidadMedida).map((u) => (
                                                <SelectItem key={u} value={u} className="h-12 rounded-xl">
                                                    {u.charAt(0) + u.slice(1).toLowerCase()}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Descripción (Opcional)</Label>
                                <Input
                                    name="descripcion"
                                    placeholder="Detalles sobre calidad o proveedor..."
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    className="h-16 bg-zinc-50 border-transparent rounded-[1.5rem] focus-visible:ring-zinc-900 transition-all text-base font-medium px-6 shadow-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-900 p-10 rounded-[3rem] border border-zinc-800 shadow-sm text-white">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-12 w-12 bg-amber-400/20 rounded-2xl flex items-center justify-center text-amber-400">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Stock Crítico</h3>
                                <p className="text-zinc-500 text-sm font-medium">Alertas automáticas al llegar al límite.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Stock Mínimo</Label>
                                <Input
                                    name="stockMinimo"
                                    type="number"
                                    step="0.01"
                                    value={stockMinimo}
                                    onChange={(e) => setStockMinimo(e.target.value)}
                                    required
                                    className="h-16 bg-zinc-800/50 border-transparent rounded-[1.5rem] focus-visible:ring-amber-400 transition-all text-base font-bold px-6 text-white shadow-none"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Costo Unitario (Estimado)</Label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-zinc-500">$</span>
                                    <Input
                                        name="costoUnitario"
                                        type="number"
                                        step="any"
                                        value={costoUnitario}
                                        onChange={(e) => setCostoUnitario(e.target.value)}
                                        required
                                        className="h-16 pl-10 bg-zinc-800/50 border-transparent rounded-[1.5rem] focus-visible:ring-zinc-400 transition-all text-base font-bold px-6 text-white shadow-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-6 ml-1">Vista Previa</h4>
                        <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 flex flex-col items-center text-center gap-4 group">
                            <div className={`h-20 w-20 bg-white shadow-sm rounded-full flex items-center justify-center group-hover:scale-105 transition-transform ${nombre ? 'text-zinc-700' : 'text-zinc-200'}`}>
                                <Beaker className="h-10 w-10" />
                            </div>
                            <div className="w-full">
                                <p className={`font-black uppercase transition-all ${nombre ? 'text-zinc-900 text-lg' : 'text-zinc-300 italic text-base'}`}>
                                    {nombre || 'PENDIENTE'}
                                </p>
                                <p className="text-[0.65rem] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                                    {nombre ? unidad.charAt(0) + unidad.slice(1).toLowerCase() : 'Nombre Insumo'}
                                </p>
                                
                                {nombre && (
                                    <div className="mt-4 pt-4 border-t border-zinc-200 space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-zinc-500 font-medium">Stock mínimo:</span>
                                            <span className="font-bold text-zinc-900">{stockMinimo} {unidad.toLowerCase()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-zinc-500 font-medium">Costo unitario:</span>
                                            <span className="font-bold text-zinc-900">${parseFloat(costoUnitario || '0').toFixed(2)}</span>
                                        </div>
                                        {descripcion && (
                                            <div className="mt-3 pt-3 border-t border-zinc-200">
                                                <p className="text-xs text-zinc-600 italic line-clamp-2">
                                                    {descripcion}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="h-16 w-full rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800 font-black text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <Save className="h-5 w-5" />
                            {loading ? "GUARDANDO..." : "GUARDAR INSUMO"}
                        </Button>
                        <Link href="/admin/dashboard/insumos">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-16 w-full rounded-2xl border-zinc-200 hover:bg-zinc-50 font-bold text-zinc-500 shadow-none transition-all"
                            >
                                CANCELAR
                            </Button>
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    );
}
