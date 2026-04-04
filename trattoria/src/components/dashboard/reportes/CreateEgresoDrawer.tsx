"use client";

import { useEffect, useState } from "react";
import { CategoriaEgreso } from "@prisma/client";
import {
    Calendar,
    CreditCard,
    DollarSign,
    FileText,
    Home,
    Loader2,
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
        metodoPago?: string;
        fecha: Date | string;
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
    const [formData, setFormData] = useState({
        descripcion: "",
        monto: "",
        categoria: "OTROS" as CategoriaEgreso,
        metodoPago: "EFECTIVO",
        fecha: new Date().toISOString().split("T")[0],
    });

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

        fetchPaymentMethods();
    }, []);

    useEffect(() => {
        if (editingEgreso) {
            setFormData({
                descripcion: editingEgreso.descripcion || "",
                monto: editingEgreso.monto.toString(),
                categoria: (editingEgreso.categoria as CategoriaEgreso) || "OTROS",
                metodoPago: editingEgreso.metodoPago || "EFECTIVO",
                fecha: new Date(editingEgreso.fecha).toISOString().split("T")[0],
            });
            return;
        }

        setFormData({
            descripcion: "",
            monto: "",
            categoria: "OTROS",
            metodoPago: paymentMethods.length > 0 ? paymentMethods[0].id : "EFECTIVO",
            fecha: new Date().toISOString().split("T")[0],
        });
    }, [editingEgreso, open, paymentMethods]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!formData.descripcion || !formData.monto) {
            toast.error("Por favor completa los campos obligatorios");
            return;
        }

        setIsLoading(true);
        try {
            const data = {
                ...formData,
                monto: parseFloat(formData.monto),
                fecha: new Date(formData.fecha),
            };

            const result = editingEgreso ? await updateEgreso(editingEgreso.id, data) : await createEgreso(data);

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
                    <div className="mb-8 px-6 pt-6 text-left md:px-10 md:pt-10">
                        <div className="mb-4 flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-red-600 text-white shadow-xl shadow-red-100">
                                {editingEgreso ? <FileText size={28} /> : <TrendingDown size={20} />}
                            </div>
                        </div>
                        <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
                            {editingEgreso ? "Editar Gasto" : "Registrar Gasto"}
                        </h2>
                        <p className="text-lg text-zinc-500">
                            {editingEgreso
                                ? "Modifica los detalles del gasto registrado."
                                : "Registra un nuevo egreso de dinero para tu negocio."}
                        </p>
                    </div>

                    <div className="flex-1 space-y-8 overflow-y-auto px-6 pb-8 md:px-10">
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

                        <div className="space-y-3">
                            <Label className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-400">
                                <CreditCard size={14} />
                                Metodo de Pago
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

                        <div className="space-y-5">
                            <Label className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                                Detalles del Gasto
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="monto" className="flex items-center gap-2 font-bold text-zinc-700">
                                        <DollarSign size={14} className="text-zinc-400" />
                                        Monto *
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
                        </div>
                    </div>

                    <div className="mt-auto border-t border-zinc-100 px-6 pb-6 pt-8 md:px-10 md:pb-10">
                        <Button
                            type="submit"
                            className="w-full gap-3 rounded-[1.5rem] bg-red-600 text-lg font-bold text-white shadow-xl shadow-red-100 transition-all hover:bg-red-700 disabled:grayscale"
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
                            className="mt-2 h-12 w-full rounded-xl font-medium text-zinc-500 hover:bg-zinc-50"
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
