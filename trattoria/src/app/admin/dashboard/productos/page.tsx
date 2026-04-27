"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Prisma, UnidadMedida } from "@prisma/client";
import {
    ChevronDown,
    ChevronUp,
    Copy,
    Filter,
    Image as ImageIcon,
    ListTree,
    Loader2,
    MoreVertical,
    Package2,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from "lucide-react";
import { toast } from "sonner";

import { createProduct, deletePromotion, softDeleteProduct, toggleProductActive, toggleProductAvailability } from "./actions";
import { CreateCategorySheet } from "./components/CreateCategorySheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ResponsivePanel } from "@/components/ui/responsive-panel";

type Category = Prisma.CategoryGetPayload<{ select: { id: true; nombre: true } }>;
type SortField = "codigo" | "nombre" | "categoria" | "precio" | "costo" | "margen" | "unidad" | "fecha" | "estado";
type SortDirection = "asc" | "desc";
type AdministrativeStatusFilter = "todos" | "activos" | "desactivados";
type AvailabilityFilter = "todas" | "disponibles" | "agotados";

interface MenuItem {
    id: string;
    type: "PRODUCTO" | "PROMOCION";
    nombre: string;
    descripcion: string | null;
    precio: number;
    imagen: string | null;
    categoria: string;
    categoryId: string;
    activo: boolean;
    disponible?: boolean;
    unidad: UnidadMedida;
    createdAt: string | Date;
    updatedAt?: string | Date;
    deletedAt?: string | Date | null;
    costoUnitario?: number | null;
}

const SORT_OPTIONS: Array<{ value: SortField; label: string }> = [
    { value: "nombre", label: "Nombre" },
    { value: "categoria", label: "Categoria" },
    { value: "precio", label: "Precio" },
    { value: "costo", label: "Costo" },
    { value: "margen", label: "Margen" },
    { value: "unidad", label: "Unidad" },
    { value: "fecha", label: "Fecha" },
    { value: "estado", label: "Estado" },
    { value: "codigo", label: "Codigo" },
];

function formatCurrency(value: number) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

function formatDate(value: string | Date) {
    const date = new Date(value);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

function calculateMargin(precio: number, costo?: number | null) {
    if (!costo || !precio) {
        return 0;
    }

    return ((precio - costo) / precio) * 100;
}

function getTypeBadgeClasses(type: MenuItem["type"]) {
    return type === "PRODUCTO" ? "bg-blue-50 text-blue-600 border-none" : "bg-violet-50 text-violet-600 border-none";
}

function getAdministrativeStatusLabel(status: AdministrativeStatusFilter) {
    switch (status) {
        case "activos":
            return "Activos";
        case "desactivados":
            return "Desactivados";
        default:
            return "Todas";
    }
}

function getAvailabilityLabel(status: AvailabilityFilter) {
    switch (status) {
        case "disponibles":
            return "Disponibles";
        case "agotados":
            return "Agotados";
        default:
            return "Todas";
    }
}

function matchesAdministrativeFilter(item: MenuItem, filter: AdministrativeStatusFilter) {
    return filter === "todos" || (filter === "activos" ? item.activo : !item.activo);
}

function matchesAvailabilityFilter(item: MenuItem, filter: AvailabilityFilter) {
    if (filter === "todas") {
        return true;
    }

    if (item.type !== "PRODUCTO") {
        return false;
    }

    return filter === "disponibles" ? item.disponible : !item.disponible;
}

function MetricCard({
    title,
    value,
    subtitle,
    headerColor,
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    headerColor: string;
}) {
    return (
        <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm md:rounded-[2rem]">
            <div className={`flex items-center px-4 py-3 text-sm font-semibold text-white md:px-5 ${headerColor}`}>{title}</div>
            <div className="p-4 md:p-6">
                <p className="break-words text-2xl font-black tracking-tight text-zinc-900 md:text-3xl">{value}</p>
                {subtitle ? <p className="mt-1 text-sm text-zinc-500">{subtitle}</p> : null}
            </div>
        </div>
    );
}

function SortIcon({
    field,
    currentField,
    currentDirection,
}: {
    field: SortField;
    currentField: SortField;
    currentDirection: SortDirection;
}) {
    if (currentField !== field) {
        return null;
    }

    return currentDirection === "asc" ? <ChevronUp className="ml-1 inline h-3 w-3" /> : <ChevronDown className="ml-1 inline h-3 w-3" />;
}

export default function ProductosPage() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [administrativeFilter, setAdministrativeFilter] = useState<AdministrativeStatusFilter>("todos");
    const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("todas");
    const [sortField, setSortField] = useState<SortField>("nombre");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);

    const refreshData = useCallback(async () => {
        setIsLoading(true);

        try {
            const [menuRes, catRes] = await Promise.all([
                fetch("/api/admin/dashboard/productos").then((res) => res.json()),
                fetch("/api/admin/dashboard/productos/categorias").then((res) => res.json()),
            ]);

            if (menuRes.success) {
                const nextItems = menuRes.data as MenuItem[];
                setMenuItems(nextItems);
                setSelectedItem((current) => (current ? nextItems.find((item) => item.id === current.id) ?? null : null));
            } else {
                toast.error(menuRes.error || "Error al cargar el menu");
            }

            if (catRes.success && catRes.data) {
                setCategories(catRes.data as Category[]);
            } else {
                toast.error(catRes.error || "Error al cargar categorias");
            }
        } catch (error) {
            console.error("Error refreshing data:", error);
            toast.error("Error de conexion");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void refreshData();
    }, [refreshData]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
            return;
        }

        setSortField(field);
        setSortDirection("asc");
    };

    const toggleCategorySelection = (categoryId: string) => {
        setSelectedCategories((current) =>
            current.includes(categoryId) ? current.filter((item) => item !== categoryId) : [...current, categoryId]
        );
    };

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedCategories([]);
        setAdministrativeFilter("todos");
        setAvailabilityFilter("todas");
        setSortField("nombre");
        setSortDirection("asc");
    };

    const handleDuplicate = async (product: MenuItem) => {
        setIsSubmitting(true);

        try {
            const res = await createProduct({
                nombre: `${product.nombre} (Copia)`,
                descripcion: product.descripcion ?? undefined,
                precio: product.precio,
                costoUnitario: product.costoUnitario ?? undefined,
                categoryId: product.categoryId,
                imagen: product.imagen,
                unidad: product.unidad,
            });

            if (res.success) {
                toast.success("Producto duplicado");
                await refreshData();
            } else {
                toast.error(res.error || "Error al duplicar");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (item: MenuItem) => {
        const confirmed = window.confirm(`Estas seguro de eliminar ${item.type === "PRODUCTO" ? "este producto" : "esta promocion"}?`);
        if (!confirmed) {
            return;
        }

        if (item.type === "PRODUCTO") {
            const res = await softDeleteProduct(item.id);
            if (res.success) {
                toast.success("Producto eliminado");
                setSelectedItem((current) => (current?.id === item.id ? null : current));
                await refreshData();
            } else {
                toast.error(res.error || "Error al eliminar");
            }
            return;
        }

        const res = await deletePromotion(item.id);
        if (res.success) {
            toast.success("Promocion eliminada");
            setSelectedItem((current) => (current?.id === item.id ? null : current));
            await refreshData();
        } else {
            toast.error(res.error || "Error al eliminar");
        }
    };

    const handleToggleAvailability = async (item: MenuItem) => {
        if (item.type !== "PRODUCTO") {
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await toggleProductAvailability(item.id, item.activo);
            if (res.success) {
                toast.success(item.activo ? "Producto desactivado" : "Producto activado");
                await refreshData();
            } else {
                toast.error(res.error || "Error al actualizar");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleActive = async (item: MenuItem) => {
        if (item.type !== "PRODUCTO") {
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await toggleProductActive(item.id, item.activo);
            if (res.success) {
                toast.success(item.activo ? "Producto desactivado" : "Producto activado");
                await refreshData();
            } else {
                toast.error(res.error || "Error al actualizar");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredAndSortedItems = useMemo(() => {
        const term = searchQuery.toLowerCase();

        const filtered = menuItems.filter((item) => {
            const matchesSearch =
                searchQuery === "" ||
                item.nombre.toLowerCase().includes(term) ||
                item.descripcion?.toLowerCase().includes(term) ||
                item.categoria.toLowerCase().includes(term) ||
                item.id.toLowerCase().includes(term);

            const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(item.categoryId);

            const matchesAdministrativeStatus = matchesAdministrativeFilter(item, administrativeFilter);
            const matchesAvailabilityStatus = matchesAvailabilityFilter(item, availabilityFilter);

            return matchesSearch && matchesCategory && matchesAdministrativeStatus && matchesAvailabilityStatus;
        });

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
                    compareValue = Number(a.costoUnitario || 0) - Number(b.costoUnitario || 0);
                    break;
                case "margen":
                    compareValue = calculateMargin(Number(a.precio), Number(a.costoUnitario)) - calculateMargin(Number(b.precio), Number(b.costoUnitario));
                    break;
                case "unidad":
                    compareValue = a.unidad.localeCompare(b.unidad);
                    break;
                case "fecha":
                    compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    break;
                case "estado":
                    compareValue = Number(a.activo) - Number(b.activo);
                    break;
            }

            return sortDirection === "asc" ? compareValue : -compareValue;
        });

        return filtered;
    }, [administrativeFilter, availabilityFilter, menuItems, searchQuery, selectedCategories, sortField, sortDirection]);

    const totalMenuItems = menuItems.length;
    const activeProducts = menuItems.filter((item) => item.type === "PRODUCTO" && item.activo).length;
    const promotionsCount = menuItems.filter((item) => item.type === "PROMOCION").length;
    const disabledProducts = menuItems.filter((item) => item.type === "PRODUCTO" && !item.activo).length;
    const activeFilterCount =
        (searchQuery ? 1 : 0) +
        (selectedCategories.length > 0 ? selectedCategories.length : 0) +
        (administrativeFilter !== "todos" ? 1 : 0) +
        (availabilityFilter !== "todas" ? 1 : 0);
    const hasActiveFilters =
        searchQuery !== "" || selectedCategories.length > 0 || administrativeFilter !== "todos" || availabilityFilter !== "todas";

    return (
        <div className="app-page-safe-bottom space-y-5 pb-6 md:space-y-8 md:pb-10">
            <section className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="mb-1 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                                <Package2 className="h-5 w-5" />
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">Menu y productos</h1>
                        </div>
                        <p className="text-sm font-medium text-zinc-500 md:text-base">Gestiona productos, promociones y categorias del menu.</p>
                    </div>

                    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-11 justify-between rounded-2xl border-zinc-200 bg-white px-4 font-medium text-zinc-700 shadow-sm md:rounded-full md:px-5">
                                    <span className="flex items-center gap-2">
                                        <ListTree className="h-4 w-4" />
                                        Categorias
                                    </span>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl border-zinc-100 p-2 shadow-xl">
                                <DropdownMenuLabel className="px-3 pb-2 text-[0.65rem] font-bold uppercase tracking-widest text-zinc-400">
                                    Gestion de categorias
                                </DropdownMenuLabel>
                                <DropdownMenuItem asChild className="my-0.5 cursor-pointer rounded-xl">
                                    <Link href="/admin/dashboard/productos/categorias">Ver todas</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-zinc-100" />
                                <DropdownMenuItem
                                    className="my-0.5 cursor-pointer rounded-xl focus:bg-orange-50 focus:text-orange-600"
                                    onClick={() => setIsCategorySheetOpen(true)}
                                >
                                    <Plus className="mr-2 h-3.5 w-3.5" />
                                    Nueva categoria
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button asChild className="h-11 rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800 md:rounded-full">
                            <Link href="/admin/dashboard/productos/promociones/nueva">
                                <Plus className="mr-2 h-4 w-4" />
                                Nueva promocion
                            </Link>
                        </Button>

                        <Button asChild className="h-11 rounded-2xl bg-orange-500 text-white hover:bg-orange-600 md:rounded-full">
                            <Link href="/admin/dashboard/productos/nuevo">
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo producto
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
                <MetricCard title="Items en menu" value={totalMenuItems} subtitle="productos y promociones" headerColor="bg-blue-600" />
                <MetricCard title="Productos activos" value={activeProducts} subtitle="visibles en operacion" headerColor="bg-orange-500" />
                <MetricCard title="Promociones" value={promotionsCount} subtitle="paquetes configurados" headerColor="bg-violet-500" />
                <MetricCard title="Productos desactivados" value={disabledProducts} subtitle="ocultos del catalogo web" headerColor="bg-emerald-500" />
            </div>

            <section className="rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <Input
                            placeholder="Buscar por nombre, categoria o codigo..."
                            className="h-12 rounded-[2rem] border-zinc-200 bg-zinc-50 pl-11 text-sm shadow-none"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                        />
                    </div>

                    <div className="flex w-full items-center gap-3 md:w-auto">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setFiltersOpen(true)}
                            className="h-12 flex-1 rounded-[1.5rem] border-zinc-200 bg-white text-zinc-700 md:hidden"
                        >
                            <Filter className="mr-2 h-4 w-4" />
                            Filtros
                            {activeFilterCount > 0 ? (
                                <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-700">{activeFilterCount}</span>
                            ) : null}
                        </Button>

                        <div className="hidden items-center gap-3 md:flex md:flex-wrap">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-12 rounded-full border-zinc-200 px-6 text-zinc-600">
                                        <Filter className="mr-2 h-4 w-4" />
                                        Categorias
                                        {selectedCategories.length > 0 ? (
                                            <Badge variant="secondary" className="ml-2 bg-zinc-100 px-2 py-0 text-zinc-900">
                                                {selectedCategories.length}
                                            </Badge>
                                        ) : null}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-60 rounded-2xl border-zinc-100 p-2 shadow-xl">
                                    <DropdownMenuLabel className="px-3 pb-2 text-[0.65rem] font-bold uppercase tracking-widest text-zinc-400">
                                        Seleccionar categorias
                                    </DropdownMenuLabel>
                                    {categories.map((category) => (
                                        <DropdownMenuCheckboxItem
                                            key={category.id}
                                            checked={selectedCategories.includes(category.id)}
                                            className="my-0.5 rounded-xl"
                                            onCheckedChange={() => toggleCategorySelection(category.id)}
                                        >
                                            {category.nombre}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-12 rounded-full border-zinc-200 px-6 text-zinc-600">
                                        Estado: {getAdministrativeStatusLabel(administrativeFilter)}
                                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 rounded-2xl border-zinc-100 p-2 shadow-xl">
                                    <DropdownMenuItem className="my-0.5 rounded-xl" onClick={() => setAdministrativeFilter("todos")}>Todos</DropdownMenuItem>
                                    <DropdownMenuItem className="my-0.5 rounded-xl" onClick={() => setAdministrativeFilter("activos")}>Activos</DropdownMenuItem>
                                    <DropdownMenuItem className="my-0.5 rounded-xl" onClick={() => setAdministrativeFilter("desactivados")}>Desactivados</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <span className="hidden text-sm font-medium text-zinc-400 md:inline">{filteredAndSortedItems.length} resultados</span>
                    </div>
                </div>

                {hasActiveFilters ? (
                    <div className="mt-4 border-t border-zinc-100 pt-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="mr-2 text-[0.65rem] font-bold uppercase tracking-widest text-zinc-400">Filtros activos</span>
                            {searchQuery ? (
                                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 shadow-sm">
                                    Busqueda: {searchQuery}
                                    <button type="button" onClick={() => setSearchQuery("")} className="rounded-full p-1 hover:bg-zinc-100">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ) : null}
                            {selectedCategories.map((categoryId) => {
                                const categoryName = categories.find((item) => item.id === categoryId)?.nombre || categoryId;
                                return (
                                    <div
                                        key={categoryId}
                                        className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 shadow-sm"
                                    >
                                        {categoryName}
                                        <button type="button" onClick={() => toggleCategorySelection(categoryId)} className="rounded-full p-1 hover:bg-zinc-100">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                );
                            })}
                            {administrativeFilter !== "todos" ? (
                                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 shadow-sm">
                                    Estado: {getAdministrativeStatusLabel(administrativeFilter)}
                                    <button type="button" onClick={() => setAdministrativeFilter("todos")} className="rounded-full p-1 hover:bg-zinc-100">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ) : null}
                            {availabilityFilter !== "todas" ? (
                                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 shadow-sm">
                                    Disponibilidad: {getAvailabilityLabel(availabilityFilter)}
                                    <button type="button" onClick={() => setAvailabilityFilter("todas")} className="rounded-full p-1 hover:bg-zinc-100">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ) : null}
                            <Button type="button" variant="ghost" size="sm" className="ml-auto rounded-full px-3 text-xs text-zinc-400 hover:text-zinc-600" onClick={clearFilters}>
                                Limpiar todo
                            </Button>
                        </div>
                    </div>
                ) : null}
            </section>

            <section className="space-y-3 md:hidden">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="animate-pulse rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm">
                            <div className="h-4 w-28 rounded bg-zinc-100" />
                            <div className="mt-3 h-20 rounded-2xl bg-zinc-50" />
                        </div>
                    ))
                ) : filteredAndSortedItems.length === 0 ? (
                    <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-12 text-center shadow-sm">
                        <p className="text-sm font-semibold text-zinc-500">No se encontraron items del menu</p>
                        <p className="mt-1 text-xs text-zinc-400">Prueba ajustando los filtros o la busqueda.</p>
                    </div>
                ) : (
                    filteredAndSortedItems.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedItem(item)}
                            className="w-full rounded-[1.75rem] border border-zinc-200 bg-white p-4 text-left shadow-sm transition-colors hover:bg-zinc-50"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] border border-zinc-100 bg-zinc-50">
                                    {item.imagen ? (
                                        <img
                                            src={item.imagen}
                                            alt={item.nombre}
                                            className="h-full w-full object-cover"
                                            onError={(event) => {
                                                event.currentTarget.style.display = "none";
                                            }}
                                        />
                                    ) : (
                                        <ImageIcon className="h-5 w-5 text-zinc-300" />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="mb-2 flex flex-wrap gap-2">
                                                <Badge variant="secondary" className={`font-bold ${getTypeBadgeClasses(item.type)}`}>
                                                    {item.type}
                                                </Badge>
                                                <Badge variant="outline" className="border-zinc-200 text-zinc-500">
                                                    {item.categoria}
                                                </Badge>
                                            </div>
                                            <h3 className="truncate text-base font-black tracking-tight text-zinc-900">{item.nombre}</h3>
                                            {item.descripcion ? <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{item.descripcion}</p> : null}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-base font-black text-zinc-900">{formatCurrency(Number(item.precio))}</p>
                                            {item.costoUnitario ? (
                                                <p className="text-xs text-zinc-400">Margen {calculateMargin(Number(item.precio), Number(item.costoUnitario)).toFixed(0)}%</p>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <Badge variant="secondary" className={item.activo ? "bg-emerald-50 text-emerald-600 border-none" : "bg-red-50 text-red-600 border-none"}>
                                            {item.activo ? "Activo" : "Inactivo"}
                                        </Badge>
                                        <Badge variant="outline" className="border-zinc-200 text-zinc-500">
                                            {item.unidad}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </section>

            <section className="hidden overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm md:block">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-zinc-100 bg-zinc-50/50">
                            <tr>
                                <th className="px-6 py-5 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500">Tipo</th>
                                <th
                                    onClick={() => handleSort("nombre")}
                                    className="cursor-pointer px-6 py-5 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-700"
                                >
                                    Nombre
                                    <SortIcon field="nombre" currentField={sortField} currentDirection={sortDirection} />
                                </th>
                                <th
                                    onClick={() => handleSort("categoria")}
                                    className="cursor-pointer px-6 py-5 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-700"
                                >
                                    Categoria
                                    <SortIcon field="categoria" currentField={sortField} currentDirection={sortDirection} />
                                </th>
                                <th
                                    onClick={() => handleSort("precio")}
                                    className="cursor-pointer px-6 py-5 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-700"
                                >
                                    Precio
                                    <SortIcon field="precio" currentField={sortField} currentDirection={sortDirection} />
                                </th>
                                <th
                                    onClick={() => handleSort("costo")}
                                    className="cursor-pointer px-6 py-5 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-700"
                                >
                                    Costo
                                    <SortIcon field="costo" currentField={sortField} currentDirection={sortDirection} />
                                </th>
                                <th
                                    onClick={() => handleSort("margen")}
                                    className="cursor-pointer px-6 py-5 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-700"
                                >
                                    Margen
                                    <SortIcon field="margen" currentField={sortField} currentDirection={sortDirection} />
                                </th>
                                <th
                                    onClick={() => handleSort("unidad")}
                                    className="cursor-pointer px-6 py-5 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-700"
                                >
                                    Unidad
                                    <SortIcon field="unidad" currentField={sortField} currentDirection={sortDirection} />
                                </th>
                                <th
                                    onClick={() => handleSort("fecha")}
                                    className="cursor-pointer px-6 py-5 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-700"
                                >
                                    Fecha
                                    <SortIcon field="fecha" currentField={sortField} currentDirection={sortDirection} />
                                </th>
                                <th
                                    onClick={() => handleSort("estado")}
                                    className="cursor-pointer px-6 py-5 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-700"
                                >
                                    Estado
                                    <SortIcon field="estado" currentField={sortField} currentDirection={sortDirection} />
                                </th>
                                <th className="px-6 py-5 text-right text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 bg-white">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
                                            <span className="text-sm font-medium text-zinc-400">Cargando items...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredAndSortedItems.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-20 text-center">
                                        <p className="font-medium text-zinc-500">No se encontraron items del menu</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedItems.map((item) => (
                                    <tr key={item.id} className="transition-all duration-150 hover:bg-zinc-50/50">
                                        <td className="px-6 py-4">
                                            <Badge variant="secondary" className={`font-bold ${getTypeBadgeClasses(item.type)}`}>
                                                {item.type}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50">
                                                    {item.imagen ? (
                                                        <img
                                                            src={item.imagen}
                                                            alt={item.nombre}
                                                            className="h-full w-full object-cover"
                                                            onError={(event) => {
                                                                event.currentTarget.style.display = "none";
                                                            }}
                                                        />
                                                    ) : (
                                                        <ImageIcon className="h-4 w-4 text-zinc-300" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-zinc-900">{item.nombre}</p>
                                                    {item.descripcion ? <p className="line-clamp-1 text-[0.7rem] text-zinc-400">{item.descripcion}</p> : null}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-zinc-500">{item.categoria}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-zinc-900">{formatCurrency(Number(item.precio))}</td>
                                        <td className="px-6 py-4 text-xs text-zinc-400">{item.costoUnitario ? formatCurrency(Number(item.costoUnitario)) : "-"}</td>
                                        <td className="px-6 py-4">
                                            {item.costoUnitario ? (
                                                <span className="rounded-md bg-zinc-50 px-2 py-1 text-xs font-bold text-zinc-500">
                                                    {calculateMargin(Number(item.precio), Number(item.costoUnitario)).toFixed(1)}%
                                                </span>
                                            ) : (
                                                <span className="text-xs text-zinc-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className="border-zinc-200 text-zinc-500">
                                                {item.unidad}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-zinc-500">{formatDate(item.createdAt)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="secondary" className={item.activo ? "bg-emerald-50 text-emerald-600 border-none" : "bg-red-50 text-red-600 border-none"}>
                                                    {item.activo ? "Activo" : "Inactivo"}
                                                </Badge>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0 hover:bg-zinc-100">
                                                        <MoreVertical className="h-4 w-4 text-zinc-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 rounded-2xl border-zinc-100 p-2 shadow-xl">
                                                    <DropdownMenuItem asChild className="my-0.5 rounded-xl">
                                                        <Link href={item.type === "PRODUCTO" ? `/admin/dashboard/productos/${item.id}` : `/admin/dashboard/productos/promociones/${item.id}`}>
                                                            Ver detalle
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild className="my-0.5 rounded-xl">
                                                        <Link
                                                            href={
                                                                item.type === "PRODUCTO"
                                                                    ? `/admin/dashboard/productos/${item.id}/editar`
                                                                    : `/admin/dashboard/productos/promociones/${item.id}/editar`
                                                            }
                                                        >
                                                            Editar
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    {item.type === "PRODUCTO" ? <DropdownMenuItem className="my-0.5 rounded-xl" onClick={() => void handleDuplicate(item)}>Duplicar</DropdownMenuItem> : null}
                                                    {item.type === "PRODUCTO" ? (
                                                        <DropdownMenuItem className="my-0.5 rounded-xl" onClick={() => void handleToggleActive(item)}>
                                                            {item.activo ? "Desactivar" : "Activar"}
                                                        </DropdownMenuItem>
                                                    ) : null}
                                                    {item.type === "PRODUCTO" ? (
                                                        <DropdownMenuItem className="my-0.5 rounded-xl" onClick={() => void handleToggleAvailability(item)}>
                                                            {item.activo ? "Desactivar producto" : "Activar producto"}
                                                        </DropdownMenuItem>
                                                    ) : null}
                                                    <DropdownMenuSeparator className="bg-zinc-100" />
                                                    <DropdownMenuItem
                                                        className="my-0.5 rounded-xl text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-700"
                                                        onClick={() => void handleDelete(item)}
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
            </section>

            <ResponsivePanel
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                title="Filtros y orden"
                description="Refina la vista del menu desde mobile."
                mobileSide="bottom"
                desktopMode="sheet"
                contentClassName="sm:max-w-lg"
            >
                <div className="space-y-6">
                    <section className="space-y-3">
                        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-400">Estado administrativo</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {(["todos", "activos", "desactivados"] as AdministrativeStatusFilter[]).map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setAdministrativeFilter(status)}
                                    className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-colors ${administrativeFilter === status ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                                        }`}
                                >
                                    {getAdministrativeStatusLabel(status)}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-400">Disponibilidad</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {(["todas", "disponibles", "agotados"] as AvailabilityFilter[]).map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setAvailabilityFilter(status)}
                                    className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-colors ${availabilityFilter === status ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                                        }`}
                                >
                                    {getAvailabilityLabel(status)}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-400">Categorias</h3>
                            {selectedCategories.length > 0 ? (
                                <button type="button" onClick={() => setSelectedCategories([])} className="text-xs font-semibold text-zinc-500 hover:text-zinc-700">
                                    Limpiar
                                </button>
                            ) : null}
                        </div>
                        <div className="max-h-56 space-y-2 overflow-y-auto">
                            {categories.map((category) => {
                                const active = selectedCategories.includes(category.id);
                                return (
                                    <button
                                        key={category.id}
                                        type="button"
                                        onClick={() => toggleCategorySelection(category.id)}
                                        className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-colors ${active ? "bg-orange-500 text-white" : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                                            }`}
                                    >
                                        <span className="truncate">{category.nombre}</span>
                                        {active ? <span className="text-xs font-black">ON</span> : null}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-400">Orden</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {SORT_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setSortField(option.value)}
                                    className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-colors ${sortField === option.value ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setSortDirection("asc")}
                                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${sortDirection === "asc" ? "bg-orange-500 text-white" : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                                    }`}
                            >
                                Ascendente
                            </button>
                            <button
                                type="button"
                                onClick={() => setSortDirection("desc")}
                                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${sortDirection === "desc" ? "bg-orange-500 text-white" : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                                    }`}
                            >
                                Descendente
                            </button>
                        </div>
                    </section>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <Button type="button" variant="outline" className="h-11 rounded-2xl" onClick={clearFilters}>
                            Limpiar
                        </Button>
                        <Button type="button" className="h-11 rounded-2xl bg-zinc-900 hover:bg-zinc-800" onClick={() => setFiltersOpen(false)}>
                            Ver resultados
                        </Button>
                    </div>
                </div>
            </ResponsivePanel>

            <ResponsivePanel
                open={selectedItem != null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedItem(null);
                    }
                }}
                title={selectedItem?.nombre || "Detalle del item"}
                description="Resumen del producto o promocion seleccionada."
                mobileSide="bottom"
                desktopMode="sheet"
                contentClassName="sm:max-w-lg"
            >
                {selectedItem ? (
                    <div className="space-y-5">
                        <div className="flex items-start gap-4">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] border border-zinc-100 bg-zinc-50">
                                {selectedItem.imagen ? (
                                    <img
                                        src={selectedItem.imagen}
                                        alt={selectedItem.nombre}
                                        className="h-full w-full object-cover"
                                        onError={(event) => {
                                            event.currentTarget.style.display = "none";
                                        }}
                                    />
                                ) : (
                                    <ImageIcon className="h-6 w-6 text-zinc-300" />
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="mb-2 flex flex-wrap gap-2">
                                    <Badge variant="secondary" className={`font-bold ${getTypeBadgeClasses(selectedItem.type)}`}>
                                        {selectedItem.type}
                                    </Badge>
                                    <Badge variant="outline" className="border-zinc-200 text-zinc-500">
                                        {selectedItem.categoria}
                                    </Badge>
                                </div>
                                <p className="text-2xl font-black tracking-tight text-zinc-900">{formatCurrency(Number(selectedItem.precio))}</p>
                                {selectedItem.descripcion ? <p className="mt-2 text-sm text-zinc-500">{selectedItem.descripcion}</p> : null}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-[1.25rem] bg-zinc-50 p-4">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Costo</p>
                                <p className="mt-1 text-sm font-bold text-zinc-900">
                                    {selectedItem.costoUnitario ? formatCurrency(Number(selectedItem.costoUnitario)) : "-"}
                                </p>
                            </div>
                            <div className="rounded-[1.25rem] bg-zinc-50 p-4">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Margen</p>
                                <p className="mt-1 text-sm font-bold text-zinc-900">
                                    {selectedItem.costoUnitario ? `${calculateMargin(Number(selectedItem.precio), Number(selectedItem.costoUnitario)).toFixed(1)}%` : "-"}
                                </p>
                            </div>
                            <div className="rounded-[1.25rem] bg-zinc-50 p-4">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Unidad</p>
                                <p className="mt-1 text-sm font-bold text-zinc-900">{selectedItem.unidad}</p>
                            </div>
                            <div className="rounded-[1.25rem] bg-zinc-50 p-4">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Alta</p>
                                <p className="mt-1 text-sm font-bold text-zinc-900">{formatDate(selectedItem.createdAt)}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className={selectedItem.activo ? "bg-emerald-50 text-emerald-600 border-none" : "bg-red-50 text-red-600 border-none"}>
                                {selectedItem.activo ? "Activo" : "Inactivo"}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <Button asChild className="h-11 rounded-2xl bg-zinc-900 hover:bg-zinc-800">
                                <Link
                                    href={
                                        selectedItem.type === "PRODUCTO"
                                            ? `/admin/dashboard/productos/${selectedItem.id}`
                                            : `/admin/dashboard/productos/promociones/${selectedItem.id}`
                                    }
                                >
                                    Ver detalle completo
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="h-11 rounded-2xl border-zinc-200">
                                <Link
                                    href={
                                        selectedItem.type === "PRODUCTO"
                                            ? `/admin/dashboard/productos/${selectedItem.id}/editar`
                                            : `/admin/dashboard/productos/promociones/${selectedItem.id}/editar`
                                    }
                                >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                </Link>
                            </Button>
                            {selectedItem.type === "PRODUCTO" ? (
                                <Button type="button" variant="outline" className="h-11 rounded-2xl border-zinc-200" disabled={isSubmitting} onClick={() => void handleDuplicate(selectedItem)}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Duplicar
                                </Button>
                            ) : null}
                            {selectedItem.type === "PRODUCTO" ? (
                                <Button type="button" variant="outline" className="h-11 rounded-2xl border-zinc-200" disabled={isSubmitting} onClick={() => void handleToggleActive(selectedItem)}>
                                    {selectedItem.activo ? "Desactivar" : "Activar"}
                                </Button>
                            ) : null}
                            {selectedItem.type === "PRODUCTO" ? (
                                <Button type="button" variant="outline" className="h-11 rounded-2xl border-zinc-200" disabled={isSubmitting} onClick={() => void handleToggleAvailability(selectedItem)}>
                                    {selectedItem.activo ? "Desactivar producto" : "Activar producto"}
                                </Button>
                            ) : null}
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11 rounded-2xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => void handleDelete(selectedItem)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </Button>
                        </div>
                    </div>
                ) : null}
            </ResponsivePanel>

            <CreateCategorySheet open={isCategorySheetOpen} onOpenChange={setIsCategorySheetOpen} onSuccess={() => void refreshData()} />

            <div aria-hidden className="rounded-[1.75rem] bg-white/55 md:hidden" style={{ minHeight: "calc(var(--admin-mobile-nav-height) - 0.5rem)" }} />
        </div>
    );
}
