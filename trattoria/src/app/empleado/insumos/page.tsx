"use client";

import React, { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    AlertTriangle,
    Beaker,
    TrendingUp,
    Package,
    History,
    ChevronDown,
    Loader2,
    LucideIcon
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
import { getSupplies, softDeleteSupply } from "./actions";
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


interface Supply {
    id: string;
    nombre: string;
    stockActual: number | string;
    stockMinimo: number | string;
    unidad: string;
    costoUnitario: number | string;
    activo: boolean;
}

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: string;
    headerColor: string;
    icon?: LucideIcon;
}

// Metric Card - Exact Match with Admin Page
function MetricCard({ title, value, change, headerColor, icon: Icon }: MetricCardProps) {
    return (
        <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full group hover:shadow-md transition-shadow duration-300">
            {/* Colored Header Strip */}
            <div className={`h-12 ${headerColor} flex items-center px-6 text-white font-medium text-sm capitalize`}>
                {title}
                {Icon && <div className="ml-auto opacity-80"><Icon className="w-4 h-4" /></div>}
            </div>
            {/* Body */}
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
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);


    useEffect(() => {
        loadSupplies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function loadSupplies() {
        setLoading(true);
        const result = await getSupplies();
        if (result.success) {
            setSupplies(result.data);
        } else {
            toast.error(result.error || "Error al cargar los insumos");
        }
        setLoading(false);
    }

    const filteredSupplies = supplies.filter(s =>
        s.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: supplies.length,
        lowStock: supplies.filter(s => Number(s.stockActual) <= Number(s.stockMinimo)).length,
        totalValue: supplies.reduce((acc, s) => acc + (Number(s.stockActual) * Number(s.costoUnitario)), 0),
        active: supplies.filter(s => s.activo).length
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const result = await softDeleteSupply(deleteId);
        if (result.success) {
            toast.success("Insumo eliminado correctamente");
            loadSupplies();
        } else {
            toast.error(result.error || "Error al eliminar el insumo");
        }
        setDeleteId(null);
    };

    const truncateId = (id: string) => {
        return id.length > 12 ? `${id.slice(0, 12)}...` : id;
    };


    return (
        <div className="flex flex-col gap-8 p-8 bg-zinc-50 min-h-screen">
            <div className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                            <Package size={20} />
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter text-zinc-900 uppercase">Gestión de Insumos</h2>
                    </div>
                    <p className="text-zinc-500 font-medium ml-12">Controla el stock y gestiona el inventario.</p>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total insumos"
                    value={stats.total}
                    change="+12%"
                    headerColor="bg-blue-600"
                    icon={Package}
                />
                <MetricCard
                    title="Insumos activos"
                    value={stats.active}
                    change="+5%"
                    headerColor="bg-orange-500"
                    icon={Beaker}
                />
                <MetricCard
                    title="Inversión total"
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
                            placeholder="Buscar por nombre o código..."
                            className="pl-11 h-12 bg-zinc-50 border-zinc-200 rounded-full focus-visible:ring-zinc-400 transition-all text-sm shadow-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <Button variant="outline" className="h-12 rounded-full px-6 border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-medium">
                            <Filter className="mr-2 h-4 w-4" />
                            Categorías
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-12 rounded-full px-6 border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-medium capitalize">
                                    Todos los estados
                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-zinc-100">
                                <DropdownMenuLabel className="px-3 pb-2 text-[0.65rem] font-bold uppercase tracking-widest text-zinc-400">Filtrar por Estado</DropdownMenuLabel>
                                <DropdownMenuItem className="rounded-xl my-0.5">Todos los estados</DropdownMenuItem>
                                <DropdownMenuItem className="rounded-xl my-0.5">Activos</DropdownMenuItem>
                                <DropdownMenuItem className="rounded-xl my-0.5">Stock Bajo</DropdownMenuItem>
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
                                    <th className="text-left p-6 w-[50px]">
                                        <input
                                            type="checkbox"
                                            className="rounded-md border-zinc-300 text-zinc-900 focus:ring-zinc-900 h-4 w-4"
                                        />
                                    </th>
                                    <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">
                                        Código
                                    </th>
                                    <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">
                                        Insumo
                                    </th>
                                    <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">
                                        Stock Actual
                                    </th>
                                    <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">
                                        Unidad
                                    </th>
                                    <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">
                                        Costo Unit.
                                    </th>
                                    <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">
                                        Valor Inv.
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
                                        <td colSpan={9} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="h-8 w-8 text-zinc-300 animate-spin" />
                                                <p className="text-zinc-500 font-medium">Sincronizando inventario...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredSupplies.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-20">
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
                                        const totalVal = Number(supply.stockActual) * Number(supply.costoUnitario);

                                        return (
                                            <tr key={supply.id} className="group border-b border-zinc-100 hover:bg-zinc-50/50 transition-all duration-150">
                                                <td className="p-6">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded-md border-zinc-300 text-zinc-900 focus:ring-zinc-900 h-4 w-4"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-mono text-[0.7rem] text-zinc-400 group-hover:text-zinc-600 transition-colors">
                                                        {truncateId(supply.id)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center border border-zinc-100 ${isLowStock ? 'bg-amber-50 text-amber-500' : 'bg-zinc-50 text-zinc-300'}`}>
                                                            {isLowStock ? <AlertTriangle className="h-5 w-5" /> : <Beaker className="h-5 w-5" />}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-zinc-900 text-sm">{supply.nombre}</span>
                                                            <span className="text-[0.7rem] text-zinc-400 mt-0.5 capitalize">Materia Prima</span>
                                                        </div>
                                                    </div>
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
                                                    <span className="font-bold text-zinc-900 text-sm">${Number(supply.costoUnitario).toFixed(2)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold text-zinc-500 bg-zinc-50 px-2 py-1 rounded-md">
                                                        ${totalVal.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                                                    </span>
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
                                                            <DropdownMenuItem className="rounded-xl my-0.5">Configurar Insumo</DropdownMenuItem>
                                                            <DropdownMenuItem className="rounded-xl my-0.5">Ver Historial</DropdownMenuItem>
                                                            <div className="h-px bg-zinc-50 my-1 mx-1" />
                                                            <DropdownMenuItem
                                                                className="text-red-500 focus:text-red-600 rounded-xl my-0.5 font-medium"
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
