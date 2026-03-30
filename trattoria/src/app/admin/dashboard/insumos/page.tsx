"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Plus,
    Search,
    Filter,
    AlertTriangle,
    TrendingUp,
    Package,
    History,
    ChevronDown,
    Loader2,
    Eye,
    ArchiveX
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
import { getSupplies, archiveSupply } from "./actions";
import { toast } from "sonner";
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
} from "@/components/ui/alert-dialog";
import { CategoryDrawer } from "./components/CategoryDrawer";

// Metric Card 
function MetricCard({ title, value, change, headerColor, icon: Icon }: any) {
    return (
        <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full group hover:shadow-md transition-shadow duration-300">
            <div className={`h-12 ${headerColor} flex items-center px-6 text-white font-medium text-sm capitalize`}>
                {title}
                {Icon && <div className="ml-auto opacity-80"><Icon className="w-4 h-4" /></div>}
            </div>
            <div className="p-6 flex flex-col justify-between flex-grow">
                <div className="flex items-end gap-3">
                    <span className="text-3xl font-bold text-zinc-900 tracking-tight">{value}</span>
                    {change && (
                        <span className={`mb-1 px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider ${change === 'REVISAR' ? 'bg-amber-50 text-amber-600' : 'bg-zinc-100 text-zinc-600'
                            }`}>
                            {change}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function InsumosPage() {
    const [supplies, setSupplies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("todos"); // todos, activos, bajo_stock, sin_stock, archivados
    const [archiveId, setArchiveId] = useState<string | null>(null);
    const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);

    useEffect(() => {
        loadSupplies();
    }, []);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    async function loadSupplies() {
        setLoading(true);
        const result = await getSupplies();
        if (result.success && result.data) {
            setSupplies(result.data);
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    }

    const filteredSupplies = useMemo(() => {
        return supplies.filter(s => {
            // Apply Search Filtering
            const matchesSearch = s.nombre.toLowerCase().includes(debouncedSearch.toLowerCase());
            if (!matchesSearch) return false;

            // Apply Status Filtering
            const isNoStock = Number(s.stockActual) === 0;
            const isLowStock = Number(s.stockActual) > 0 && Number(s.stockActual) <= Number(s.stockMinimo);
            const isArchived = s.activo === false;
            
            if (statusFilter === "todos") return true;
            if (statusFilter === "activos") return s.activo === true;
            if (statusFilter === "bajo_stock") return isLowStock && s.activo === true;
            if (statusFilter === "sin_stock") return isNoStock && s.activo === true;
            if (statusFilter === "archivados") return isArchived;
            return true;
        });
    }, [supplies, debouncedSearch, statusFilter]);

    const stats = {
        total: supplies.length,
        lowStock: supplies.filter(s => Number(s.stockActual) <= Number(s.stockMinimo) && s.activo !== false).length,
        totalValue: supplies.filter(s => s.activo !== false).reduce((acc, s) => acc + (Number(s.stockActual) * Number(s.costoUnitario)), 0),
        active: supplies.filter(s => s.activo).length
    };

    const handleArchive = async () => {
        if (!archiveId) return;
        const result = await archiveSupply(archiveId);
        if (result.success) {
            toast.success("Insumo archivado correctamente");
            loadSupplies();
        } else {
            toast.error(result.error || "Error al archivar");
        }
        setArchiveId(null);
    };

    const getStatusLabel = () => {
        switch (statusFilter) {
            case "activos": return "Activos";
            case "bajo_stock": return "Stock Bajo";
            case "sin_stock": return "Sin Stock";
            case "archivados": return "Archivados";
            default: return "Todos los estados";
        }
    };

    return (
        <div className="flex flex-col gap-8 p-8 bg-zinc-50 min-h-screen">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Inventario de Insumos</h1>
                    <p className="text-zinc-500 mt-1">Gestiona las materias primas y el stock de tu trattoria.</p>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total insumos"
                    value={stats.total}
                    headerColor="bg-blue-600"
                    icon={Package}
                />
                <MetricCard
                    title="Insumos activos"
                    value={stats.active}
                    headerColor="bg-violet-500"
                    icon={Package}
                />
                <MetricCard
                    title="Inversión total (Activos)"
                    value={`$${stats.totalValue.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`}
                    headerColor="bg-amber-400"
                    icon={TrendingUp}
                />
                <MetricCard
                    title="Stock crítico"
                    value={stats.lowStock}
                    change={stats.lowStock > 0 ? "REVISAR" : undefined}
                    headerColor="bg-emerald-500"
                    icon={AlertTriangle}
                />
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-5 rounded-[2rem] border border-zinc-200 shadow-sm">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" />
                        <Input
                            placeholder="Buscar por nombre..."
                            className="pl-11 h-12 bg-zinc-50 border-zinc-200 rounded-full focus-visible:ring-zinc-400 transition-all text-sm shadow-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <Button 
                            variant="outline" 
                            className="h-12 rounded-full px-6 border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-medium"
                            onClick={() => setIsCategoryDrawerOpen(true)}
                        >
                            <Filter className="mr-2 h-4 w-4" />
                            Categorías
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-12 rounded-full px-6 border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-medium capitalize">
                                    {getStatusLabel()}
                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-zinc-100">
                                <DropdownMenuLabel className="px-3 pb-2 text-[0.65rem] font-bold uppercase tracking-widest text-zinc-400">Filtrar por Estado</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => setStatusFilter("todos")} className="rounded-xl my-0.5 cursor-pointer">Todos los estados</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("activos")} className="rounded-xl my-0.5 cursor-pointer">Activos</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("bajo_stock")} className="rounded-xl my-0.5 cursor-pointer">Stock Bajo</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("sin_stock")} className="rounded-xl my-0.5 cursor-pointer">Sin Stock</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("archivados")} className="rounded-xl my-0.5 cursor-pointer">Archivados</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="h-8 w-[1px] bg-zinc-200 mx-1 hidden md:block"></div>

                        <div className="flex items-center gap-3">
                            <Link href="/admin/dashboard/insumos/stock">
                                <Button variant="outline" className="rounded-full border-zinc-200 hover:bg-zinc-50 transition-all font-medium text-xs h-9 px-4">
                                    <History className="h-3.5 w-3.5 mr-2" />
                                    Registrar Stock
                                </Button>
                            </Link>

                            <Link href="/admin/dashboard/insumos/nuevo">
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
                                    <th className="text-left py-5 px-6 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">
                                        Insumo
                                    </th>
                                    <th className="text-left py-5 px-6 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">
                                        Categoría
                                    </th>
                                    <th className="text-left py-5 px-6 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">
                                        Stock Actual
                                    </th>
                                    <th className="text-left py-5 px-6 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">
                                        Unidad
                                    </th>
                                    <th className="text-left py-5 px-6 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">
                                        Costo Unit.
                                    </th>
                                    <th className="text-left py-5 px-6 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">
                                        Valor Inv.
                                    </th>
                                    <th className="text-left py-5 px-6 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">
                                        Estado
                                    </th>
                                    <th className="text-right py-5 px-6 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="h-8 w-8 text-zinc-300 animate-spin" />
                                                <p className="text-zinc-500 font-medium">Sincronizando inventario...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredSupplies.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="h-16 w-16 bg-zinc-50 rounded-full flex items-center justify-center">
                                                    <Search className="h-8 w-8 text-zinc-300" />
                                                </div>
                                                <p className="text-zinc-500 font-medium">No se encontraron resultados</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSupplies.map((supply) => {
                                        const stock = Number(supply.stockActual);
                                        const minStock = Number(supply.stockMinimo);
                                        const totalVal = stock * Number(supply.costoUnitario);
                                        
                                        // Visual indicators
                                        let stockColor = "bg-zinc-50 text-zinc-600 border-zinc-200";
                                        let stockIcon = null;
                                        let stateLabel = "OK";
                                        
                                        if (supply.activo === false) {
                                            stockColor = "bg-zinc-100 text-zinc-500 border-zinc-200";
                                            stateLabel = "Archivado";
                                        } else if (stock === 0) {
                                            stockColor = "bg-red-50 text-red-600 border-red-200";
                                            stockIcon = <AlertTriangle className="h-4 w-4 mr-1" />;
                                            stateLabel = "Sin Stock";
                                        } else if (stock <= minStock) {
                                            stockColor = "bg-amber-50 text-amber-600 border-amber-200";
                                            stockIcon = <AlertTriangle className="h-4 w-4 mr-1" />;
                                            stateLabel = "Crítico";
                                        } else {
                                            stockColor = "bg-emerald-50 text-emerald-600 border-emerald-200";
                                            stateLabel = "Activo";
                                        }

                                        return (
                                            <tr key={supply.id} className={`group ${supply.activo === false ? 'opacity-60 bg-zinc-50/50 grayscale-[0.5]' : 'border-b border-zinc-100 hover:bg-zinc-50/50 transition-all duration-150'}`}>
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-zinc-900 text-sm">
                                                        {supply.nombre}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {supply.categoria ? (
                                                        <Badge variant="outline" className="font-medium text-[0.65rem] text-zinc-500 border-zinc-200">
                                                            {supply.categoria}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs text-zinc-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-zinc-900">
                                                            {stock.toLocaleString()}
                                                        </span>
                                                        <span className="text-[0.6rem] text-zinc-400 uppercase font-bold tracking-tighter">Mín: {minStock.toLocaleString()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className="border-zinc-200 text-zinc-500 font-medium text-[0.6rem] uppercase tracking-tighter px-2 py-0">
                                                        {supply.unidad}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-zinc-900 text-sm">${Number(supply.costoUnitario).toFixed(2)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold text-zinc-500 bg-zinc-50 px-2 py-1 rounded-md">
                                                        ${totalVal.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className={`font-bold text-[0.65rem] px-2 py-0.5 flex w-max items-center ${stockColor}`}>
                                                        {stockIcon}
                                                        {stateLabel}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <Link href={`/admin/dashboard/insumos/${supply.id}`}>
                                                            <Button variant="outline" size="sm" className="h-8 rounded-lg shadow-sm font-medium text-xs">
                                                                <Eye className="h-3.5 w-3.5 mr-1" />
                                                                Detalle
                                                            </Button>
                                                        </Link>
                                                        {supply.activo && (
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                className="h-8 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-medium text-xs transition-colors"
                                                                onClick={() => setArchiveId(supply.id)}
                                                            >
                                                                <ArchiveX className="h-3.5 w-3.5 mr-1" />
                                                                Archivar
                                                            </Button>
                                                        )}
                                                    </div>
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

            {/* Category Drawer */}
            <CategoryDrawer 
                open={isCategoryDrawerOpen} 
                onClose={() => setIsCategoryDrawerOpen(false)} 
            />

            <AlertDialog open={!!archiveId} onOpenChange={() => setArchiveId(null)}>
                <AlertDialogContent className="rounded-[2rem] p-8 border-zinc-200 bg-white shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl">¿Archivar este insumo?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                            Este insumo no aparecerá en las búsquedas activas y ya no se podrá utilizar en nuevas formulaciones ni recetas. 
                            Sin embargo, su historial de movimientos permanecerá.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4 border-t border-zinc-100 pt-4">
                        <AlertDialogCancel className="rounded-xl border-zinc-200 shadow-sm font-medium">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleArchive}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-600/20 font-medium"
                        >
                            <ArchiveX className="w-4 h-4 mr-2" />
                            Archivar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
