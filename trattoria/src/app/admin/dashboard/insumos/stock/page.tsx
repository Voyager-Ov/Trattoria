"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    ChevronRight,
    History as HistoryIcon,
    Info,
    Loader2,
    Save,
    ShoppingCart,
    TrendingUp,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { getSupplies, registerStockEntry, registerStockMovement } from "../actions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { TipoMovimientoStock } from "@prisma/client";

interface Supply {
    id: string;
    nombre: string;
    unidad: string;
    stockActual: number;
    stockMinimo?: number;
    costoUnitario?: number;
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
        motivo: "Compra de Insumos",
        proveedor: "",
        tipo: "IN" as TipoMovimientoStock,
    });

    const loadSupplies = React.useCallback(async () => {
        const result = await getSupplies();
        if (result.success) {
            setSupplies(result.data as Supply[]);
        }
    }, []);

    useEffect(() => {
        loadSupplies();
    }, [loadSupplies]);

    const selectedSupply = supplies.find(s => s.id === formData.supplyId);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!formData.supplyId) {
            toast.error("Seleccione un insumo");
            return;
        }
        if (!formData.cantidad || parseFloat(formData.cantidad) <= 0) {
            toast.error("La cantidad debe ser mayor a 0");
            return;
        }

        setLoading(true);

        let result;

        if (formData.tipo === "IN") {
            const qty = parseFloat(formData.cantidad);
            const total = parseFloat(formData.costoTotal) || 0;
            const unitCost = qty > 0 ? total / qty : 0;

            result = await registerStockEntry({
                supplyId: formData.supplyId,
                cantidad: qty,
                costoUnitario: unitCost,
                motivo: formData.motivo,
                proveedor: formData.proveedor || undefined,
            });
        } else {
            result = await registerStockMovement({
                supplyId: formData.supplyId,
                cantidad: parseFloat(formData.cantidad),
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
        <div className="flex flex-col gap-8 p-8 bg-zinc-50 min-h-screen">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                <Link href="/admin/dashboard" className="hover:text-zinc-600 transition-colors">Dashboard</Link>
                <ChevronRight className="h-4 w-4" />
                <Link href="/admin/dashboard/insumos" className="hover:text-zinc-600 transition-colors">Inventario</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-zinc-900 capitalize">Registrar Stock</span>
            </div>

            <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
                <div>
                    <h1 className="text-4xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                        <div className="h-12 w-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-white">
                            <HistoryIcon className="h-6 w-6" />
                        </div>
                        MOVIMIENTO DE STOCK
                    </h1>
                    <p className="text-zinc-500 mt-2 font-medium">Actualiza el inventario base de tus insumos.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/admin/dashboard/insumos">
                        <Button variant="outline" className="h-14 w-14 rounded-full border-zinc-200 hover:bg-zinc-50 shadow-none p-0 transition-all active:scale-95">
                            <X className="h-6 w-6 text-zinc-400" />
                        </Button>
                    </Link>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-10 rounded-[3rem] border border-zinc-200 shadow-sm space-y-8">
                        <div className="flex items-center gap-4 border-b border-zinc-100 pb-8">
                            <div className="p-4 bg-zinc-50 rounded-2xl text-zinc-900">
                                <ShoppingCart className="h-6 w-6 text-zinc-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-zinc-900 tracking-tight leading-none uppercase italic">Detalle de Adquisición</h3>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-2">Especifica insumo y costos</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Tipo de Movimiento</Label>
                                <Select
                                    value={formData.tipo}
                                    onValueChange={(val: TipoMovimientoStock) => {
                                        setFormData({
                                            ...formData,
                                            tipo: val,
                                            motivo: val === "IN" ? "Compra de Insumos" : val === "OUT" ? "Consumo / Merma" : "Ajuste de Inventario"
                                        });
                                    }}
                                >
                                    <SelectTrigger className="h-16 bg-zinc-50 border-transparent rounded-[1.5rem] focus:bg-white focus:border-zinc-200 focus:ring-0 transition-all text-base font-bold px-6 shadow-none">
                                        <SelectValue placeholder="Seleccionar tipo" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl shadow-xl border-zinc-100 p-2">
                                        <SelectItem value="IN" className="rounded-xl py-3 font-bold text-emerald-600">ENTRADA (COMPRA)</SelectItem>
                                        <SelectItem value="OUT" className="rounded-xl py-3 font-bold text-amber-600">SALIDA (MERMA/CONSUMO)</SelectItem>
                                        <SelectItem value="AJUSTE" className="rounded-xl py-3 font-bold text-blue-600">AJUSTE MANUAL</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Insumo</Label>
                                <Select
                                    value={formData.supplyId}
                                    onValueChange={(val) => {
                                        const supply = supplies.find(s => s.id === val);
                                        setFormData({
                                            ...formData,
                                            supplyId: val,
                                            costoTotal: "" // Reset total cost on supply change to avoid confusion
                                        });
                                    }}
                                >
                                    <SelectTrigger className="h-16 bg-zinc-50 border-transparent rounded-[1.5rem] focus:bg-white focus:border-zinc-200 focus:ring-0 transition-all text-base font-bold px-6 shadow-none">
                                        <SelectValue placeholder="Seleccionar insumo" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl shadow-xl border-zinc-100 p-2 max-h-[400px]">
                                        {supplies.map(s => (
                                            <SelectItem key={s.id} value={s.id} className="rounded-xl py-3 font-bold">
                                                <div className="flex items-center justify-between w-full gap-8">
                                                    <span>{s.nombre}</span>
                                                    <Badge variant="outline" className="text-[0.6rem] font-bold uppercase tracking-tighter bg-zinc-50 border-zinc-200 px-2 py-0">
                                                        {Number(s.stockActual).toFixed(2)} {s.unidad}
                                                    </Badge>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">
                                    {formData.tipo === "IN" ? "Cantidad Comprada" : "Cantidad a Movilizar"}
                                </Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        step="any"
                                        placeholder="0.000"
                                        className="h-16 bg-zinc-50 border-transparent rounded-[1.5rem] focus:bg-white focus:border-zinc-200 focus:ring-0 transition-all text-base font-bold px-6 shadow-none pr-16"
                                        value={formData.cantidad}
                                        onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                                    />
                                    {selectedSupply && (
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400 font-black text-[0.65rem] uppercase tracking-widest">
                                            {selectedSupply.unidad}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {formData.tipo === "IN" && (
                                <div className="space-y-3">
                                    <Label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Costo Total de Compra ($)</Label>
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                                        <Input
                                            type="number"
                                            step="any"
                                            placeholder="0.00"
                                            className="pl-10 h-16 bg-zinc-50 border-transparent rounded-[1.5rem] focus:bg-white focus:border-zinc-200 focus:ring-0 transition-all text-base font-bold px-6 shadow-none"
                                            value={formData.costoTotal}
                                            onChange={(e) => setFormData({ ...formData, costoTotal: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3 md:col-span-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Motivo o Referencia</Label>
                                <Input
                                    placeholder="Ej: Compra mensual, Ajuste de inventario..."
                                    className="h-16 bg-zinc-50 border-transparent rounded-[1.5rem] focus:bg-white focus:border-zinc-200 focus:ring-0 transition-all text-base font-medium px-6 shadow-none"
                                    value={formData.motivo}
                                    onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                                />
                            </div>

                            {formData.tipo === "IN" && (
                                <div className="space-y-3 md:col-span-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Proveedor (Opcional)</Label>
                                    <Input
                                        placeholder="Ej: Distribuidora San Juan, Mayorista Central..."
                                        className="h-16 bg-zinc-50 border-transparent rounded-[1.5rem] focus:bg-white focus:border-zinc-200 focus:ring-0 transition-all text-base font-medium px-6 shadow-none"
                                        value={formData.proveedor}
                                        onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {selectedSupply && formData.cantidad ? (
                        <div className="bg-zinc-900 text-white p-8 rounded-[2.5rem] shadow-xl overflow-hidden relative group transition-all">
                            <div className="absolute top-0 right-0 p-8 text-white/[0.03] pointer-events-none">
                                <TrendingUp className="h-40 w-40 -mr-16 -mt-16 rotate-12" />
                            </div>

                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/10 rounded-xl">
                                        <TrendingUp className="h-6 w-6 text-emerald-400" />
                                    </div>
                                    <h3 className="text-lg font-black tracking-tight leading-none italic uppercase">Impacto</h3>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Nuevo Stock Estimado</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black tracking-tighter italic">
                                                {(Number(selectedSupply.stockActual) + (parseFloat(formData.cantidad) || 0)).toFixed(2)}
                                            </span>
                                            <span className="text-zinc-500 font-bold text-xs uppercase tracking-widest">{selectedSupply.unidad}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 border-t border-white/5 pt-6">
                                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Inversión Total</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-lg font-black text-zinc-500">$</span>
                                            <span className="text-3xl font-black tracking-tighter text-emerald-400 italic">
                                                {(parseFloat(formData.costoTotal) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        {formData.cantidad && parseFloat(formData.cantidad) > 0 && (
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                                Costo Unit: ${(parseFloat(formData.costoTotal) / parseFloat(formData.cantidad)).toFixed(2)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="p-4 bg-zinc-50 rounded-2xl shadow-sm">
                                <Info className="h-8 w-8 text-zinc-300" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-black text-zinc-900 uppercase tracking-tight italic">Resumen pendiente</h4>
                                <p className="text-[0.7rem] text-zinc-400 font-medium">Completa el formulario para visualizar el impacto.</p>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || !formData.supplyId}
                            className="h-16 w-full rounded-2xl bg-zinc-900 text-white font-black text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
                            CONFIRMAR ENTRADA
                        </Button>
                        <Link href="/admin/dashboard/insumos">
                            <Button variant="outline" className="h-16 w-full rounded-2xl border-zinc-200 hover:bg-zinc-50 font-bold text-zinc-500 shadow-none transition-all">
                                CANCELAR
                            </Button>
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default function RegistrarStockPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        }>
            <RegistrarStockContent />
        </Suspense>
    );
}
