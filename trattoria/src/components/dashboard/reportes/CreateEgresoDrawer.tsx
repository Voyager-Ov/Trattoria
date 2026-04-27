"use client";

import { useEffect, useState } from "react";
import { CategoriaEgreso, EstadoPagoEgreso } from "@prisma/client";
import {
    Calendar,
    CreditCard,
    DollarSign,
    FileText,
    Home,
    Loader2,
    MapPinned,
    Megaphone,
    MoreHorizontal,
    Receipt,
    Save,
    ShoppingCart,
    TrendingDown,
    Users,
    Wrench,
    Zap,
} from "lucide-react";
import { toast } from "sonner";

import { createEgreso, updateEgreso } from "@/app/actions/egresoActions";
import { getConfigs } from "@/app/actions/configActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsivePanel } from "@/components/ui/responsive-panel";
import { Textarea } from "@/components/ui/textarea";

interface PaymentMethod {
    id: string;
    label: string;
    enabled: boolean;
}

interface CreateEgresoDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    editingEgreso?: {
        id: string;
        descripcion?: string;
        monto: number;
        categoria?: CategoriaEgreso | string;
        metodoPago?: string | null;
        proveedor?: string | null;
        comprobante?: string | null;
        estadoPago?: EstadoPagoEgreso | string | null;
        centroCosto?: string | null;
        tipoComprobante?: string | null;
        numeroComprobante?: string | null;
        fecha: Date | string;
        fechaDevengado?: Date | string | null;
        fechaPago?: Date | string | null;
        fechaVencimiento?: Date | string | null;
        periodoDesde?: Date | string | null;
        periodoHasta?: Date | string | null;
        neto?: number | null;
        impuestos?: number | null;
        percepciones?: number | null;
    };
}

type FormState = {
    descripcion: string;
    monto: string;
    categoria: CategoriaEgreso;
    metodoPago: string;
    proveedor: string;
    comprobante: string;
    estadoPago: EstadoPagoEgreso;
    centroCosto: string;
    tipoComprobante: string;
    numeroComprobante: string;
    fecha: string;
    fechaDevengado: string;
    fechaPago: string;
    fechaVencimiento: string;
    periodoDesde: string;
    periodoHasta: string;
    neto: string;
    impuestos: string;
    percepciones: string;
};

function toDateInputValue(value?: Date | string | null) {
    if (!value) {
        return "";
    }

    return new Date(value).toISOString().split("T")[0];
}

function toNumericInputValue(value?: number | null) {
    return value != null ? value.toString() : "";
}

function createInitialState(paymentMethods: PaymentMethod[]): FormState {
    return {
        descripcion: "",
        monto: "",
        categoria: "OTROS",
        metodoPago: paymentMethods[0]?.id || "EFECTIVO",
        proveedor: "",
        comprobante: "",
        estadoPago: "PAGADO",
        centroCosto: "",
        tipoComprobante: "",
        numeroComprobante: "",
        fecha: new Date().toISOString().split("T")[0],
        fechaDevengado: "",
        fechaPago: "",
        fechaVencimiento: "",
        periodoDesde: "",
        periodoHasta: "",
        neto: "",
        impuestos: "",
        percepciones: "",
    };
}

export function CreateEgresoDrawer({
    open,
    onOpenChange,
    onSuccess,
    editingEgreso,
}: CreateEgresoDrawerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [formData, setFormData] = useState<FormState>(createInitialState([]));

    useEffect(() => {
        async function fetchPaymentMethods() {
            const res = await getConfigs(["payments.methods"]);
            if (res.success && res.data && res.data["payments.methods"]) {
                const methods = (res.data["payments.methods"] as PaymentMethod[]).filter((method) => method.enabled);
                setPaymentMethods(methods.length > 0 ? methods : [{ id: "EFECTIVO", label: "Efectivo", enabled: true }]);
                return;
            }

            setPaymentMethods([{ id: "EFECTIVO", label: "Efectivo", enabled: true }]);
        }

        void fetchPaymentMethods();
    }, []);

    useEffect(() => {
        if (editingEgreso) {
            setFormData({
                descripcion: editingEgreso.descripcion || "",
                monto: editingEgreso.monto.toString(),
                categoria: (editingEgreso.categoria as CategoriaEgreso) || "OTROS",
                metodoPago: editingEgreso.metodoPago || paymentMethods[0]?.id || "EFECTIVO",
                proveedor: editingEgreso.proveedor || "",
                comprobante: editingEgreso.comprobante || "",
                estadoPago: (editingEgreso.estadoPago as EstadoPagoEgreso) || "PAGADO",
                centroCosto: editingEgreso.centroCosto || "",
                tipoComprobante: editingEgreso.tipoComprobante || "",
                numeroComprobante: editingEgreso.numeroComprobante || "",
                fecha: toDateInputValue(editingEgreso.fecha),
                fechaDevengado: toDateInputValue(editingEgreso.fechaDevengado),
                fechaPago: toDateInputValue(editingEgreso.fechaPago),
                fechaVencimiento: toDateInputValue(editingEgreso.fechaVencimiento),
                periodoDesde: toDateInputValue(editingEgreso.periodoDesde),
                periodoHasta: toDateInputValue(editingEgreso.periodoHasta),
                neto: toNumericInputValue(editingEgreso.neto),
                impuestos: toNumericInputValue(editingEgreso.impuestos),
                percepciones: toNumericInputValue(editingEgreso.percepciones),
            });
            return;
        }

        setFormData(createInitialState(paymentMethods));
    }, [editingEgreso, open, paymentMethods]);

    const categories = [
        { id: "INSUMOS", label: "Insumos", icon: ShoppingCart },
        { id: "SERVICIOS", label: "Servicios", icon: Zap },
        { id: "NOMINA", label: "Nomina", icon: Users },
        { id: "ALQUILER", label: "Alquiler", icon: Home },
        { id: "IMPUESTOS", label: "Impuestos", icon: Receipt },
        { id: "PUBLICIDAD", label: "Publicidad", icon: Megaphone },
        { id: "EQUIPAMIENTO", label: "Equipamiento", icon: Wrench },
        { id: "MANTENIMIENTO", label: "Mantenimiento", icon: TrendingDown },
        { id: "OTROS", label: "Otros", icon: MoreHorizontal },
    ] as const;

    const expenseStates: Array<{ id: EstadoPagoEgreso; label: string }> = [
        { id: "PAGADO", label: "Pagado" },
        { id: "PENDIENTE", label: "Pendiente" },
        { id: "VENCIDO", label: "Vencido" },
        { id: "ANULADO", label: "Anulado" },
    ];

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!formData.descripcion || !formData.monto) {
            toast.error("Por favor completa los campos obligatorios");
            return;
        }

        if (formData.categoria === "NOMINA" && (!formData.centroCosto || !formData.periodoDesde || !formData.periodoHasta)) {
            toast.error("Para nomina completa centro de costo y periodo");
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                descripcion: formData.descripcion,
                monto: parseFloat(formData.monto),
                categoria: formData.categoria,
                metodoPago: formData.metodoPago,
                proveedor: formData.proveedor,
                comprobante: formData.comprobante,
                estadoPago: formData.estadoPago,
                centroCosto: formData.centroCosto,
                tipoComprobante: formData.tipoComprobante,
                numeroComprobante: formData.numeroComprobante,
                fecha: new Date(formData.fecha),
                fechaDevengado: formData.fechaDevengado ? new Date(formData.fechaDevengado) : undefined,
                fechaPago: formData.fechaPago ? new Date(formData.fechaPago) : undefined,
                fechaVencimiento: formData.fechaVencimiento ? new Date(formData.fechaVencimiento) : undefined,
                periodoDesde: formData.periodoDesde ? new Date(formData.periodoDesde) : undefined,
                periodoHasta: formData.periodoHasta ? new Date(formData.periodoHasta) : undefined,
                neto: formData.neto ? parseFloat(formData.neto) : undefined,
                impuestos: formData.impuestos ? parseFloat(formData.impuestos) : undefined,
                percepciones: formData.percepciones ? parseFloat(formData.percepciones) : undefined,
            };

            const result = editingEgreso
                ? await updateEgreso(editingEgreso.id, payload)
                : await createEgreso(payload);

            if (!result.success) {
                toast.error(result.error || "Ocurrio un error");
                return;
            }

            toast.success(editingEgreso ? "Gasto actualizado" : "Gasto registrado correctamente");
            onSuccess();
            onOpenChange(false);
        } catch {
            toast.error("Error al procesar la solicitud");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ResponsivePanel
            open={open}
            onOpenChange={onOpenChange}
            title={<span className="sr-only">{editingEgreso ? "Editar gasto" : "Registrar gasto"}</span>}
            description={<span className="sr-only">Formulario de carga y edicion de egresos</span>}
            contentClassName="overflow-hidden border-zinc-100 bg-white px-0 pt-0 sm:max-w-xl"
            desktopContentClassName="p-0"
        >
            <div className="flex h-full min-h-0 flex-col overflow-hidden">
                <form onSubmit={handleSubmit} className="flex min-h-full flex-col">
                    <div className="mb-6 px-5 pt-5 text-left md:mb-8 md:px-10 md:pt-10">
                        <div className="mb-4 flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-[1.15rem] bg-red-600 text-white shadow-xl shadow-red-100 md:h-14 md:w-14 md:rounded-[1.25rem]">
                                {editingEgreso ? <FileText size={24} /> : <TrendingDown size={18} />}
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
                            {editingEgreso ? "Editar Gasto" : "Registrar Gasto"}
                        </h2>
                        <p className="text-sm text-zinc-500 md:text-lg">
                            {editingEgreso
                                ? "Modifica los detalles del gasto registrado."
                                : "Registra un nuevo egreso con datos contables y operativos."}
                        </p>
                    </div>

                    <div className="flex-1 space-y-6 overflow-y-auto px-5 pb-6 md:space-y-8 md:px-10 md:pb-8">
                        <div className="space-y-3">
                            <Label className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                                Seleccionar categoria
                            </Label>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                                {categories.map((category) => {
                                    const Icon = category.icon;
                                    const isSelected = formData.categoria === category.id;

                                    return (
                                        <button
                                            key={category.id}
                                            type="button"
                                            onClick={() =>
                                                setFormData((current) => ({
                                                    ...current,
                                                    categoria: category.id as CategoriaEgreso,
                                                }))
                                            }
                                            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-2.5 transition-all duration-200 ${
                                                isSelected
                                                    ? "scale-[1.02] border-red-500 bg-red-50 text-red-600 shadow-sm"
                                                    : "border-zinc-100 bg-zinc-50 text-zinc-400 hover:border-zinc-200 hover:bg-zinc-100 hover:text-zinc-500"
                                            }`}
                                        >
                                            <div
                                                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                                                    isSelected ? "bg-red-600 text-white" : "bg-white text-zinc-400"
                                                }`}
                                            >
                                                <Icon size={16} />
                                            </div>
                                            <span className="text-center text-[0.6rem] font-bold uppercase tracking-wider leading-tight">
                                                {category.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-5">
                            <Label className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                                Detalles principales
                            </Label>

                            <div className="space-y-2">
                                <Label htmlFor="descripcion" className="flex items-center gap-2 font-bold text-zinc-700">
                                    <FileText size={14} className="text-zinc-400" />
                                    Descripcion *
                                </Label>
                                <Textarea
                                    id="descripcion"
                                    placeholder="Ej. Pago de luz local principal"
                                    value={formData.descripcion}
                                    onChange={(event) =>
                                        setFormData((current) => ({
                                            ...current,
                                            descripcion: event.target.value,
                                        }))
                                    }
                                    className="min-h-[90px] resize-none rounded-xl border-zinc-200 bg-white text-base font-medium shadow-sm focus-visible:ring-red-400"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="monto" className="flex items-center gap-2 font-bold text-zinc-700">
                                        <DollarSign size={14} className="text-zinc-400" />
                                        Monto total *
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400">$</span>
                                        <Input
                                            id="monto"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={formData.monto}
                                            onChange={(event) =>
                                                setFormData((current) => ({
                                                    ...current,
                                                    monto: event.target.value,
                                                }))
                                            }
                                            className="h-12 rounded-xl border-zinc-200 bg-white pl-8 text-base font-medium shadow-sm focus-visible:ring-red-400"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="fecha" className="flex items-center gap-2 font-bold text-zinc-700">
                                        <Calendar size={14} className="text-zinc-400" />
                                        Fecha
                                    </Label>
                                    <Input
                                        id="fecha"
                                        type="date"
                                        value={formData.fecha}
                                        onChange={(event) =>
                                            setFormData((current) => ({
                                                ...current,
                                                fecha: event.target.value,
                                            }))
                                        }
                                        className="h-12 rounded-xl border-zinc-200 bg-white text-base font-medium shadow-sm focus-visible:ring-red-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="proveedor" className="flex items-center gap-2 font-bold text-zinc-700">
                                        <ShoppingCart size={14} className="text-zinc-400" />
                                        Proveedor
                                    </Label>
                                    <Input
                                        id="proveedor"
                                        placeholder="Nombre del proveedor"
                                        value={formData.proveedor}
                                        onChange={(event) =>
                                            setFormData((current) => ({
                                                ...current,
                                                proveedor: event.target.value,
                                            }))
                                        }
                                        className="h-12 rounded-xl border-zinc-200 bg-white text-base font-medium shadow-sm focus-visible:ring-red-400"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="centroCosto" className="flex items-center gap-2 font-bold text-zinc-700">
                                        <MapPinned size={14} className="text-zinc-400" />
                                        Centro de costo
                                    </Label>
                                    <Input
                                        id="centroCosto"
                                        placeholder="Ej. Salon, Cocina, Delivery"
                                        value={formData.centroCosto}
                                        onChange={(event) =>
                                            setFormData((current) => ({
                                                ...current,
                                                centroCosto: event.target.value,
                                            }))
                                        }
                                        className="h-12 rounded-xl border-zinc-200 bg-white text-base font-medium shadow-sm focus-visible:ring-red-400"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-400">
                                <CreditCard size={14} />
                                Metodo de pago
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {paymentMethods.map((method) => {
                                    const isSelected = formData.metodoPago === method.id;

                                    return (
                                        <button
                                            key={method.id}
                                            type="button"
                                            onClick={() =>
                                                setFormData((current) => ({
                                                    ...current,
                                                    metodoPago: method.id,
                                                }))
                                            }
                                            className={`rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                                                isSelected
                                                    ? "border-red-500 bg-red-50 text-red-600 shadow-sm"
                                                    : "border-zinc-100 bg-zinc-50 text-zinc-500 hover:border-zinc-200 hover:bg-zinc-100"
                                            }`}
                                        >
                                            {method.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                                Estado del gasto
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {expenseStates.map((state) => {
                                    const isSelected = formData.estadoPago === state.id;

                                    return (
                                        <button
                                            key={state.id}
                                            type="button"
                                            onClick={() =>
                                                setFormData((current) => ({
                                                    ...current,
                                                    estadoPago: state.id,
                                                }))
                                            }
                                            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                                                isSelected
                                                    ? "border-zinc-900 bg-zinc-900 text-white"
                                                    : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                                            }`}
                                        >
                                            {state.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-5">
                            <Label className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                                Comprobante y fechas contables
                            </Label>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Input
                                    placeholder="Tipo comprobante"
                                    value={formData.tipoComprobante}
                                    onChange={(event) =>
                                        setFormData((current) => ({
                                            ...current,
                                            tipoComprobante: event.target.value,
                                        }))
                                    }
                                    className="h-12 rounded-xl border-zinc-200 bg-white text-base font-medium shadow-sm"
                                />
                                <Input
                                    placeholder="Numero comprobante"
                                    value={formData.numeroComprobante}
                                    onChange={(event) =>
                                        setFormData((current) => ({
                                            ...current,
                                            numeroComprobante: event.target.value,
                                        }))
                                    }
                                    className="h-12 rounded-xl border-zinc-200 bg-white text-base font-medium shadow-sm"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Input
                                    type="date"
                                    value={formData.fechaDevengado}
                                    onChange={(event) =>
                                        setFormData((current) => ({
                                            ...current,
                                            fechaDevengado: event.target.value,
                                        }))
                                    }
                                    className="h-12 rounded-xl border-zinc-200 bg-white text-base font-medium shadow-sm"
                                />
                                <Input
                                    type="date"
                                    value={formData.fechaPago}
                                    onChange={(event) =>
                                        setFormData((current) => ({
                                            ...current,
                                            fechaPago: event.target.value,
                                        }))
                                    }
                                    className="h-12 rounded-xl border-zinc-200 bg-white text-base font-medium shadow-sm"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Input
                                    type="date"
                                    value={formData.fechaVencimiento}
                                    onChange={(event) =>
                                        setFormData((current) => ({
                                            ...current,
                                            fechaVencimiento: event.target.value,
                                        }))
                                    }
                                    className="h-12 rounded-xl border-zinc-200 bg-white text-base font-medium shadow-sm"
                                />
                                <Input
                                    placeholder="Comprobante / URL"
                                    value={formData.comprobante}
                                    onChange={(event) =>
                                        setFormData((current) => ({
                                            ...current,
                                            comprobante: event.target.value,
                                        }))
                                    }
                                    className="h-12 rounded-xl border-zinc-200 bg-white text-base font-medium shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-5">
                            <Label className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                                Desglose contable
                            </Label>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Neto"
                                    value={formData.neto}
                                    onChange={(event) =>
                                        setFormData((current) => ({
                                            ...current,
                                            neto: event.target.value,
                                        }))
                                    }
                                    className="h-12 rounded-xl border-zinc-200 bg-white text-base font-medium shadow-sm"
                                />
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Impuestos"
                                    value={formData.impuestos}
                                    onChange={(event) =>
                                        setFormData((current) => ({
                                            ...current,
                                            impuestos: event.target.value,
                                        }))
                                    }
                                    className="h-12 rounded-xl border-zinc-200 bg-white text-base font-medium shadow-sm"
                                />
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Percepciones"
                                    value={formData.percepciones}
                                    onChange={(event) =>
                                        setFormData((current) => ({
                                            ...current,
                                            percepciones: event.target.value,
                                        }))
                                    }
                                    className="h-12 rounded-xl border-zinc-200 bg-white text-base font-medium shadow-sm"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Input
                                    type="date"
                                    value={formData.periodoDesde}
                                    onChange={(event) =>
                                        setFormData((current) => ({
                                            ...current,
                                            periodoDesde: event.target.value,
                                        }))
                                    }
                                    className="h-12 rounded-xl border-zinc-200 bg-white text-base font-medium shadow-sm"
                                />
                                <Input
                                    type="date"
                                    value={formData.periodoHasta}
                                    onChange={(event) =>
                                        setFormData((current) => ({
                                            ...current,
                                            periodoHasta: event.target.value,
                                        }))
                                    }
                                    className="h-12 rounded-xl border-zinc-200 bg-white text-base font-medium shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto border-t border-zinc-100 px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-6 md:px-10 md:pb-10 md:pt-8">
                        <Button
                            type="submit"
                            className="w-full gap-3 rounded-[1.35rem] bg-red-600 text-base font-bold text-white shadow-xl shadow-red-100 transition-all hover:bg-red-700 disabled:grayscale md:rounded-[1.5rem] md:text-lg"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <Save className="h-5 w-5" />
                                    {editingEgreso ? "Guardar Cambios" : "Registrar Gasto"}
                                </>
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="mt-2 h-11 w-full rounded-xl font-medium text-zinc-500 hover:bg-zinc-50 md:h-12"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            </div>
        </ResponsivePanel>
    );
}
