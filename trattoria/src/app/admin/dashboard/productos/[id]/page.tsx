"use client";

import { useState, useEffect, useCallback, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Edit3,
    Package,
    Tag,
    DollarSign,
    TrendingUp,
    ClipboardList,
    Image as ImageIcon,
    Loader2,
    Trash2,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { getProductById, softDeleteProduct } from "../actions";
import Link from "next/link";
import Image from "next/image";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState<any>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/dashboard/productos/${id}`);
            const res = await response.json();

            if (res.success && res.data) {
                setProduct(res.data);
            } else {
                toast.error(res.error || "No se pudo cargar el producto");
                router.push("/admin/dashboard/productos");
            }
        } catch (error) {
            console.error("Error fetching product:", error);
            toast.error("Error al cargar los datos");
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = async () => {
        if (!confirm("¿Estás seguro de eliminar este producto?")) return;
        const res = await softDeleteProduct(id);
        if (res.success) {
            toast.success("Producto eliminado");
            router.push("/admin/dashboard/productos");
        } else {
            toast.error(res.error || "Error al eliminar");
        }
    };

    // Cost and Margin Calculations
    const calculations = useMemo(() => {
        if (!product || !product.recipeItems) return { totalCost: 0, margin: 0, marginPercentage: 0 };

        const totalCost = product.recipeItems.reduce((acc: number, item: any) => {
            const supplyCost = Number(item.supply.costoUnitario || 0);
            const qty = Number(item.qtyPerUnit || 0);
            return acc + (supplyCost * qty);
        }, 0);

        const precio = Number(product.precio);
        const margin = precio - totalCost;
        const marginPercentage = precio > 0 ? (margin / precio) * 100 : 0;

        return { totalCost, margin, marginPercentage };
    }, [product]);

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (!product) return null;

    return (
        <div className="flex flex-col gap-8 p-8 bg-zinc-50 min-h-screen">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/admin/dashboard/productos")}
                        className="h-10 w-10 rounded-full hover:bg-white shadow-sm border border-transparent hover:border-zinc-200 transition-all"
                    >
                        <ChevronLeft className="h-5 w-5 text-zinc-600" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{product.nombre}</h1>
                            <Badge
                                variant="secondary"
                                className={
                                    product.activo
                                        ? "bg-emerald-50 text-emerald-600 border-none font-bold text-[0.65rem] px-3 py-1 rounded-full"
                                        : "bg-red-50 text-red-600 border-none font-bold text-[0.65rem] px-3 py-1 rounded-full"
                                }
                            >
                                {product.activo ? "ACTIVO" : "INACTIVO"}
                            </Badge>
                        </div>
                        <p className="text-zinc-500 text-sm mt-1">ID: {product.id}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handleDelete}
                        className="rounded-full border-zinc-200 text-red-500 hover:text-red-600 hover:bg-red-50 transition-all font-medium h-11 px-6 shadow-sm"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                    </Button>
                    <Link href={`/admin/dashboard/productos/${product.id}/editar`}>
                        <Button className="rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition-all font-medium h-11 px-8 shadow-md">
                            <Edit3 className="h-4 w-4 mr-2" />
                            Editar Producto
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm p-6 flex flex-col justify-between group hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[0.65rem] font-bold text-zinc-400 uppercase tracking-widest">Precio de Venta</span>
                        <div className="h-8 w-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-zinc-900">${Number(product.precio).toFixed(2)}</span>
                        <span className="text-xs text-zinc-400 font-medium">/{product.unidad}</span>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm p-6 flex flex-col justify-between group hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[0.65rem] font-bold text-zinc-400 uppercase tracking-widest">Costo Total (Receta)</span>
                        <div className="h-8 w-8 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                            <ClipboardList className="h-4 w-4" />
                        </div>
                    </div>
                    <div>
                        <span className="text-3xl font-bold text-zinc-900">${calculations.totalCost.toFixed(2)}</span>
                        <p className="text-[0.65rem] text-zinc-400 mt-1 uppercase font-bold tracking-tighter">Basado en {product.recipeItems?.length || 0} insumos</p>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm p-6 flex flex-col justify-between group hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[0.65rem] font-bold text-zinc-400 uppercase tracking-widest">Margen de Ganancia</span>
                        <div className="h-8 w-8 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </div>
                    <div>
                        <span className="text-3xl font-bold text-zinc-900">${calculations.margin.toFixed(2)}</span>
                        <p className="text-xs text-zinc-400 font-medium mt-1">Utilidad neta por unidad</p>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm p-6 flex flex-col justify-between group hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[0.65rem] font-bold text-zinc-400 uppercase tracking-widest">% Rentabilidad</span>
                        <div className="h-8 w-8 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
                            <Tag className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-zinc-900">{calculations.marginPercentage.toFixed(1)}%</span>
                        <Badge className={`${calculations.marginPercentage > 30 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} border-none rounded-full`}>
                            {calculations.marginPercentage > 30 ? 'Saludable' : 'Revisar'}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Product Info Sidebar */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="aspect-square relative flex items-center justify-center bg-zinc-50 border-b border-zinc-100 p-8">
                            {product.imagen ? (
                                <Image
                                    src={product.imagen}
                                    alt={product.nombre}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <ImageIcon className="h-20 w-20 text-zinc-200" />
                            )}
                        </div>
                        <div className="p-8">
                            <h3 className="font-bold text-zinc-900 text-lg mb-4">Detalles del Producto</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-zinc-50">
                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Categoría</span>
                                    <span className="text-sm font-semibold text-zinc-700 bg-zinc-100 px-3 py-1 rounded-full">{product.category.nombre}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-zinc-50">
                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Estado</span>
                                    <Badge variant="outline" className={`${product.activo ? 'border-emerald-200 text-emerald-600' : 'border-orange-200 text-orange-600'} rounded-full font-bold px-3`}>
                                        {product.activo ? 'ACTIVO' : 'DESACTIVADO'}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-zinc-50">
                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Unidad</span>
                                    <span className="text-sm font-bold text-zinc-900 uppercase">{product.unidad}</span>
                                </div>
                                <div className="py-4">
                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-2">Descripción</span>
                                    <p className="text-sm text-zinc-600 leading-relaxed italic border-l-2 border-zinc-200 pl-4">
                                        {product.descripcion || "Sin descripción proporcionada."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recipe/Supplies Table */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm overflow-hidden h-full">
                        <div className="p-8 border-b border-zinc-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-zinc-900 text-lg">Composición del Producto</h3>
                                <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest mt-1">Receta / Insumos utilizados</p>
                            </div>
                            <div className="h-10 w-10 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100">
                                <Package className="h-5 w-5 text-zinc-400" />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-zinc-50/50">
                                    <tr>
                                        <th className="px-8 py-5 text-left font-bold text-[0.6rem] uppercase tracking-widest text-zinc-400">Insumo</th>
                                        <th className="px-8 py-5 text-center font-bold text-[0.6rem] uppercase tracking-widest text-zinc-400">Cantidad</th>
                                        <th className="px-8 py-5 text-center font-bold text-[0.6rem] uppercase tracking-widest text-zinc-400">Unidad</th>
                                        <th className="px-8 py-5 text-right font-bold text-[0.6rem] uppercase tracking-widest text-zinc-400">Costo Unitario</th>
                                        <th className="px-8 py-5 text-right font-bold text-[0.6rem] uppercase tracking-widest text-zinc-400">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50">
                                    {product.recipeItems?.length > 0 ? (
                                        product.recipeItems.map((item: any) => {
                                            const subtotal = Number(item.supply.costoUnitario || 0) * Number(item.qtyPerUnit);
                                            return (
                                                <tr key={item.id} className="hover:bg-zinc-50/30 transition-colors">
                                                    <td className="px-8 py-5 font-semibold text-zinc-900">{item.supply.nombre}</td>
                                                    <td className="px-8 py-5 text-center font-bold text-zinc-600">{Number(item.qtyPerUnit).toFixed(3)}</td>
                                                    <td className="px-8 py-5 text-center">
                                                        <Badge variant="outline" className="text-[0.6rem] font-bold border-zinc-200 text-zinc-400 px-2 py-0 uppercase">
                                                            {item.supply.unidad}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-8 py-5 text-right text-zinc-500 font-mono">${Number(item.supply.costoUnitario || 0).toFixed(2)}</td>
                                                    <td className="px-8 py-5 text-right font-bold text-zinc-900 font-mono">${subtotal.toFixed(2)}</td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3 opacity-30">
                                                    <AlertCircle className="h-10 w-10 text-zinc-400" />
                                                    <p className="font-semibold text-zinc-400 italic">No hay insumos definidos en la receta.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-zinc-50/80">
                                    <tr>
                                        <td colSpan={4} className="px-8 py-6 text-right font-bold text-zinc-400 uppercase tracking-widest text-xs">Costo Total de Producción</td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-xl font-black text-zinc-900 font-mono">${calculations.totalCost.toFixed(2)}</span>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
