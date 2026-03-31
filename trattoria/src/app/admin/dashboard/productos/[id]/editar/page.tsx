"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Save,
    Plus,
    Trash2,
    Search,
    Image as ImageIcon,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    getCategories,
    getSupplies,
    getProductById,
    updateProductWithRecipe,
    createCategory,
} from "../../actions";
import { toast } from "sonner";
import { Prisma, UnidadMedida } from "@prisma/client";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

type Category = Prisma.CategoryGetPayload<{ select: { id: true; nombre: true; esPromocion: true } }>;
type Supply = Prisma.SupplyGetPayload<{ select: { id: true; nombre: true; descripcion: true; costoUnitario: true; unidad: true; stockActual: true; stockMinimo: true; createdAt: true; updatedAt: true; deletedAt: true } }>;
type Product = Prisma.ProductGetPayload<{ include: { category: true; recipeItems: { include: { supply: true } } } }>;

interface RecipeItem {
    supplyId: string;
    qtyPerUnit: number;
    unidad: UnidadMedida;
    supplyName?: string;
    costoUnitarioIndividual?: number;
}

export default function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
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

    // Category Creation State
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Recipe State
    const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);
    const [searchSupply, setSearchSupply] = useState("");

    // Automatically calculate suggested unit cost
    useEffect(() => {
        const totalCost = recipeItems.reduce((acc, item) => {
            const itemCost = (item.costoUnitarioIndividual || 0) * (item.qtyPerUnit || 0);
            return acc + itemCost;
        }, 0);

        if (totalCost > 0) {
            setFormData(prev => {
                const newCosto = totalCost.toFixed(2);
                if (prev.costoUnitario === newCosto) return prev;
                return { ...prev, costoUnitario: newCosto };
            });
        }
    }, [recipeItems]);

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [catRes, supRes, prodRes] = await Promise.all([
                getCategories(),
                getSupplies(),
                getProductById(id)
            ]);

            if (catRes.success && catRes.data) {
                setCategories((catRes.data as Category[]).filter(c => !c.esPromocion));
            }

            if (supRes.success && supRes.data) {
                setSupplies(supRes.data as Supply[]);
            }

            if (prodRes.success && prodRes.data) {
                const p = prodRes.data as Product;
                setFormData({
                    nombre: p.nombre,
                    descripcion: p.descripcion || "",
                    precio: p.precio.toString(),
                    costoUnitario: p.costoUnitario?.toString() || "",
                    categoryId: p.categoryId,
                    imagen: p.imagen || null,
                });

                const loadedRecipe: RecipeItem[] = p.recipeItems.map((ri) => ({
                    supplyId: ri.supplyId,
                    qtyPerUnit: Number(ri.qtyPerUnit),
                    unidad: ri.supply.unidad,
                    supplyName: ri.supply.nombre,
                    costoUnitarioIndividual: Number(ri.supply.costoUnitario)
                }));
                setRecipeItems(loadedRecipe);
            } else {
                toast.error("Producto no encontrado");
                router.push("/admin/dashboard/productos");
            }
        } catch (error) {
            toast.error("Error al cargar los datos");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        loadData();
    }, [loadData]);

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
        if (!formData.categoryId) {
            toast.error("Selecciona una categoría");
            return;
        }

        setIsSaving(true);
        try {
            const res = await updateProductWithRecipe(
                id,
                { ...formData, unidad: "UNIDAD" },
                recipeItems.map(({ supplyId, qtyPerUnit, unidad }) => ({
                    supplyId,
                    qtyPerUnit,
                    unidad
                }))
            );

            if (res.success) {
                toast.success("Producto actualizado exitosamente");
                router.push("/admin/dashboard/productos");
                router.refresh();
            } else {
                toast.error(res.error || "Error al actualizar el producto");
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            toast.error("El nombre de la categoría es obligatorio");
            return;
        }

        setIsCreatingCategory(true);
        try {
            const res = await createCategory({
                nombre: newCategoryName,
                activo: true,
                esPromocion: false
            });

            if (res.success && res.data) {
                const newCategory = res.data as Category;
                setCategories(prev => [...prev, newCategory]);
                setFormData(prev => ({ ...prev, categoryId: newCategory.id }));
                setNewCategoryName("");
                setIsSheetOpen(false);
                toast.success("Categoría creada exitosamente");
            } else {
                toast.error(res.error || "Error al crear la categoría");
            }
        } catch (error) {
            toast.error("Error al conectar con el servidor");
        } finally {
            setIsCreatingCategory(false);
        }
    };

    const filteredSupplies = supplies.filter(s =>
        s.nombre.toLowerCase().includes(searchSupply.toLowerCase()) &&
        !recipeItems.find(ri => ri.supplyId === s.id)
    );

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center bg-zinc-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-zinc-300" />
                    <p className="text-zinc-500 font-medium animate-pulse">Cargando producto...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 p-8 bg-zinc-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/dashboard/productos">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Editar Producto</h1>
                        <p className="text-zinc-500">Actualiza los detalles y la receta del producto.</p>
                    </div>
                </div>
                <Button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-6"
                >
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar Cambios
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Visual Information */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-zinc-200 shadow-sm space-y-4">
                        <Label className="text-sm font-bold uppercase tracking-widest text-zinc-400">Imagen del Producto</Label>
                        <div className="aspect-square w-full bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center overflow-hidden group relative transition-all hover:border-zinc-300">
                            {formData.imagen ? (
                                <>
                                    <img
                                        src={formData.imagen}
                                        alt="Vista previa"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button variant="secondary" size="sm" className="rounded-full" onClick={() => setFormData(p => ({ ...p, imagen: null }))}>
                                            Cambiar imagen
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="h-12 w-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-3">
                                        <ImageIcon className="h-6 w-6 text-zinc-400" />
                                    </div>
                                    <p className="text-xs text-zinc-400 font-medium">Click para subir</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleImageUpload}
                                    />
                                </>
                            )}
                        </div>
                        <p className="text-[0.7rem] text-zinc-400 text-center">Recomendado: 800x800px. Máx 1MB.</p>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-zinc-200 shadow-sm space-y-4">
                        <Label className="text-sm font-bold uppercase tracking-widest text-zinc-400">Precios y Márgenes</Label>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="precio" className="text-xs font-medium text-zinc-600">Precio de Venta</Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                                    <Input
                                        id="precio"
                                        type="number"
                                        step="any"
                                        placeholder="0.00"
                                        className="pl-8 h-12 bg-zinc-50 border-zinc-200 rounded-2xl"
                                        value={formData.precio}
                                        onChange={(e) => setFormData(p => ({ ...p, precio: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="costo" className="text-xs font-medium text-zinc-600">Costo Unitario (Sugerido)</Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                                    <Input
                                        id="costo"
                                        type="number"
                                        step="any"
                                        placeholder="0.00"
                                        className="pl-8 h-12 bg-zinc-50 border-zinc-200 rounded-2xl"
                                        value={formData.costoUnitario}
                                        onChange={(e) => setFormData(p => ({ ...p, costoUnitario: e.target.value }))}
                                    />
                                </div>
                                <p className="text-[0.65rem] text-zinc-400 italic">El costo se calcula sumando los insumos de la receta.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Details and Recipe */}
                <div className="md:col-span-2 space-y-8">
                    {/* General Details */}
                    <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-sm space-y-6">
                        <Label className="text-sm font-bold uppercase tracking-widest text-zinc-400">Detalles Generales</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="nombre" className="text-xs font-medium text-zinc-600">Nombre del Producto</Label>
                                <Input
                                    id="nombre"
                                    placeholder="Ej: Pizza Margherita"
                                    className="h-12 bg-zinc-50 border-zinc-200 rounded-2xl focus-visible:ring-zinc-400"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData(p => ({ ...p, nombre: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-xs font-medium text-zinc-600">Categoría</Label>
                                <div className="flex gap-2">
                                    <div className="flex-grow">
                                        <Select
                                            value={formData.categoryId}
                                            onValueChange={(v: string) => setFormData(p => ({ ...p, categoryId: v }))}
                                        >
                                            <SelectTrigger className="h-12 bg-zinc-50 border-zinc-200 rounded-2xl">
                                                <SelectValue placeholder="Seleccionar categoría" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl shadow-xl border-zinc-100">
                                                {categories.map(cat => (
                                                    <SelectItem key={cat.id} value={cat.id} className="rounded-xl my-0.5">
                                                        {cat.nombre}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                                        <SheetTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-12 w-12 rounded-2xl border-zinc-200 bg-zinc-50 hover:bg-zinc-100 shrink-0"
                                            >
                                                <Plus className="h-5 w-5 text-zinc-600" />
                                            </Button>
                                        </SheetTrigger>
                                        <SheetContent side="right" className="sm:max-w-md border-l border-zinc-200 p-0 overflow-hidden flex flex-col">
                                            <div className="p-8 space-y-8 flex-grow">
                                                <SheetHeader className="text-left space-y-2">
                                                    <SheetTitle className="text-2xl font-bold text-zinc-900 tracking-tight">Nueva Categoría</SheetTitle>
                                                    <SheetDescription className="text-zinc-500">
                                                        Crea una categoría rápidamente para organizar tus productos.
                                                    </SheetDescription>
                                                </SheetHeader>

                                                <form id="category-form" onSubmit={handleCreateCategory} className="space-y-6">
                                                    <div className="space-y-3">
                                                        <Label htmlFor="cat-nombre" className="text-sm font-bold uppercase tracking-widest text-zinc-400">Nombre de Categoría</Label>
                                                        <Input
                                                            id="cat-nombre"
                                                            placeholder="Ej: Postres, Bebidas..."
                                                            className="h-14 bg-zinc-50 border-zinc-200 rounded-2xl focus-visible:ring-zinc-400 text-lg"
                                                            value={newCategoryName}
                                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                                            autoFocus
                                                        />
                                                    </div>

                                                    <div className="bg-zinc-50/50 p-6 rounded-[2rem] border border-zinc-100 space-y-4">
                                                        <div className="flex items-center gap-3 text-zinc-500">
                                                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                                            <span className="text-xs font-medium">La categoría estará activa inmediatamente</span>
                                                        </div>
                                                        <p className="text-[0.8rem] text-zinc-400 leading-relaxed">
                                                            Asegúrate de usar nombres descriptivos que ayuden a tus clientes a navegar por el menú.
                                                        </p>
                                                    </div>
                                                </form>
                                            </div>

                                            <div className="p-8 border-t border-zinc-100 bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.02)] flex gap-4">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="flex-grow h-14 rounded-2xl font-semibold text-zinc-500"
                                                    onClick={() => setIsSheetOpen(false)}
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    form="category-form"
                                                    type="submit"
                                                    disabled={isCreatingCategory}
                                                    className="flex-[2] h-14 bg-zinc-900 text-white hover:bg-zinc-800 rounded-2xl font-semibold shadow-lg shadow-zinc-200 transition-all active:scale-95"
                                                >
                                                    {isCreatingCategory ? (
                                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    ) : (
                                                        <Save className="mr-2 h-5 w-5" />
                                                    )}
                                                    Crear Categoría
                                                </Button>
                                            </div>
                                        </SheetContent>
                                    </Sheet>
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="descripcion" className="text-xs font-medium text-zinc-600">Descripción</Label>
                                <Textarea
                                    id="descripcion"
                                    placeholder="Brief description of the product..."
                                    className="bg-zinc-50 border-zinc-200 rounded-2xl focus-visible:ring-zinc-400 min-h-[100px]"
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData(p => ({ ...p, descripcion: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Recipe Builder */}
                    <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-bold uppercase tracking-widest text-zinc-400">Receta (Insumos)</Label>
                            <Badge variant="outline" className="rounded-full border-zinc-200 text-zinc-500">
                                {recipeItems.length} Insumos
                            </Badge>
                        </div>

                        {/* Supply Search & Grid */}
                        <div className="space-y-4">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" />
                                <Input
                                    placeholder="Buscar insumos para añadir a la receta..."
                                    className="pl-11 h-12 bg-zinc-50 border-zinc-200 rounded-2xl focus-visible:ring-zinc-400"
                                    value={searchSupply}
                                    onChange={(e) => setSearchSupply(e.target.value)}
                                />

                                {searchSupply && filteredSupplies.length > 0 && (
                                    <div className="absolute z-10 w-full mt-2 bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        {filteredSupplies.map(supply => (
                                            <button
                                                key={supply.id}
                                                type="button"
                                                className="w-full text-left px-5 py-3 hover:bg-zinc-50 flex items-center justify-between group transition-colors"
                                                onClick={() => {
                                                    addRecipeItem(supply);
                                                    setSearchSupply("");
                                                }}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-zinc-900 text-sm">{supply.nombre}</span>
                                                    <span className="text-[0.65rem] text-zinc-400 uppercase font-bold tracking-tighter">{supply.unidad} • ${Number(supply.costoUnitario).toFixed(2)} p/unidad</span>
                                                </div>
                                                <Plus className="h-4 w-4 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Quick Select Grid */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Selección Rápida</Label>
                                    {searchSupply && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-[10px] text-zinc-400 hover:text-zinc-900"
                                            onClick={() => setSearchSupply("")}
                                        >
                                            Limpiar búsqueda
                                        </Button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {filteredSupplies.length > 0 ? (
                                        filteredSupplies.slice(0, 12).map(supply => (
                                            <button
                                                key={supply.id}
                                                type="button"
                                                onClick={() => addRecipeItem(supply)}
                                                className="flex flex-col items-start gap-1 p-3 bg-zinc-50 border border-zinc-100 rounded-2xl hover:bg-white hover:border-zinc-300 hover:shadow-sm transition-all text-left group"
                                            >
                                                <span className="text-xs font-semibold text-zinc-700 truncate w-full group-hover:text-zinc-900">{supply.nombre}</span>
                                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">{supply.unidad}</span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-4 text-center bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-200">
                                            <p className="text-[10px] font-medium text-zinc-400">No hay insumos disponibles{searchSupply && " para esta búsqueda"}.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recipe List */}
                        <div className="space-y-3">
                            {recipeItems.map(item => (
                                <div
                                    key={item.supplyId}
                                    className="flex items-center gap-4 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100 group hover:bg-zinc-50 transition-colors"
                                >
                                    <div className="flex-grow">
                                        <p className="font-semibold text-zinc-900 text-sm">{item.supplyName}</p>
                                        <p className="text-[0.65rem] text-zinc-400 font-bold uppercase tracking-tighter">Por UNIDAD</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            type="number"
                                            step="any"
                                            className="w-20 h-10 bg-white border-zinc-200 rounded-xl text-center font-bold text-zinc-900"
                                            value={item.qtyPerUnit || ""}
                                            onChange={(e) => updateRecipeItemQty(item.supplyId, e.target.value)}
                                        />
                                        <span className="text-xs font-bold text-zinc-400 min-w-[50px]">{item.unidad}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50"
                                            onClick={() => removeRecipeItem(item.supplyId)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {recipeItems.length === 0 && (
                                <div className="text-center py-12 bg-zinc-50/30 rounded-[2rem] border border-dashed border-zinc-200">
                                    <p className="text-sm text-zinc-400">No hay insumos en la receta aún.</p>
                                    <p className="text-[0.7rem] text-zinc-300">Usa el buscador arriba para añadir ingredientes.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
