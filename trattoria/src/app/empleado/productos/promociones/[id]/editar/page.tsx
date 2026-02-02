"use client";

import { useState, useEffect, useCallback, useMemo, useRef, use } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Save,
    Tag,
    Calendar,
    Image as ImageIcon,
    LayoutGrid,
    Package,
    Plus,
    X,
    Check,
    Search,
    Loader2,
    AlertCircle,
    Info,
    Clock,
    DollarSign,
    Percent,
    Upload,
    Minus,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
    getCategories,
    getProducts,
    updatePromotion,
    getPromotionById,
    deletePromotion
} from "@/app/admin/dashboard/productos/actions";
import Link from "next/link";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

export default function EditarPromocionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

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
            const [catRes, prodRes] = await Promise.all([
                getCategories(),
                getProducts(),
            ]);
            const promoRes = await getPromotionById(id);

            if (catRes.success && catRes.data) {
                const promoCats = (catRes.data as any[]).filter((c: any) =>
                    c.nombre.toLowerCase().includes("promo")
                );
                setCategories(promoCats.length > 0 ? promoCats : (catRes.data as any[]));
            }

            if (prodRes.success && prodRes.data) {
                setProducts(prodRes.data as SelectionItem[]);
            }

            if (promoRes.success && promoRes.data) {
                const promo = promoRes.data as any;

                const initialSelectedProducts = promo.items.map((item: any) => ({
                    id: item.productId,
                    quantity: item.quantity
                }));

                setSelectedProducts(initialSelectedProducts);

                // Calculate total original price of these items
                let totalOrig = 0;
                initialSelectedProducts.forEach((sp: any) => {
                    const product = (prodRes.data as SelectionItem[]).find(p => p.id === sp.id);
                    if (product) totalOrig += Number(product.precio) * sp.quantity;
                });

                setFormData({
                    name: promo.name || "",
                    description: promo.description || "",
                    code: promo.code || "",
                    finalPrice: (totalOrig - Number(promo.discountValue)).toString(),
                    startDate: promo.startDate ? new Date(promo.startDate).toISOString().split('T')[0] : "",
                    endDate: promo.endDate ? new Date(promo.endDate).toISOString().split('T')[0] : "",
                    imagen: promo.imagen || "",
                    isActive: promo.isActive,
                });

                if (promo.imagen) setPreviewImage(promo.imagen);
                if (promo.daysOfWeek) setSelectedDays(promo.daysOfWeek.split(","));
                if (promo.categories) setSelectedCategories(promo.categories.map((c: any) => c.id));
            } else {
                toast.error(promoRes.error || "No se pudo encontrar la promoción");
                router.push("/empleado/productos");
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Error al cargar datos necesarios");
        } finally {
            setFetchingData(false);
        }
    }, [id, router]);

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
        if (totalOriginalPrice === 0) return 0;
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
            const res = await updatePromotion(id, {
                ...formData,
                discountType: "FIXED_AMOUNT",
                discountValue: calculatedDiscount,
                daysOfWeek: selectedDays.join(","),
                items: selectedProducts.map(p => ({ productId: p.id, quantity: p.quantity })),
                categoryIds: selectedCategories,
            });

            if (res.success) {
                toast.success("Promoción actualizada satisfactoriamente");
                router.push("/empleado/productos");
            } else {
                toast.error(res.error || "Error al actualizar la promoción");
            }
        } catch (error) {
            toast.error("Error inesperado");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await deletePromotion(id);
            if (res.success) {
                toast.success("Promoción eliminada");
                router.push("/empleado/productos");
            } else {
                toast.error(res.error || "Error al eliminar");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setIsDeleting(false);
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-8 p-12 bg-[#F8F9FA] min-h-screen w-full">
            {/* Header section - Full Width */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 sticky top-0 z-20 bg-[#F8F9FA]/90 backdrop-blur-xl py-6 -mt-12 border-b border-zinc-100">
                <div className="flex items-center gap-6">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/empleado/productos")}
                        className="h-14 w-14 rounded-[1.5rem] bg-white shadow-sm border border-zinc-200 hover:border-zinc-900 transition-all hover:scale-105 active:scale-95"
                    >
                        <ChevronLeft className="h-7 w-7 text-zinc-900" />
                    </Button>
                    <div>
                        <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Editar Promoción</h1>
                        <p className="text-zinc-500 text-lg font-medium opacity-70 italic">Perfecciona tu oferta para atraer más clientes</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 lg:flex-none rounded-[2rem] border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 transition-all font-bold h-14 px-8 text-lg"
                            >
                                <Trash2 className="h-5 w-5 mr-2" />
                                Eliminar
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2rem] p-8 border-none shadow-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-2xl font-black text-zinc-900">¿Estás completamente seguro?</AlertDialogTitle>
                                <AlertDialogDescription className="text-zinc-500 font-medium text-lg">
                                    Esta acción no se puede deshacer. La promoción se marcará como eliminada y no aparecerá más en el catálogo.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-6 gap-3">
                                <AlertDialogCancel className="rounded-2xl h-12 px-6 font-bold border-zinc-200">Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDelete}
                                    className="rounded-2xl h-12 px-8 font-black bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200"
                                >
                                    Sí, eliminar promoción
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1 lg:flex-none rounded-[2rem] bg-zinc-900 text-white hover:bg-zinc-800 transition-all font-black h-14 px-12 text-lg shadow-2xl shadow-zinc-300 transform motion-safe:hover:-translate-y-1 active:scale-95"
                    >
                        {loading ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Save className="h-6 w-6 mr-3" />}
                        Guardar Cambios
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                {/* Left Column - Configuration (Basic Info & Vigencia) */}
                <div className="xl:col-span-4 space-y-10">
                    {/* Basic Info */}
                    <Card className="rounded-[3rem] border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden bg-white">
                        <CardHeader className="p-10 pb-0">
                            <Badge className="w-fit bg-zinc-900 text-white font-black px-4 py-1 rounded-full text-xs">CONFIGURACIÓN</Badge>
                            <h2 className="text-2xl font-black text-zinc-900">Información General</h2>
                        </CardHeader>
                        <CardContent className="p-10 space-y-8">
                            <div className="space-y-3">
                                <Label className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-2">Nombre de la Promo</Label>
                                <Input
                                    placeholder="Ej: Mega Combo Familiar"
                                    className="h-16 rounded-[1.5rem] border-zinc-100 bg-zinc-50 font-bold text-xl px-6 focus:border-zinc-900 focus:ring-0"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-2">Descripción</Label>
                                <Textarea
                                    placeholder="Cuéntale a tus clientes qué incluye..."
                                    className="min-h-[120px] rounded-[2rem] border-zinc-100 bg-zinc-50 font-medium p-6 text-lg focus:border-zinc-900 focus:ring-0 italic"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-4">
                                <Label className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-2">Imagen Publicitaria</Label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative h-64 w-full rounded-[2.5rem] border-4 border-dashed border-zinc-100 hover:border-zinc-900 transition-all bg-zinc-50 flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden group"
                                >
                                    {previewImage ? (
                                        <>
                                            <img src={previewImage} alt="Preview" className="h-full w-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center transition-all">
                                                <Upload className="h-10 w-10 text-white" />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="h-20 w-20 bg-white rounded-3xl shadow-lg flex items-center justify-center">
                                                <Upload className="h-10 w-10 text-zinc-400" />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-black text-zinc-900">Seleccionar Archivo</p>
                                                <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">PNG, JPG hasta 5MB</p>
                                            </div>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Vigencia & Días */}
                    <Card className="rounded-[3rem] border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden bg-white">
                        <CardHeader className="p-10 pb-0">
                            <div className="flex flex-col gap-2">
                                <Badge className="w-fit bg-zinc-900 text-white font-black px-4 py-1 rounded-full text-xs">VIGENCIA</Badge>
                                <h2 className="text-2xl font-black text-zinc-900">¿Cuándo se activa?</h2>
                            </div>
                        </CardHeader>
                        <CardContent className="p-10 space-y-10">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[0.65rem] font-black text-zinc-400 uppercase tracking-widest ml-1">Fecha Desde</Label>
                                    <Input
                                        type="date"
                                        className="h-14 rounded-[1.2rem] border-zinc-100 bg-zinc-50 font-bold px-4"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[0.65rem] font-black text-zinc-400 uppercase tracking-widest ml-1">Fecha Hasta</Label>
                                    <Input
                                        type="date"
                                        className="h-14 rounded-[1.2rem] border-zinc-100 bg-zinc-50 font-bold px-4 focus:ring-zinc-900"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[0.65rem] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    Días específicos
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS.map(day => (
                                        <button
                                            key={day.value}
                                            type="button"
                                            onClick={() => toggleDay(day.value)}
                                            className={`h-11 w-11 rounded-xl font-black text-xs transition-all border-2 ${selectedDays.includes(day.value)
                                                ? 'bg-zinc-900 text-white border-zinc-900 shadow-xl shadow-zinc-200'
                                                : 'bg-white text-zinc-400 border-zinc-50 hover:border-zinc-200'
                                                }`}
                                        >
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Product Grid Selection, Categories & Price */}
                <div className="xl:col-span-8 space-y-10">
                    <div className="flex justify-between items-end px-2">
                        <div>
                            <h2 className="text-4xl font-black text-zinc-900 tracking-tight">Selección de Productos</h2>
                            <p className="text-zinc-500 font-bold">Añade o retira productos de la promoción</p>
                        </div>
                        <div className="bg-white p-2 rounded-2xl border border-zinc-100 flex items-center gap-3 shadow-sm">
                            <Search className="h-5 w-5 text-zinc-400 ml-2" />
                            <Input
                                placeholder="Buscar platillo..."
                                className="border-none bg-transparent h-10 w-64 focus-visible:ring-0 font-bold"
                                value={productSearch}
                                onChange={e => setProductSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {filteredProducts.map(product => {
                            const selected = selectedProducts.find(p => p.id === product.id);
                            const isSelected = !!selected;

                            return (
                                <div
                                    key={product.id}
                                    className={`group relative rounded-[2.5rem] border-4 transition-all overflow-hidden bg-white flex flex-col ${isSelected
                                        ? 'border-zinc-900 ring-4 ring-zinc-100'
                                        : 'border-transparent shadow-sm hover:shadow-xl hover:border-zinc-100'
                                        }`}
                                >
                                    <div
                                        onClick={() => toggleProduct(product.id)}
                                        className="h-32 w-full bg-zinc-50 flex items-center justify-center overflow-hidden cursor-pointer relative"
                                    >
                                        {product.imagen ? (
                                            <img src={product.imagen} alt={product.nombre} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <ImageIcon className="h-10 w-10 text-zinc-200" />
                                        )}
                                        {isSelected && (
                                            <div className="absolute top-3 right-3 bg-zinc-900 text-white rounded-full p-1.5 shadow-xl">
                                                <Check className="h-3 w-3 stroke-[4px]" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h4 className="font-black text-lg text-zinc-900 leading-tight uppercase tracking-tighter mb-1 line-clamp-1">
                                                {product.nombre}
                                            </h4>
                                            <p className="text-zinc-400 text-[0.6rem] font-black uppercase tracking-widest leading-none mb-3">ID: {product.id.slice(-6)}</p>
                                            <span className="text-xl font-black text-zinc-900 tracking-tight">${Number(product.precio).toLocaleString()}</span>
                                        </div>

                                        {isSelected && (
                                            <div className="mt-4 flex items-center justify-between p-1 bg-zinc-100 rounded-2xl">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); updateProductQuantity(product.id, -1); }}
                                                    className="h-9 w-9 bg-white rounded-xl shadow-sm flex items-center justify-center hover:bg-zinc-50 active:scale-95 transition-all"
                                                >
                                                    <Minus className="h-4 w-4 text-zinc-900" />
                                                </button>
                                                <span className="font-black text-lg text-zinc-900">{selected.quantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); updateProductQuantity(product.id, 1); }}
                                                    className="h-9 w-9 bg-white rounded-xl shadow-sm flex items-center justify-center hover:bg-zinc-50 active:scale-95 transition-all"
                                                >
                                                    <Plus className="h-4 w-4 text-zinc-900" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Categorías de Promo */}
                    <Card className="rounded-[3rem] border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] bg-white overflow-hidden">
                        <CardHeader className="p-10 pb-6 flex flex-row justify-between items-center">
                            <div>
                                <CardTitle className="text-xl font-black uppercase tracking-widest text-zinc-900">Categorías de Promo</CardTitle>
                                <CardDescription className="font-bold">¿Dónde aparecerá esta oferta?</CardDescription>
                            </div>
                            <LayoutGrid className="h-8 w-8 text-zinc-200" />
                        </CardHeader>
                        <CardContent className="p-10 pt-0 flex flex-wrap gap-3">
                            {categories.map(cat => {
                                const isSelected = selectedCategories.includes(cat.id);
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setSelectedCategories(prev =>
                                            prev.includes(cat.id) ? prev.filter(c => c !== cat.id) : [...prev, cat.id]
                                        )}
                                        className={`px-8 py-4 rounded-[1.5rem] font-black text-sm transition-all border-2 flex items-center gap-3 ${isSelected
                                            ? 'bg-zinc-900 text-white border-zinc-900 shadow-xl shadow-zinc-200'
                                            : 'bg-zinc-50 text-zinc-500 border-zinc-100 hover:border-zinc-200'
                                            }`}
                                    >
                                        {cat.nombre}
                                        {isSelected && <Check className="h-4 w-4 stroke-[3px]" />}
                                    </button>
                                );
                            })}
                        </CardContent>
                    </Card>

                    {/* Price & Discount logic Card (NOW AT THE BOTTOM) */}
                    <Card className="rounded-[4rem] border-none shadow-[0_40px_80px_rgba(0,0,0,0.1)] overflow-hidden bg-white border-4 border-zinc-900/5">
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                            <div className="p-12 space-y-8 bg-zinc-900 text-white">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 bg-white/10 rounded-[2rem] flex items-center justify-center backdrop-blur-xl">
                                        <Tag className="h-8 w-8 text-emerald-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-3xl font-black uppercase tracking-tighter">Precio Final</CardTitle>
                                        <CardDescription className="text-zinc-400 font-bold">Ajusta el precio de venta</CardDescription>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-[0.65rem] font-black text-zinc-500 uppercase tracking-[0.3em] ml-2">Precio de Venta</Label>
                                    <div className="relative">
                                        <div className="absolute left-8 top-1/2 -translate-y-1/2 text-white/20 font-black text-5xl">$</div>
                                        <Input
                                            type="number"
                                            step="any"
                                            placeholder="0.00"
                                            className="h-28 rounded-[2.5rem] border-none bg-white/5 focus:bg-white/10 text-white pl-16 text-5xl font-black transition-all"
                                            value={formData.finalPrice}
                                            onChange={(e) => setFormData({ ...formData, finalPrice: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-12 flex flex-col justify-center space-y-8 bg-emerald-50">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center text-emerald-900/40 font-black text-sm uppercase tracking-widest">
                                        <span>Valor Total Productos</span>
                                        <span className="line-through text-2xl">${totalOriginalPrice.toLocaleString()}</span>
                                    </div>

                                    <div className="h-px bg-emerald-200/50 w-full" />

                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em]">Ahorro Real</p>
                                            <h3 className="text-5xl font-black text-emerald-700 tracking-tighter">
                                                -${calculatedDiscount.toLocaleString()}
                                            </h3>
                                        </div>
                                        <div className="bg-emerald-600 text-white px-8 py-4 rounded-[2rem] font-black text-3xl shadow-2xl shadow-emerald-200">
                                            {savingsPercentage}% OFF
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-white/50 rounded-[2rem] border border-emerald-200 flex gap-4 items-center">
                                    <div className="h-12 w-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                        <Info className="h-6 w-6" />
                                    </div>
                                    <p className="text-xs font-bold text-emerald-800 leading-tight">
                                        Esta oferta representa un beneficio directo de **${calculatedDiscount.toLocaleString()}** para tus clientes habituales.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <style jsx global>{`
                body {
                    background-color: #F8F9FA;
                }
                input[type="date"]::-webkit-calendar-picker-indicator {
                    filter: invert(0);
                    cursor: pointer;
                }
            `}</style>
        </form>
    );
}
