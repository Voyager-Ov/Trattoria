"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
    Search, Plus, Filter, X, ChevronUp, ChevronDown,
    MoreVertical, Loader2, ListTree,
    Trash2, UtensilsCrossed, ChefHat, Tag, Copy, Edit,
    AlertCircle,
    DollarSign
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuCheckboxItem,
    DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import Image from "next/image";
import {
    toggleProductAvailability,
    softDeleteProduct,
    createProduct,
    deletePromotion,
    reorderCategories
} from "@/app/admin/dashboard/productos/actions";
import { Prisma, UnidadMedida } from "@prisma/client";
import { CreateCategorySheet } from "@/app/admin/dashboard/productos/components/CreateCategorySheet";
import { CreateProductSheet } from "@/app/admin/dashboard/productos/components/CreateProductSheet";
import { CreatePromotionSheet } from "@/app/admin/dashboard/productos/components/CreatePromotionSheet";

// Types
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
};

type Category = { id: string; nombre: string };
type SortField = "nombre" | "categoria" | "precio" | "estado" | "fecha" | "type";
type SortDirection = "asc" | "desc";

// Metric Card Component
function MetricCard({ title, value, change, headerColor, icon }: any) {
    return (
        <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full group hover:shadow-md transition-shadow duration-300">
            <div className={`h-12 ${headerColor} flex items-center px-6 text-white font-medium text-sm`}>
                {title}
                {icon && <div className="ml-auto opacity-80">{icon}</div>}
            </div>
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

export default function EmpleadoProductosPage() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Sheets state
    const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
    const [isProductSheetOpen, setIsProductSheetOpen] = useState(false);
    const [isPromotionSheetOpen, setIsPromotionSheetOpen] = useState(false);

    const refreshData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [menuRes, catRes] = await Promise.all([
                fetch('/api/admin/dashboard/productos').then(res => res.json()),
                fetch('/api/admin/dashboard/productos/categorias').then(res => res.json())
            ]);

            if (menuRes.success) {
                setMenuItems(menuRes.data);
            }
            if (catRes.success) {
                setCategories(catRes.data);
            }
        } catch (error) {
            toast.error("Error al cargar datos");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<"todos" | "activos" | "disponibles" | "agotados">("todos");
    const [sortField, setSortField] = useState<SortField>("nombre");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

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

        filtered.sort((a, b) => {
            const direction = sortDirection === "asc" ? 1 : -1;
            switch (sortField) {
                case "type": return a.type.localeCompare(b.type) * direction;
                case "nombre": return a.nombre.localeCompare(b.nombre) * direction;
                case "categoria": return a.categoria.localeCompare(b.categoria) * direction;
                case "precio": return (Number(a.precio) - Number(b.precio)) * direction;
                case "fecha": return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
                case "estado": return ((a.activo ? 1 : 0) - (b.activo ? 1 : 0)) * direction;
                default: return 0;
            }
        });

        return filtered;
    }, [menuItems, searchQuery, selectedCategories, statusFilter, sortField, sortDirection]);

    const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
        const res = await toggleProductAvailability(id, currentStatus);
        if (res.success) {
            toast.success("Disponibilidad actualizada");
            refreshData();
        } else {
            toast.error(res.error || "Error al actualizar");
        }
    };

    const handleDuplicate = async (product: MenuItem) => {
        setIsSubmitting(true);
        const { id, createdAt, updatedAt, deletedAt, ...rest } = product;
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
        const res = item.type === 'PRODUCTO'
            ? await softDeleteProduct(item.id)
            : await deletePromotion(item.id);

        if (res.success) {
            toast.success("Eliminado correctamente");
            refreshData();
        } else {
            toast.error(res.error || "Error al eliminar");
        }
    };

    const stats = {
        total: menuItems.filter(i => i.type === 'PRODUCTO').length,
        active: menuItems.filter(i => i.type === 'PRODUCTO' && i.activo).length,
        categories: categories.length,
        promos: menuItems.filter(i => i.type === 'PROMOCION').length
    };

    const handleReorder = async (categoryId: string, direction: 'up' | 'down') => {
        const index = categories.findIndex(c => c.id === categoryId);
        if (index === -1) return;

        const newCategories = [...categories];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= categories.length) return;

        // Swap
        const temp = newCategories[index];
        newCategories[index] = newCategories[targetIndex];
        newCategories[targetIndex] = temp;

        // Prepare updates for backend
        const updates = newCategories.map((cat, i) => ({
            id: cat.id,
            orden: i
        }));

        // Optimistic update
        setCategories(newCategories);

        const res = await reorderCategories(updates);
        if (!res.success) {
            toast.error(res.error || "Error al reordenar");
            refreshData(); // Rollback
        } else {
            toast.success("Orden actualizado");
        }
    };

    const hasActiveFilters = searchQuery !== "" || selectedCategories.length > 0 || statusFilter !== "todos";

    return (
        <div className="flex flex-col gap-8 p-8 bg-zinc-50 min-h-screen pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Menú y Productos</h1>
                    <p className="text-zinc-500 mt-1">Consulta y gestiona el catálogo, precios y disponibilidad.</p>
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
                        <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 shadow-xl border-zinc-100">
                            <DropdownMenuLabel className="px-3 pb-2 text-[0.65rem] font-bold uppercase tracking-widest text-zinc-400">Gestión de Categorías</DropdownMenuLabel>

                            <div className="max-h-[300px] overflow-y-auto px-1 py-1">
                                {categories.map((cat, index) => (
                                    <div key={cat.id} className="flex items-center justify-between p-2 hover:bg-zinc-50 rounded-xl group transition-colors">
                                        <span className="text-sm font-medium text-zinc-700">{cat.nombre}</span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 rounded-lg hover:bg-zinc-100"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleReorder(cat.id, 'up');
                                                }}
                                                disabled={index === 0}
                                            >
                                                <ChevronUp className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 rounded-lg hover:bg-zinc-100"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleReorder(cat.id, 'down');
                                                }}
                                                disabled={index === categories.length - 1}
                                            >
                                                <ChevronDown className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <DropdownMenuSeparator className="bg-zinc-100 mx-2 my-2" />
                            <DropdownMenuItem
                                className="rounded-xl cursor-pointer font-semibold text-orange-600 focus:text-orange-600 focus:bg-orange-50 py-2.5 mx-1"
                                onClick={() => setIsCategorySheetOpen(true)}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Nueva Categoría
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        onClick={() => setIsPromotionSheetOpen(true)}
                        className="rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition-all font-medium text-sm h-11 px-6 shadow-md"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Promoción
                    </Button>

                    <Button
                        onClick={() => setIsProductSheetOpen(true)}
                        className="rounded-full bg-orange-500 text-white hover:bg-orange-600 shadow-md transition-all font-medium text-sm h-11 px-6"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Producto
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Productos"
                    value={stats.total}
                    headerColor="bg-blue-600"
                    icon={<UtensilsCrossed className="w-4 h-4" />}
                />
                <MetricCard
                    title="Activos"
                    value={stats.active}
                    headerColor="bg-emerald-500"
                    icon={<ChefHat className="w-4 h-4" />}
                />
                <MetricCard
                    title="Promociones"
                    value={stats.promos}
                    headerColor="bg-purple-500"
                    icon={<Tag className="w-4 h-4" />}
                />
                <MetricCard
                    title="Categorías"
                    value={stats.categories}
                    headerColor="bg-amber-400"
                    icon={<ListTree className="w-4 h-4" />}
                />
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col gap-4 bg-white p-5 rounded-[2rem] border border-zinc-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" />
                        <Input
                            placeholder="Buscar producto o categoría..."
                            className="pl-11 h-12 bg-zinc-50 border-zinc-200 rounded-full focus-visible:ring-zinc-400 transition-all text-sm shadow-none"
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
                    </div>
                </div>

                {hasActiveFilters && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-50">
                        {searchQuery && (
                            <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 rounded-full px-3 py-1 gap-1">
                                "{searchQuery}"
                                <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                            </Badge>
                        )}
                        {statusFilter !== "todos" && (
                            <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 rounded-full px-3 py-1 gap-1">
                                Estado: {statusFilter}
                                <X className="w-3 h-3 cursor-pointer" onClick={() => setStatusFilter("todos")} />
                            </Badge>
                        )}
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden mb-12">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-zinc-50/50 border-b border-zinc-100">
                            <tr>
                                <th onClick={() => handleSort("type")} className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500 cursor-pointer hover:text-zinc-700 transition-colors">
                                    Tipo {sortField === "type" && (sortDirection === "asc" ? "↑" : "↓")}
                                </th>
                                <th onClick={() => handleSort("nombre")} className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500 cursor-pointer hover:text-zinc-700 transition-colors">
                                    Producto Info {sortField === "nombre" && (sortDirection === "asc" ? "↑" : "↓")}
                                </th>
                                <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">
                                    Imagen
                                </th>
                                <th onClick={() => handleSort("categoria")} className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500 cursor-pointer hover:text-zinc-700 transition-colors">
                                    Categoría {sortField === "categoria" && (sortDirection === "asc" ? "↑" : "↓")}
                                </th>
                                <th onClick={() => handleSort("precio")} className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500 cursor-pointer hover:text-zinc-700 transition-colors">
                                    Precio {sortField === "precio" && (sortDirection === "asc" ? "↑" : "↓")}
                                </th>
                                <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">
                                    Estado
                                </th>
                                <th className="text-right px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="h-8 w-8 text-zinc-300 animate-spin" />
                                            <p className="text-zinc-500 font-medium">Cargando catálogo...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredAndSortedItems.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-16 w-16 bg-zinc-50 rounded-full flex items-center justify-center">
                                                <Search className="h-8 w-8 text-zinc-300" />
                                            </div>
                                            <p className="text-zinc-500 font-medium">No se encontraron productos</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedItems.map((item) => (
                                    <tr key={item.id} className="group border-b border-zinc-100 hover:bg-zinc-50/50 transition-all duration-150">
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
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-zinc-900 text-sm">{item.nombre}</span>
                                                </div>
                                                <span className="text-[0.7rem] text-zinc-400 line-clamp-1 mt-0.5">{item.descripcion || "Sin descripción"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="h-12 w-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center overflow-hidden shrink-0 relative shadow-sm">
                                                {item.imagen ? (
                                                    <Image src={item.imagen} alt={item.nombre} fill className="object-cover group-hover:scale-110 transition-transform duration-300" />
                                                ) : (
                                                    <UtensilsCrossed className="h-5 w-5 text-zinc-300" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant="outline" className="border-zinc-200 text-zinc-500 font-medium text-[0.6rem] uppercase px-2 py-0">
                                                {item.categoria}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-sm text-zinc-700">
                                            <div className="flex items-center">
                                                <DollarSign className="w-3 h-3 mr-0.5 text-zinc-400" />
                                                {Number(item.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                <Badge
                                                    variant="secondary"
                                                    className={item.activo ? "bg-blue-50 text-blue-600 text-[0.6rem] px-2 py-0.5 rounded-full" : "bg-zinc-100 text-zinc-400 text-[0.6rem] px-2 py-0.5 rounded-full"}
                                                >
                                                    {item.activo ? 'ACTIVO' : 'INACTIVO'}
                                                </Badge>
                                                <Badge
                                                    variant="secondary"
                                                    className={item.disponible ? "bg-emerald-50 text-emerald-600 text-[0.6rem] px-2 py-0.5 rounded-full" : "bg-red-50 text-red-600 text-[0.6rem] px-2 py-0.5 rounded-full"}
                                                >
                                                    {item.disponible ? 'STOCK OK' : 'AGOTADO'}
                                                </Badge>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                        <MoreVertical className="h-4 w-4 text-zinc-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 shadow-xl border-zinc-100">
                                                    <DropdownMenuItem onClick={() => handleToggleAvailability(item.id, item.disponible)} className="rounded-xl py-2 cursor-pointer">
                                                        <AlertCircle className="h-3.5 w-3.5 mr-2 text-zinc-500" />
                                                        {item.disponible ? 'Marcar Agotado' : 'Marcar Disponible'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-zinc-50" />
                                                    {item.type === 'PRODUCTO' && (
                                                        <DropdownMenuItem onClick={() => handleDuplicate(item)} className="rounded-xl py-2 cursor-pointer transition-colors hover:text-blue-600">
                                                            <Copy className="h-3.5 w-3.5 mr-2" />
                                                            Duplicar
                                                        </DropdownMenuItem>
                                                    )}

                                                    {/* Usar rutas específicas de empleado para edición */}
                                                    <Link href={item.type === 'PRODUCTO' ? `/empleado/productos/${item.id}/editar` : `/empleado/productos/promociones/${item.id}/editar`}>
                                                        <DropdownMenuItem className="rounded-xl py-2 cursor-pointer">
                                                            <Edit className="h-3.5 w-3.5 mr-2" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                    </Link>

                                                    <DropdownMenuSeparator className="bg-zinc-50" />
                                                    <DropdownMenuItem onClick={() => handleDelete(item)} className="rounded-xl py-2 cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600">
                                                        <Trash2 className="h-3.5 w-3.5 mr-2" />
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

            {/* Sheets */}
            <CreateCategorySheet open={isCategorySheetOpen} onOpenChange={setIsCategorySheetOpen} onSuccess={refreshData} />
            <CreateProductSheet open={isProductSheetOpen} onOpenChange={setIsProductSheetOpen} onSuccess={refreshData} />
            <CreatePromotionSheet open={isPromotionSheetOpen} onOpenChange={setIsPromotionSheetOpen} onSuccess={refreshData} />
        </div>
    );
}
