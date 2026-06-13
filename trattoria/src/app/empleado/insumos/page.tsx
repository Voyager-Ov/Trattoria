"use client";

import React, { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    History,
    ChevronDown,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { getSupplies, softDeleteSupply, archiveSupply, unarchiveSupply } from "./actions";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";


interface Supply {
    id: string;
    nombre: string;
    stockActual: number | string;
    stockMinimo: number | string;
    unidad: string;
    costoUnitario: number | string;
    activo: boolean;
    category?: {
        id: string;
        nombre: string;
    } | null;
}



export default function InsumosPage() {
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);

    async function fetchSupplies() {
        const result = await getSupplies();
        if (!result.success) {
            throw new Error(result.error || "Error al cargar los insumos");
        }

        return (result.data ?? []) as Supply[];
    }

    async function loadSupplies() {
        setLoading(true);
        try {
            const nextSupplies = await fetchSupplies();
            setSupplies(nextSupplies);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al cargar los insumos");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let isActive = true;

        void fetchSupplies()
            .then((nextSupplies) => {
                if (isActive) {
                    setSupplies(nextSupplies);
                }
            })
            .catch((error) => {
                if (isActive) {
                    toast.error(error instanceof Error ? error.message : "Error al cargar los insumos");
                }
            })
            .finally(() => {
                if (isActive) {
                    setLoading(false);
                }
            });

        return () => {
            isActive = false;
        };
    }, []);

    const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
    const [statusFilter, setStatusFilter] = useState<string>("Todos los estados");

    const categories = Array.from(new Set(supplies.map(s => s.category?.nombre).filter(Boolean))) as string[];

    const filteredSupplies = supplies.filter(s => {
        const matchesSearch = s.nombre.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "Todas" || s.category?.nombre === selectedCategory;
        const matchesStatus = statusFilter === "Todos los estados" 
            || (statusFilter === "Activos" && s.activo)
            || (statusFilter === "Stock Bajo" && Number(s.stockActual) <= Number(s.stockMinimo));
        return matchesSearch && matchesCategory && matchesStatus;
    });



    const router = useRouter();

    const handleDelete = async () => {
        if (!deleteId) return;
        const result = await softDeleteSupply(deleteId);
        if (result.success) {
            toast.success("Insumo archivado correctamente");
            loadSupplies();
        } else {
            toast.error(result.error || "Error al archivar el insumo");
        }
        setDeleteId(null);
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        const action = currentStatus ? archiveSupply : unarchiveSupply;
        const result = await action(id);
        if (result.success) {
            toast.success(currentStatus ? "Insumo desactivado" : "Insumo activado");
            loadSupplies();
        } else {
            toast.error(result.error);
        }
    };

    const truncateId = (id: string) => {
        return id.length > 12 ? `${id.slice(0, 12)}...` : id;
    };


    return (
        <div className="flex flex-col gap-8 p-8 bg-zinc-50 min-h-screen">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter text-zinc-900 uppercase">Gestión de Insumos</h2>
                    <p className="text-zinc-500 font-medium mt-1">Controla el stock y gestiona el inventario.</p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-[1.5rem] border border-zinc-200 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">Total Insumos</p>
                    <p className="mt-2 text-3xl font-black tracking-tighter text-zinc-900">{supplies.length}</p>
                </div>
                <div className="bg-white p-5 rounded-[1.5rem] border border-zinc-200 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">Activos</p>
                    <p className="mt-2 text-3xl font-black tracking-tighter text-emerald-600">{supplies.filter(s => s.activo).length}</p>
                </div>
                <div className="bg-white p-5 rounded-[1.5rem] border border-zinc-200 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">Stock Crítico</p>
                    <p className="mt-2 text-3xl font-black tracking-tighter text-amber-500">{supplies.filter(s => Number(s.stockActual) <= Number(s.stockMinimo)).length}</p>
                </div>
                <div className="bg-white p-5 rounded-[1.5rem] border border-zinc-200 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">Categorías</p>
                    <p className="mt-2 text-3xl font-black tracking-tighter text-blue-600">{new Set(supplies.map(s => s.category?.nombre).filter(Boolean)).size}</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-5 rounded-[2rem] border border-zinc-200 shadow-sm">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" />
                        <Input
                            placeholder="Buscar por nombre o código..."
                            className="pl-11 h-12 bg-zinc-50 border-zinc-200 rounded-full focus-visible:ring-zinc-400 transition-all text-sm shadow-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-12 rounded-full px-6 border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-medium capitalize">
                                    <Filter className="mr-2 h-4 w-4 opacity-50" />
                                    {selectedCategory === "Todas" ? "Categorías" : selectedCategory}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-zinc-100 max-h-60 overflow-y-auto">
                                <DropdownMenuLabel className="px-3 pb-2 text-[0.65rem] font-bold uppercase tracking-widest text-zinc-400">Filtrar por Categoría</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => setSelectedCategory("Todas")} className="rounded-xl my-0.5">Todas</DropdownMenuItem>
                                {categories.map(cat => (
                                    <DropdownMenuItem key={cat} onClick={() => setSelectedCategory(cat)} className="rounded-xl my-0.5">{cat}</DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-12 rounded-full px-6 border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-medium capitalize">
                                    {statusFilter === "Todos los estados" ? "Todos los estados" : statusFilter}
                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-zinc-100">
                                <DropdownMenuLabel className="px-3 pb-2 text-[0.65rem] font-bold uppercase tracking-widest text-zinc-400">Filtrar por Estado</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => setStatusFilter("Todos los estados")} className="rounded-xl my-0.5">Todos los estados</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("Activos")} className="rounded-xl my-0.5">Activos</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("Stock Bajo")} className="rounded-xl my-0.5">Stock Bajo</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="h-8 w-[1px] bg-zinc-200 mx-1 hidden md:block"></div>

                        <div className="flex items-center gap-3">
                            <Link href="/empleado/insumos/stock">
                                <Button variant="outline" className="rounded-full border-zinc-200 hover:bg-zinc-50 transition-all font-medium text-xs h-9 px-4">
                                    <History className="h-3.5 w-3.5 mr-2" />
                                    Registrar Stock
                                </Button>
                            </Link>

                            <Link href="/empleado/insumos/nuevo">
                                <Button className="rounded-full bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm transition-all font-medium text-xs h-9 px-4">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nuevo Insumo
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden mb-12">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-zinc-50/50 border-b border-zinc-100">
                                <tr>
                                    <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">
                                        Insumo
                                    </th>
                                    <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">
                                        Categoría
                                    </th>
                                    <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">
                                        Stock Actual
                                    </th>
                                    <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">
                                        Unidad
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
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="h-8 w-8 text-zinc-300 animate-spin" />
                                                <p className="text-zinc-500 font-medium">Sincronizando inventario...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredSupplies.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="h-16 w-16 bg-zinc-50 rounded-full flex items-center justify-center">
                                                    <Search className="h-8 w-8 text-zinc-300" />
                                                </div>
                                                <p className="text-zinc-500 font-medium">No se encontraron insumos</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSupplies.map((supply) => {
                                        const isLowStock = Number(supply.stockActual) <= Number(supply.stockMinimo);

                                        return (
                                            <tr key={supply.id} className="group border-b border-zinc-100 hover:bg-zinc-50/50 transition-all duration-150">
                                                <td className="px-6 py-4">
                                                    <span className="font-black text-zinc-900 text-sm whitespace-nowrap">{supply.nombre}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-[0.7rem] text-zinc-500 uppercase tracking-widest font-black bg-zinc-100/50 px-3 py-1.5 rounded-lg border border-zinc-200">
                                                        {supply.category?.nombre || "Sin categoria"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className={`font-bold text-sm ${isLowStock ? 'text-amber-500' : 'text-zinc-900'}`}>
                                                            {Number(supply.stockActual).toLocaleString()}
                                                        </span>
                                                        <span className="text-[0.6rem] text-zinc-400 uppercase font-bold tracking-tighter">Mín: {Number(supply.stockMinimo).toLocaleString()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className="border-zinc-200 text-zinc-500 font-medium text-[0.6rem] uppercase tracking-tighter px-2 py-0">
                                                        {supply.unidad}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge
                                                        variant="secondary"
                                                        className={
                                                            supply.activo
                                                                ? "bg-emerald-50 text-emerald-600 border-none font-bold text-[0.6rem] px-2 py-0.5 rounded-full"
                                                                : "bg-red-50 text-red-600 border-none font-bold text-[0.6rem] px-2 py-0.5 rounded-full"
                                                        }
                                                    >
                                                        {supply.activo ? "ACTIVO" : "INACTIVO"}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-zinc-100">
                                                                <MoreVertical className="h-4 w-4 text-zinc-400" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 shadow-xl border-zinc-100">
                                                            <DropdownMenuItem onClick={() => router.push(`/empleado/insumos/${supply.id}/editar`)} className="rounded-xl my-0.5 cursor-pointer">Configurar Insumo</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => router.push(`/empleado/insumos/${supply.id}`)} className="rounded-xl my-0.5 cursor-pointer">Ver Historial</DropdownMenuItem>
                                                            <div className="h-px bg-zinc-50 my-1 mx-1" />
                                                            <DropdownMenuItem
                                                                className="rounded-xl my-0.5 font-medium cursor-pointer"
                                                                onClick={() => handleToggleStatus(supply.id, supply.activo)}
                                                            >
                                                                {supply.activo ? "Desactivar" : "Activar"}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-500 focus:text-red-600 rounded-xl my-0.5 font-medium cursor-pointer"
                                                                onClick={() => setDeleteId(supply.id)}
                                                            >
                                                                Archivar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent className="rounded-[2rem] p-8 border-zinc-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Archivar este insumo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            El insumo ya no aparecerá en el inventario activo ni en la creación de productos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-full"
                        >
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
