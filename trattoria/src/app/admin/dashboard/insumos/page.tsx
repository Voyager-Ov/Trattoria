"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Settings, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

import { archiveSupply, getSupplies } from "./actions";
import { CategoryDrawer } from "./components/CategoryDrawer";
import { SuppliesDesktopTable } from "./components/SuppliesDesktopTable";
import { SuppliesHero } from "./components/SuppliesHero";
import { SuppliesMobileList } from "./components/SuppliesMobileList";
import { SuppliesToolbar } from "./components/SuppliesToolbar";
import { SupplyStatCard } from "./components/SupplyStatCard";
import { FILTER_LABEL, formatArCurrency, isCriticalSupply, type FilterStatus, type Supply } from "./components/supplies-shared";

export default function InsumosPage() {
    const router = useRouter();
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("todos");
    const [archiveId, setArchiveId] = useState<string | null>(null);
    const [showCategories, setShowCategories] = useState(false);

    const loadSupplies = useCallback(async () => {
        const result = await getSupplies();

        if (result.success && result.data) {
            setSupplies(result.data as Supply[]);
        } else {
            toast.error(result.error || "No se pudieron cargar los insumos");
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        let active = true;

        async function initializeSupplies() {
            const result = await getSupplies();

            if (!active) {
                return;
            }

            if (result.success && result.data) {
                setSupplies(result.data as Supply[]);
            } else {
                toast.error(result.error || "No se pudieron cargar los insumos");
            }

            setLoading(false);
        }

        void initializeSupplies();

        return () => {
            active = false;
        };
    }, []);

    const filteredSupplies = useMemo(() => {
        return supplies.filter((supply) => {
            const matchSearch = supply.nombre.toLowerCase().includes(search.toLowerCase());
            const matchStatus =
                filterStatus === "todos"
                    ? true
                    : filterStatus === "activos"
                      ? supply.activo
                      : filterStatus === "archivados"
                        ? !supply.activo
                        : isCriticalSupply(supply);

            return matchSearch && matchStatus;
        });
    }, [filterStatus, search, supplies]);

    const totalInsumos = supplies.length;
    const activeSupplies = supplies.filter((supply) => supply.activo);
    const totalActivos = activeSupplies.length;
    const inversionTotal = activeSupplies.reduce(
        (accumulator, supply) => accumulator + Number(supply.stockActual) * Number(supply.costoUnitario || 0),
        0
    );
    const stockCritico = supplies.filter((supply) => isCriticalSupply(supply)).length;

    async function handleArchive() {
        if (!archiveId) {
            return;
        }

        setLoading(true);
        const result = await archiveSupply(archiveId);
        if (!result.success) {
            toast.error(result.error || "No se pudo archivar el insumo");
            setLoading(false);
            return;
        }

        toast.success("Insumo archivado");
        setArchiveId(null);
        await loadSupplies();
    }

    return (
        <div className="app-page-safe-bottom flex min-h-screen flex-col gap-5 bg-white px-4 py-4 sm:px-6 md:gap-6 md:px-8 md:py-8">
            <SuppliesHero
                onOpenCategories={() => setShowCategories(true)}
                onGoToStock={() => router.push("/admin/dashboard/insumos/stock")}
                onGoToCreate={() => router.push("/admin/dashboard/insumos/nuevo")}
            />

            <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <SupplyStatCard label="Total Insumos" value={loading ? "--" : totalInsumos} icon={Settings} headerClass="bg-blue-600" />
                <SupplyStatCard label="Insumos Activos" value={loading ? "--" : totalActivos} icon={Settings} headerClass="bg-violet-600" />
                <SupplyStatCard
                    label="Inversion Total"
                    value={loading ? "--" : formatArCurrency(inversionTotal)}
                    icon={TrendingUp}
                    headerClass="bg-amber-500"
                    valueClassName="text-xl sm:text-2xl md:text-3xl xl:text-[2rem]"
                />
                <SupplyStatCard label="Stock Critico" value={loading ? "--" : stockCritico} icon={AlertTriangle} headerClass="bg-emerald-600" />
            </section>

            <SuppliesToolbar
                total={filteredSupplies.length}
                search={search}
                filterStatus={filterStatus}
                onSearchChange={setSearch}
                onFilterChange={setFilterStatus}
                onClearFilters={() => {
                    setSearch("");
                    setFilterStatus("todos");
                }}
            />

            <SuppliesMobileList
                supplies={filteredSupplies}
                loading={loading}
                totalSupplies={supplies.length}
                filterStatusLabel={FILTER_LABEL[filterStatus]}
                onArchive={setArchiveId}
            />

            <SuppliesDesktopTable
                supplies={filteredSupplies}
                loading={loading}
                totalSupplies={supplies.length}
                onArchive={setArchiveId}
            />

            <div
                aria-hidden
                className="rounded-[1.75rem] bg-white/55 md:hidden"
                style={{ minHeight: "calc(var(--admin-mobile-nav-height) - 0.5rem)" }}
            />

            <CategoryDrawer open={showCategories} onClose={() => setShowCategories(false)} />

            <AlertDialog open={!!archiveId} onOpenChange={() => setArchiveId(null)}>
                <AlertDialogContent className="rounded-2xl border-zinc-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Archivar insumo</AlertDialogTitle>
                        <AlertDialogDescription>
                            El insumo dejara de aparecer en las listas activas, pero mantendra su historial.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleArchive} className="bg-rose-600 hover:bg-rose-700">
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
