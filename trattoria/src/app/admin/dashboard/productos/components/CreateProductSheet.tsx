"use client";

import React, { useState, useEffect } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    getCategories,
    getSupplies,
    createProductWithRecipe,
} from "../actions";
import {
    Loader2,
    Save,
    Plus,
    Trash2,
    Search,
    Image as ImageIcon,
    UtensilsCrossed
} from "lucide-react";
import { Prisma, UnidadMedida } from "@prisma/client";
import Image from "next/image";

type Category = Prisma.CategoryGetPayload<{ select: { id: true; nombre: true; esPromocion: true } }>;
type Supply = Prisma.SupplyGetPayload<{ select: { id: true; nombre: true; descripcion: true; costoUnitario: true; unidad: true; stockActual: true; stockMinimo: true; createdAt: true; updatedAt: true; deletedAt: true } }>;

interface RecipeItem {
    supplyId: string;
    qtyPerUnit: number;
    unidad: UnidadMedida;
    supplyName?: string;
    costoUnitarioIndividual?: number;
}

interface CreateProductSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function CreateProductSheet({ open, onOpenChange, onSuccess }: CreateProductSheetProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [supplies, setSupplies] = useState<Supply[]>([]);

    // Product State
    const [formData, setFormData] = useState({
        nombre: "",
        descripcion: "",
        precio: "",
        costoUnitario: "",
        categoryId: "",
        imagen: "" as string | null,
    });

    // Recipe State
    const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);
    const [searchSupply, setSearchSupply] = useState("");

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open]);

    async function loadData() {
        setFetchingData(true);
        try {
            const [catRes, supRes] = await Promise.all([
                getCategories(),
                getSupplies()
            ]);

            if (catRes.success && catRes.data) {
                setCategories((catRes.data as any[]).filter((c: any) => !c.esPromocion));
            }

            if (supRes.success && supRes.data) {
                setSupplies(supRes.data as Supply[]);
            }
        } catch (error) {
            toast.error("Error al cargar datos");
        } finally {
            setFetchingData(false);
        }
    }

    // Automatically calculate suggested unit cost
    useEffect(() => {
        const totalCost = recipeItems.reduce((acc, item) => {
            const itemCost = (item.costoUnitarioIndividual || 0) * (item.qtyPerUnit || 0);
            return acc + itemCost;
        }, 0);

        if (totalCost > 0) {
            setFormData(prev => ({
                ...prev,
                costoUnitario: totalCost.toFixed(2)
            }));
        }
    }, [recipeItems]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, imagen: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const addRecipeItem = (supply: Supply) => {
        if (recipeItems.find(item => item.supplyId === supply.id)) {
            toast.error("Este insumo ya está en la receta");
            return;
        }

        setRecipeItems(prev => [
            ...prev,
            {
                supplyId: supply.id,
                qtyPerUnit: 1,
                unidad: supply.unidad,
                supplyName: supply.nombre,
                costoUnitarioIndividual: Number(supply.costoUnitario)
            }
        ]);
        setSearchSupply("");
    };

    const removeRecipeItem = (supplyId: string) => {
        setRecipeItems(prev => prev.filter(item => item.supplyId !== supplyId));
    };

    const updateRecipeItemQty = (supplyId: string, value: string) => {
        const qty = parseFloat(value);
        setRecipeItems(prev => prev.map(item =>
            item.supplyId === supplyId ? { ...item, qtyPerUnit: isNaN(qty) ? 0 : qty } : item
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nombre.trim()) return toast.error("El nombre es obligatorio");
        if (!formData.precio) return toast.error("El precio es obligatorio");
        if (!formData.categoryId) return toast.error("Selecciona una categoría");

        setIsLoading(true);
        try {
            const res = await createProductWithRecipe(
                { ...formData, unidad: "UNIDAD" },
                recipeItems.map(({ supplyId, qtyPerUnit, unidad }) => ({
                    supplyId,
                    qtyPerUnit,
                    unidad
                }))
            );

            if (res.success) {
                toast.success("Producto creado exitosamente");
                setFormData({
                    nombre: "",
                    descripcion: "",
                    precio: "",
                    costoUnitario: "",
                    categoryId: "",
                    imagen: null,
                });
                setRecipeItems([]);
                onOpenChange(false);
                onSuccess?.();
            } else {
                toast.error(res.error || "Error al crear el producto");
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredSupplies = supplies.filter(s =>
        s.nombre.toLowerCase().includes(searchSupply.toLowerCase())
    ).slice(0, 5);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl rounded-l-[2rem] border-zinc-200 shadow-2xl p-0 overflow-hidden flex flex-col">
                <SheetHeader className="p-8 bg-zinc-50 border-b border-zinc-100 shrink-0">
                    <SheetTitle className="text-2xl font-bold text-zinc-900 tracking-tight">Nuevo Producto</SheetTitle>
                    <SheetDescription className="text-zinc-500 font-medium">
                        Completa la información para crear un nuevo producto.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-zinc-100 scrollbar-track-transparent">

                        {/* Basic Info Section */}
                        <div className="space-y-6">
                            <h3 className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-400 mb-4 px-1">Información General</h3>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Nombre del Producto</Label>
                                    <Input
                                        placeholder="Ej: Pizza Napolitana Especial"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        className="h-12 bg-zinc-50 border-zinc-200 rounded-xl focus-visible:ring-zinc-400 transition-all text-sm shadow-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Precio de Venta</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="h-12 pl-8 bg-zinc-50 border-zinc-200 rounded-xl focus-visible:ring-zinc-400 transition-all text-sm shadow-none"
                                            value={formData.precio}
                                            onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Categoría</Label>
                                    <Select
                                        value={formData.categoryId}
                                        onValueChange={(val) => setFormData({ ...formData, categoryId: val })}
                                    >
                                        <SelectTrigger className="h-12 bg-zinc-50 border-zinc-200 rounded-xl focus:ring-zinc-400 transition-all">
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl shadow-xl border-zinc-100">
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id} className="rounded-xl my-0.5">
                                                    {cat.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Descripción</Label>
                                <Textarea
                                    placeholder="Detalles sobre los ingredientes, tamaño, etc."
                                    className="min-h-[100px] bg-zinc-50 border-zinc-200 rounded-2xl focus-visible:ring-zinc-400 transition-all text-sm shadow-none resize-none"
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                />
                            </div>

                            {/* Image Upload */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Imagen</Label>
                                <div className="flex items-start gap-6">
                                    <div className="h-32 w-32 rounded-[2rem] bg-zinc-50 border-2 border-dashed border-zinc-200 flex items-center justify-center overflow-hidden shrink-0 group hover:border-zinc-400 transition-colors">
                                        {formData.imagen ? (
                                            <div className="relative w-full h-full">
                                                <Image src={formData.imagen} alt="Preview" fill className="object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, imagen: null })}
                                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                >
                                                    <Trash2 className="h-6 w-6 text-white" />
                                                </button>
                                            </div>
                                        ) : (
                                            <ImageIcon className="h-8 w-8 text-zinc-300" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <p className="text-[0.7rem] text-zinc-500 font-medium">
                                            Sube una imagen para mostrar en el catálogo. Se recomienda un formato cuadrado (1:1).
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-10 rounded-full border-zinc-200 hover:bg-zinc-50 transition-all font-bold text-[0.65rem] uppercase tracking-widest px-6"
                                            onClick={() => document.getElementById('image-upload')?.click()}
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-2" />
                                            Seleccionar Imagen
                                        </Button>
                                        <input
                                            id="image-upload"
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recipe Section */}
                        <div className="space-y-6 pt-4 border-t border-zinc-100">
                            <h3 className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-400 mb-4 px-1">Receta e Insumos</h3>

                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                <Input
                                    placeholder="Buscar insumos por nombre..."
                                    className="h-12 pl-11 bg-white border-zinc-200 rounded-xl focus:ring-zinc-400 transition-all text-sm shadow-sm"
                                    value={searchSupply}
                                    onChange={(e) => setSearchSupply(e.target.value)}
                                />
                                {searchSupply && filteredSupplies.length > 0 && (
                                    <div className="absolute z-10 w-full mt-2 bg-white border border-zinc-100 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2">
                                        {filteredSupplies.map(supply => (
                                            <button
                                                key={supply.id}
                                                type="button"
                                                onClick={() => addRecipeItem(supply)}
                                                className="w-full text-left p-3 hover:bg-zinc-50 rounded-xl flex items-center gap-3 transition-colors"
                                            >
                                                <div className="h-8 w-8 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                                                    <UtensilsCrossed className="h-4 w-4 text-zinc-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm text-zinc-900 truncate">{supply.nombre}</p>
                                                    <p className="text-[0.65rem] text-zinc-500 uppercase tracking-tighter">Stock: {supply.stockActual.toString()} {supply.unidad}</p>
                                                </div>
                                                <Plus className="h-4 w-4 text-zinc-300" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Added Items */}
                            <div className="space-y-3">
                                {recipeItems.length === 0 ? (
                                    <div className="py-12 bg-zinc-50 rounded-[2rem] border border-dashed border-zinc-200 flex flex-col items-center justify-center text-center px-6">
                                        <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center border border-zinc-100 mb-3 shadow-sm">
                                            <UtensilsCrossed className="h-6 w-6 text-zinc-200" />
                                        </div>
                                        <p className="text-sm font-bold text-zinc-500">Sin insumos registrados</p>
                                        <p className="text-[0.65rem] text-zinc-400 font-medium max-w-[200px] mt-1 uppercase tracking-wider">La receta ayuda a calcular el costo y controlar el stock automático.</p>
                                    </div>
                                ) : (
                                    recipeItems.map(item => (
                                        <div key={item.supplyId} className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-zinc-900 truncate">{item.supplyName}</p>
                                                <p className="text-[0.65rem] text-zinc-400 uppercase font-bold tracking-tighter">Costo: ${(item.costoUnitarioIndividual! * item.qtyPerUnit).toFixed(2)}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-24">
                                                    <Input
                                                        type="number"
                                                        value={item.qtyPerUnit}
                                                        onChange={(e) => updateRecipeItemQty(item.supplyId, e.target.value)}
                                                        className="h-10 pr-10 bg-white border-zinc-200 rounded-xl text-xs font-bold font-mono"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-black text-zinc-400 pointer-events-none">
                                                        {item.unidad}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeRecipeItem(item.supplyId)}
                                                    className="h-9 w-9 flex items-center justify-center rounded-xl text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-all"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Cost Summary */}
                            <div className="p-5 bg-zinc-900 rounded-[1.5rem] flex items-center justify-between shadow-lg shadow-zinc-200">
                                <div>
                                    <p className="text-[0.65rem] font-bold text-zinc-400 uppercase tracking-widest">Costo Sugerido</p>
                                    <p className="text-xl font-black text-white">${formData.costoUnitario || "0.00"}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[0.65rem] font-bold text-zinc-400 uppercase tracking-widest">Utilidad</p>
                                    <p className="text-sm font-bold text-emerald-400">
                                        {formData.precio && formData.costoUnitario
                                            ? `${(((Number(formData.precio) - Number(formData.costoUnitario)) / Number(formData.precio)) * 100).toFixed(0)}%`
                                            : "0%"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-zinc-50 border-t border-zinc-100 shrink-0 flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 h-12 rounded-full border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-all"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 h-12 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-zinc-200"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Guardar Producto
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
