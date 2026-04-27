"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CategoriaEgreso } from "@prisma/client";
import {
    AlertTriangle,
    Banknote,
    CircleDollarSign,
    Landmark,
    Loader2,
    Plus,
    ReceiptText,
    TrendingDown,
    Wallet,
} from "lucide-react";
import { toast } from "sonner";

import {
    closeCashbox,
    getCashboxHistory,
    getCurrentCashbox,
    openCashbox,
    registerCashboxExpense,
} from "@/app/actions/cashboxActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsivePanel } from "@/components/ui/responsive-panel";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type PaymentMethodOption = {
    id: string;
    label: string;
    enabled: boolean;
};

type CashboxMovement = {
    id: string;
    type: "APERTURA" | "COBRO" | "ANULACION_COBRO" | "EGRESO" | "CIERRE";
    happenedAt: string | Date;
    title: string;
    description: string;
    amount: number;
    methodId: string | null;
};

type CashboxSummary = {
    id: string;
    estado: "ABIERTA" | "CERRADA";
    usuarioNombre: string;
    fechaApertura: string | Date;
    fechaCierre: string | Date | null;
    montoInicialSugerido: number;
    montoInicialReal: number;
    efectivoContado: number | null;
    diferenciaEfectivo: number | null;
    observacionesApertura: string | null;
    observacionesCierre: string | null;
    totalCobrado: number;
    totalEgresos: number;
    efectivoEsperado: number;
    methodTotals: Array<{
        methodId: string;
        label: string;
        paymentsAmount: number;
        paymentsCount: number;
        expensesAmount: number;
        netAmount: number;
    }>;
    movements: CashboxMovement[];
};

type CurrentCashboxPayload = {
    currentUser: {
        id: string;
        rol: string;
        displayName: string;
    };
    paymentMethods: PaymentMethodOption[];
    suggestedOpeningAmount: number;
    currentCashbox: CashboxSummary | null;
};

const EXPENSE_CATEGORIES: Array<{ id: CategoriaEgreso; label: string }> = [
    { id: "INSUMOS", label: "Insumos" },
    { id: "SERVICIOS", label: "Servicios" },
    { id: "NOMINA", label: "Nomina" },
    { id: "ALQUILER", label: "Alquiler" },
    { id: "IMPUESTOS", label: "Impuestos" },
    { id: "PUBLICIDAD", label: "Publicidad" },
    { id: "EQUIPAMIENTO", label: "Equipamiento" },
    { id: "MANTENIMIENTO", label: "Mantenimiento" },
    { id: "OTROS", label: "Otros" },
];

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(amount || 0);
}

function formatDateTime(value: string | Date | null) {
    if (!value) {
        return "Sin dato";
    }

    return new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function SummaryMetric({
    title,
    value,
    helper,
    tone,
}: {
    title: string;
    value: string;
    helper?: string;
    tone: string;
}) {
    return (
        <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">{title}</p>
                <span className={cn("h-2.5 w-2.5 rounded-full", tone)} />
            </div>
            <p className="mt-2 text-3xl font-black tracking-tight text-zinc-900">{value}</p>
            {helper ? <p className="mt-1 text-sm text-zinc-500">{helper}</p> : null}
        </div>
    );
}

export function CashboxEmployeePageClient() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cashboxData, setCashboxData] = useState<CurrentCashboxPayload | null>(null);
    const [history, setHistory] = useState<CashboxSummary[]>([]);
    const [openingAmount, setOpeningAmount] = useState("");
    const [openingNotes, setOpeningNotes] = useState("");
    const [expensePanelOpen, setExpensePanelOpen] = useState(false);
    const [closePanelOpen, setClosePanelOpen] = useState(false);
    const [expenseForm, setExpenseForm] = useState({
        descripcion: "",
        monto: "",
        categoria: "OTROS" as CategoriaEgreso,
        metodoPago: "EFECTIVO",
        proveedor: "",
    });
    const [closeForm, setCloseForm] = useState({
        efectivoContado: "",
        observacionesCierre: "",
    });

    const currentCashbox = cashboxData?.currentCashbox ?? null;
    const paymentMethods = useMemo(() => cashboxData?.paymentMethods ?? [], [cashboxData?.paymentMethods]);
    const recentPayments = useMemo(
        () => currentCashbox?.movements.filter((movement) => movement.type === "COBRO").slice(0, 4) ?? [],
        [currentCashbox],
    );
    const recentExpenses = useMemo(
        () => currentCashbox?.movements.filter((movement) => movement.type === "EGRESO").slice(0, 4) ?? [],
        [currentCashbox],
    );
    const recentClosedCashboxes = useMemo(
        () => history.filter((item) => item.estado === "CERRADA").slice(0, 3),
        [history],
    );
    const closeDifference = useMemo(() => {
        if (!currentCashbox) {
            return 0;
        }

        return Number(closeForm.efectivoContado || 0) - currentCashbox.efectivoEsperado;
    }, [closeForm.efectivoContado, currentCashbox]);

    useEffect(() => {
        void loadCashboxData();
    }, []);

    useEffect(() => {
        if (cashboxData?.suggestedOpeningAmount != null && !currentCashbox) {
            setOpeningAmount(cashboxData.suggestedOpeningAmount.toString());
        }
    }, [cashboxData?.suggestedOpeningAmount, currentCashbox]);

    useEffect(() => {
        if (paymentMethods.length > 0) {
            setExpenseForm((current) => ({
                ...current,
                metodoPago: current.metodoPago || paymentMethods[0].id,
            }));
        }
    }, [paymentMethods]);

    async function loadCashboxData() {
        setIsLoading(true);
        try {
            const [currentResult, historyResult] = await Promise.all([getCurrentCashbox(), getCashboxHistory(6)]);

            if (!currentResult.success) {
                toast.error(currentResult.error || "No se pudo cargar la caja");
                setCashboxData(null);
                setHistory([]);
                return;
            }

            setCashboxData(currentResult.data as CurrentCashboxPayload);
            setHistory((historyResult.success ? (historyResult.data as CashboxSummary[]) : []) ?? []);
        } catch (error) {
            console.error("Error loading employee cashbox:", error);
            toast.error("No se pudo cargar la caja");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleOpenCashbox() {
        const amount = Number(openingAmount);
        if (!Number.isFinite(amount) || amount < 0) {
            toast.error("Ingresa un monto inicial valido");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await openCashbox({
                montoInicialReal: amount,
                observacionesApertura: openingNotes,
            });

            if (!result.success) {
                toast.error(result.error || "No se pudo abrir la caja");
                return;
            }

            toast.success("Caja abierta correctamente");
            setOpeningNotes("");
            await loadCashboxData();
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleRegisterExpense() {
        const amount = Number(expenseForm.monto);
        if (!expenseForm.descripcion.trim()) {
            toast.error("La descripcion del egreso es obligatoria");
            return;
        }
        if (!Number.isFinite(amount) || amount <= 0) {
            toast.error("Ingresa un monto valido");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await registerCashboxExpense({
                descripcion: expenseForm.descripcion,
                monto: amount,
                categoria: expenseForm.categoria,
                metodoPago: expenseForm.metodoPago,
                proveedor: expenseForm.proveedor || undefined,
            });

            if (!result.success) {
                toast.error(result.error || "No se pudo registrar el egreso");
                return;
            }

            toast.success("Egreso registrado");
            setExpensePanelOpen(false);
            setExpenseForm({
                descripcion: "",
                monto: "",
                categoria: "OTROS",
                metodoPago: paymentMethods[0]?.id || "EFECTIVO",
                proveedor: "",
            });
            await loadCashboxData();
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleCloseCashbox() {
        const counted = Number(closeForm.efectivoContado);
        if (!Number.isFinite(counted) || counted < 0) {
            toast.error("Ingresa el efectivo contado");
            return;
        }
        if (Math.abs(closeDifference) > 0.009 && !closeForm.observacionesCierre.trim()) {
            toast.error("Debes agregar una observacion si hay diferencia");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await closeCashbox({
                efectivoContado: counted,
                observacionesCierre: closeForm.observacionesCierre,
            });

            if (!result.success) {
                toast.error(result.error || "No se pudo cerrar la caja");
                return;
            }

            toast.success("Caja cerrada correctamente");
            setClosePanelOpen(false);
            setCloseForm({ efectivoContado: "", observacionesCierre: "" });
            await loadCashboxData();
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-sm">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-900">Caja del turno</h1>
                    </div>
                    <p className="text-sm font-medium text-zinc-500">
                        Apertura, cobro operativo, egresos básicos y cierre de caja del empleado.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button asChild variant="outline" className="h-11 rounded-full border-zinc-200 bg-white px-5 font-medium text-zinc-600">
                        <Link href="/empleado/pedidos">Volver a pedidos</Link>
                    </Button>
                    {currentCashbox ? (
                        <>
                            <Button
                                type="button"
                                onClick={() => setExpensePanelOpen(true)}
                                className="h-11 rounded-full bg-zinc-900 px-5 font-semibold text-white hover:bg-zinc-800"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Registrar egreso
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    setCloseForm({
                                        efectivoContado: currentCashbox.efectivoEsperado.toFixed(0),
                                        observacionesCierre: "",
                                    });
                                    setClosePanelOpen(true);
                                }}
                                className="h-11 rounded-full bg-red-600 px-5 font-semibold text-white shadow-lg shadow-red-100 hover:bg-red-700"
                            >
                                Cerrar caja
                            </Button>
                        </>
                    ) : null}
                </div>
            </div>

            {isLoading ? (
                <div className="flex min-h-[18rem] items-center justify-center rounded-[2rem] border border-zinc-200 bg-white">
                    <div className="flex flex-col items-center gap-3 text-zinc-500">
                        <Loader2 className="h-7 w-7 animate-spin" />
                        <p className="text-sm font-medium">Cargando estado de caja...</p>
                    </div>
                </div>
            ) : currentCashbox ? (
                <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryMetric title="Caja abierta" value={currentCashbox.usuarioNombre} helper={formatDateTime(currentCashbox.fechaApertura)} tone="bg-emerald-500" />
                        <SummaryMetric title="Inicial" value={formatCurrency(currentCashbox.montoInicialReal)} helper={`Sugerido ${formatCurrency(currentCashbox.montoInicialSugerido)}`} tone="bg-blue-500" />
                        <SummaryMetric title="Esperado" value={formatCurrency(currentCashbox.efectivoEsperado)} helper="Efectivo esperado" tone="bg-zinc-900" />
                        <SummaryMetric title="Cobrado" value={formatCurrency(currentCashbox.totalCobrado)} helper={`${currentCashbox.movements.filter((movement) => movement.type === "COBRO").length} cobros`} tone="bg-violet-500" />
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                        <div className="space-y-6">
                            <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700">
                                        <CircleDollarSign className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black tracking-tight text-zinc-900">Totales por método</h2>
                                        <p className="text-sm text-zinc-500">Resumen corto del turno</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {currentCashbox.methodTotals.map((method) => (
                                        <div key={method.methodId} className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50/70 p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="font-bold text-zinc-900">{method.label}</p>
                                                <Badge variant="outline" className="border-zinc-200 bg-white text-zinc-600">
                                                    Neto {formatCurrency(method.netAmount)}
                                                </Badge>
                                            </div>
                                            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                                <div className="rounded-2xl bg-white p-3">
                                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Cobros</p>
                                                    <p className="mt-1 font-bold text-emerald-600">{formatCurrency(method.paymentsAmount)}</p>
                                                </div>
                                                <div className="rounded-2xl bg-white p-3">
                                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Egresos</p>
                                                    <p className="mt-1 font-bold text-red-600">{formatCurrency(method.expensesAmount)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                                        <ReceiptText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black tracking-tight text-zinc-900">Últimos cierres</h2>
                                        <p className="text-sm text-zinc-500">Referencia rápida del mismo operador</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {recentClosedCashboxes.length === 0 ? (
                                        <p className="rounded-[1.25rem] bg-zinc-50 px-4 py-6 text-sm font-medium text-zinc-500">
                                            Aún no hay cierres registrados para mostrar.
                                        </p>
                                    ) : (
                                        recentClosedCashboxes.map((cashbox) => (
                                            <div key={cashbox.id} className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50/70 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-bold text-zinc-900">{formatDateTime(cashbox.fechaApertura)}</p>
                                                        <p className="text-sm text-zinc-500">Cierre {formatDateTime(cashbox.fechaCierre)}</p>
                                                    </div>
                                                    <p className={cn("text-sm font-black", (cashbox.diferenciaEfectivo || 0) === 0 ? "text-zinc-900" : "text-amber-700")}>
                                                        {formatCurrency(cashbox.diferenciaEfectivo || 0)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        </div>

                        <div className="space-y-6">
                            <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                                        <Banknote className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black tracking-tight text-zinc-900">Cobros recientes</h2>
                                        <p className="text-sm text-zinc-500">Ingresos asociados a tu caja activa</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {recentPayments.length === 0 ? (
                                        <p className="rounded-[1.25rem] bg-zinc-50 px-4 py-6 text-sm font-medium text-zinc-500">
                                            Aún no registraste cobros en esta caja.
                                        </p>
                                    ) : (
                                        recentPayments.map((movement) => (
                                            <div key={movement.id} className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50/70 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-bold text-zinc-900">{movement.title}</p>
                                                        <p className="text-sm text-zinc-500">{movement.description}</p>
                                                    </div>
                                                    <p className="text-sm font-black text-emerald-600">{formatCurrency(movement.amount)}</p>
                                                </div>
                                                <p className="mt-2 text-xs font-medium text-zinc-500">
                                                    {formatDateTime(movement.happenedAt)} · {movement.methodId || "Sin método"}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>

                            <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                                        <TrendingDown className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black tracking-tight text-zinc-900">Egresos recientes</h2>
                                        <p className="text-sm text-zinc-500">Gastos operativos cargados desde caja</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {recentExpenses.length === 0 ? (
                                        <p className="rounded-[1.25rem] bg-zinc-50 px-4 py-6 text-sm font-medium text-zinc-500">
                                            No hay egresos registrados en esta caja.
                                        </p>
                                    ) : (
                                        recentExpenses.map((movement) => (
                                            <div key={movement.id} className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50/70 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-bold text-zinc-900">{movement.title}</p>
                                                        <p className="text-sm text-zinc-500">{movement.description}</p>
                                                    </div>
                                                    <p className="text-sm font-black text-red-600">-{formatCurrency(movement.amount)}</p>
                                                </div>
                                                <p className="mt-2 text-xs font-medium text-zinc-500">
                                                    {formatDateTime(movement.happenedAt)} · {movement.methodId || "Sin método"}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                    <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
                        <div className="rounded-[1.75rem] border border-zinc-200 bg-zinc-50/80 p-5">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-white">
                                    <Wallet className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-lg font-black tracking-tight text-zinc-900">No tienes una caja abierta</p>
                                    <p className="text-sm text-zinc-500">
                                        Mientras la caja esté cerrada podrás gestionar pedidos, pero no cobrar ni cargar egresos del turno.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-[1.35rem] border border-zinc-200 bg-white p-4">
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Monto sugerido</p>
                                    <p className="mt-1 text-2xl font-black tracking-tight text-zinc-900">
                                        {formatCurrency(cashboxData?.suggestedOpeningAmount || 0)}
                                    </p>
                                </div>
                                <div className="rounded-[1.35rem] border border-zinc-200 bg-white p-4">
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Operador</p>
                                    <p className="mt-1 text-lg font-black tracking-tight text-zinc-900">
                                        {cashboxData?.currentUser.displayName || "Empleado"}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="employee-cashbox-opening-amount" className="text-sm font-bold text-zinc-700">
                                    Monto inicial real
                                </Label>
                                <Input
                                    id="employee-cashbox-opening-amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={openingAmount}
                                    onChange={(event) => setOpeningAmount(event.target.value)}
                                    className="h-12 rounded-2xl border-zinc-200"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="employee-cashbox-opening-notes" className="text-sm font-bold text-zinc-700">
                                    Observaciones
                                </Label>
                                <Textarea
                                    id="employee-cashbox-opening-notes"
                                    value={openingNotes}
                                    onChange={(event) => setOpeningNotes(event.target.value)}
                                    placeholder="Ej. fondo inicial, cambio, notas del turno..."
                                    className="min-h-[110px] rounded-[1.4rem] border-zinc-200"
                                />
                            </div>

                            <Button
                                type="button"
                                onClick={handleOpenCashbox}
                                disabled={isSubmitting}
                                className="h-12 rounded-full bg-zinc-900 px-6 font-semibold text-white hover:bg-zinc-800"
                            >
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
                                Abrir caja
                            </Button>
                        </div>
                    </section>

                    <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black tracking-tight text-zinc-900">Qué se habilita al abrir</h2>
                                <p className="text-sm text-zinc-500">Contexto operativo del turno</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {[
                                "Cobrar pedidos con el método real utilizado.",
                                "Registrar egresos operativos básicos desde la misma pantalla.",
                                "Cerrar caja con efectivo esperado, contado y diferencia.",
                            ].map((item) => (
                                <div key={item} className="flex items-start gap-3 rounded-[1.25rem] border border-zinc-200 bg-zinc-50/70 p-4">
                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                        <CircleDollarSign className="h-4 w-4" />
                                    </div>
                                    <p className="text-sm font-medium text-zinc-700">{item}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            )}

            <ResponsivePanel
                open={expensePanelOpen}
                onOpenChange={setExpensePanelOpen}
                title="Registrar egreso"
                description="Este egreso impacta la caja del turno actual."
                mobileSide="bottom"
                desktopMode="sheet"
                contentClassName="sm:max-w-xl"
            >
                <div className="space-y-5">
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-zinc-700">Descripción</Label>
                        <Textarea
                            value={expenseForm.descripcion}
                            onChange={(event) => setExpenseForm((current) => ({ ...current, descripcion: event.target.value }))}
                            className="min-h-[120px] rounded-[1.4rem] border-zinc-200"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-zinc-700">Monto</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={expenseForm.monto}
                                onChange={(event) => setExpenseForm((current) => ({ ...current, monto: event.target.value }))}
                                className="h-12 rounded-2xl border-zinc-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-zinc-700">Proveedor</Label>
                            <Input
                                value={expenseForm.proveedor}
                                onChange={(event) => setExpenseForm((current) => ({ ...current, proveedor: event.target.value }))}
                                className="h-12 rounded-2xl border-zinc-200"
                                placeholder="Opcional"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-zinc-700">Categoría</Label>
                            <select
                                value={expenseForm.categoria}
                                onChange={(event) => setExpenseForm((current) => ({ ...current, categoria: event.target.value as CategoriaEgreso }))}
                                className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700"
                            >
                                {EXPENSE_CATEGORIES.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-zinc-700">Método</Label>
                            <select
                                value={expenseForm.metodoPago}
                                onChange={(event) => setExpenseForm((current) => ({ ...current, metodoPago: event.target.value }))}
                                className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700"
                            >
                                {paymentMethods.map((method) => (
                                    <option key={method.id} value={method.id}>
                                        {method.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Button
                        type="button"
                        onClick={handleRegisterExpense}
                        disabled={isSubmitting}
                        className="h-12 w-full rounded-full bg-zinc-900 font-semibold text-white hover:bg-zinc-800"
                    >
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingDown className="mr-2 h-4 w-4" />}
                        Guardar egreso
                    </Button>
                </div>
            </ResponsivePanel>

            <ResponsivePanel
                open={closePanelOpen}
                onOpenChange={setClosePanelOpen}
                title="Cerrar caja"
                description="Confirma el efectivo contado y deja observación si hay diferencia."
                mobileSide="bottom"
                desktopMode="sheet"
                contentClassName="sm:max-w-xl"
            >
                {currentCashbox ? (
                    <div className="space-y-5">
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-[1.3rem] bg-zinc-50 p-4">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Inicial</p>
                                <p className="mt-1 font-black text-zinc-900">{formatCurrency(currentCashbox.montoInicialReal)}</p>
                            </div>
                            <div className="rounded-[1.3rem] bg-zinc-50 p-4">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Esperado</p>
                                <p className="mt-1 font-black text-zinc-900">{formatCurrency(currentCashbox.efectivoEsperado)}</p>
                            </div>
                            <div className="rounded-[1.3rem] bg-zinc-50 p-4">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Diferencia</p>
                                <p className={cn("mt-1 font-black", Math.abs(closeDifference) > 0.009 ? "text-amber-700" : "text-zinc-900")}>
                                    {formatCurrency(closeDifference)}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-zinc-700">Efectivo contado</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={closeForm.efectivoContado}
                                onChange={(event) => setCloseForm((current) => ({ ...current, efectivoContado: event.target.value }))}
                                className="h-12 rounded-2xl border-zinc-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-zinc-700">Observaciones</Label>
                            <Textarea
                                value={closeForm.observacionesCierre}
                                onChange={(event) => setCloseForm((current) => ({ ...current, observacionesCierre: event.target.value }))}
                                className="min-h-[110px] rounded-[1.4rem] border-zinc-200"
                            />
                        </div>

                        <Button
                            type="button"
                            onClick={handleCloseCashbox}
                            disabled={isSubmitting}
                            className="h-12 w-full rounded-full bg-red-600 font-semibold text-white shadow-lg shadow-red-100 hover:bg-red-700"
                        >
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Landmark className="mr-2 h-4 w-4" />}
                            Confirmar cierre
                        </Button>
                    </div>
                ) : null}
            </ResponsivePanel>
        </div>
    );
}
