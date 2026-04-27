"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CategoriaEgreso } from "@prisma/client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
    AlertTriangle,
    ArrowRight,
    Banknote,
    CheckCircle2,
    CircleDollarSign,
    CreditCard,
    History,
    Landmark,
    Loader2,
    Plus,
    ReceiptText,
    ShieldAlert,
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
import { ReportSurface } from "@/app/admin/dashboard/reportes/reportes-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsivePanel } from "@/components/ui/responsive-panel";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

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
    orderId?: string | null;
};

type CashboxSummary = {
    id: string;
    estado: "ABIERTA" | "CERRADA";
    usuarioId: string;
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

function getMovementTone(type: CashboxMovement["type"]) {
    switch (type) {
        case "APERTURA":
            return {
                icon: Wallet,
                chip: "bg-zinc-100 text-zinc-700",
                iconWrap: "bg-zinc-100 text-zinc-700",
                amount: "text-zinc-900",
            };
        case "COBRO":
            return {
                icon: CircleDollarSign,
                chip: "bg-emerald-100 text-emerald-700",
                iconWrap: "bg-emerald-100 text-emerald-700",
                amount: "text-emerald-600",
            };
        case "ANULACION_COBRO":
            return {
                icon: ShieldAlert,
                chip: "bg-amber-100 text-amber-700",
                iconWrap: "bg-amber-100 text-amber-700",
                amount: "text-amber-600",
            };
        case "EGRESO":
            return {
                icon: TrendingDown,
                chip: "bg-red-100 text-red-700",
                iconWrap: "bg-red-100 text-red-700",
                amount: "text-red-600",
            };
        default:
            return {
                icon: CheckCircle2,
                chip: "bg-blue-100 text-blue-700",
                iconWrap: "bg-blue-100 text-blue-700",
                amount: "text-blue-600",
            };
    }
}

function SummaryMetric({
    title,
    value,
    accent,
    icon: Icon,
    helper,
}: {
    title: string;
    value: string;
    accent: string;
    icon: React.ComponentType<{ className?: string }>;
    helper?: string;
}) {
    return (
        <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm md:rounded-[2rem]">
            <div className={cn("flex items-center justify-between px-4 py-3 md:px-5 text-sm font-semibold text-white", accent)}>
                {title}
                <Icon className="h-5 w-5 text-white/80" />
            </div>
            <div className="px-4 py-5 md:px-6 md:py-6 space-y-1">
                <p className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-zinc-900">{value}</p>
                {helper ? <p className="text-sm text-zinc-500">{helper}</p> : null}
            </div>
        </div>
    );
}

export function CashboxAdminPageClient() {
    const scope = useRef<HTMLDivElement | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cashboxData, setCashboxData] = useState<CurrentCashboxPayload | null>(null);
    const [history, setHistory] = useState<CashboxSummary[]>([]);
    const [openingAmount, setOpeningAmount] = useState("");
    const [openingNotes, setOpeningNotes] = useState("");
    const [expensePanelOpen, setExpensePanelOpen] = useState(false);
    const [closePanelOpen, setClosePanelOpen] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState<CashboxSummary | null>(null);
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
        () => currentCashbox?.movements.filter((movement) => movement.type === "COBRO").slice(0, 5) ?? [],
        [currentCashbox]
    );
    const recentExpenses = useMemo(
        () => currentCashbox?.movements.filter((movement) => movement.type === "EGRESO").slice(0, 5) ?? [],
        [currentCashbox]
    );
    const closeDifference = useMemo(() => {
        if (!currentCashbox) {
            return 0;
        }

        const counted = Number(closeForm.efectivoContado || 0);
        return counted - currentCashbox.efectivoEsperado;
    }, [closeForm.efectivoContado, currentCashbox]);

    useGSAP(
        () => {
            const nodes = gsap.utils.toArray<HTMLElement>("[data-cashbox-reveal]");
            gsap.fromTo(
                nodes,
                { opacity: 0, y: 18 },
                { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: "power2.out", clearProps: "opacity,transform" }
            );
        },
        { scope, dependencies: [isLoading, currentCashbox?.id, history.length] }
    );

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
            const [currentResult, historyResult] = await Promise.all([getCurrentCashbox(), getCashboxHistory(12)]);

            if (!currentResult.success) {
                toast.error(currentResult.error || "No se pudo cargar la caja");
                return;
            }

            setCashboxData(currentResult.data as CurrentCashboxPayload);
            setHistory((historyResult.success ? (historyResult.data as CashboxSummary[]) : []) ?? []);
        } catch (error) {
            console.error("Error loading cashbox data:", error);
            toast.error("No se pudo cargar la informacion de caja");
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
            toast.error("Ingresa un monto valido para el egreso");
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

            toast.success("Egreso registrado en la caja");
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
            toast.error("Debes registrar una observacion para cerrar con diferencia");
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
        <div ref={scope} className="app-page-safe-bottom flex min-h-screen flex-col gap-5 bg-white px-4 py-4 sm:px-6 md:gap-6 md:px-8 md:py-8">
            <section data-cashbox-reveal className="space-y-4">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">Caja operativa</h1>
                    </div>
                    <p className="text-sm text-zinc-500 sm:text-base">
                        Apertura, egresos, cierre y trazabilidad del turno administrativo.
                    </p>
                </div>

                {/* Mobile buttons */}
                <div className="grid grid-cols-2 gap-3 md:hidden">
                    <Button asChild variant="outline" className="h-11 rounded-2xl border-zinc-200 bg-white font-semibold text-zinc-700 shadow-sm">
                        <Link href="/admin/dashboard/reportes/egresos">Ver egresos</Link>
                    </Button>
                    {currentCashbox ? (
                        <>
                            <Button
                                type="button"
                                onClick={() => setExpensePanelOpen(true)}
                                className="h-11 rounded-2xl bg-zinc-900 font-bold text-white shadow-lg shadow-zinc-200 hover:bg-zinc-800"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Egreso
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
                                className="col-span-2 h-11 rounded-2xl bg-red-600 font-semibold text-white shadow-lg shadow-red-100 hover:bg-red-700"
                            >
                                Cerrar caja
                            </Button>
                        </>
                    ) : null}
                </div>

                {/* Desktop buttons */}
                <div className="hidden items-center justify-end gap-3 md:flex">
                    <Button
                        asChild
                        variant="outline"
                        className="h-11 rounded-full border-2 border-zinc-200 bg-white px-4 font-medium text-zinc-600 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] transition-all hover:-translate-x-px hover:-translate-y-px hover:bg-zinc-50"
                    >
                        <Link href="/admin/dashboard/reportes/egresos">
                            Ver egresos
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    {currentCashbox ? (
                        <>
                            <Button
                                type="button"
                                onClick={() => setExpensePanelOpen(true)}
                                className="h-11 rounded-full border-2 border-zinc-900 bg-zinc-900 px-5 font-semibold text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-px hover:-translate-y-px hover:bg-zinc-800"
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
                                className="h-11 rounded-full border-2 border-red-700 bg-red-600 px-5 font-semibold text-white shadow-[3px_3px_0px_0px_rgba(185,28,28,0.5)] transition-all hover:-translate-x-px hover:-translate-y-px hover:bg-red-700"
                            >
                                Cerrar caja
                            </Button>
                        </>
                    ) : null}
                </div>
            </section>

            {isLoading ? (
                <div className="flex min-h-[20rem] items-center justify-center rounded-[2rem] border border-zinc-200 bg-white" data-cashbox-reveal>
                    <div className="flex flex-col items-center gap-3 text-zinc-500">
                        <Loader2 className="h-7 w-7 animate-spin" />
                        <p className="text-sm font-medium">Cargando estado de caja...</p>
                    </div>
                </div>
            ) : currentCashbox ? (
                <>
                    <section data-cashbox-reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <SummaryMetric
                            title="Caja abierta"
                            value={currentCashbox.usuarioNombre}
                            helper={`Abierta el ${formatDateTime(currentCashbox.fechaApertura)}`}
                            accent="bg-zinc-900"
                            icon={Wallet}
                        />
                        <SummaryMetric
                            title="Monto inicial"
                            value={formatCurrency(currentCashbox.montoInicialReal)}
                            helper={`Sugerido ${formatCurrency(currentCashbox.montoInicialSugerido)}`}
                            accent="bg-blue-600"
                            icon={Banknote}
                        />
                        <SummaryMetric
                            title="Efectivo esperado"
                            value={formatCurrency(currentCashbox.efectivoEsperado)}
                            helper="Formula viva del turno"
                            accent="bg-emerald-600"
                            icon={CircleDollarSign}
                        />
                        <SummaryMetric
                            title="Total cobrado"
                            value={formatCurrency(currentCashbox.totalCobrado)}
                            helper="Solo cobros vigentes"
                            accent="bg-violet-500"
                            icon={CreditCard}
                        />
                        <SummaryMetric
                            title="Total egresos"
                            value={formatCurrency(currentCashbox.totalEgresos)}
                            helper="Impacta por metodo registrado"
                            accent="bg-red-500"
                            icon={TrendingDown}
                        />
                        <SummaryMetric
                            title="Movimientos"
                            value={String(currentCashbox.movements.length)}
                            helper="Actividad del turno"
                            accent="bg-amber-500"
                            icon={ReceiptText}
                        />
                    </section>

                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                        <ReportSurface
                            title="Actividad del turno"
                            description="Movimientos operativos ordenados por fecha."
                            className="min-h-[24rem]"
                            headerClassName="items-start"
                        >
                            <div className="space-y-3">
                                {currentCashbox.movements.map((movement) => {
                                    const tone = getMovementTone(movement.type);
                                    const MovementIcon = tone.icon;
                                    return (
                                        <div
                                            key={movement.id}
                                            className="flex items-start gap-3 rounded-[1.4rem] border border-zinc-200 bg-zinc-50/70 p-4"
                                        >
                                            <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", tone.iconWrap)}>
                                                <MovementIcon className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-black tracking-tight text-zinc-900">{movement.title}</p>
                                                    <Badge className={cn("rounded-full border-none px-2.5 py-1 text-[11px] font-bold", tone.chip)}>
                                                        {movement.type.replaceAll("_", " ")}
                                                    </Badge>
                                                </div>
                                                <p className="mt-1 text-sm text-zinc-500">{movement.description}</p>
                                                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-zinc-500">
                                                    <span>{formatDateTime(movement.happenedAt)}</span>
                                                    {movement.methodId ? <span>Metodo: {movement.methodId}</span> : null}
                                                </div>
                                            </div>
                                            <p className={cn("shrink-0 text-sm font-black", tone.amount)}>
                                                {movement.type === "EGRESO" || movement.type === "ANULACION_COBRO" ? "-" : "+"}
                                                {formatCurrency(movement.amount)}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </ReportSurface>

                        <div className="space-y-5">
                            <ReportSurface title="Desglose por metodo" description="Cobros y egresos dentro de la caja activa.">
                                <div className="space-y-3">
                                    {currentCashbox.methodTotals.map((method) => (
                                        <div
                                            key={method.methodId}
                                            className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50/70 p-4"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="font-black tracking-tight text-zinc-900">{method.label}</p>
                                                    <p className="text-sm text-zinc-500">{method.paymentsCount} cobros registrados</p>
                                                </div>
                                                <Badge variant="outline" className="rounded-full border-zinc-200 bg-white px-3 py-1 font-semibold text-zinc-600">
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
                            </ReportSurface>

                            <ReportSurface title="Cobros recientes" description="Ultimos ingresos vigentes del turno.">
                                <div className="space-y-3">
                                    {recentPayments.length === 0 ? (
                                        <p className="rounded-[1.25rem] bg-zinc-50 px-4 py-6 text-sm font-medium text-zinc-500">
                                            Todavia no hay cobros registrados en esta caja.
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
                                                    {formatDateTime(movement.happenedAt)} · {movement.methodId || "Sin metodo"}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ReportSurface>

                            <ReportSurface title="Egresos recientes" description="Salidas operativas registradas desde caja.">
                                <div className="space-y-3">
                                    {recentExpenses.length === 0 ? (
                                        <p className="rounded-[1.25rem] bg-zinc-50 px-4 py-6 text-sm font-medium text-zinc-500">
                                            No hay egresos asociados a esta caja por ahora.
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
                                                    {formatDateTime(movement.happenedAt)} · {movement.methodId || "Sin metodo"}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ReportSurface>
                        </div>
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                    <ReportSurface
                        title="Abrir caja"
                        description="Necesitas una caja activa para cobrar pedidos o registrar egresos operativos."
                        className="overflow-hidden"
                        headerClassName="items-start"
                    >
                        <div className="rounded-[1.75rem] border border-zinc-200 bg-zinc-50/80 p-5">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-white">
                                    <Wallet className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-lg font-black tracking-tight text-zinc-900">Sin caja abierta</p>
                                    <p className="text-sm text-zinc-500">
                                        El sistema te va a dejar crear y gestionar pedidos, pero no cobrar ni cargar egresos hasta abrir el turno.
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
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Usuario operativo</p>
                                    <p className="mt-1 text-lg font-black tracking-tight text-zinc-900">
                                        {cashboxData?.currentUser.displayName || "Admin"}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cashbox-opening-amount" className="text-sm font-bold text-zinc-700">
                                    Monto inicial real
                                </Label>
                                <Input
                                    id="cashbox-opening-amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={openingAmount}
                                    onChange={(event) => setOpeningAmount(event.target.value)}
                                    className="h-12 rounded-2xl border-zinc-200 bg-white text-base font-medium shadow-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cashbox-opening-notes" className="text-sm font-bold text-zinc-700">
                                    Observaciones de apertura
                                </Label>
                                <Textarea
                                    id="cashbox-opening-notes"
                                    value={openingNotes}
                                    onChange={(event) => setOpeningNotes(event.target.value)}
                                    placeholder="Ej. cambio inicial, fondo separado para delivery, notas del turno..."
                                    className="min-h-[110px] rounded-[1.4rem] border-zinc-200 bg-white text-base font-medium shadow-sm"
                                />
                            </div>

                            {/* Mobile CTA */}
                            <div className="flex flex-col gap-3 md:hidden">
                                <Button
                                    type="button"
                                    onClick={handleOpenCashbox}
                                    disabled={isSubmitting}
                                    className="h-12 w-full rounded-2xl bg-zinc-900 font-bold text-white shadow-lg shadow-zinc-200 hover:bg-zinc-800"
                                >
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
                                    Abrir caja
                                </Button>
                                <Button asChild variant="outline" className="h-11 w-full rounded-2xl border-zinc-200 bg-white font-semibold text-zinc-700">
                                    <Link href="/admin/dashboard/pedidos">Volver a pedidos</Link>
                                </Button>
                            </div>
                            {/* Desktop CTA */}
                            <div className="hidden gap-3 md:flex">
                                <Button
                                    type="button"
                                    onClick={handleOpenCashbox}
                                    disabled={isSubmitting}
                                    className="h-11 rounded-full border-2 border-zinc-900 bg-zinc-900 px-6 font-semibold text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-px hover:-translate-y-px hover:bg-zinc-800"
                                >
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
                                    Abrir caja
                                </Button>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="h-11 rounded-full border-2 border-zinc-200 bg-white px-5 font-medium text-zinc-600 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] transition-all hover:-translate-x-px hover:-translate-y-px hover:bg-zinc-50"
                                >
                                    <Link href="/admin/dashboard/pedidos">Volver a pedidos</Link>
                                </Button>
                            </div>
                        </div>
                    </ReportSurface>

                    <ReportSurface title="Lo que se habilita al abrir" description="Contexto operativo para que el flujo sea claro desde el primer uso.">
                        <div className="space-y-3">
                            {[
                                "Cobrar pedidos con metodo real y trazabilidad de caja.",
                                "Registrar egresos del turno sin salir del modulo operativo.",
                                "Cerrar caja con efectivo esperado, contado y diferencia.",
                            ].map((item) => (
                                <div key={item} className="flex items-start gap-3 rounded-[1.25rem] border border-zinc-200 bg-zinc-50/70 p-4">
                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <p className="text-sm font-medium text-zinc-700">{item}</p>
                                </div>
                            ))}
                            <div className="flex items-start gap-3 rounded-[1.25rem] border border-amber-200 bg-amber-50/80 p-4">
                                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                    <AlertTriangle className="h-4 w-4" />
                                </div>
                                <p className="text-sm font-medium text-amber-800">
                                    Si intentas cobrar desde pedidos sin caja abierta, el sistema te va a traer a este modulo.
                                </p>
                            </div>
                        </div>
                    </ReportSurface>
                </div>
            )}

            <ReportSurface
                title="Historial de cajas"
                description="Sesiones de todos los operadores, ordenadas por apertura más reciente."
                data-cashbox-reveal=""
            >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {history.length === 0 ? (
                        <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-5 py-10 text-center text-sm font-medium text-zinc-500">
                            Todavia no hay historial de cajas registrado.
                        </div>
                    ) : (
                        history.map((cashbox) => (
                            <button
                                key={cashbox.id}
                                type="button"
                                onClick={() => setSelectedHistory(cashbox)}
                                className="rounded-[1.75rem] border-2 border-zinc-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-px hover:border-zinc-300 hover:shadow-md md:rounded-[2rem]"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">
                                            {cashbox.usuarioNombre}
                                        </p>
                                        <p className="font-black tracking-tight text-zinc-900">
                                            {cashbox.estado === "ABIERTA" ? "Caja activa" : "Caja cerrada"}
                                        </p>
                                        <p className="text-sm text-zinc-500">{formatDateTime(cashbox.fechaApertura)}</p>
                                    </div>
                                    <Badge
                                        className={cn(
                                            "rounded-full border-none px-2.5 py-1 text-[11px] font-bold",
                                            cashbox.estado === "ABIERTA" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-700"
                                        )}
                                    >
                                        {cashbox.estado}
                                    </Badge>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                    <div className="rounded-2xl bg-zinc-50 p-3">
                                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Cobrado</p>
                                        <p className="mt-1 font-bold text-zinc-900">{formatCurrency(cashbox.totalCobrado)}</p>
                                    </div>
                                    <div className="rounded-2xl bg-zinc-50 p-3">
                                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Diferencia</p>
                                        <p className={cn("mt-1 font-bold", (cashbox.diferenciaEfectivo || 0) === 0 ? "text-zinc-900" : "text-amber-700")}>
                                            {formatCurrency(cashbox.diferenciaEfectivo || 0)}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </ReportSurface>

            <ResponsivePanel
                open={expensePanelOpen}
                onOpenChange={setExpensePanelOpen}
                title="Registrar egreso de caja"
                description="Este egreso impacta el turno actual y queda visible tambien en reportes."
                mobileSide="bottom"
                desktopMode="sheet"
                contentClassName="sm:max-w-xl"
            >
                <div className="space-y-5">
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-zinc-700">Descripcion</Label>
                        <Textarea
                            value={expenseForm.descripcion}
                            onChange={(event) => setExpenseForm((current) => ({ ...current, descripcion: event.target.value }))}
                            className="min-h-[120px] rounded-[1.4rem] border-zinc-200"
                            placeholder="Ej. compra urgente de insumos, pago de servicio, gasto operativo del turno..."
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
                            <Label className="text-sm font-bold text-zinc-700">Categoria</Label>
                            <select
                                value={expenseForm.categoria}
                                onChange={(event) =>
                                    setExpenseForm((current) => ({ ...current, categoria: event.target.value as CategoriaEgreso }))
                                }
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
                            <Label className="text-sm font-bold text-zinc-700">Metodo de pago</Label>
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
                description="Confirma el efectivo contado y documenta cualquier diferencia."
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
                            <Label className="text-sm font-bold text-zinc-700">Observaciones de cierre</Label>
                            <Textarea
                                value={closeForm.observacionesCierre}
                                onChange={(event) =>
                                    setCloseForm((current) => ({ ...current, observacionesCierre: event.target.value }))
                                }
                                className="min-h-[110px] rounded-[1.4rem] border-zinc-200"
                                placeholder="Obligatorio si existe diferencia. Ej. faltante de cambio, gasto no cargado, redondeo, etc."
                            />
                        </div>

                        <div className="rounded-[1.3rem] border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800">
                            El cierre deja la caja fuera de operacion. Los cobros y egresos posteriores van a requerir una nueva apertura.
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

            <ResponsivePanel
                open={selectedHistory != null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedHistory(null);
                    }
                }}
                title={selectedHistory?.estado === "ABIERTA" ? "Caja activa" : "Detalle historico"}
                description="Resumen consolidado de la sesion seleccionada."
                mobileSide="bottom"
                desktopMode="sheet"
                contentClassName="sm:max-w-xl"
            >
                {selectedHistory ? (
                    <div className="space-y-5">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-[1.3rem] bg-zinc-50 p-4">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Apertura</p>
                                <p className="mt-1 font-black text-zinc-900">{formatDateTime(selectedHistory.fechaApertura)}</p>
                            </div>
                            <div className="rounded-[1.3rem] bg-zinc-50 p-4">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Cierre</p>
                                <p className="mt-1 font-black text-zinc-900">{formatDateTime(selectedHistory.fechaCierre)}</p>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-[1.3rem] bg-white p-4 shadow-sm ring-1 ring-zinc-200">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Cobrado</p>
                                <p className="mt-1 font-black text-zinc-900">{formatCurrency(selectedHistory.totalCobrado)}</p>
                            </div>
                            <div className="rounded-[1.3rem] bg-white p-4 shadow-sm ring-1 ring-zinc-200">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Egresos</p>
                                <p className="mt-1 font-black text-zinc-900">{formatCurrency(selectedHistory.totalEgresos)}</p>
                            </div>
                            <div className="rounded-[1.3rem] bg-white p-4 shadow-sm ring-1 ring-zinc-200">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Diferencia</p>
                                <p className={cn("mt-1 font-black", (selectedHistory.diferenciaEfectivo || 0) === 0 ? "text-zinc-900" : "text-amber-700")}>
                                    {formatCurrency(selectedHistory.diferenciaEfectivo || 0)}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <History className="h-4 w-4 text-zinc-500" />
                                <p className="text-sm font-black uppercase tracking-[0.16em] text-zinc-500">Movimientos</p>
                            </div>
                            {selectedHistory.movements.slice(0, 8).map((movement) => (
                                <div key={movement.id} className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50/70 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-bold text-zinc-900">{movement.title}</p>
                                            <p className="text-sm text-zinc-500">{movement.description}</p>
                                        </div>
                                        <p className="text-sm font-black text-zinc-900">{formatCurrency(movement.amount)}</p>
                                    </div>
                                    <p className="mt-2 text-xs font-medium text-zinc-500">
                                        {formatDateTime(movement.happenedAt)} · {movement.methodId || "Sin metodo"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
            </ResponsivePanel>

            <div
                aria-hidden
                className="rounded-[1.75rem] bg-white/55 md:hidden"
                style={{ minHeight: "calc(var(--admin-mobile-nav-height) - 0.5rem)" }}
            />
        </div>
    );
}
