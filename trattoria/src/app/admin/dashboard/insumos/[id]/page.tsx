import React from "react";
import { getSupplyById } from "../actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
    ChevronLeft, 
    Edit, 
    ArchiveX, 
    Package, 
    AlertTriangle, 
    CheckCircle2, 
    History 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function InsumoDetallePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const result = await getSupplyById(id);

    if (!result.success || !result.data) {
        notFound();
    }

    const supply = result.data as any;
    const stockActual = Number(supply.stockActual);
    const stockMinimo = Number(supply.stockMinimo);

    // Indicator logic
    let stockIndicatorState = "ok";
    if (stockActual === 0) stockIndicatorState = "empty";
    else if (stockActual <= stockMinimo) stockIndicatorState = "low";

    const isArchived = supply.activo === false;

    return (
        <div className="flex flex-col gap-8 p-8 bg-zinc-50 min-h-screen">
            {/* Header & Breadcrumb */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                    <Link href="/admin/dashboard/insumos" className="hover:text-zinc-900 flex items-center gap-1 transition-colors">
                        <ChevronLeft className="h-4 w-4" />
                        Volver a Insumos
                    </Link>
                </div>
                
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
                                {supply.nombre}
                            </h1>
                            {isArchived && (
                                <Badge variant="secondary" className="bg-zinc-200 text-zinc-600 font-bold uppercase tracking-widest text-[0.65rem] px-2 py-0.5">
                                    Archivado
                                </Badge>
                            )}
                        </div>
                        {supply.descripcion && (
                            <p className="text-zinc-500 mt-2">{supply.descripcion}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* 
                          These buttons would be client side if they did immediate actions. 
                          Since this is a Server Component, for actions like "Archivar", 
                          we should ideally use a Client Component wrapper. 
                          But for now we can link to an edit page or show them visually. 
                        */}
                        {!isArchived && (
                            <Link href={`/admin/dashboard/insumos/${supply.id}/editar`}>
                                <Button variant="outline" className="rounded-xl font-medium shadow-sm transition-all h-10 px-4 group">
                                    <Edit className="h-4 w-4 mr-2 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                                    Editar Información
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: General Info and Stock */}
                <div className="space-y-8">
                    {/* General Info Card */}
                    <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-zinc-50 rounded-xl">
                                <Package className="h-5 w-5 text-zinc-600" />
                            </div>
                            <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Info General</h2>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Categoría</h3>
                                <p className="font-medium text-zinc-900">
                                    {supply.categoria ? supply.categoria : "Sin categoría"}
                                </p>
                            </div>
                            <div className="h-px w-full bg-zinc-100" />
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Unidad de Medida</h3>
                                <p className="font-medium text-zinc-900 capitalize">
                                    {supply.unidad.toLowerCase()}
                                </p>
                            </div>
                            <div className="h-px w-full bg-zinc-100" />
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Costo Unitario</h3>
                                <p className="font-medium text-zinc-900 text-lg">
                                    ${Number(supply.costoUnitario).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="h-px w-full bg-zinc-100" />
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Fecha de Registro</h3>
                                <p className="font-medium text-zinc-900">
                                    {format(new Date(supply.createdAt), "dd 'de' MMMM, yyyy", { locale: es })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stock Status Card */}
                    <div className={`rounded-[2rem] border shadow-sm p-8 relative overflow-hidden ${
                        stockIndicatorState === "ok" ? "bg-emerald-50 border-emerald-100" :
                        stockIndicatorState === "low" ? "bg-amber-50 border-amber-100" :
                        "bg-rose-50 border-rose-100"
                    }`}>
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            {stockIndicatorState === "ok" ? (
                                <CheckCircle2 className="h-32 w-32 -mt-8 -mr-8 text-emerald-900" />
                            ) : (
                                <AlertTriangle className="h-32 w-32 -mt-8 -mr-8 text-rose-900" />
                            )}
                        </div>

                        <div className="relative z-10">
                            <h2 className={`text-sm font-bold uppercase tracking-widest mb-6 ${
                                stockIndicatorState === "ok" ? "text-emerald-800/60" :
                                stockIndicatorState === "low" ? "text-amber-800/60" :
                                "text-rose-800/60"
                            }`}>
                                Estado de Inventario
                            </h2>

                            <div className="flex items-baseline gap-2 mb-2">
                                <span className={`text-5xl font-black tracking-tighter ${
                                    stockIndicatorState === "ok" ? "text-emerald-900" :
                                    stockIndicatorState === "low" ? "text-amber-900" :
                                    "text-rose-900"
                                }`}>
                                    {stockActual.toLocaleString()}
                                </span>
                                <span className={`font-bold uppercase tracking-widest ${
                                    stockIndicatorState === "ok" ? "text-emerald-700" :
                                    stockIndicatorState === "low" ? "text-amber-700" :
                                    "text-rose-700"
                                }`}>
                                    {supply.unidad}
                                </span>
                            </div>

                            <p className={`font-medium text-sm ${
                                stockIndicatorState === "ok" ? "text-emerald-800" :
                                stockIndicatorState === "low" ? "text-amber-800" :
                                "text-rose-800"
                            }`}>
                                {stockIndicatorState === "ok" && "Nivel de stock saludable"}
                                {stockIndicatorState === "low" && "Atención: Stock bajo el nivel crítico."}
                                {stockIndicatorState === "empty" && "¡Peligro! Insumo agotado."}
                            </p>

                            <div className={`mt-6 pt-6 border-t ${
                                stockIndicatorState === "ok" ? "border-emerald-200/50" :
                                stockIndicatorState === "low" ? "border-amber-200/50" :
                                "border-rose-200/50"
                            }`}>
                                <h3 className={`text-xs font-bold uppercase tracking-widest mb-1 ${
                                    stockIndicatorState === "ok" ? "text-emerald-800/50" :
                                    stockIndicatorState === "low" ? "text-amber-800/50" :
                                    "text-rose-800/50"
                                }`}>
                                    Stock Crítico Pautado
                                </h3>
                                <p className={`font-bold ${
                                    stockIndicatorState === "ok" ? "text-emerald-900" :
                                    stockIndicatorState === "low" ? "text-amber-900" :
                                    "text-rose-900"
                                }`}>
                                    {stockMinimo.toLocaleString()} {supply.unidad.toLowerCase()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: History */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm h-full flex flex-col overflow-hidden">
                        <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-zinc-50 rounded-xl">
                                    <History className="h-5 w-5 text-zinc-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Historial de Movimientos</h2>
                                    <p className="text-sm font-medium text-zinc-500 mt-1">
                                        Últimos ingresos y egresos registrados
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto p-0">
                            <table className="w-full text-sm">
                                <thead className="bg-zinc-50/50 sticky top-0 z-10 border-b border-zinc-100">
                                    <tr>
                                        <th className="text-left font-semibold text-zinc-500 uppercase tracking-widest text-[0.65rem] p-6">Fecha</th>
                                        <th className="text-left font-semibold text-zinc-500 uppercase tracking-widest text-[0.65rem] p-6">Tipo</th>
                                        <th className="text-left font-semibold text-zinc-500 uppercase tracking-widest text-[0.65rem] p-6">Cantidad</th>
                                        <th className="text-left font-semibold text-zinc-500 uppercase tracking-widest text-[0.65rem] p-6 w-[40%]">Motivo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {!supply.movements || supply.movements.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-20">
                                                <div className="flex flex-col items-center justify-center text-zinc-400">
                                                    <History className="h-12 w-12 mb-4 opacity-20" />
                                                    <p className="font-medium text-zinc-500">No hay movimientos registrados</p>
                                                    <p className="text-sm mt-1">El stock inicial y ajustes aparecerán aquí.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        supply.movements.map((mov: any) => (
                                            <tr key={mov.id} className="hover:bg-zinc-50/50 transition-colors">
                                                <td className="p-6 text-zinc-600 font-medium">
                                                    {format(new Date(mov.createdAt), "dd MMM, HH:mm", { locale: es })}
                                                </td>
                                                <td className="p-6">
                                                    {mov.tipo === "IN" && (
                                                        <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-none px-2 py-0.5 rounded-md font-bold text-[0.6rem] uppercase tracking-widest">
                                                            Ingreso
                                                        </Badge>
                                                    )}
                                                    {mov.tipo === "OUT" && (
                                                        <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-50 border-none px-2 py-0.5 rounded-md font-bold text-[0.6rem] uppercase tracking-widest">
                                                            Egreso
                                                        </Badge>
                                                    )}
                                                    {mov.tipo === "AJUSTE" && (
                                                        <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-none px-2 py-0.5 rounded-md font-bold text-[0.6rem] uppercase tracking-widest">
                                                            Ajuste
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="p-6">
                                                    <span className={`font-bold flex items-center gap-1 ${
                                                        mov.tipo === "IN" ? "text-emerald-600" :
                                                        mov.tipo === "OUT" ? "text-amber-600" :
                                                        "text-blue-600"
                                                    }`}>
                                                        {mov.tipo === "IN" ? "+" : mov.tipo === "OUT" ? "-" : ""}
                                                        {Number(mov.cantidad).toLocaleString()} 
                                                        <span className="text-[0.6rem] uppercase tracking-widest ml-1">{supply.unidad}</span>
                                                    </span>
                                                </td>
                                                <td className="p-6 text-zinc-600">
                                                    {mov.motivo || "-"}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
