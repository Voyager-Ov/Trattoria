"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft, Save, Tag, Clock,
    Image as ImageIcon, Upload, Check, Search, Loader2,
    Minus, Plus, Info, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getCategories, getProducts, createPromotion } from "../../actions";

interface SelectionItem {
    id: string;
    nombre: string;
    precio: number;
    imagen?: string | null;
    categoryId: string;
}

interface SelectedProduct {
    id: string;
    quantity: number;
}

const DAYS = [
    { label: "Lun", value: "L" },
    { label: "Mar", value: "M" },
    { label: "Mié", value: "X" },
    { label: "Jue", value: "J" },
    { label: "Vie", value: "V" },
    { label: "Sáb", value: "S" },
    { label: "Dom", value: "D" },
];

export default function NuevaPromocionPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);

    const [categories, setCategories] = useState<any[]>([]);
    const [products, setProducts] = useState<SelectionItem[]>([]);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        code: "",
        finalPrice: "",
        startDate: "",
        endDate: "",
        imagen: "",
        isActive: true,
    });

    const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedDays, setSelectedDays] = useState<string[]>([]);

    const [productSearch, setProductSearch] = useState("");
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setFetchingData(true);
            const [catRes, prodRes] = await Promise.all([getCategories(), getProducts()]);
            if (catRes.success && catRes.data) {
                const promoCats = (catRes.data as any[]).filter((c: any) =>
                    c.nombre.toLowerCase().includes("promo")
                );
                setCategories(promoCats.length > 0 ? promoCats : (catRes.data as any[]));
            }
            if (prodRes.success && prodRes.data) setProducts(prodRes.data as SelectionItem[]);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Error al cargar datos necesarios");
        } finally {
            setFetchingData(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const totalOriginalPrice = useMemo(() => {
        return selectedProducts.reduce((sum, sp) => {
            const product = products.find(p => p.id === sp.id);
            return sum + (product ? Number(product.precio) * sp.quantity : 0);
        }, 0);
    }, [selectedProducts, products]);

    const calculatedDiscount = useMemo(() => {
        const final = Number(formData.finalPrice) || 0;
        if (totalOriginalPrice === 0 || final === 0) return 0;
        return Math.max(0, totalOriginalPrice - final);
    }, [totalOriginalPrice, formData.finalPrice]);

    const savingsPercentage = useMemo(() => {
        if (totalOriginalPrice === 0 || calculatedDiscount === 0) return 0;
        return Math.round((calculatedDiscount / totalOriginalPrice) * 100);
    }, [totalOriginalPrice, calculatedDiscount]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            toast.error("El nombre de la promoción es obligatorio");
            return;
        }

        if (selectedProducts.length === 0) {
            toast.error("Debes seleccionar al menos un producto");
            return;
        }

        setLoading(true);
        try {
            const res = await createPromotion({
                ...formData,
                discountType: "FIXED_AMOUNT",
                discountValue: calculatedDiscount,
                daysOfWeek: selectedDays.length > 0 ? selectedDays.join(",") : null,
                items: selectedProducts.map(p => ({ productId: p.id, quantity: p.quantity })),
                categoryIds: selectedCategories,
            });

            if (res.success) {
                toast.success("Promoción creada satisfactoriamente");
                router.back();
            } else {
                toast.error(res.error || "Error al crear la promoción");
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado");
        } finally {
            setLoading(false);
        }
    };

    const toggleProduct = (id: string) => {
        setSelectedProducts(prev => {
            const existing = prev.find(p => p.id === id);
            if (existing) {
                return prev.filter(p => p.id !== id);
            } else {
                return [...prev, { id, quantity: 1 }];
            }
        });
    };

    const updateProductQuantity = (id: string, delta: number) => {
        setSelectedProducts(prev => prev.map(p => {
            if (p.id === id) {
                const newQty = Math.max(1, p.quantity + delta);
                return { ...p, quantity: newQty };
            }
            return p;
        }));
    };

    const toggleDay = (val: string) => {
        setSelectedDays(prev =>
            prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val]
        );
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error("La imagen supera los 10MB permitidos.");
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
                setFormData({ ...formData, imagen: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    if (fetchingData) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    const filteredProducts = products.filter(p =>
        p.nombre.toLowerCase().includes(productSearch.toLowerCase())
    );

    return (
        <form onSubmit={handleSubmit} className="flex h-[calc(100vh-2rem)] md:h-[calc(100vh-6rem)] w-full overflow-hidden bg-zinc-50 rounded-[2rem] border border-zinc-200 shadow-sm">
            
            {/* LEFT PANEL - Configuration */}
            <div className="w-full md:w-[450px] shrink-0 bg-white border-r border-zinc-200 flex flex-col relative z-10">
                {/* Fixed Header */}
                <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="h-10 w-10 rounded-xl bg-zinc-50 hover:bg-zinc-100"
                        >
                            <ChevronLeft className="h-5 w-5 text-zinc-900" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-black text-zinc-900 leading-none">Nueva Promoción</h1>
                            <p className="text-xs text-zinc-500 font-medium mt-1">Configuración general</p>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
                    
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Nombre</Label>
                            <Input
                                placeholder="Ej: Combo Familiar"
                                className="h-11 rounded-xl border-zinc-200 bg-white font-bold text-sm px-4 focus:ring-zinc-900 focus:border-zinc-900"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Descripción</Label>
                            <Textarea
                                placeholder="¿Qué incluye esta oferta?"
                                className="min-h-[80px] rounded-xl border-zinc-200 bg-white font-medium p-4 text-sm focus:ring-zinc-900 focus:border-zinc-900 resize-none"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center justify-between">
                                <span>Imagen</span>
                                <span className="text-[9px] text-zinc-300">Máx 10MB</span>
                            </Label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="relative h-40 w-full rounded-xl border-2 border-dashed border-zinc-200 hover:border-zinc-900 transition-all bg-zinc-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden group"
                            >
                                {previewImage ? (
                                    <>
                                        <img src={previewImage} alt="Preview" className="h-full w-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Upload className="h-6 w-6 text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-10 w-10 bg-white rounded-full shadow-sm flex items-center justify-center">
                                            <Upload className="h-4 w-4 text-zinc-400" />
                                        </div>
                                        <span className="text-xs font-bold text-zinc-500">Tocar para subir foto</span>
                                    </div>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Categorías donde aparece</Label>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => {
                                const isSelected = selectedCategories.includes(cat.id);
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setSelectedCategories(prev =>
                                            prev.includes(cat.id) ? prev.filter(c => c !== cat.id) : [...prev, cat.id]
                                        )}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                            isSelected 
                                            ? 'bg-zinc-900 text-white border-zinc-900' 
                                            : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                                        }`}
                                    >
                                        {cat.nombre}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Vigencia */}
                    <div className="space-y-4">
                        <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vigencia (Opcional)</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-bold text-zinc-400">FECHA DESDE</Label>
                                <Input type="date" className="h-10 rounded-xl bg-white border-zinc-200 text-xs px-3" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-bold text-zinc-400">FECHA HASTA</Label>
                                <Input type="date" className="h-10 rounded-xl bg-white border-zinc-200 text-xs px-3" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                            </div>
                        </div>
                        <div className="pt-1">
                            <Label className="text-[9px] font-bold text-zinc-400 mb-2 block">DÍAS ESPECÍFICOS (VACÍO = TODOS)</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {DAYS.map(day => (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => toggleDay(day.value)}
                                        className={`h-8 w-8 rounded-lg font-bold text-[10px] transition-all border ${
                                            selectedDays.includes(day.value)
                                            ? 'bg-zinc-900 text-white border-zinc-900'
                                            : 'bg-white text-zinc-400 border-zinc-200'
                                        }`}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fixed Footer with Price */}
                <div className="border-t border-zinc-200 bg-zinc-50 shrink-0 p-5 space-y-4">
                    <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                            <Tag className="h-16 w-16" />
                        </div>
                        <div className="flex justify-between items-center mb-3 relative z-10">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Valor normal</span>
                            <span className="text-sm font-bold text-zinc-400 line-through">${totalOriginalPrice.toLocaleString()}</span>
                        </div>
                        <div className="space-y-1.5 relative z-10">
                            <Label className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Precio Final de Venta</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                                <Input
                                    type="number"
                                    step="any"
                                    placeholder="0.00"
                                    className="h-12 rounded-xl border-orange-200 bg-orange-50/50 pl-8 text-lg font-black text-zinc-900 focus:border-orange-500 focus:ring-orange-500/20"
                                    value={formData.finalPrice}
                                    onChange={(e) => setFormData({ ...formData, finalPrice: e.target.value })}
                                />
                            </div>
                        </div>
                        {calculatedDiscount > 0 && (
                            <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 relative z-10">
                                <span>Ahorro: ${calculatedDiscount.toLocaleString()}</span>
                                <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 border-none">{savingsPercentage}% OFF</Badge>
                            </div>
                        )}
                    </div>
                    
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-xl bg-zinc-900 text-white font-black text-sm shadow-md hover:bg-zinc-800 transition-all hover:-translate-y-0.5 active:scale-95"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                        Publicar Promoción
                    </Button>
                </div>
            </div>

            {/* RIGHT PANEL - Products Catalog */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FA] relative">
                {/* Sticky Header */}
                <div className="sticky top-0 z-10 p-5 bg-[#F8F9FA]/90 backdrop-blur-md border-b border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-zinc-900">Seleccionar Productos</h2>
                        <p className="text-xs text-zinc-500 font-medium mt-1">
                            {selectedProducts.length} items agregados al combo
                        </p>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Buscar en el menú..."
                            className="h-10 rounded-xl border-zinc-200 bg-white pl-9 text-sm focus:border-zinc-900 focus:ring-0"
                            value={productSearch}
                            onChange={e => setProductSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-20">
                        {filteredProducts.map(product => {
                            const selected = selectedProducts.find(p => p.id === product.id);
                            const isSelected = !!selected;

                            return (
                                <div
                                    key={product.id}
                                    className={`group relative rounded-[1.5rem] transition-all overflow-hidden bg-white flex flex-col border ${
                                        isSelected
                                        ? 'border-orange-500 shadow-lg shadow-orange-500/10 ring-1 ring-orange-500'
                                        : 'border-zinc-200 shadow-sm hover:shadow-md hover:border-zinc-300'
                                    }`}
                                >
                                    <div
                                        onClick={() => toggleProduct(product.id)}
                                        className="h-28 w-full bg-zinc-50 flex items-center justify-center overflow-hidden cursor-pointer relative shrink-0"
                                    >
                                        {product.imagen ? (
                                            <img src={product.imagen} alt={product.nombre} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <ImageIcon className="h-8 w-8 text-zinc-300" />
                                        )}
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 bg-orange-500 text-white rounded-full p-1 shadow-md">
                                                <Check className="h-3 w-3 stroke-[4px]" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-3 flex-1 flex flex-col justify-between min-h-[5rem]">
                                        <div>
                                            <h4 className="font-bold text-xs text-zinc-900 leading-snug mb-1">
                                                {product.nombre}
                                            </h4>
                                            <span className="text-sm font-black text-zinc-900">${Number(product.precio).toLocaleString()}</span>
                                        </div>

                                        {isSelected && (
                                            <div className="mt-3 flex items-center justify-between p-1 bg-zinc-100 rounded-lg">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); updateProductQuantity(product.id, -1); }}
                                                    className="h-7 w-7 bg-white rounded-md shadow-sm flex items-center justify-center hover:bg-zinc-50 transition-all"
                                                >
                                                    <Minus className="h-3 w-3 text-zinc-900" />
                                                </button>
                                                <span className="font-black text-sm text-zinc-900">{selected.quantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); updateProductQuantity(product.id, 1); }}
                                                    className="h-7 w-7 bg-white rounded-md shadow-sm flex items-center justify-center hover:bg-zinc-50 transition-all"
                                                >
                                                    <Plus className="h-3 w-3 text-zinc-900" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {filteredProducts.length === 0 && (
                            <div className="col-span-full py-10 flex flex-col items-center justify-center text-zinc-400">
                                <Package className="h-10 w-10 mb-2 opacity-50" />
                                <p className="font-medium">No se encontraron productos</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #e4e4e7;
                    border-radius: 20px;
                }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                    background-color: #d4d4d8;
                }
            `}</style>
        </form>
    );
}
