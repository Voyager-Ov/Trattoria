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
    getProducts,
    createPromotion,
} from "../actions";
import {
    Loader2,
    Save,
    Plus,
    Trash2,
    Search,
    Image as ImageIcon,
    Tag,
    Utensils,
    Layers
} from "lucide-react";
import { Prisma } from "@prisma/client";
import Image from "next/image";

type Category = Prisma.CategoryGetPayload<{ select: { id: true; nombre: true; esPromocion: true } }>;
type Product = Prisma.ProductGetPayload<{ select: { id: true; nombre: true; precio: true; categoryId: true } }>;

interface SelectionItem {
    id: string;
    nombre: string;
    tipo: "PRODUCT" | "CATEGORY";
    precio?: number;
    cantidad: number;
}

interface CreatePromotionSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function CreatePromotionSheet({ open, onOpenChange, onSuccess }: CreatePromotionSheetProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [promoCategories, setPromoCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // Promo State
    const [formData, setFormData] = useState({
        nombre: "",
        descripcion: "",
        precio: "",
        categoriaPromoId: "",
        imagen: "" as string | null,
    });

    // Selections
    const [selectedItems, setSelectedItems] = useState<SelectionItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open]);

    async function loadData() {
        setFetchingData(true);
        try {
            const [catRes, prodRes] = await Promise.all([
                getCategories(),
                getProducts()
            ]);

            if (catRes.success && catRes.data) {
                const cats = catRes.data as any[];
                setCategories(cats.filter(c => !c.esPromocion));
                setPromoCategories(cats.filter(c => c.esPromocion));
            }

            if (prodRes.success && prodRes.data) {
                setProducts(prodRes.data as any[]);
            }
        } catch (error) {
            toast.error("Error al cargar datos");
        } finally {
            setFetchingData(false);
        }
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, imagen: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const addItem = (item: Product | Category, tipo: "PRODUCT" | "CATEGORY") => {
        const existingItem = selectedItems.find(i => i.id === item.id);

        if (existingItem) {
            setSelectedItems(prev => prev.map(i =>
                i.id === item.id ? { ...i, cantidad: i.cantidad + 1 } : i
            ));
            toast.success(`Incrementada cantidad de ${item.nombre}`);
            return;
        }

        setSelectedItems(prev => [
            ...prev,
            {
                id: item.id,
                nombre: item.nombre,
                tipo,
                precio: tipo === "PRODUCT" ? Number((item as Product).precio) : undefined,
                cantidad: 1
            }
        ]);
        setSearchQuery("");
    };

    const updateQuantity = (id: string, delta: number) => {
        setSelectedItems(prev => prev.map(item => {
            if (item.id === id) {
                const newCantidad = Math.max(1, item.cantidad + delta);
                return { ...item, cantidad: newCantidad };
            }
            return item;
        }));
    };

    const removeItem = (id: string) => {
        setSelectedItems(prev => prev.filter(item => item.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nombre.trim()) return toast.error("El nombre es obligatorio");
        if (!formData.precio) return toast.error("El precio es obligatorio");
        if (!formData.categoriaPromoId) return toast.error("Selecciona una categoría de promoción");
        if (selectedItems.length === 0) return toast.error("Agrega al menos un producto o categoría");

        setIsLoading(true);
        try {
            // Calcular el ahorro (discountValue) para la base de datos
            const totalOriginal = selectedItems
                .filter(i => i.tipo === "PRODUCT")
                .reduce((acc, curr) => acc + ((curr.precio || 0) * curr.cantidad), 0);

            const precioFinal = Number(formData.precio);
            const discountValue = Math.max(0, totalOriginal - precioFinal);

            const res = await createPromotion({
                ...formData,
                discountValue, // El ahorro calculado
                discountType: "FIXED_AMOUNT",
                items: selectedItems.filter(i => i.tipo === "PRODUCT").map(i => ({
                    productId: i.id,
                    quantity: i.cantidad
                })),
                categoryIds: selectedItems.filter(i => i.tipo === "CATEGORY").map(i => i.id),
            });

            if (res.success) {
                toast.success("Promoción creada exitosamente");
                setFormData({
                    nombre: "",
                    descripcion: "",
                    precio: "",
                    categoriaPromoId: "",
                    imagen: null,
                });
                setSelectedItems([]);
                onOpenChange(false);
                onSuccess?.();
            } else {
                toast.error(res.error || "Error al crear la promoción");
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredSuggestions = searchQuery.length > 0 ? [
        ...products.filter(p => p.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(p => ({ ...p, tipo: "PRODUCT" as const })),
        ...categories.filter(c => c.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(c => ({ ...c, tipo: "CATEGORY" as const }))
    ].slice(0, 5) : [];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl rounded-l-[2rem] border-zinc-200 shadow-2xl p-0 overflow-hidden flex flex-col">
                <SheetHeader className="p-8 bg-zinc-50 border-b border-zinc-100 shrink-0">
                    <SheetTitle className="text-2xl font-bold text-zinc-900 tracking-tight">Nueva Promoción</SheetTitle>
                    <SheetDescription className="text-zinc-500 font-medium">
                        Crea un paquete promocional con productos y categorías.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-zinc-100 scrollbar-track-transparent">

                        {/* Basic Info Section */}
                        <div className="space-y-6">
                            <h3 className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-400 mb-4 px-1">Información General</h3>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Nombre de la Promoción</Label>
                                    <Input
                                        placeholder="Ej: Promo Familiar Fin de Semana"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        className="h-12 bg-zinc-50 border-zinc-200 rounded-xl focus-visible:ring-zinc-400 transition-all text-sm shadow-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Precio Promo</Label>
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
                                    <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Categoría Promo</Label>
                                    <Select
                                        value={formData.categoriaPromoId}
                                        onValueChange={(val) => setFormData({ ...formData, categoriaPromoId: val })}
                                    >
                                        <SelectTrigger className="h-12 bg-zinc-50 border-zinc-200 rounded-xl focus:ring-zinc-400 transition-all">
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl shadow-xl border-zinc-100">
                                            {promoCategories.map((cat) => (
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
                                    placeholder="¿Qué incluye esta promoción?"
                                    className="min-h-[100px] bg-zinc-50 border-zinc-200 rounded-2xl focus-visible:ring-zinc-400 transition-all text-sm shadow-none resize-none"
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                />
                            </div>

                            {/* Image Upload */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Imagen de la Promo</Label>
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
                                            Sube una imagen atractiva para la promoción.
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-10 rounded-full border-zinc-200 hover:bg-zinc-50 transition-all font-bold text-[0.65rem] uppercase tracking-widest px-6"
                                            onClick={() => document.getElementById('promo-image-upload')?.click()}
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-2" />
                                            Sellar Imagen
                                        </Button>
                                        <input
                                            id="promo-image-upload"
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contents Section */}
                        <div className="space-y-6 pt-4 border-t border-zinc-100">
                            <h3 className="text-[0.65rem] font-bold uppercase tracking-widest text-zinc-400 mb-4 px-1">Contenido del Paquete</h3>

                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                <Input
                                    placeholder="Buscar productos..."
                                    className="h-12 pl-11 bg-white border-zinc-200 rounded-xl focus:ring-zinc-400 transition-all text-sm shadow-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && filteredSuggestions.length > 0 && (
                                    <div className="absolute z-10 w-full mt-2 bg-white border border-zinc-100 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2">
                                        {filteredSuggestions.map(item => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => addItem(item as any, item.tipo)}
                                                className="w-full text-left p-3 hover:bg-zinc-50 rounded-xl flex items-center gap-3 transition-colors"
                                            >
                                                <div className="h-8 w-8 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                                                    {item.tipo === "PRODUCT" ? <Utensils className="h-4 w-4 text-zinc-400" /> : <Layers className="h-4 w-4 text-zinc-400" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-sm text-zinc-900 truncate">{item.nombre}</p>
                                                        <Badge variant="secondary" className="text-[10px] uppercase h-4 px-1.5 font-black bg-zinc-100 text-zinc-500 border-none">
                                                            {item.tipo === "PRODUCT" ? "Producto" : "Categoría"}
                                                        </Badge>
                                                    </div>
                                                    {item.tipo === "PRODUCT" && <p className="text-[0.65rem] text-zinc-500 uppercase tracking-tighter">Precio: ${Number((item as any).precio).toFixed(2)}</p>}
                                                </div>
                                                <Plus className="h-4 w-4 text-zinc-300" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Added Items List */}
                            <div className="space-y-3">
                                {selectedItems.length === 0 ? (
                                    <div className="py-12 bg-zinc-50 rounded-[2rem] border border-dashed border-zinc-200 flex flex-col items-center justify-center text-center px-6">
                                        <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center border border-zinc-100 mb-3 shadow-sm">
                                            <Tag className="h-6 w-6 text-zinc-200" />
                                        </div>
                                        <p className="text-sm font-bold text-zinc-500">Sin elementos agregados</p>
                                        <p className="text-[0.65rem] text-zinc-400 font-medium max-w-[200px] mt-1 uppercase tracking-wider">Agrega productos específicos o categorías enteras a la promoción.</p>
                                    </div>
                                ) : (
                                    selectedItems.map(item => (
                                        <div key={item.id} className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group">
                                            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center border border-zinc-200 shadow-sm shrink-0">
                                                {item.tipo === "PRODUCT" ? <Utensils className="h-5 w-5 text-zinc-400" /> : <Layers className="h-5 w-5 text-zinc-400" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-sm text-zinc-900 truncate">{item.nombre}</p>
                                                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-tighter">
                                                        {item.tipo === "PRODUCT" ? "Producto" : "Categoría"}
                                                    </span>
                                                </div>
                                                {item.tipo === "PRODUCT" && (
                                                    <p className="text-[0.65rem] text-zinc-400 font-bold tracking-tighter">
                                                        Ref: ${item.precio?.toFixed(2)} c/u
                                                    </p>
                                                )}
                                            </div>

                                            {item.tipo === "PRODUCT" && (
                                                <div className="flex items-center bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(item.id, -1)}
                                                        className="h-8 w-8 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 transition-colors"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-8 text-center text-xs font-bold text-zinc-900 border-x border-zinc-100">
                                                        {item.cantidad}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(item.id, 1)}
                                                        className="h-8 w-8 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 transition-colors"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => removeItem(item.id)}
                                                className="h-9 w-9 flex items-center justify-center rounded-xl text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Total Original vs Promo */}
                            <div className="p-5 bg-zinc-900 rounded-[1.5rem] flex items-center justify-between shadow-lg shadow-zinc-200 mt-4">
                                <div>
                                    <p className="text-[0.65rem] font-bold text-zinc-400 uppercase tracking-widest">Ahorro Estimado</p>
                                    <p className="text-xl font-black text-white">
                                        {formData.precio && selectedItems.some(i => i.tipo === "PRODUCT")
                                            ? `${Math.max(0, (((selectedItems.filter(i => i.tipo === "PRODUCT").reduce((acc, current) => acc + ((current.precio || 0) * current.cantidad), 0)) - Number(formData.precio)))).toFixed(2)}`
                                            : "0.00"}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[0.65rem] font-bold text-zinc-400 uppercase tracking-widest">Precio Final</p>
                                    <p className="text-xl font-black text-emerald-400">${Number(formData.precio || 0).toFixed(2)}</p>
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
                            Guardar Promoción
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
