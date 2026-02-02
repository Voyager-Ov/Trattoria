"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Calendar,
    Download,
    TrendingDown,
    DollarSign,
    Search,
    ChevronDown,
    FileText,
    ShoppingCart,
    Zap,
    Users,
    Plus,
    MoreHorizontal,
    Pencil,
    Trash2,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";
import { format, startOfDay, subDays, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { getEgresos, getEgresoStats, deleteEgreso } from "@/app/actions/egresoActions";
import { CreateEgresoDrawer } from "@/components/dashboard/reportes/CreateEgresoDrawer";

// --- Types ---
interface Egreso {
    id: string;
    numero: string;
    fecha: Date | string;
    descripcion: string;
    monto: number;
    categoria: string;
    proveedor?: string;
}

interface MetricCardProps {
    title: string;
    value: string | number;
    subValue?: string;
    headerColor: string;
    icon?: React.ReactNode;
}

// --- Components ---
function MetricCard({ title, value, subValue, headerColor, icon }: MetricCardProps) {
    return (
        <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full group hover:shadow-md transition-shadow duration-300">
            <div className={`h-12 ${headerColor} flex items-center px-6 text-white font-medium text-sm`}>
                {title}
                {icon && <div className="ml-auto opacity-80">{icon}</div>}
            </div>
            <div className="p-6 flex flex-col justify-between flex-grow">
                <div className="flex flex-col gap-1">
                    <span className="text-3xl font-bold text-zinc-900 tracking-tight">{value}</span>
                    {subValue && <span className="text-sm text-zinc-500 font-medium">{subValue}</span>}
                </div>
            </div>
        </div>
    );
}

// --- Main Component ---
export default function EgresosPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [egresos, setEgresos] = useState<Egreso[]>([]);
    const [stats, setStats] = useState({ total: 0, porCategoria: {} as Record<string, number>, count: 0 });
    const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "all">("month");
    const [searchQuery, setSearchQuery] = useState("");

    // UI State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingEgreso, setEditingEgreso] = useState<Egreso | undefined>();
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
            const [resEgresos, resStats] = await Promise.all([
                getEgresos(filters),
                getEgresoStats(filters)
            ]);

            if (resEgresos.success && resEgresos.data) {
                setEgresos(resEgresos.data as any);
            }
            if (resStats.success && resStats.data) {
                setStats(resStats.data);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Error al cargar los datos");
        } finally {
            setIsLoading(false);
        }
    }, [getFilters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleEdit = (egreso: Egreso) => {
        setEditingEgreso(egreso);
        setIsDrawerOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingId) return;

        try {
            const res = await deleteEgreso(deletingId);
            if (res.success) {
                toast.success("Gasto eliminado");
                fetchData();
            } else {
                toast.error(res.error || "No se pudo eliminar");
            }
        } catch (error) {
            toast.error("Error al eliminar");
        } finally {
            setDeletingId(null);
        }
    };

    const filteredEgresos = useMemo(() => {
        return egresos.filter(e =>
            e.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.descripcion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.proveedor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.categoria?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [egresos, searchQuery]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount);
    };

    const formatDate = (dateStr: Date | string) => {
        return format(new Date(dateStr), "dd MMM yyyy", { locale: es });
    };

    const getCategoryBadgeColor = (categoria: string) => {
        switch (categoria) {
            case "INSUMOS": return "bg-blue-50 text-blue-600";
            case "SERVICIOS": return "bg-amber-50 text-amber-600";
            case "NOMINA": return "bg-violet-50 text-violet-600";
            case "MANTENIMIENTO": return "bg-emerald-50 text-emerald-600";
            default: return "bg-zinc-50 text-zinc-600";
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                            <TrendingDown size={20} />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Reporte de Egresos</h2>
                    </div>
                    <p className="text-zinc-500 font-medium">Seguimiento de gastos y pagos realizados.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => {
                            setEditingEgreso(undefined);
                            setIsDrawerOpen(true);
                        }}
                        className="h-12 px-8 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold shadow-lg shadow-red-100 transition-all active:scale-95"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Nuevo Gasto
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 rounded-full px-5 border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-medium bg-white">
                                <Calendar className="mr-2 h-4 w-4 text-zinc-400" />
                                {dateRange === "today" ? "Hoy" :
                                    dateRange === "week" ? "Últimos 7 días" :
                                        dateRange === "month" ? "Últimos 30 días" : "Histórico completo"}
                                <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-zinc-100">
                            <DropdownMenuItem className="rounded-xl my-0.5" onClick={() => setDateRange("today")}>Hoy</DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl my-0.5" onClick={() => setDateRange("week")}>Últimos 7 días</DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl my-0.5" onClick={() => setDateRange("month")}>Marzo (Mes actual)</DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl my-0.5" onClick={() => setDateRange("all")}>Histórico completo</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="outline" className="h-10 w-10 p-0 rounded-full border-zinc-200 text-zinc-600 hover:bg-zinc-50 bg-white" title="Exportar">
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Egresos Totales"
                    value={isLoading ? "..." : formatCurrency(stats.total)}
                    subValue={isLoading ? "" : `${stats.count} gastos registrados`}
                    headerColor="bg-red-600"
                    icon={<DollarSign className="h-5 w-5" />}
                />
                <MetricCard
                    title="Insumos"
                    value={isLoading ? "..." : formatCurrency(stats.porCategoria['INSUMOS'] || 0)}
                    headerColor="bg-blue-600"
                    icon={<ShoppingCart className="h-5 w-5" />}
                />
                <MetricCard
                    title="Servicios"
                    value={isLoading ? "..." : formatCurrency(stats.porCategoria['SERVICIOS'] || 0)}
                    headerColor="bg-amber-500"
                    icon={<Zap className="h-5 w-5" />}
                />
                <MetricCard
                    title="Nómina"
                    value={isLoading ? "..." : formatCurrency(stats.porCategoria['NOMINA'] || 0)}
                    headerColor="bg-violet-500"
                    icon={<Users className="h-5 w-5" />}
                />
            </div>

            {/* Egresos Table Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-zinc-900">Gastos Recientes</h3>
                    <div className="relative w-64 md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" />
                        <Input
                            placeholder="Buscar gasto, proveedor..."
                            className="pl-11 h-10 bg-white border-zinc-200 rounded-full focus-visible:ring-zinc-400 transition-all text-sm shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden min-h-[400px]">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-zinc-50/50 border-b border-zinc-100">
                                <tr>
                                    <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">Número</th>
                                    <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">Fecha</th>
                                    <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">Descripción</th>
                                    <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">Categoría</th>
                                    <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">Proveedor</th>
                                    <th className="text-right px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">Monto</th>
                                    <th className="px-6 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="h-6 w-6 text-zinc-300 animate-spin" />
                                                <span className="text-sm text-zinc-400 font-medium">Cargando datos...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredEgresos.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="h-16 w-16 bg-zinc-50 rounded-full flex items-center justify-center">
                                                    <FileText className="h-8 w-8 text-zinc-300" />
                                                </div>
                                                <p className="text-zinc-500 font-medium">No se encontraron egresos</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEgresos.map((egreso) => (
                                        <tr key={egreso.id} className="group border-b border-zinc-100 hover:bg-zinc-50/50 transition-all duration-150">
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-zinc-900 text-sm">{egreso.numero}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-xs text-zinc-500 font-medium capitalize">{formatDate(egreso.fecha)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-zinc-700 text-sm line-clamp-1" title={egreso.descripcion}>
                                                    {egreso.descripcion}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    variant="secondary"
                                                    className={`border-none font-bold text-[0.6rem] px-2 py-0.5 rounded-full ${getCategoryBadgeColor(egreso.categoria)}`}
                                                >
                                                    {egreso.categoria}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-zinc-500">{egreso.proveedor || "—"}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-red-600 text-sm">-{formatCurrency(egreso.monto)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-zinc-100">
                                                            <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-xl border-zinc-100 p-1 shadow-lg">
                                                        <DropdownMenuItem
                                                            onClick={() => handleEdit(egreso)}
                                                            className="rounded-lg text-sm font-medium focus:bg-zinc-50 cursor-pointer"
                                                        >
                                                            <Pencil className="mr-2 h-4 w-4 text-zinc-400" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => setDeletingId(egreso.id)}
                                                            className="rounded-lg text-sm font-medium text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
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
            </div>

            {/* Drawer */}
            <CreateEgresoDrawer
                open={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
                onSuccess={fetchData}
                editingEgreso={editingEgreso}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
                <AlertDialogContent className="rounded-3xl border-zinc-100">
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción marcará el gasto como eliminado y no aparecerá en los reportes activos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
