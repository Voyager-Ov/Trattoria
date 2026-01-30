"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Edit3,
    Tag,
    Calendar,
    Image as ImageIcon,
    LayoutGrid,
    Package,
    Clock,
    DollarSign,
    Percent,
    ArrowRight,
    CheckCircle2,
    Loader2,
    CalendarDays,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { getPromotionById } from "../../actions";
import Link from "next/link";

const DAYS_MAP: Record<string, string> = {
    "L": "Lunes",
    "M": "Martes",
    "X": "Miércoles",
    "J": "Jueves",
    "V": "Viernes",
    "S": "Sábado",
    "D": "Domingo",
};

export default function DetallePromocionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [promotion, setPromotion] = useState<any>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getPromotionById(id);
            if (res.success) {
                setPromotion(res.data);
            } else {
                toast.error(res.error || "No se pudo encontrar la promoción");
                router.push("/admin/dashboard/productos");
            }
        } catch (error) {
            console.error("Error fetching promotion:", error);
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (!promotion) return null;

    const daysList = promotion.daysOfWeek ? promotion.daysOfWeek.split(",") : [];

    // Calculate final price (total - discount)
    const totalOriginal = promotion.items?.reduce((sum: number, item: any) =>
        sum + (Number(item.product?.precio || 0) * item.quantity), 0) || 0;
    const finalPrice = totalOriginal - Number(promotion.discountValue);
    const savingsPercentage = totalOriginal > 0 ? Math.round((Number(promotion.discountValue) / totalOriginal) * 100) : 0;

    return (
        <div className="flex flex-col gap-10 p-12 bg-[#F8F9FA] min-h-screen w-full">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 sticky top-0 z-20 bg-[#F8F9FA]/90 backdrop-blur-xl py-6 -mt-12 border-b border-zinc-100">
                <div className="flex items-center gap-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/admin/dashboard/productos")}
                        className="h-14 w-14 rounded-[1.5rem] bg-white shadow-sm border border-zinc-200 hover:border-zinc-900 transition-all"
                    >
                        <ChevronLeft className="h-7 w-7 text-zinc-900" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[0.6rem] px-2 py-0.5 rounded-full">PROMOCIÓN ACTIVA</Badge>
                            <span className="text-zinc-300 text-xs font-bold uppercase tracking-widest">ID: {promotion.id.slice(-8)}</span>
                        </div>
                        <h1 className="text-4xl font-black text-zinc-900 tracking-tight">{promotion.name}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Link href={`/admin/dashboard/productos/promociones/${id}/editar`}>
                        <Button
                            className="rounded-[2rem] bg-zinc-900 text-white hover:bg-zinc-800 transition-all font-black h-14 px-10 text-lg shadow-2xl shadow-zinc-300"
                        >
                            <Edit3 className="h-5 w-5 mr-3" />
                            Editar Oferta
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                {/* Left: Graphic & Summary */}
                <div className="xl:col-span-7 space-y-10">
                    <Card className="rounded-[4rem] border-none shadow-[0_40px_80px_rgba(0,0,0,0.05)] overflow-hidden bg-white">
                        <div className="aspect-[21/9] w-full relative group">
                            {promotion.imagen ? (
                                <img src={promotion.imagen} alt={promotion.name} className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full bg-zinc-50 flex items-center justify-center">
                                    <ImageIcon className="h-20 w-20 text-zinc-100" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-12">
                                <h2 className="text-4xl font-black text-white mb-2">{promotion.name}</h2>
                                <p className="text-white/80 text-lg font-medium max-w-2xl">{promotion.description || "Sin descripción proporcionada"}</p>
                            </div>
                        </div>

                        <CardContent className="p-12">
                            <h3 className="text-xl font-black text-zinc-900 mb-8 uppercase tracking-widest flex items-center gap-3">
                                <Package className="h-6 w-6 text-zinc-400" />
                                Productos Incluidos
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {promotion.items?.map((item: any) => (
                                    <div key={item.id} className="flex items-center gap-5 p-5 bg-zinc-50 rounded-[2rem] border border-zinc-100 group transition-all hover:bg-white hover:shadow-xl hover:border-transparent">
                                        <div className="h-20 w-20 rounded-[1.5rem] overflow-hidden bg-white shadow-sm flex-shrink-0">
                                            {item.product?.imagen ? (
                                                <img src={item.product.imagen} alt={item.product.nombre} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center">
                                                    <Tag className="h-8 w-8 text-zinc-100" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="h-6 w-6 bg-zinc-900 text-white rounded-lg flex items-center justify-center font-black text-xs leading-none">
                                                    {item.quantity}
                                                </span>
                                                <h4 className="font-black text-zinc-900 text-lg uppercase tracking-tight">{item.product?.nombre}</h4>
                                            </div>
                                            <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest">${Number(item.product?.precio || 0).toLocaleString()} c/u</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Categories */}
                        <Card className="rounded-[3rem] border-none shadow-[0_20px_40px_rgba(0,0,0,0.03)] bg-white overflow-hidden">
                            <CardHeader className="p-10 pb-0">
                                <CardTitle className="text-lg font-black uppercase tracking-widest text-zinc-400">Visibilidad</CardTitle>
                            </CardHeader>
                            <CardContent className="p-10 flex flex-wrap gap-2">
                                {promotion.categories?.length > 0 ? (
                                    promotion.categories.map((cat: any) => (
                                        <Badge key={cat.id} className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border-none px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-tight">
                                            {cat.nombre}
                                        </Badge>
                                    ))
                                ) : (
                                    <p className="text-zinc-300 font-bold italic">No hay categorías asignadas</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Status Info */}
                        <Card className="rounded-[3rem] border-none shadow-[0_20px_40px_rgba(0,0,0,0.03)] bg-zinc-900 text-white overflow-hidden">
                            <CardHeader className="p-10 pb-0">
                                <CardTitle className="text-lg font-black uppercase tracking-widest text-white/40">Estado de Operación</CardTitle>
                            </CardHeader>
                            <CardContent className="p-10">
                                <div className="flex items-center gap-6">
                                    <div className={`h-16 w-16 rounded-[2rem] flex items-center justify-center ${promotion.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                        <CheckCircle2 className="h-10 w-10" />
                                    </div>
                                    <div>
                                        <h4 className="text-3xl font-black tracking-tight">{promotion.isActive ? 'Pública' : 'Borrador'}</h4>
                                        <p className="text-white/40 font-bold text-sm">La oferta {promotion.isActive ? 'está disponible para clientes' : 'no es visible en el menú'}.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right: Constraints & Pricing */}
                <div className="xl:col-span-5 space-y-10">
                    <Card className="rounded-[4rem] border-none shadow-[0_40px_80px_rgba(0,0,0,0.1)] overflow-hidden bg-white border-4 border-zinc-900/5">
                        <div className="flex flex-col">
                            <div className="p-12 space-y-10 bg-zinc-900 text-white">
                                <div className="flex items-center gap-6">
                                    <div className="h-20 w-20 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-emerald-500/20">
                                        <Tag className="h-10 w-10 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-4xl font-black tracking-tighter uppercase whitespace-nowrap">Precio de Oferta</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-emerald-400 font-black text-xl italic">{savingsPercentage}% OFF</span>
                                            <span className="text-zinc-500 font-black text-lg line-through ml-2">${totalOriginal.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center py-4 border-y border-white/10">
                                    <span className="text-7xl font-black tracking-tighter block">${finalPrice.toLocaleString()}</span>
                                    <span className="text-zinc-500 font-black uppercase tracking-[0.4em] text-xs mt-4 block">Precio Final al Cliente</span>
                                </div>

                                <div className="flex items-center gap-4 p-8 bg-white/5 rounded-[2.5rem] border border-white/5">
                                    <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400">
                                        <DollarSign className="h-6 w-6" />
                                    </div>
                                    <p className="text-sm font-bold text-white/60">
                                        Generando un ahorro directo de <span className="text-white font-black">${Number(promotion.discountValue).toLocaleString()}</span> comparado con compras individuales.
                                    </p>
                                </div>
                            </div>

                            <div className="p-12 space-y-12">
                                <div className="space-y-6">
                                    <h3 className="text-xl font-black text-zinc-900 uppercase tracking-widest flex items-center gap-3">
                                        <CalendarDays className="h-6 w-6 text-zinc-300" />
                                        Disponibilidad Temporal
                                    </h3>
                                    <div className="grid grid-cols-2 gap-6 pb-6 border-b border-zinc-50">
                                        <div className="space-y-2">
                                            <p className="text-[0.65rem] font-black text-zinc-400 uppercase tracking-widest">Desde</p>
                                            <p className="text-xl font-black text-zinc-900 italic">
                                                {promotion.startDate ? new Date(promotion.startDate).toLocaleDateString() : 'Sin fecha'}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[0.65rem] font-black text-zinc-400 uppercase tracking-widest">Hasta</p>
                                            <p className="text-xl font-black text-zinc-900 italic">
                                                {promotion.endDate ? new Date(promotion.endDate).toLocaleDateString() : 'Sin fecha'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <p className="text-[0.65rem] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                            <Clock className="h-3 w-3" />
                                            Días habilitados
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {daysList.length > 0 ? daysList.map((val: string) => (
                                                <div key={val} className="px-5 py-3 rounded-2xl bg-zinc-50 text-zinc-900 border border-zinc-100 font-black text-sm transition-all hover:bg-zinc-100 uppercase tracking-tighter">
                                                    {DAYS_MAP[val] || val}
                                                </div>
                                            )) : (
                                                <p className="text-sm font-bold text-zinc-400 italic">Habilitada todos los días</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 p-8 bg-zinc-50 rounded-[3rem] border border-zinc-100">
                                    <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-zinc-400 flex-shrink-0">
                                        <Info className="h-5 w-5" />
                                    </div>
                                    <p className="text-xs font-bold text-zinc-500 leading-relaxed italic">
                                        Asegúrate de que los ingredientes para los productos incluidos en esta promoción estén siempre disponibles en cocina para evitar cancelaciones.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
