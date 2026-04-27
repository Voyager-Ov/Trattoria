"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, startOfDay, startOfMonth, subDays } from "date-fns";
import { es } from "date-fns/locale";
import {
    Calendar,
    ChevronDown,
    DollarSign,
    FileText,
    Loader2,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    ShoppingCart,
    Trash2,
    TrendingDown,
    Users,
    Zap,
} from "lucide-react";
import { toast } from "sonner";

import { deleteEgreso, getEgresos, getEgresoStats } from "@/app/actions/egresoActions";
import { CreateEgresoDrawer } from "@/components/dashboard/reportes/CreateEgresoDrawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ResponsivePanel } from "@/components/ui/responsive-panel";
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

import { ReportSurface } from "../reportes-ui";

interface Egreso {
    id: string;
    numero: string;
    cajaId?: string | null;
    fecha: Date | string;
    descripcion: string;
    monto: number;
    categoria: string;
    proveedor?: string | null;
    metodoPago?: string | null;
    estadoPago?: string | null;
    centroCosto?: string | null;
    tipoComprobante?: string | null;
    numeroComprobante?: string | null;
    comprobante?: string | null;
    fechaDevengado?: Date | string | null;
    fechaPago?: Date | string | null;
    fechaVencimiento?: Date | string | null;
    periodoDesde?: Date | string | null;
    periodoHasta?: Date | string | null;
    neto?: number | null;
    impuestos?: number | null;
    percepciones?: number | null;
}

interface MetricCardProps {
    title: string;
    value: string;
    subValue?: string;
    headerColor: string;
    icon: React.ComponentType<{ className?: string }>;
}

type RangePreset = "today" | "week" | "month" | "all";

function MetricCard({ title, value, subValue, headerColor, icon: Icon }: MetricCardProps) {
    return (
        <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm md:rounded-[2rem]">
            <div className={`flex items-center justify-between px-4 py-3 text-sm font-semibold text-white md:px-5 ${headerColor}`}>
                {title}
                <Icon className="h-5 w-5 text-white/80" />
            </div>
            <div className="p-4 md:p-6">
                <span className="break-words text-2xl font-black tracking-tight text-zinc-900 md:text-3xl">{value}</span>
                {subValue ? <span className="mt-1 block text-sm text-zinc-500">{subValue}</span> : null}
            </div>
        </div>
    );
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatDate(dateStr: Date | string) {
    return format(new Date(dateStr), "dd MMM yyyy", { locale: es });
}

function getCategoryBadgeColor(categoria: string) {
    switch (categoria) {
        case "INSUMOS":
            return "bg-blue-50 text-blue-600";
        case "SERVICIOS":
            return "bg-amber-50 text-amber-600";
        case "NOMINA":
            return "bg-violet-50 text-violet-600";
        case "MANTENIMIENTO":
            return "bg-emerald-50 text-emerald-600";
        default:
            return "bg-zinc-50 text-zinc-600";
    }
}

export default function EgresosPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [egresos, setEgresos] = useState<Egreso[]>([]);
    const [stats, setStats] = useState({ total: 0, porCategoria: {} as Record<string, number>, count: 0 });
    const [dateRange, setDateRange] = useState<RangePreset>("month");
    const [searchQuery, setSearchQuery] = useState("");
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingEgreso, setEditingEgreso] = useState<Egreso | undefined>();
    const [selectedEgreso, setSelectedEgreso] = useState<Egreso | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const getFilters = useCallback(() => {
        const now = new Date();
        let fechaInicio: Date | undefined;

        switch (dateRange) {
            case "today":
                fechaInicio = startOfDay(now);
                break;
            case "week":
                fechaInicio = subDays(now, 7);
                break;
            case "month":
                fechaInicio = startOfMonth(now);
                break;
            default:
                fechaInicio = undefined;
        }

        return { fechaInicio };
    }, [dateRange]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);

        try {
            const filters = getFilters();
            const [resEgresos, resStats] = await Promise.all([getEgresos(filters), getEgresoStats(filters)]);

            if (resEgresos.success && resEgresos.data) {
                setEgresos(resEgresos.data as Egreso[]);
            } else {
                setEgresos([]);
            }

            if (resStats.success && resStats.data) {
                setStats(resStats.data);
            } else {
                setStats({ total: 0, porCategoria: {}, count: 0 });
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Error al cargar los datos");
            setEgresos([]);
            setStats({ total: 0, porCategoria: {}, count: 0 });
        } finally {
            setIsLoading(false);
        }
    }, [getFilters]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    const handleEdit = (egreso: Egreso) => {
        setEditingEgreso(egreso);
        setSelectedEgreso(null);
        setIsDrawerOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingId) {
            return;
        }

        try {
            const res = await deleteEgreso(deletingId);
            if (res.success) {
                toast.success("Gasto eliminado");
                setSelectedEgreso((current) => (current?.id === deletingId ? null : current));
                void fetchData();
            } else {
                toast.error(res.error || "No se pudo eliminar");
            }
        } catch (error) {
            console.error("Error deleting egreso:", error);
            toast.error("Error al eliminar");
        } finally {
            setDeletingId(null);
        }
    };

    const filteredEgresos = useMemo(() => {
        const term = searchQuery.toLowerCase();
        return egresos.filter(
            (egreso) =>
                egreso.numero.toLowerCase().includes(term) ||
                egreso.descripcion?.toLowerCase().includes(term) ||
                egreso.proveedor?.toLowerCase().includes(term) ||
                egreso.categoria?.toLowerCase().includes(term)
        );
    }, [egresos, searchQuery]);

    const currentRangeLabel =
        dateRange === "today" ? "Hoy" : dateRange === "week" ? "Ultimos 7 dias" : dateRange === "month" ? "Ultimos 30 dias" : "Historico completo";

    return (
        <div className="app-page-safe-bottom animate-in space-y-5 fade-in pb-6 duration-500 md:space-y-8 md:pb-10">
            <section className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="mb-1 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                                <TrendingDown className="h-5 w-5" />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">Reporte de egresos</h2>
                        </div>
                        <p className="text-sm font-medium text-zinc-500 md:text-base">Seguimiento de gastos y pagos realizados.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:flex md:items-center">
                        <Button
                            onClick={() => {
                                setEditingEgreso(undefined);
                                setIsDrawerOpen(true);
                            }}
                            className="h-11 rounded-2xl bg-red-600 px-5 font-semibold text-white shadow-lg shadow-red-100 transition-all hover:bg-red-700 md:rounded-full"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo gasto
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-11 w-full justify-between rounded-2xl border-zinc-200 bg-white px-4 font-medium text-zinc-600 shadow-sm md:w-auto md:rounded-full md:px-5"
                                >
                                    <span className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-zinc-400" />
                                        {currentRangeLabel}
                                    </span>
                                    <ChevronDown className="h-3 w-3 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl border-zinc-100 p-2 shadow-xl">
                                <DropdownMenuItem className="my-0.5 rounded-xl" onClick={() => setDateRange("today")}>Hoy</DropdownMenuItem>
                                <DropdownMenuItem className="my-0.5 rounded-xl" onClick={() => setDateRange("week")}>Ultimos 7 dias</DropdownMenuItem>
                                <DropdownMenuItem className="my-0.5 rounded-xl" onClick={() => setDateRange("month")}>Ultimos 30 dias</DropdownMenuItem>
                                <DropdownMenuItem className="my-0.5 rounded-xl" onClick={() => setDateRange("all")}>Historico completo</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
                <MetricCard
                    title="Egresos totales"
                    value={isLoading ? "..." : formatCurrency(stats.total)}
                    subValue={isLoading ? undefined : `${stats.count} gastos registrados`}
                    headerColor="bg-red-600"
                    icon={DollarSign}
                />
                <MetricCard
                    title="Insumos"
                    value={isLoading ? "..." : formatCurrency(stats.porCategoria.INSUMOS || 0)}
                    headerColor="bg-blue-600"
                    icon={ShoppingCart}
                />
                <MetricCard
                    title="Servicios"
                    value={isLoading ? "..." : formatCurrency(stats.porCategoria.SERVICIOS || 0)}
                    headerColor="bg-amber-500"
                    icon={Zap}
                />
                <MetricCard
                    title="Nomina"
                    value={isLoading ? "..." : formatCurrency(stats.porCategoria.NOMINA || 0)}
                    headerColor="bg-violet-500"
                    icon={Users}
                />
            </div>

            <ReportSurface title="Gastos recientes" description="Listado filtrable de egresos registrados.">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <Input
                            placeholder="Buscar gasto, proveedor o categoria..."
                            className="h-12 rounded-[2rem] border-zinc-200 bg-white pl-11 text-sm shadow-sm"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                        />
                    </div>
                    <p className="text-sm font-medium text-zinc-400">{filteredEgresos.length} registros</p>
                </div>

                <div className="space-y-3 md:hidden">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="animate-pulse rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm">
                                <div className="h-4 w-24 rounded bg-zinc-100" />
                                <div className="mt-3 h-20 rounded-2xl bg-zinc-50" />
                            </div>
                        ))
                    ) : filteredEgresos.length === 0 ? (
                        <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-12 text-center">
                            <p className="text-sm font-semibold text-zinc-500">No se encontraron egresos</p>
                        </div>
                    ) : (
                        filteredEgresos.map((egreso) => (
                            <button
                                key={egreso.id}
                                type="button"
                                onClick={() => setSelectedEgreso(egreso)}
                                className="w-full rounded-[1.75rem] border border-zinc-200 bg-white p-4 text-left shadow-sm transition-colors hover:bg-zinc-50"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-base font-black tracking-tight text-zinc-900">{egreso.numero}</p>
                                        <p className="line-clamp-2 text-sm text-zinc-500">{egreso.descripcion}</p>
                                    </div>
                                    <p className="shrink-0 text-base font-black text-red-600">-{formatCurrency(egreso.monto)}</p>
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Fecha</p>
                                        <p className="mt-1 text-zinc-700">{formatDate(egreso.fecha)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Proveedor</p>
                                        <p className="mt-1 truncate text-zinc-700">{egreso.proveedor || "Sin proveedor"}</p>
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="secondary" className={`border-none ${getCategoryBadgeColor(egreso.categoria)}`}>
                                            {egreso.categoria}
                                        </Badge>
                                        {egreso.cajaId ? (
                                            <Badge variant="outline" className="border-zinc-200 bg-white text-zinc-600">
                                                Caja del turno
                                            </Badge>
                                        ) : null}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                <div className="hidden overflow-hidden rounded-[1.75rem] border border-zinc-200 md:block">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-zinc-100 bg-zinc-50/50">
                                <tr>
                                    <th className="px-6 py-5 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500">Numero</th>
                                    <th className="px-6 py-5 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500">Fecha</th>
                                    <th className="px-6 py-5 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500">Descripcion</th>
                                    <th className="px-6 py-5 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500">Categoria</th>
                                    <th className="px-6 py-5 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500">Proveedor</th>
                                    <th className="px-6 py-5 text-right text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500">Monto</th>
                                    <th className="px-6 py-5" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 bg-white">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
                                                <span className="text-sm font-medium text-zinc-400">Cargando datos...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredEgresos.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50">
                                                    <FileText className="h-8 w-8 text-zinc-300" />
                                                </div>
                                                <p className="font-medium text-zinc-500">No se encontraron egresos</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEgresos.map((egreso) => (
                                        <tr key={egreso.id} className="border-b border-zinc-100 transition-all duration-150 hover:bg-zinc-50/50">
                                            <td className="px-6 py-4 text-sm font-bold text-zinc-900">{egreso.numero}</td>
                                            <td className="whitespace-nowrap px-6 py-4 text-xs font-medium capitalize text-zinc-500">{formatDate(egreso.fecha)}</td>
                                            <td className="px-6 py-4">
                                                <span className="line-clamp-1 text-sm font-semibold text-zinc-700" title={egreso.descripcion}>
                                                    {egreso.descripcion}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    <Badge variant="secondary" className={`border-none text-[0.65rem] font-bold ${getCategoryBadgeColor(egreso.categoria)}`}>
                                                        {egreso.categoria}
                                                    </Badge>
                                                    {egreso.cajaId ? (
                                                        <Badge variant="outline" className="border-zinc-200 bg-white text-[0.65rem] font-bold text-zinc-600">
                                                            Caja
                                                        </Badge>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-500">{egreso.proveedor || "-"}</td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-red-600">-{formatCurrency(egreso.monto)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 rounded-full p-0 hover:bg-zinc-100">
                                                            <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-xl border-zinc-100 p-1 shadow-lg">
                                                        <DropdownMenuItem onClick={() => handleEdit(egreso)} className="cursor-pointer rounded-lg text-sm font-medium focus:bg-zinc-50">
                                                            <Pencil className="mr-2 h-4 w-4 text-zinc-400" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => setDeletingId(egreso.id)}
                                                            className="cursor-pointer rounded-lg text-sm font-medium text-red-600 focus:bg-red-50 focus:text-red-700"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
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
            </ReportSurface>

            <ResponsivePanel
                open={selectedEgreso != null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedEgreso(null);
                    }
                }}
                title={selectedEgreso?.numero || "Detalle de egreso"}
                description="Resumen completo del gasto seleccionado."
                mobileSide="bottom"
                desktopMode="sheet"
                contentClassName="sm:max-w-lg"
            >
                {selectedEgreso ? (
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-[1.25rem] bg-zinc-50 p-4">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Monto</p>
                                <p className="mt-1 text-lg font-black text-red-600">-{formatCurrency(selectedEgreso.monto)}</p>
                            </div>
                            <div className="rounded-[1.25rem] bg-zinc-50 p-4">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Categoria</p>
                                <p className="mt-1 text-lg font-black text-zinc-900">{selectedEgreso.categoria}</p>
                            </div>
                        </div>

                        <div className="space-y-3 rounded-[1.4rem] border border-zinc-200 bg-white p-4">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Fecha</p>
                                <p className="mt-1 font-semibold text-zinc-800">{formatDate(selectedEgreso.fecha)}</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Descripcion</p>
                                <p className="mt-1 font-semibold text-zinc-800">{selectedEgreso.descripcion}</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Proveedor</p>
                                <p className="mt-1 font-semibold text-zinc-800">{selectedEgreso.proveedor || "Sin proveedor"}</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Origen operativo</p>
                                <p className="mt-1 font-semibold text-zinc-800">
                                    {selectedEgreso.cajaId ? "Caja del turno" : "Registro administrativo"}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Estado</p>
                                    <p className="mt-1 font-semibold text-zinc-800">{selectedEgreso.estadoPago || "PAGADO"}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Metodo</p>
                                    <p className="mt-1 font-semibold text-zinc-800">{selectedEgreso.metodoPago || "EFECTIVO"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Button
                                type="button"
                                onClick={() => handleEdit(selectedEgreso)}
                                className="h-11 rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800"
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar gasto
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDeletingId(selectedEgreso.id)}
                                className="h-11 rounded-2xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </Button>
                        </div>
                    </div>
                ) : null}
            </ResponsivePanel>

            <CreateEgresoDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} onSuccess={fetchData} editingEgreso={editingEgreso} />

            <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogContent className="rounded-3xl border-zinc-100">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar eliminacion</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta accion marcara el gasto como eliminado y no aparecera en los reportes activos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-red-600 text-white hover:bg-red-700">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div aria-hidden className="rounded-[1.75rem] bg-white/55 md:hidden" style={{ minHeight: "calc(var(--admin-mobile-nav-height) - 0.5rem)" }} />
        </div>
    );
}
