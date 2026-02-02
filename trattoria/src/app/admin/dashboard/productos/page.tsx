"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, Plus, Filter, X, ChevronUp, ChevronDown, MoreVertical, Image as ImageIcon, Loader2, ListTree, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getProducts, getCategories, toggleProductAvailability, softDeleteProduct, createProduct, updateProduct, createPromotion, deletePromotion } from "./actions";
import { Prisma, UnidadMedida } from "@prisma/client";
import { toast } from "sonner";
import { CreateCategorySheet } from "./components/CreateCategorySheet";
import { CreateProductSheet } from "./components/CreateProductSheet";
import { CreatePromotionSheet } from "./components/CreatePromotionSheet";

// Unified Menu Item type
interface MenuItem {
    id: string;
    type: 'PRODUCTO' | 'PROMOCION';
    nombre: string;
    descripcion: string | null;
    precio: number;
    imagen: string | null;
    categoria: string;
    categoryId: string;
    activo: boolean;
    disponible: boolean;
    unidad: UnidadMedida;
    createdAt: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
    costoUnitario?: number;
    // Original Prisma objects for actions if needed
    category?: Category;
};

type Category = Prisma.CategoryGetPayload<{ select: { id: true; nombre: true } }>;


// Mock products with all fields

type SortField = "codigo" | "nombre" | "categoria" | "precio" | "costo" | "margen" | "unidad" | "fecha" | "estado";
type SortDirection = "asc" | "desc";

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: string;
    trend?: "up" | "down";
    headerColor: string;
    icon?: React.ReactNode;
}

function MetricCard({ title, value, change, headerColor, icon }: MetricCardProps) {
    return (
        <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full group hover:shadow-md transition-shadow duration-300">
            {/* Colored Header Strip */}
            <div className={`h-12 ${headerColor} flex items-center px-6 text-white font-medium text-sm`}>
                {title}
                {icon && <div className="ml-auto opacity-80">{icon}</div>}
            </div>
            {/* Body */}
            <div className="p-6 flex flex-col justify-between flex-grow">
                <div className="flex items-end gap-3">
                    <span className="text-3xl font-bold text-zinc-900 tracking-tight">{value}</span>
                    {change && (
                        <span className="mb-1 bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider">
                            {change}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ProductosPage() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [menuRes, catRes] = await Promise.all([
                fetch('/api/admin/dashboard/productos').then(res => res.json()),
                fetch('/api/admin/dashboard/productos/categorias').then(res => res.json())
            ]);

            if (menuRes.success) {
                setMenuItems(menuRes.data);
            } else {
                toast.error(menuRes.error || "Error al cargar el menú");
            }

            if (catRes.success && catRes.data) {
                setCategories(catRes.data as Category[]);
            } else {
                toast.error(catRes.error || "Error al cargar categorías");
            }
        } catch (error) {
            console.error("Error refreshing data:", error);
            toast.error("Error de conexión");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
        const res = await toggleProductAvailability(id, currentStatus);
        if (res.success) {
            toast.success("Disponibilidad actualizada");
            refreshData();
        } else {
            toast.error(res.error || "Error al actualizar");
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Sheets state
    const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
    const [isProductSheetOpen, setIsProductSheetOpen] = useState(false);
    const [isPromotionSheetOpen, setIsPromotionSheetOpen] = useState(false);


    type ProductWithCategory = Prisma.ProductGetPayload<{
        include: { category: true }
    }>;

    const handleDuplicate = async (product: MenuItem) => {
        setIsSubmitting(true);
        const { id, createdAt, updatedAt, deletedAt, category, ...rest } = product;
        const res = await createProduct({
            ...rest,
            descripcion: rest.descripcion ?? undefined,
            nombre: `${rest.nombre} (Copia)`,
        });
        if (res.success) {
            toast.success("Producto duplicado");
            refreshData();
        } else {
            toast.error(res.error || "Error al duplicar");
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (item: MenuItem) => {
        if (!confirm(`¿Estás seguro de eliminar esta ${item.type.toLowerCase()}?`)) return;

        // In the future, we might need a separate deletePromotion action
        // For now, if it's a product, use softDeleteProduct
        if (item.type === 'PRODUCTO') {
            const res = await softDeleteProduct(item.id);
            if (res.success) {
                toast.success("Producto eliminado");
                refreshData();
            } else {
                toast.error(res.error || "Error al eliminar");
            }
        } else {
            const res = await deletePromotion(item.id);
            if (res.success) {
                toast.success("Promoción eliminada");
                refreshData();
            } else {
                toast.error(res.error || "Error al eliminar");
            }
        }
    };

    // Metrics calculations using real data
    const totalProducts = menuItems.filter(item => item.type === 'PRODUCTO').length;
    const activeProducts = menuItems.filter(item => item.type === 'PRODUCTO' && item.activo).length;
    const categoriesCount = categories.length;
    const outOfStockCount = menuItems.filter((item) => item.type === 'PRODUCTO' && !item.disponible).length;

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<"todos" | "activos" | "disponibles" | "agotados">("todos");
    const [sortField, setSortField] = useState<SortField>("nombre");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    // Filter & sort logic
    const filteredAndSortedItems = useMemo(() => {
        const filtered = menuItems.filter((item) => {
            const matchesSearch =
                searchQuery === "" ||
                item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.descripcion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.categoria.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory =
                selectedCategories.length === 0 || selectedCategories.includes(item.categoryId);

            const matchesStatus =
                statusFilter === "todos" ||
                (statusFilter === "activos" && item.activo) ||
                (statusFilter === "disponibles" && item.disponible) ||
                (statusFilter === "agotados" && !item.disponible);

            return matchesSearch && matchesCategory && matchesStatus;
        });

        // Sorting
        filtered.sort((a, b) => {
            let compareValue = 0;

            switch (sortField) {
                case "codigo":
                    compareValue = a.id.localeCompare(b.id);
                    break;
                case "nombre":
                    compareValue = a.nombre.localeCompare(b.nombre);
                    break;
                case "categoria":
                    compareValue = a.categoria.localeCompare(b.categoria);
                    break;
                case "precio":
                    compareValue = Number(a.precio) - Number(b.precio);
                    break;
                case "costo":
                    // Promotions might not have cost, use 0
                    const costoA = a.costoUnitario || 0;
                    const costoB = b.costoUnitario || 0;
                    compareValue = Number(costoA) - Number(costoB);
                    break;
                case "margen": {
                    const costoA = a.costoUnitario || 0;
                    const costoB = b.costoUnitario || 0;
                    const marginA = costoA
                        ? ((Number(a.precio) - Number(costoA)) / Number(a.precio)) * 100
                        : 0;
                    const marginB = costoB
                        ? ((Number(b.precio) - Number(costoB)) / Number(b.precio)) * 100
                        : 0;
                    compareValue = marginA - marginB;
                    break;
                }
                case "unidad":
                    compareValue = a.unidad.localeCompare(b.unidad);
                    break;
                case "fecha":
                    compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    break;
                case "estado":
                    compareValue = (a.activo ? 1 : 0) - (b.activo ? 1 : 0);
                    break;
            }

            return sortDirection === "asc" ? compareValue : -compareValue;
        });

        return filtered;
    }, [menuItems, searchQuery, selectedCategories, statusFilter, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };



    const removeCategoryFilter = (cat: string) => {
        setSelectedCategories(prev => prev.filter(c => c !== cat));
    };

    const formatDate = (date: Date) => {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    const calculateMargin = (precio: number, costo?: number) => {
        if (!costo) return 0;
        return ((precio - costo) / precio) * 100;
    };

    const truncateId = (id: string) => {
        return id.length > 12 ? `${id.slice(0, 12)}...` : id;
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null;
        return sortDirection === "asc" ? (
            <ChevronUp className="h-3 w-3 inline ml-1" />
        ) : (
            <ChevronDown className="h-3 w-3 inline ml-1" />
        );
    };

    const hasActiveFilters = searchQuery !== "" || selectedCategories.length > 0 || statusFilter !== "todos";

    return (
        <div className="flex flex-col gap-8 p-8 bg-zinc-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Catálogo de Productos</h1>
                    <p className="text-zinc-500 mt-1">Gestiona el inventario y precios de tu trattoria.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-full border-zinc-200 hover:bg-zinc-50 transition-all font-medium text-sm h-11 px-6 shadow-sm">
                                <ListTree className="h-4 w-4 mr-2" />
                                Categorías
                                <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-zinc-100">
                            <DropdownMenuLabel className="px-3 pb-2 text-[0.65rem] font-bold uppercase tracking-widest text-zinc-400">Gestión de Categorías</DropdownMenuLabel>
                            <Link href="/admin/dashboard/productos/categorias">
                                <DropdownMenuItem className="rounded-xl cursor-pointer">
                                    <ListTree className="h-3.5 w-3.5 mr-2" />
                                    Ver Todas
                                </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator className="bg-zinc-100" />
                            <DropdownMenuItem className="rounded-xl cursor-pointer focus:bg-orange-50 focus:text-orange-600" onClick={() => setIsCategorySheetOpen(true)}>
                                <Plus className="h-3.5 w-3.5 mr-2" />
                                Nueva Categoría
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Link href="/admin/dashboard/productos/promociones/nueva">
                        <Button
                            className="rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition-all font-medium text-sm h-11 px-6 shadow-md"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Nueva Promoción
                        </Button>
                    </Link>

                    <Link href="/admin/dashboard/productos/nuevo">
                        <Button
                            className="rounded-full bg-orange-500 text-white hover:bg-orange-600 shadow-md transition-all font-medium text-sm h-11 px-6"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Nuevo Producto
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total productos"
                    value={totalProducts}
                    change="+12%"
                    headerColor="bg-blue-600"
                />
                <MetricCard
                    title="Productos activos"
                    value={activeProducts}
                    change="+5%"
                    headerColor="bg-orange-500"
                />
                <MetricCard
                    title="Categorías"
                    value={categoriesCount}
                    headerColor="bg-amber-400"
                />
                <MetricCard
                    title="Sin stock / Alertas"
                    value={outOfStockCount}
                    change="Revisar"
                    headerColor="bg-emerald-500"
                />
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col gap-4 bg-white p-5 rounded-[2rem] border border-zinc-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" />
                        <Input
                            placeholder="Buscar por nombre o código..."
                            className="pl-11 h-12 bg-zinc-50 border-zinc-200 rounded-full focus-visible:ring-zinc-400 transition-all text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-12 rounded-full px-6 border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-medium">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Categorías
                                    {selectedCategories.length > 0 && (
                                        <Badge variant="secondary" className="ml-2 bg-zinc-100 text-zinc-900 font-bold px-2 py-0">
                                            {selectedCategories.length}
                                        </Badge>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-zinc-100">
                                <DropdownMenuLabel className="px-3 pb-2 text-[0.65rem] font-bold uppercase tracking-widest text-zinc-400">Seleccionar Categorías</DropdownMenuLabel>
                                {categories.map((cat) => (
                                    <DropdownMenuCheckboxItem
                                        key={cat.id}
                                        className="rounded-xl focus:bg-zinc-50 my-0.5"
                                        checked={selectedCategories.includes(cat.id)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedCategories([...selectedCategories, cat.id]);
                                            } else {
                                                setSelectedCategories(selectedCategories.filter((c) => c !== cat.id));
                                            }
                                        }}
                                    >
                                        {cat.nombre}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-12 rounded-full px-6 border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-medium capitalize">
                                    {statusFilter === "todos" ? "Todos los estados" : statusFilter}
                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-zinc-100">
                                <DropdownMenuItem className="rounded-xl my-0.5" onClick={() => setStatusFilter("todos")}>Todos los estados</DropdownMenuItem>
                                <DropdownMenuItem className="rounded-xl my-0.5" onClick={() => setStatusFilter("activos")}>Solo activos</DropdownMenuItem>
                                <DropdownMenuItem className="rounded-xl my-0.5" onClick={() => setStatusFilter("disponibles")}>Solo disponibles</DropdownMenuItem>
                                <DropdownMenuItem className="rounded-xl my-0.5" onClick={() => setStatusFilter("agotados")}>Agotados</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="h-8 w-[1px] bg-zinc-200 mx-1 hidden md:block"></div>
                    </div>
                </div>

                {/* Active Filters Pill Badges Row */}
                {hasActiveFilters && (
                    <>
                        <div className="h-[1px] bg-zinc-100 w-full my-1"></div>
                        <div className="flex flex-wrap items-center gap-2 px-1 py-1 animate-in fade-in slide-in-from-top-2 duration-300">
                            <span className="text-[0.65rem] font-bold text-zinc-400 uppercase tracking-widest mr-2">Filtros activos:</span>
                            {searchQuery && (
                                <Badge variant="secondary" className="bg-white border-zinc-200 text-zinc-600 pl-3 pr-1 py-1 h-8 rounded-full gap-1 shadow-sm font-medium">
                                    Búsqueda: {searchQuery}
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-zinc-100" onClick={() => setSearchQuery("")}>
                                        <X className="h-3 w-3" />
                                    </Button>
                                </Badge>
                            )}
                            {selectedCategories.map(catId => {
                                const catName = categories.find(c => c.id === catId)?.nombre || catId;
                                return (
                                    <Badge key={catId} variant="secondary" className="bg-white border-zinc-200 text-zinc-600 pl-3 pr-1 py-1 h-8 rounded-full gap-1 shadow-sm font-medium">
                                        {catName}
                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-zinc-100" onClick={() => removeCategoryFilter(catId)}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                );
                            })}
                            {statusFilter !== "todos" && (
                                <Badge variant="secondary" className="bg-white border-zinc-200 text-zinc-600 pl-3 pr-1 py-1 h-8 rounded-full gap-1 shadow-sm font-medium">
                                    Estado: {statusFilter}
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-zinc-100" onClick={() => setStatusFilter("todos")}>
                                        <X className="h-3 w-3" />
                                    </Button>
                                </Badge>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-zinc-400 hover:text-zinc-600 h-8 rounded-full px-3 hover:bg-transparent ml-auto"
                                onClick={() => {
                                    setSearchQuery("");
                                    setSelectedCategories([]);
                                    setStatusFilter("todos");
                                }}
                            >
                                Limpiar todos
                            </Button>
                        </div>
                    </>
                )}
            </div>

            {/* Products Table Container */}
            <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden mb-12">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-zinc-50/50 border-b border-zinc-100">
                            <tr>
                                <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">
                                    Tipo
                                </th>
                                <th onClick={() => handleSort("nombre")} className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500 cursor-pointer hover:text-zinc-700 transition-colors">
                                    Nombre <SortIcon field="nombre" />
                                </th>
                                <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">
                                    Imagen
                                </th>
                                <th onClick={() => handleSort("categoria")} className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500 cursor-pointer hover:text-zinc-700 transition-colors">
                                    Categoría <SortIcon field="categoria" />
                                </th>
                                <th onClick={() => handleSort("precio")} className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500 cursor-pointer hover:text-zinc-700 transition-colors">
                                    Precio <SortIcon field="precio" />
                                </th>
                                <th onClick={() => handleSort("costo")} className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500 cursor-pointer hover:text-zinc-700 transition-colors">
                                    Costo <SortIcon field="costo" />
                                </th>
                                <th onClick={() => handleSort("margen")} className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500 cursor-pointer hover:text-zinc-700 transition-colors">
                                    Margen <SortIcon field="margen" />
                                </th>
                                <th onClick={() => handleSort("unidad")} className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500 cursor-pointer hover:text-zinc-700 transition-colors">
                                    Unidad <SortIcon field="unidad" />
                                </th>
                                <th onClick={() => handleSort("fecha")} className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500 cursor-pointer hover:text-zinc-700 transition-colors">
                                    Fecha <SortIcon field="fecha" />
                                </th>
                                <th onClick={() => handleSort("estado")} className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500 cursor-pointer hover:text-zinc-700 transition-colors">
                                    Estado <SortIcon field="estado" />
                                </th>
                                <th className="text-right px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {filteredAndSortedItems.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-16 w-16 bg-zinc-50 rounded-full flex items-center justify-center">
                                                <Search className="h-8 w-8 text-zinc-300" />
                                            </div>
                                            <p className="text-zinc-500 font-medium">No se encontraron elementos</p>
                                            <p className="text-xs text-zinc-400">Intenta ajustando los filtros de búsqueda</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedItems.map(item => (
                                    <tr
                                        key={item.id}
                                        className="group border-b border-zinc-100 hover:bg-zinc-50/50 transition-all duration-150"
                                    >
                                        <td className="px-6 py-4">
                                            <Badge
                                                variant="secondary"
                                                className={
                                                    item.type === 'PRODUCTO'
                                                        ? "bg-blue-50 text-blue-600 border-none font-bold text-[0.6rem] px-2 py-0.5 rounded-full"
                                                        : "bg-purple-50 text-purple-600 border-none font-bold text-[0.6rem] px-2 py-0.5 rounded-full"
                                                }
                                            >
                                                {item.type}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-zinc-900 text-sm">{item.nombre}</span>
                                                {item.descripcion && (
                                                    <span className="text-[0.7rem] text-zinc-400 line-clamp-1 mt-0.5">{item.descripcion}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.imagen ? (
                                                <div className="h-12 w-12 rounded-2xl overflow-hidden border border-zinc-100 shadow-sm">
                                                    <img
                                                        src={item.imagen}
                                                        alt={item.nombre}
                                                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-12 w-12 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100">
                                                    <ImageIcon className="h-5 w-5 text-zinc-300" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-zinc-500">
                                            {item.categoria}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-zinc-900 text-sm">${Number(item.precio).toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.costoUnitario ? (
                                                <span className="text-xs text-zinc-400">${Number(item.costoUnitario).toFixed(2)}</span>
                                            ) : (
                                                <span className="text-xs text-zinc-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.costoUnitario ? (
                                                <span className="text-xs font-bold text-zinc-500 bg-zinc-50 px-2 py-1 rounded-md">
                                                    {calculateMargin(Number(item.precio), Number(item.costoUnitario)).toFixed(1)}%
                                                </span>
                                            ) : (
                                                <span className="text-xs text-zinc-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className="border-zinc-200 text-zinc-500 font-medium text-[0.6rem] uppercase tracking-tighter px-2 py-0">
                                                {item.unidad}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-xs text-zinc-500 font-medium">{formatDate(new Date(item.createdAt))}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                <Badge
                                                    variant="secondary"
                                                    className={
                                                        item.activo
                                                            ? "bg-emerald-50 text-emerald-600 border-none font-bold text-[0.6rem] px-2 py-0.5 rounded-full"
                                                            : "bg-red-50 text-red-600 border-none font-bold text-[0.6rem] px-2 py-0.5 rounded-full"
                                                    }
                                                >
                                                    {item.activo ? "ACTIVO" : "INACTIVO"}
                                                </Badge>
                                                {item.type === 'PRODUCTO' && !item.disponible && (
                                                    <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-none font-bold text-[0.6rem] px-2 py-0.5 rounded-full">
                                                        AGOTADO
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-zinc-100">
                                                        <MoreVertical className="h-4 w-4 text-zinc-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 shadow-xl border-zinc-100">
                                                    <DropdownMenuItem className="rounded-xl my-0.5">
                                                        <Link
                                                            href={item.type === 'PRODUCTO'
                                                                ? `/admin/dashboard/productos/${item.id}`
                                                                : `/admin/dashboard/productos/promociones/${item.id}`
                                                            }
                                                            className="w-full"
                                                        >
                                                            Ver detalles
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="rounded-xl my-0.5">
                                                        <Link
                                                            href={item.type === 'PRODUCTO'
                                                                ? `/admin/dashboard/productos/${item.id}/editar`
                                                                : `/admin/dashboard/productos/promociones/${item.id}/editar`
                                                            }
                                                            className="w-full"
                                                        >
                                                            Editar
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    {item.type === 'PRODUCTO' && (
                                                        <DropdownMenuItem className="rounded-xl my-0.5" onClick={() => handleDuplicate(item)}>Duplicar</DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator className="bg-zinc-50" />
                                                    {item.type === 'PRODUCTO' && (
                                                        <DropdownMenuItem
                                                            className="rounded-xl my-0.5"
                                                            onClick={async () => {
                                                                setIsSubmitting(true);
                                                                const res = await toggleProductAvailability(item.id, item.disponible);
                                                                if (res.success) {
                                                                    toast.success(item.disponible ? "Producto marcado como agotado" : "Producto marcado como disponible");
                                                                    refreshData();
                                                                } else {
                                                                    toast.error(res.error || "Error al actualizar");
                                                                }
                                                                setIsSubmitting(false);
                                                            }}
                                                        >
                                                            {item.disponible ? "Marcar como agotado" : "Marcar como disponible"}
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        className="rounded-xl my-0.5 text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-700"
                                                        onClick={() => handleDelete(item)}
                                                    >
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
