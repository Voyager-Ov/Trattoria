"use client";

import * as React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { EstadoPedido } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsivePanel } from "@/components/ui/responsive-panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { ORDER_FILTER_OPTIONS, SORT_OPTIONS, STATUS_CONFIG, type SortDirection, type SortField } from "./pedido-shared";

interface PedidosToolbarProps {
    total: number;
    searchQuery: string;
    statusFilter: "TODOS" | EstadoPedido;
    orderBy: SortField;
    orderDir: SortDirection;
    onSearchChange: (value: string) => void;
    onStatusFilterChange: (value: "TODOS" | EstadoPedido) => void;
    onSortFieldChange: (value: SortField) => void;
    onSortDirectionChange: (value: SortDirection) => void;
    onClearFilters: () => void;
}

function getFilterLabel(value: "TODOS" | EstadoPedido) {
    if (value === "TODOS") {
        return "Todos";
    }

    return STATUS_CONFIG[value].shortLabel;
}

export function PedidosToolbar({
    total,
    searchQuery,
    statusFilter,
    orderBy,
    orderDir,
    onSearchChange,
    onStatusFilterChange,
    onSortFieldChange,
    onSortDirectionChange,
    onClearFilters,
}: PedidosToolbarProps) {
    const [filtersOpen, setFiltersOpen] = React.useState(false);
    const isFiltered =
        statusFilter !== "TODOS" ||
        searchQuery.trim().length > 0 ||
        orderBy !== "recibidoEn" ||
        orderDir !== "desc";

    return (
        <section className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                        placeholder="Buscar por numero o cliente..."
                        value={searchQuery}
                        onChange={(event) => onSearchChange(event.target.value)}
                        className="h-12 rounded-2xl border-zinc-200 bg-white pl-11 font-medium shadow-sm focus:ring-zinc-900"
                    />
                </div>

                <div className="flex items-center gap-3 md:hidden">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setFiltersOpen(true)}
                        className="h-11 flex-1 rounded-2xl border-zinc-200 bg-white font-semibold text-zinc-700 shadow-sm"
                    >
                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                        Filtros
                    </Button>
                    {isFiltered && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClearFilters}
                            className="h-11 rounded-2xl px-4 font-semibold text-zinc-500"
                        >
                            <X className="mr-1 h-4 w-4" />
                            Limpiar
                        </Button>
                    )}
                </div>

                <div className="hidden md:flex md:flex-col md:items-end">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Pedidos</p>
                    <p className="text-sm font-semibold text-zinc-600">{total} resultados</p>
                </div>
            </div>

            <div className="hidden flex-wrap items-center gap-2 rounded-[1.5rem] border border-zinc-200 bg-white p-1.5 shadow-sm md:flex">
                {ORDER_FILTER_OPTIONS.map((option) => (
                    <button
                        key={option}
                        onClick={() => onStatusFilterChange(option)}
                        className={cn(
                            "rounded-2xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200",
                            statusFilter === option
                                ? "scale-[1.02] bg-zinc-900 text-white shadow-md shadow-zinc-200"
                                : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
                        )}
                    >
                        {getFilterLabel(option)}
                    </button>
                ))}
            </div>

            <div className="flex items-center justify-between md:hidden">
                <div className="flex items-center gap-2">
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                        {getFilterLabel(statusFilter)}
                    </span>
                    {isFiltered && <span className="text-xs font-semibold text-zinc-400">{total} resultados</span>}
                </div>
            </div>

            <ResponsivePanel
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                title="Filtros"
                description="Ajusta estado y orden del listado."
                mobileSide="bottom"
                desktopMode="sheet"
                contentClassName="sm:max-w-md"
            >
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Estado</Label>
                        <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as "TODOS" | EstadoPedido)}>
                            <SelectTrigger className="h-12 rounded-2xl border-zinc-200 bg-white">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                {ORDER_FILTER_OPTIONS.map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {getFilterLabel(option)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Ordenar por</Label>
                        <Select value={orderBy} onValueChange={(value) => onSortFieldChange(value as SortField)}>
                            <SelectTrigger className="h-12 rounded-2xl border-zinc-200 bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SORT_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Direccion</Label>
                        <Select value={orderDir} onValueChange={(value) => onSortDirectionChange(value as SortDirection)}>
                            <SelectTrigger className="h-12 rounded-2xl border-zinc-200 bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="desc">Descendente</SelectItem>
                                <SelectItem value="asc">Ascendente</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button type="button" variant="outline" onClick={onClearFilters} className="h-11 w-full rounded-2xl border-zinc-200">
                        Limpiar filtros
                    </Button>
                </div>
            </ResponsivePanel>
        </section>
    );
}
