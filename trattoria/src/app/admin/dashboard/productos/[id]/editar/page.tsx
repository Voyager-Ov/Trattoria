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
    getProductWithConfiguration,
    updateProductWithRecipe,
    updateConfigurableProduct,
    createCategory,
    getProductOptionGroups,
    ProductOptionGroupWithOptions,
} from "../../actions";
import { toast } from "sonner";
import { Prisma, ProductCatalogRole, ProductOptionPriceMode, UnidadMedida } from "@prisma/client";
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
type ProductWithConfiguration = Prisma.ProductGetPayload<{
    include: {
        category: true;
        recipeItems: { include: { supply: true } };
        optionGroupAssignments: {
            include: {
                group: { include: { options: true } };
            };
        };
        optionLinksAsBase: { include: { option: true } };
    };
}>;

interface RecipeItem {
    supplyId: string;
    qtyPerUnit: number;
    unidad: UnidadMedida;
    supplyName?: string;
    costoUnitarioIndividual?: number;
}

interface OptionLinkState {
    optionId: string;
    label: string;
    slug: string;
    price: string;
    activo: boolean;
    orden: number;
}

interface GroupAssignmentState {
    groupId: string;
    groupKey: string;
    groupNombre: string;
    priceMode: ProductOptionPriceMode;
    required: boolean;
    orden: number;
    options: OptionLinkState[];
}

export default function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [optionGroups, setOptionGroups] = useState<ProductOptionGroupWithOptions[]>([]);

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
    const [catalogRole, setCatalogRole] = useState<ProductCatalogRole>("STANDARD");
    const [groupAssignments, setGroupAssignments] = useState<GroupAssignmentState[]>([]);

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
            const [catRes, supRes, prodRes, groupsRes] = await Promise.all([
                getCategories(),
                getSupplies(),
                getProductWithConfiguration(id),
                getProductOptionGroups(),
            ]);

            if (catRes.success && catRes.data) {
                setCategories((catRes.data as Category[]).filter(c => !c.esPromocion));
            }

            if (supRes.success && supRes.data) {
                setSupplies(supRes.data as Supply[]);
            }

            if (groupsRes.success && groupsRes.data) {
                setOptionGroups(groupsRes.data as ProductOptionGroupWithOptions[]);
            }

            if (prodRes.success && prodRes.data) {
                const p = prodRes.data as ProductWithConfiguration;
                setFormData({
                    nombre: p.nombre,
                    descripcion: p.descripcion || "",
                    precio: p.precio.toString(),
                    costoUnitario: p.costoUnitario?.toString() || "",
                    categoryId: p.categoryId,
                    imagen: p.imagen || null,
                });
                setCatalogRole(p.catalogRole ?? "STANDARD");

                const loadedRecipe: RecipeItem[] = p.recipeItems.map((ri) => ({
                    supplyId: ri.supplyId,
                    qtyPerUnit: Number(ri.qtyPerUnit),
                    unidad: ri.supply.unidad,
                    supplyName: ri.supply.nombre,
                    costoUnitarioIndividual: Number(ri.supply.costoUnitario)
                }));
                setRecipeItems(loadedRecipe);

                const optionLinks = p.optionLinksAsBase ?? [];
                const assignments: GroupAssignmentState[] = (p.optionGroupAssignments ?? []).map((assignment) => {
                    const group = assignment.group;
                    const options: OptionLinkState[] = group.options.map((option) => {
                        const link = optionLinks.find((item) => item.optionId === option.id);
                        return {
                            optionId: option.id,
                            label: option.label,
                            slug: option.slug,
                            price: link ? String(link.price ?? 0) : "0",
                            activo: link ? Boolean(link.activo) : false,
                            orden: link?.orden ?? option.orden,
                        };
                    });

                    return {
                        groupId: group.id,
                        groupKey: group.key,
                        groupNombre: group.nombre,
                        priceMode: group.priceMode,
                        required: group.required,
                        orden: assignment.orden,
                        options,
                    };
                });

                setGroupAssignments(assignments);
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

    const toggleGroupAssignment = (group: ProductOptionGroupWithOptions) => {
        setGroupAssignments((current) => {
            const exists = current.find((assignment) => assignment.groupId === group.id);
            if (exists) {
                return current.filter((assignment) => assignment.groupId !== group.id);
            }

            const options: OptionLinkState[] = group.options.map((option) => ({
                optionId: option.id,
                label: option.label,
                slug: option.slug,
                price: "0",
                activo: false,
                orden: option.orden,
            }));

            return [
                ...current,
                {
                    groupId: group.id,
                    groupKey: group.key,
                    groupNombre: group.nombre,
                    priceMode: group.priceMode,
                    required: group.required,
                    orden: group.orden,
                    options,
                },
            ];
        });
    };

    const updateGroupOrden = (groupId: string, orden: number) => {
        setGroupAssignments((current) =>
            current.map((assignment) =>
                assignment.groupId === groupId ? { ...assignment, orden } : assignment
            )
        );
    };

    const updateOptionState = (groupId: string, optionId: string, updater: (option: OptionLinkState) => OptionLinkState) => {
        setGroupAssignments((current) =>
            current.map((assignment) => {
                if (assignment.groupId !== groupId) return assignment;
                return {
                    ...assignment,
                    options: assignment.options.map((option) =>
                        option.optionId === optionId ? updater(option) : option
                    ),
                };
            })
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nombre.trim()) {
            toast.error("El nombre es obligatorio");
            return;
        }
        if (!formData.categoryId) {
            toast.error("Selecciona una categoría");
            return;
        }
        const priceValue = Number(formData.precio);
        if (Number.isNaN(priceValue) || priceValue < (catalogRole === "STANDARD" ? 1 : 0)) {
            toast.error("El precio es obligatorio");
            return;
        }

        if (catalogRole === "CONFIGURABLE_BASE") {
            if (groupAssignments.length === 0) {
                toast.error("Asigna al menos un grupo de opciones");
                return;
            }

            for (const assignment of groupAssignments) {
                const activeOptions = assignment.options.filter((option) => option.activo);
                if (activeOptions.length === 0) {
                    toast.error(`El grupo '${assignment.groupNombre}' debe tener al menos una opcion activa`);
                    return;
                }

                const invalidPrice = activeOptions.find((option) => Number(option.price) < 0 || Number.isNaN(Number(option.price)));
                if (invalidPrice) {
                    toast.error(`La opcion '${invalidPrice.label}' debe tener un precio valido`);
                    return;
                }
            }
        }

        setIsSaving(true);
        try {
            let res;
            if (catalogRole === "STANDARD") {
                res = await updateProductWithRecipe(
                    id,
                    { ...formData, unidad: "UNIDAD" },
                    recipeItems.map(({ supplyId, qtyPerUnit, unidad }) => ({
                        supplyId,
                        qtyPerUnit,
                        unidad
                    }))
                );
            } else {
                const groupAssignmentsPayload = groupAssignments.map((assignment) => ({
                    groupId: assignment.groupId,
                    orden: assignment.orden,
                }));

                const optionLinksPayload = groupAssignments.flatMap((assignment) =>
                    assignment.options
                        .filter((option) => option.activo)
                        .map((option) => ({
                            optionId: option.optionId,
                            price: Number(option.price) || 0,
                            activo: option.activo,
                            orden: option.orden,
                        }))
                );

                res = await updateConfigurableProduct(id, {
                    nombre: formData.nombre,
                    descripcion: formData.descripcion || undefined,
                    precio: formData.precio,
                    costoUnitario: formData.costoUnitario || null,
                    categoryId: formData.categoryId,
                    imagen: formData.imagen,
                    unidad: "UNIDAD",
                    catalogRole,
                    recipeItems: recipeItems.map(({ supplyId, qtyPerUnit, unidad }) => ({
                        supplyId,
                        qtyPerUnit,
                        unidad,
                    })),
                    groupAssignments: groupAssignmentsPayload,
                    optionLinks: optionLinksPayload,
                });
            }

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

    const assignedGroupIds = new Set(groupAssignments.map((assignment) => assignment.groupId));

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
        <div className="flex min-h-screen flex-col gap-6 bg-zinc-50 px-4 py-4 md:gap-8 md:p-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
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
                    className="w-full rounded-full bg-zinc-900 px-6 text-white hover:bg-zinc-800 sm:w-auto"
                >
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar Cambios
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
                {/* Left Column: Visual Information */}
                <div className="md:col-span-1 space-y-6">
                    <div className="space-y-4 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
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

                    <div className="space-y-4 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
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
                    <div className="space-y-6 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm md:p-8">
                        <Label className="text-sm font-bold uppercase tracking-widest text-zinc-400">Detalles Generales</Label>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-xs font-medium text-zinc-600">Tipo de producto</Label>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    {[
                                        { value: "STANDARD", label: "Simple", hint: "Producto vendible" },
                                        { value: "CONFIGURABLE_BASE", label: "Configurable", hint: "Con opciones" },
                                        { value: "OPTION_PRODUCT", label: "Opcion", hint: "Vinculable" },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => {
                                                if (option.value === "STANDARD" && groupAssignments.length > 0) {
                                                    const confirmed = window.confirm(
                                                        "Cambiar a simple eliminara los grupos y opciones asignadas. Quieres continuar?"
                                                    );
                                                    if (!confirmed) {
                                                        return;
                                                    }
                                                    setGroupAssignments([]);
                                                }
                                                setCatalogRole(option.value as ProductCatalogRole);
                                            }}
                                            className={`rounded-[1.25rem] border px-4 py-3 text-left transition ${
                                                catalogRole === option.value
                                                    ? "border-sky-200 bg-sky-50"
                                                    : "border-zinc-200 bg-white hover:border-zinc-300"
                                            }`}
                                        >
                                            <p className="text-sm font-semibold text-zinc-900">{option.label}</p>
                                            <p className="text-xs text-zinc-500">{option.hint}</p>
                                        </button>
                                    ))}
                                </div>
                                {catalogRole === "OPTION_PRODUCT" ? (
                                    <div className="mt-3 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                                        Este producto puede vincularse como opcion desde el catalogo de opciones.
                                    </div>
                                ) : null}
                            </div>
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
                                <div className="flex flex-col gap-2 sm:flex-row">
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
                                        <SheetContent side="right" className="flex max-h-[100svh] flex-col overflow-hidden border-l border-zinc-200 p-0 sm:max-w-md">
                                            <div className="flex-grow space-y-8 p-5 md:p-8">
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

                                            <div className="flex flex-col gap-3 border-t border-zinc-100 bg-white p-5 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] sm:flex-row md:p-8">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="h-14 flex-1 rounded-2xl font-semibold text-zinc-500"
                                                    onClick={() => setIsSheetOpen(false)}
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    form="category-form"
                                                    type="submit"
                                                    disabled={isCreatingCategory}
                                                    className="h-14 flex-[2] rounded-2xl bg-zinc-900 font-semibold text-white shadow-lg shadow-zinc-200 transition-all active:scale-95 hover:bg-zinc-800"
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

                    {catalogRole === "CONFIGURABLE_BASE" ? (
                        <div className="space-y-6 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm md:p-8">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <Label className="text-sm font-bold uppercase tracking-widest text-zinc-400">Opciones del producto</Label>
                                    <p className="text-sm text-zinc-500">
                                        Selecciona los grupos y activa las opciones necesarias.
                                    </p>
                                </div>
                                <Link href="/admin/dashboard/productos/opciones" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
                                    Gestionar catalogo de opciones →
                                </Link>
                            </div>

                            {optionGroups.length === 0 ? (
                                <div className="rounded-[1.5rem] border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">
                                    No hay grupos de opciones disponibles. Crea uno primero en el catalogo de opciones.
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {optionGroups.map((group) => {
                                            const isAssigned = assignedGroupIds.has(group.id);
                                            return (
                                                <button
                                                    key={group.id}
                                                    type="button"
                                                    onClick={() => toggleGroupAssignment(group)}
                                                    className={`rounded-[1.25rem] border px-4 py-3 text-left transition ${
                                                        isAssigned
                                                            ? "border-sky-200 bg-sky-50"
                                                            : "border-zinc-200 bg-white hover:border-zinc-300"
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-zinc-900">{group.nombre}</p>
                                                            <p className="text-xs text-zinc-400 uppercase tracking-widest">{group.key}</p>
                                                        </div>
                                                        <Badge variant="secondary" className="shrink-0 bg-zinc-100 text-zinc-600">
                                                            {group.options.length} opciones
                                                        </Badge>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {groupAssignments.length > 0 ? (
                                        <div className="space-y-4">
                                            {groupAssignments.map((assignment) => (
                                                <div key={assignment.groupId} className="rounded-[1.5rem] border border-zinc-200 p-4">
                                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-zinc-900">{assignment.groupNombre}</p>
                                                            <p className="text-xs text-zinc-400 uppercase tracking-widest">
                                                                {assignment.priceMode} · {assignment.required ? "Requerido" : "Opcional"}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Label className="text-xs text-zinc-500">Orden</Label>
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                value={assignment.orden}
                                                                onChange={(e) => updateGroupOrden(assignment.groupId, Number(e.target.value))}
                                                                className="h-9 w-20 rounded-xl border-zinc-200 bg-zinc-50 text-xs"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 space-y-3">
                                                        {assignment.options.map((option) => (
                                                            <div key={option.optionId} className="flex flex-col gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-semibold text-zinc-900">{option.label}</p>
                                                                    <p className="text-xs text-zinc-400 uppercase tracking-widest">{option.slug}</p>
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-3 md:justify-end">
                                                                    <Button
                                                                        type="button"
                                                                        variant={option.activo ? "default" : "outline"}
                                                                        className={`h-9 rounded-full px-4 text-xs ${
                                                                            option.activo
                                                                                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                                                                : "border-zinc-200 text-zinc-600"
                                                                        }`}
                                                                        onClick={() =>
                                                                            updateOptionState(assignment.groupId, option.optionId, (current) => ({
                                                                                ...current,
                                                                                activo: !current.activo,
                                                                            }))
                                                                        }
                                                                    >
                                                                        {option.activo ? "Activa" : "Inactiva"}
                                                                    </Button>
                                                                    <div className="flex items-center gap-2">
                                                                        <Label className="text-xs text-zinc-500">Precio</Label>
                                                                        <Input
                                                                            type="number"
                                                                            step="0.01"
                                                                            min={0}
                                                                            value={option.price}
                                                                            onChange={(e) =>
                                                                                updateOptionState(assignment.groupId, option.optionId, (current) => ({
                                                                                    ...current,
                                                                                    price: e.target.value,
                                                                                }))
                                                                            }
                                                                            className="h-9 w-24 rounded-xl border-zinc-200 bg-white text-xs"
                                                                        />
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Label className="text-xs text-zinc-500">Orden</Label>
                                                                        <Input
                                                                            type="number"
                                                                            min={1}
                                                                            value={option.orden}
                                                                            onChange={(e) =>
                                                                                updateOptionState(assignment.groupId, option.optionId, (current) => ({
                                                                                    ...current,
                                                                                    orden: Number(e.target.value),
                                                                                }))
                                                                            }
                                                                            className="h-9 w-20 rounded-xl border-zinc-200 bg-white text-xs"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    ) : null}

                    {/* Recipe Builder */}
                    <div className="space-y-6 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm md:p-8">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
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
                                    className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 transition-colors group hover:bg-zinc-50 sm:flex-row sm:items-center"
                                >
                                    <div className="min-w-0 flex-grow">
                                        <p className="font-semibold text-zinc-900 text-sm">{item.supplyName}</p>
                                        <p className="text-[0.65rem] text-zinc-400 font-bold uppercase tracking-tighter">Por UNIDAD</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
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
