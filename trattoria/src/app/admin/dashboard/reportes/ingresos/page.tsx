"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, Calendar, Download, TrendingUp, DollarSign, CreditCard, Search, ChevronDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getReportsData, FinancialSummary } from "../actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ComingSoonOverlay } from "@/components/ui/coming-soon-overlay";
import { isFeatureEnabled } from "@/lib/features";

// --- Types ---
interface Transaction {
    id: string;
    numero: string;
    recibidoEn: string;
    clienteNombre: string;
    total: number;
    metodoPago: string;
    estado: string;
    items: { cantidad: number }[];
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
export default function IngresosPage() {
    // Feature flag check
    const reportesEnabled = isFeatureEnabled('reportes');
    
    const [isLoading, setIsLoading] = useState(true);
    const [summary, setSummary] = useState<FinancialSummary | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "all">("month");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const now = new Date();
            let startDate: Date | undefined;

            if (dateRange === "today") {
                startDate = new Date(now.setHours(0, 0, 0, 0));
            } else if (dateRange === "week") {
                startDate = new Date(now.setDate(now.getDate() - 7));
            } else if (dateRange === "month") {
                startDate = new Date(now.setDate(now.getDate() - 30));
            }

            const res = await getReportsData(startDate, new Date());

            if (res.success && res.data) {
                setSummary(res.data.summary);
                setTransactions(res.data.recentTransactions as Transaction[]);
            } else {
                toast.error(res.error || "Error al cargar datos");
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Error de conexión");
        } finally {
            setIsLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredTransactions = transactions.filter(t =>
        t.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.clienteNombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.metodoPago?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return format(new Date(dateStr), "dd MMM yyyy, HH:mm", { locale: es });
    };

    // Si la feature está deshabilitada, mostrar overlay
    if (!reportesEnabled) {
        return (
            <ComingSoonOverlay>
                <div className="space-y-8"></div>
            </ComingSoonOverlay>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <TrendingUp size={20} />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Reporte de Ingresos</h2>
                    </div>
                    <p className="text-zinc-500 font-medium">Seguimiento de ventas y transacciones recientes.</p>
                </div>

                <div className="flex items-center gap-3">
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
                            <DropdownMenuItem className="rounded-xl my-0.5" onClick={() => setDateRange("month")}>Últimos 30 días</DropdownMenuItem>
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
                    title="Ingresos Totales"
                    value={isLoading ? "..." : formatCurrency(summary?.totalRevenue || 0)}
                    subValue={isLoading ? "" : `${summary?.totalOrders} órdenes`}
                    headerColor="bg-zinc-900"
                    icon={<DollarSign className="h-5 w-5" />}
                />
                <MetricCard
                    title="Ticket Promedio"
                    value={isLoading ? "..." : formatCurrency(summary?.averageTicket || 0)}
                    headerColor="bg-blue-600"
                    icon={<TrendingUp className="h-5 w-5" />}
                />
                <MetricCard
                    title="Ventas Efectivo"
                    value={isLoading ? "..." : formatCurrency(summary?.ordersByPaymentMethod['EFECTIVO'] || 0)}
                    headerColor="bg-emerald-500"
                    icon={<DollarSign className="h-5 w-5" />}
                />
                <MetricCard
                    title="Ventas Digitales"
                    value={isLoading ? "..." : formatCurrency((summary?.totalRevenue || 0) - (summary?.ordersByPaymentMethod['EFECTIVO'] || 0))}
                    headerColor="bg-violet-500"
                    icon={<CreditCard className="h-5 w-5" />}
                />
            </div>

            {/* Transactions Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-zinc-900">Transacciones Recientes</h3>
                    <div className="relative w-64 md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" />
                        <Input
                            placeholder="Buscar orden, cliente..."
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
                                    <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">Orden</th>
                                    <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">Fecha</th>
                                    <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">Cliente</th>
                                    <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">Estado</th>
                                    <th className="text-left px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">Método Pago</th>
                                    <th className="text-right px-6 py-5 font-semibold text-[0.65rem] uppercase tracking-widest text-zinc-500">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-6 w-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
                                                <span className="text-sm text-zinc-400 font-medium">Cargando datos...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="h-16 w-16 bg-zinc-50 rounded-full flex items-center justify-center">
                                                    <FileText className="h-8 w-8 text-zinc-300" />
                                                </div>
                                                <p className="text-zinc-500 font-medium">No se encontraron transacciones</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map((tx) => (
                                        <tr key={tx.id} className="group border-b border-zinc-100 hover:bg-zinc-50/50 transition-all duration-150">
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-zinc-900 text-sm">{tx.numero}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-xs text-zinc-500 font-medium capitalize">{formatDate(tx.recibidoEn)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-zinc-700 text-sm">{tx.clienteNombre || "Cliente Final"}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    variant="secondary"
                                                    className={`
                                                        border-none font-bold text-[0.6rem] px-2 py-0.5 rounded-full
                                                        ${tx.estado === 'FINALIZADO' ? 'bg-emerald-50 text-emerald-600' :
                                                            tx.estado === 'CANCELADO' ? 'bg-red-50 text-red-600' :
                                                                tx.estado === 'PENDIENTE' ? 'bg-amber-50 text-amber-600' :
                                                                    'bg-blue-50 text-blue-600'}
                                                    `}
                                                >
                                                    {tx.estado}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="border-zinc-200 text-zinc-500 font-medium text-[0.6rem] uppercase tracking-tighter px-2 py-0">
                                                    {tx.metodoPago || "N/A"}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-zinc-900 text-sm">{formatCurrency(tx.total)}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
