import * as React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsivePanel } from "@/components/ui/responsive-panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { FILTER_LABEL, type FilterStatus } from "./supplies-shared";

interface SuppliesToolbarProps {
    total: number;
    search: string;
    filterStatus: FilterStatus;
    onSearchChange: (value: string) => void;
    onFilterChange: (value: FilterStatus) => void;
    onClearFilters: () => void;
}

const FILTER_OPTIONS: FilterStatus[] = ["todos", "activos", "archivados", "criticos"];

export function SuppliesToolbar({
    total,
    search,
    filterStatus,
    onSearchChange,
    onFilterChange,
    onClearFilters,
}: SuppliesToolbarProps) {
    const [filtersOpen, setFiltersOpen] = React.useState(false);
    const isFiltered = search.trim().length > 0 || filterStatus !== "todos";

    return (
        <section className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Buscar por nombre..."
                        className="h-12 rounded-[1.75rem] border-zinc-200 bg-white pl-11 text-sm font-medium shadow-sm focus:ring-zinc-900 md:rounded-[2rem]"
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
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Inventario</p>
                    <p className="text-sm font-semibold text-zinc-600">{total} resultados</p>
                </div>
            </div>

            <div className="flex items-center justify-between md:hidden">
                <div className="flex items-center gap-2">
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                        {FILTER_LABEL[filterStatus]}
                    </span>
                    {isFiltered && <span className="text-xs font-semibold text-zinc-400">{total} resultados</span>}
                </div>
            </div>

            <div className="hidden flex-wrap items-center gap-2 rounded-[1.5rem] border border-zinc-200 bg-white p-1.5 shadow-sm md:flex">
                {FILTER_OPTIONS.map((status) => (
                    <button
                        key={status}
                        type="button"
                        onClick={() => onFilterChange(status)}
                        className={cn(
                            "rounded-2xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200",
                            filterStatus === status
                                ? "scale-[1.02] bg-zinc-900 text-white shadow-md shadow-zinc-200"
                                : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
                        )}
                    >
                        {FILTER_LABEL[status]}
                    </button>
                ))}
            </div>

            <ResponsivePanel
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                title="Filtros"
                description="Ajusta el estado del inventario."
                mobileSide="bottom"
                desktopMode="sheet"
                contentClassName="sm:max-w-md"
            >
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Estado</Label>
                        <Select value={filterStatus} onValueChange={(value) => onFilterChange(value as FilterStatus)}>
                            <SelectTrigger className="h-12 rounded-2xl border-zinc-200 bg-white">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                {FILTER_OPTIONS.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {FILTER_LABEL[status]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClearFilters}
                        className="h-11 w-full rounded-2xl border-zinc-200"
                    >
                        Limpiar filtros
                    </Button>
                </div>
            </ResponsivePanel>
        </section>
    );
}
