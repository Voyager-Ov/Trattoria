"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Calendar,
    ChevronDown,
    CreditCard,
    DollarSign,
    FileText,
    ReceiptText,
    Search,
    TrendingUp,
    UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { getReportsData, type FinancialSummary, type ReportBasis } from "../actions";
import { ReportSurface } from "../reportes-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ResponsivePanel } from "@/components/ui/responsive-panel";

interface TransactionItem {
    cantidad: number;
}

interface Transaction {
    id: string;
    numero: string;
    recibidoEn: string;
    fechaReferencia: string;
    clienteNombre: string;
    total: number;
    metodoPago: string;
    estado: string;
    items: TransactionItem[];
}

type RangePreset = "today" | "week" | "month" | "all";

function MetricCard({
    title,
    value,
    subValue,
    icon: Icon,
    accent,
}: {
    title: string;
    value: string;
    subValue?: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
}) {
    return (
        <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm md:rounded-[2rem]">
            <div className={`flex items-center justify-between px-4 py-3 text-sm font-semibold text-white md:px-5 ${accent}`}>
                {title}
                <Icon className="h-5 w-5 text-white/80" />
            </div>
            <div className="px-4 py-5 md:px-6 md:py-6">
                <p className="break-words text-2xl font-black tracking-tight text-zinc-900 md:text-3xl">{value}</p>
                {subValue ? <p className="mt-1 text-sm text-zinc-500">{subValue}</p> : null}
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

function formatDate(dateStr: string) {
    return format(new Date(dateStr), "dd MMM yyyy, HH:mm", { locale: es });
}

export default function IngresosPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [summary, setSummary] = useState<FinancialSummary | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [dateRange, setDateRange] = useState<RangePreset>("month");
    const [basis, setBasis] = useState<ReportBasis>("caja");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);

        try {
            const now = new Date();
            let startDate: Date | undefined;
            let endDate: Date | undefined = new Date();

            if (dateRange === "today") {
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            } else if (dateRange === "week") {
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
            } else if (dateRange === "month") {
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 30);
                startDate.setHours(0, 0, 0, 0);
            } else {
                endDate = undefined;
            }

            const res = await getReportsData({
                startDate,
                endDate,
                basis,
            });
            if (res.success && res.data) {
                setSummary(res.data.summary);
                setTransactions(res.data.recentTransactions as Transaction[]);
            } else {
                toast.error(res.error || "Error al cargar datos");
                setSummary(null);
                setTransactions([]);
            }
        } catch {
            toast.error("Error de conexion");
            setSummary(null);
            setTransactions([]);
        } finally {
            setIsLoading(false);
        }
    }, [basis, dateRange]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    const filteredTransactions = useMemo(
        () =>
            transactions.filter((transaction) => {
                const term = searchQuery.toLowerCase();
                return (
                    transaction.numero.toLowerCase().includes(term) ||
                    transaction.clienteNombre?.toLowerCase().includes(term) ||
                    transaction.metodoPago?.toLowerCase().includes(term) ||
                    transaction.estado?.toLowerCase().includes(term)
                );
            }),
        [searchQuery, transactions]
    );

    const currentRangeLabel =
        dateRange === "today" ? "Hoy" : dateRange === "week" ? "Ultimos 7 dias" : dateRange === "month" ? "Ultimos 30 dias" : "Historico completo";
    const currentBasisLabel = basis === "operativo" ? "Operativo" : basis === "devengado" ? "Devengado" : "Caja";

    return (
        <div className="app-page-safe-bottom space-y-5 pb-6 md:space-y-8 md:pb-10">
            <section className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="mb-1 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">Reporte de ingresos</h2>
                        </div>
                        <p className="text-sm font-medium text-zinc-500 md:text-base">Seguimiento de ventas cobradas y transacciones recientes.</p>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-11 w-full justify-between rounded-2xl border-zinc-200 bg-white px-4 font-medium text-zinc-600 shadow-sm md:w-auto md:rounded-full md:px-5"
                            >
                                <span className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-zinc-400" />
                                    {currentBasisLabel}
                                </span>
                                <ChevronDown className="h-3 w-3 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl border-zinc-100 p-2 shadow-xl">
                            <DropdownMenuItem className="my-0.5 rounded-xl" onClick={() => setBasis("operativo")}>Operativo</DropdownMenuItem>
                            <DropdownMenuItem className="my-0.5 rounded-xl" onClick={() => setBasis("caja")}>Caja</DropdownMenuItem>
                            <DropdownMenuItem className="my-0.5 rounded-xl" onClick={() => setBasis("devengado")}>Devengado</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

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
            </section>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
                <MetricCard
                    title="Ventas netas"
                    value={isLoading ? "..." : formatCurrency(summary?.netSales || 0)}
                    subValue={isLoading ? undefined : `${summary?.totalOrders || 0} ordenes en base ${currentBasisLabel.toLowerCase()}`}
                    accent="bg-zinc-900"
                    icon={DollarSign}
                />
                <MetricCard
                    title="Ventas brutas"
                    value={isLoading ? "..." : formatCurrency(summary?.grossSales || 0)}
                    subValue={isLoading ? undefined : `${formatCurrency(summary?.discounts || 0)} en descuentos`}
                    accent="bg-blue-600"
                    icon={TrendingUp}
                />
                <MetricCard
                    title="Ticket promedio"
                    value={isLoading ? "..." : formatCurrency(summary?.averageTicket || 0)}
                    accent="bg-emerald-500"
                    icon={TrendingUp}
                />
                <MetricCard
                    title="Ventas digitales"
                    value={
                        isLoading
                            ? "..."
                            : formatCurrency(Math.max(0, (summary?.netSales || 0) - (summary?.ordersByPaymentMethod?.EFECTIVO || 0)))
                    }
                    accent="bg-violet-500"
                    icon={CreditCard}
                />
            </div>

            <ReportSurface title="Transacciones recientes" description="Lista filtrable de ingresos cobrados.">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <Input
                            placeholder="Buscar orden, cliente o metodo..."
                            className="h-12 rounded-[2rem] border-zinc-200 bg-white pl-11 text-sm shadow-sm"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                        />
                    </div>
                    <p className="text-sm font-medium text-zinc-400">{filteredTransactions.length} registros</p>
                </div>

                <div className="space-y-3 md:hidden">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="animate-pulse rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm">
                                <div className="h-4 w-24 rounded bg-zinc-100" />
                                <div className="mt-3 h-20 rounded-2xl bg-zinc-50" />
                            </div>
                        ))
                    ) : filteredTransactions.length === 0 ? (
                        <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-12 text-center">
                            <p className="text-sm font-semibold text-zinc-500">No se encontraron transacciones</p>
                        </div>
                    ) : (
                        filteredTransactions.map((transaction) => {
                            const itemCount = transaction.items.reduce((sum, item) => sum + item.cantidad, 0);
                            return (
                                <button
                                    key={transaction.id}
                                    type="button"
                                    onClick={() => setSelectedTransaction(transaction)}
                                    className="w-full rounded-[1.75rem] border border-zinc-200 bg-white p-4 text-left shadow-sm transition-colors hover:bg-zinc-50"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-base font-black tracking-tight text-zinc-900">{transaction.numero}</p>
                                            <p className="truncate text-sm text-zinc-500">{transaction.clienteNombre || "Cliente final"}</p>
                                        </div>
                                        <p className="shrink-0 text-base font-black text-zinc-900">{formatCurrency(transaction.total)}</p>
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Fecha</p>
                                            <p className="mt-1 text-zinc-700">{formatDate(transaction.fechaReferencia)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Metodo</p>
                                            <p className="mt-1 text-zinc-700">{transaction.metodoPago || "N/A"}</p>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <Badge variant="secondary" className="border-none bg-zinc-100 text-zinc-600">
                                            {transaction.estado}
                                        </Badge>
                                        <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-500">
                                            {itemCount} items
                                        </Badge>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                <div className="hidden overflow-hidden rounded-[1.75rem] border border-zinc-200 md:block">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-zinc-100 bg-zinc-50/60">
                                <tr>
                                    <th className="px-6 py-5 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500">Orden</th>
                                    <th className="px-6 py-5 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500">Fecha</th>
                                    <th className="px-6 py-5 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500">Cliente</th>
                                    <th className="px-6 py-5 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500">Estado</th>
                                    <th className="px-6 py-5 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500">Metodo pago</th>
                                    <th className="px-6 py-5 text-right text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 bg-white">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
                                                <span className="text-sm font-medium text-zinc-400">Cargando datos...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50">
                                                    <FileText className="h-8 w-8 text-zinc-300" />
                                                </div>
                                                <p className="font-medium text-zinc-500">No se encontraron transacciones</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map((transaction) => (
                                        <tr
                                            key={transaction.id}
                                            className="cursor-pointer border-b border-zinc-100 transition-all duration-150 hover:bg-zinc-50/50"
                                            onClick={() => setSelectedTransaction(transaction)}
                                        >
                                            <td className="px-6 py-4 text-sm font-bold text-zinc-900">{transaction.numero}</td>
                                            <td className="whitespace-nowrap px-6 py-4 text-xs font-medium capitalize text-zinc-500">{formatDate(transaction.fechaReferencia)}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-zinc-700">{transaction.clienteNombre || "Cliente final"}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant="secondary" className="border-none bg-zinc-100 text-zinc-600">
                                                    {transaction.estado}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="border-zinc-200 text-zinc-500">
                                                    {transaction.metodoPago || "N/A"}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-zinc-900">{formatCurrency(transaction.total)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </ReportSurface>

            <ResponsivePanel
                open={selectedTransaction != null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedTransaction(null);
                    }
                }}
                title={selectedTransaction?.numero || "Detalle de ingreso"}
                description="Resumen completo de la transaccion seleccionada."
                mobileSide="bottom"
                desktopMode="sheet"
                contentClassName="sm:max-w-lg"
            >
                {selectedTransaction ? (
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-[1.25rem] bg-zinc-50 p-4">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Monto</p>
                                <p className="mt-1 text-lg font-black text-zinc-900">{formatCurrency(selectedTransaction.total)}</p>
                            </div>
                            <div className="rounded-[1.25rem] bg-zinc-50 p-4">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Items</p>
                                <p className="mt-1 text-lg font-black text-zinc-900">
                                    {selectedTransaction.items.reduce((sum, item) => sum + item.cantidad, 0)}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 rounded-[1.4rem] border border-zinc-200 bg-white p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                                    <ReceiptText className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Fecha</p>
                                    <p className="mt-1 font-semibold text-zinc-800">{formatDate(selectedTransaction.fechaReferencia)}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600">
                                    <UserRound className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Cliente</p>
                                    <p className="mt-1 font-semibold text-zinc-800">{selectedTransaction.clienteNombre || "Cliente final"}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Estado</p>
                                    <p className="mt-1 font-semibold text-zinc-800">{selectedTransaction.estado}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Metodo</p>
                                    <p className="mt-1 font-semibold text-zinc-800">{selectedTransaction.metodoPago || "N/A"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </ResponsivePanel>

            <div aria-hidden className="rounded-[1.75rem] bg-white/55 md:hidden" style={{ minHeight: "calc(var(--admin-mobile-nav-height) - 0.5rem)" }} />
        </div>
    );
}
