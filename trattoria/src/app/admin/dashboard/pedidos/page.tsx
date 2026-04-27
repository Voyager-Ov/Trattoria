"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, CheckCircle2, CreditCard, RefreshCw, XCircle } from "lucide-react";
import { EstadoPedido } from "@prisma/client";
import { toast } from "sonner";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { getConfigs } from "@/app/actions/configActions";
import { getCurrentCashbox } from "@/app/actions/cashboxActions";
import { DEFAULT_PAYMENT_METHODS } from "@/lib/configDefaults";
import { CashboxBlockedDialog } from "@/components/dashboard/cashbox/CashboxBlockedDialog";

import { updateOrderStatus, toggleOrderPayment } from "./actions";
import { PedidosDesktopTable } from "./components/PedidosDesktopTable";
import { PedidosHero } from "./components/PedidosHero";
import { PedidosKpiStrip } from "./components/PedidosKpiStrip";
import { PedidosMobileList } from "./components/PedidosMobileList";
import { PedidosToolbar } from "./components/PedidosToolbar";
import type { OrderListItem, SortDirection, SortField } from "./components/pedido-shared";

type PaymentMethodOption = {
    id: string;
    label: string;
    enabled: boolean;
};

export default function PedidosPage() {
    const router = useRouter();

    const [orders, setOrders] = useState<OrderListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"TODOS" | EstadoPedido>("TODOS");
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [orderBy, setOrderBy] = useState<SortField>("recibidoEn");
    const [orderDir, setOrderDir] = useState<SortDirection>("desc");

    const [isCancelSheetOpen, setIsCancelSheetOpen] = useState(false);
    const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
    const [cancelMotive, setCancelMotive] = useState("");
    const [cancelDeductStock, setCancelDeductStock] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
    const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
    const [isSavingPayment, setIsSavingPayment] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);
    const [hasOpenCashbox, setHasOpenCashbox] = useState(false);
    const [isCashboxGateOpen, setIsCashboxGateOpen] = useState(false);

    const fetchOrders = useCallback(
        async (silent = false) => {
            if (!silent) {
                setIsLoading(true);
            }

            try {
                const queryParams = new URLSearchParams({
                    status: statusFilter,
                    search: debouncedSearchQuery,
                    page: page.toString(),
                    limit: limit.toString(),
                    orderBy,
                    orderDir,
                });

                const response = await fetch(`/api/admin/dashboard/pedidos?${queryParams}`);
                const data = await response.json();

                if (data.orders) {
                    setOrders(data.orders);
                    setTotalPages(data.totalPages);
                    setTotal(data.total);
                }
            } catch {
                toast.error("Error al cargar pedidos");
            } finally {
                if (!silent) {
                    setIsLoading(false);
                }
            }
        },
        [statusFilter, debouncedSearchQuery, page, limit, orderBy, orderDir]
    );

    const syncCashboxState = useCallback(async () => {
        const response = await getCurrentCashbox();
        if (response.success && response.data) {
            const currentCashbox = (response.data as { currentCashbox?: unknown | null }).currentCashbox;
            setHasOpenCashbox(Boolean(currentCashbox));
            return;
        }

        setHasOpenCashbox(false);
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery.trim());
        }, 350);

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    useEffect(() => {
        const loadConfigs = async () => {
            const response = await getConfigs(["payments.methods"]);
            let methods = DEFAULT_PAYMENT_METHODS as PaymentMethodOption[];

            if (response.success && response.data?.["payments.methods"]) {
                const dbMethods = response.data["payments.methods"] as PaymentMethodOption[];
                if (dbMethods.length > 0) {
                    methods = dbMethods;
                }
            }

            const activeMethods = methods.filter((method) => method.enabled);
            setPaymentMethods(activeMethods);

            if (activeMethods.length > 0) {
                const defaultMethod = activeMethods.find((method) => method.id === "EFECTIVO")?.id ?? activeMethods[0].id;
                setPaymentMethod(defaultMethod);
            }
        };

        loadConfigs();
        void syncCashboxState();
    }, [syncCashboxState]);

    useEffect(() => {
        void fetchOrders();

        const interval = setInterval(() => void fetchOrders(true), 30000);
        const handleWindowFocus = () => void fetchOrders(true);
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                void fetchOrders(true);
            }
        };

        window.addEventListener("focus", handleWindowFocus);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            clearInterval(interval);
            window.removeEventListener("focus", handleWindowFocus);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [fetchOrders]);

    const metrics = useMemo(
        () => ({
            received: orders.filter((order) => order.estado === "RECIBIDO").length,
            pending: orders.filter((order) => order.estado === "PENDIENTE").length,
            preparing: orders.filter((order) => order.estado === "EN_PREPARACION").length,
            ready: orders.filter((order) => order.estado === "LISTO").length,
        }),
        [orders]
    );

    const resolveDefaultPaymentMethod = useCallback(() => {
        return paymentMethods.find((method) => method.id === "EFECTIVO")?.id ?? paymentMethods[0]?.id ?? "EFECTIVO";
    }, [paymentMethods]);

    const handleStatusUpdate = async (id: string, newStatus: EstadoPedido) => {
        if (newStatus === "CANCELADO") {
            setCancellingOrderId(id);
            setCancelMotive("");
            setCancelDeductStock(false);
            setIsCancelSheetOpen(true);
            return;
        }

        const result = await updateOrderStatus(id, newStatus);
        if (result.success) {
            toast.success("Estado actualizado");
            void fetchOrders(true);
        } else {
            toast.error(result.error || "Error al actualizar");
        }
    };

    const handleConfirmCancel = async () => {
        if (!cancellingOrderId || !cancelMotive.trim()) {
            toast.error("Debes ingresar un motivo");
            return;
        }

        setIsCancelling(true);
        const result = await updateOrderStatus(cancellingOrderId, "CANCELADO", cancelMotive, cancelDeductStock);

        if (result.success) {
            toast.success("Pedido cancelado");
            setIsCancelSheetOpen(false);
            void fetchOrders();
        } else {
            toast.error(result.error || "Error al cancelar");
        }

        setIsCancelling(false);
    };

    const handleTogglePayment = async (id: string, currentIsPaid: boolean) => {
        if (!currentIsPaid) {
            if (!hasOpenCashbox) {
                setIsCashboxGateOpen(true);
                return;
            }

            setPaymentOrderId(id);
            setPaymentMethod(resolveDefaultPaymentMethod());
            setIsPaymentSheetOpen(true);
            return;
        }

        toast.info("El cobro ya fue registrado. Para anularlo debes cancelar el pedido.");
    };

    const handleConfirmPayment = async () => {
        if (!paymentOrderId) {
            return;
        }

        setIsSavingPayment(true);
        const result = await toggleOrderPayment(paymentOrderId, true, paymentMethod);

        if (result.success) {
            toast.success("Pedido cobrado");
            setIsPaymentSheetOpen(false);
            void syncCashboxState();
            void fetchOrders();
        } else {
            if (result.error?.toLowerCase().includes("abrir una caja")) {
                setIsPaymentSheetOpen(false);
                setIsCashboxGateOpen(true);
            }
            toast.error(result.error || "Error al registrar pago");
        }

        setIsSavingPayment(false);
    };

    const handleSort = (field: SortField) => {
        setPage(1);
        if (orderBy === field) {
            setOrderDir(orderDir === "asc" ? "desc" : "asc");
            return;
        }

        setOrderBy(field);
        setOrderDir("desc");
    };

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setPage(1);
    };

    const handleStatusFilterChange = (value: "TODOS" | EstadoPedido) => {
        setStatusFilter(value);
        setPage(1);
    };

    const handleSortFieldChange = (value: SortField) => {
        setOrderBy(value);
        setPage(1);
    };

    const handleSortDirectionChange = (value: SortDirection) => {
        setOrderDir(value);
        setPage(1);
    };

    const handleClearFilters = () => {
        setSearchQuery("");
        setStatusFilter("TODOS");
        setOrderBy("recibidoEn");
        setOrderDir("desc");
        setPage(1);
    };

    const handleViewOrder = (orderId: string) => {
        router.push(`/admin/dashboard/pedidos/${orderId}`);
    };

    return (
        <div className="app-page-safe-bottom flex min-h-screen flex-col">
            <div className="space-y-4 px-4 pb-2 pt-4 sm:px-6 md:px-8 md:pb-4 md:pt-8">
                <PedidosHero
                    isLoading={isLoading}
                    onRefresh={() => void fetchOrders()}
                    onCreate={() => router.push("/admin/dashboard/pedidos/nuevo")}
                />
                <PedidosKpiStrip metrics={metrics} />
                <PedidosToolbar
                    total={total}
                    searchQuery={searchQuery}
                    statusFilter={statusFilter}
                    orderBy={orderBy}
                    orderDir={orderDir}
                    onSearchChange={handleSearchChange}
                    onStatusFilterChange={handleStatusFilterChange}
                    onSortFieldChange={handleSortFieldChange}
                    onSortDirectionChange={handleSortDirectionChange}
                    onClearFilters={handleClearFilters}
                />
            </div>

            <div className="flex-1 px-4 pb-6 pt-4 sm:px-6 md:px-8 md:pb-12 md:pt-6">
                <PedidosMobileList
                    orders={orders}
                    isLoading={isLoading}
                    total={total}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    onOpenOrder={handleViewOrder}
                    onClearFilters={handleClearFilters}
                />

                <PedidosDesktopTable
                    orders={orders}
                    isLoading={isLoading}
                    limit={limit}
                    total={total}
                    totalPages={totalPages}
                    page={page}
                    orderBy={orderBy}
                    orderDir={orderDir}
                    onSort={handleSort}
                    onPageChange={setPage}
                    onViewOrder={handleViewOrder}
                    onTogglePayment={handleTogglePayment}
                    onStatusChange={handleStatusUpdate}
                    onClearFilters={handleClearFilters}
                />
            </div>

            <div
                aria-hidden
                className="mx-4 mb-[calc(var(--admin-mobile-nav-offset)-1rem)] rounded-[1.75rem] bg-white/55 sm:mx-6 md:hidden"
                style={{ minHeight: "calc(var(--admin-mobile-nav-height) - 0.5rem)" }}
            />

            <Sheet open={isCancelSheetOpen} onOpenChange={setIsCancelSheetOpen}>
                <SheetContent className="sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle className="text-2xl font-black uppercase tracking-tight text-red-600">Cancelar Pedido</SheetTitle>
                        <SheetDescription className="font-medium">
                            Por favor ingresa el motivo de la cancelacion. Esta accion es definitiva.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-6 py-6">
                        <div className="space-y-2">
                            <Label htmlFor="motive" className="block text-left text-xs font-bold uppercase tracking-wider text-zinc-400">
                                Motivo de Cancelacion
                            </Label>
                            <Textarea
                                id="motive"
                                placeholder="Ej: Error en el pedido, Cliente cancelo, Sin stock..."
                                className="min-h-[120px] rounded-2xl border-zinc-200 focus:ring-red-500"
                                value={cancelMotive}
                                onChange={(event) => setCancelMotive(event.target.value)}
                            />
                        </div>
                        <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-bold text-zinc-700">Descontar insumos (Merma)</Label>
                                <p className="text-xs text-zinc-500">Registrar como perdida en el inventario</p>
                            </div>
                            <Switch checked={cancelDeductStock} onCheckedChange={setCancelDeductStock} />
                        </div>
                    </div>
                    <SheetFooter className="flex-col gap-2 sm:flex-col">
                        <Button
                            onClick={handleConfirmCancel}
                            disabled={isCancelling || !cancelMotive.trim()}
                            className="h-12 w-full rounded-2xl bg-red-600 font-black uppercase tracking-wider text-white shadow-lg shadow-red-100 hover:bg-red-700"
                        >
                            {isCancelling ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                            Confirmar Cancelacion
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setIsCancelSheetOpen(false)}
                            className="h-12 w-full rounded-2xl font-bold text-zinc-400"
                        >
                            Volver
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <Sheet open={isPaymentSheetOpen} onOpenChange={setIsPaymentSheetOpen}>
                <SheetContent className="overflow-hidden rounded-l-[2rem] border-none p-0 shadow-2xl sm:max-w-md">
                    <div className="absolute left-0 top-0 h-1.5 w-full bg-emerald-500" />

                    <div className="p-8">
                        <SheetHeader className="mb-8">
                            <div className="mb-2 flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm">
                                    <Banknote size={24} />
                                </div>
                                <SheetTitle className="text-3xl font-black uppercase tracking-tighter text-zinc-900">Cobrar Pedido</SheetTitle>
                            </div>
                            <SheetDescription className="font-medium text-zinc-500">
                                Selecciona el metodo de pago utilizado para este pedido.
                            </SheetDescription>
                        </SheetHeader>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label className="ml-1 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    Metodo de Pago
                                </Label>

                                {paymentMethods.length > 0 ? (
                                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-1 gap-3">
                                        {paymentMethods.map((method) => (
                                            <div
                                                key={method.id}
                                                onClick={() => setPaymentMethod(method.id)}
                                                className={cn(
                                                    "group relative flex cursor-pointer items-center justify-between rounded-[1.5rem] border-2 p-5 transition-all duration-300",
                                                    paymentMethod === method.id
                                                        ? "scale-[1.02] border-emerald-500 bg-emerald-50/50 shadow-lg shadow-emerald-500/10"
                                                        : "border-zinc-100 bg-white hover:border-zinc-200"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={cn(
                                                            "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-300",
                                                            paymentMethod === method.id
                                                                ? "border-emerald-500 bg-white"
                                                                : "border-zinc-200 group-hover:border-zinc-300"
                                                        )}
                                                    >
                                                        {paymentMethod === method.id && <div className="h-3 w-3 animate-in zoom-in rounded-full bg-emerald-500 duration-300" />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span
                                                            className={cn(
                                                                "text-sm font-black uppercase tracking-tight transition-colors",
                                                                paymentMethod === method.id ? "text-emerald-900" : "text-zinc-600"
                                                            )}
                                                        >
                                                            {method.label}
                                                        </span>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Pago Instantaneo</span>
                                                    </div>
                                                </div>

                                                <div
                                                    className={cn(
                                                        "rounded-xl p-2 transition-all duration-300",
                                                        paymentMethod === method.id ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "bg-zinc-50 text-zinc-300"
                                                    )}
                                                >
                                                    <CreditCard size={16} />
                                                </div>

                                                <RadioGroupItem value={method.id} id={`modal-${method.id}`} className="sr-only" />
                                            </div>
                                        ))}
                                    </RadioGroup>
                                ) : (
                                    <div className="rounded-3xl border-2 border-dashed border-zinc-100 bg-zinc-50 p-8 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">No hay metodos configurados</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-12 space-y-3">
                            <Button
                                onClick={handleConfirmPayment}
                                disabled={isSavingPayment || paymentMethods.length === 0}
                                className="h-14 w-full rounded-[1.25rem] bg-zinc-900 font-black uppercase tracking-[0.1em] text-white shadow-xl shadow-zinc-200 transition-all active:scale-[0.98] hover:bg-zinc-800 disabled:opacity-50"
                            >
                                {isSavingPayment ? (
                                    <RefreshCw className="h-5 w-5 animate-spin" />
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <CheckCircle2 size={20} />
                                        Confirmar Cobro
                                    </div>
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setIsPaymentSheetOpen(false)}
                                className="h-12 w-full rounded-[1.25rem] font-black uppercase tracking-widest text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-600"
                            >
                                Volver Atras
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            <CashboxBlockedDialog
                open={isCashboxGateOpen}
                onOpenChange={setIsCashboxGateOpen}
                description="Este pedido todavia no puede cobrarse porque no tienes una caja abierta. Abre caja y vuelve a intentarlo."
            />
        </div>
    );
}
