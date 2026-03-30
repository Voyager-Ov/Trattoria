"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Settings, Save, Plus, Trash2, CreditCard, Store, Clock,
    Loader2, Smartphone, ShieldCheck, MapPin, Truck, ChevronRight,
    Search, Moon, Sun, CheckCircle2, AlertCircle, PhoneOff, DollarSign, ShoppingBag, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { saveConfigs } from "@/app/actions/configActions";
import { cn } from "@/lib/utils";
import { DEFAULT_PAYMENT_METHODS } from "@/lib/configDefaults";

// --- Validations ---
const ConfigFormSchema = z.object({
    business: z.object({
        profile: z.object({
            name: z.string().min(1, "El nombre es requerido"),
            address: z.string().min(1, "La dirección es requerida"),
            logo: z.string().optional().or(z.literal("")),
        }),
        hours: z.record(z.string(), z.array(z.object({
            start: z.string(),
            end: z.string(),
        }))),
        closedDays: z.array(z.string()).default([]), // New field to track closed days
    }),
    payments: z.object({
        methods: z.array(z.object({
            id: z.string(),
            label: z.string(),
            enabled: z.boolean(),
            sortOrder: z.number(),
        })),
    }),
    integrations: z.object({
        mercadoPago: z.object({
            publicKey: z.string().optional().or(z.literal("")),
            // accessToken omitted — F-09: stored in MERCADOPAGO_ACCESS_TOKEN env var, never in DB
            enabled: z.boolean(),
        }),
    }),
    whatsapp: z.object({
        settings: z.object({
            phoneNumber: z.string().optional().or(z.literal("")),
            templateMessage: z.string().optional().or(z.literal("")),
            enabled: z.boolean(),
        }),
    }),
    delivery: z.object({
        settings: z.object({
            enabled: z.boolean(),
            minPurchase: z.number().min(0),
            deliveryFee: z.number().min(0).default(0),
            estimatedTimeRange: z.string().optional().or(z.literal("")),
            allowPickup: z.boolean(),
            allowDelivery: z.boolean(),
        }),
        zones: z.array(z.object({
            id: z.string(),
            name: z.string(),
            fee: z.number(),
            enabled: z.boolean(),
        })),
    }),
    goals: z.object({
        monthly: z.object({
            amount: z.number().min(0, "La meta debe ser un valor positivo."),
            type: z.enum(["revenue", "profit"]),
        }).optional(),
    }).optional(),
});

type ConfigFormValues = z.infer<typeof ConfigFormSchema>;

interface ConfigFormClientProps {
    initialData: Record<string, any>;
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function ConfigFormClient({ initialData }: ConfigFormClientProps) {
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("general");
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

    const whatsappVariables = [
        { label: "ID Pedido", value: "{id}" },
        { label: "Cliente", value: "{nombre}" },
        { label: "Dirección", value: "{direccion}" },
        { label: "Método Pago", value: "{metodoPago}" },
        { label: "Items", value: "{items}" },
        { label: "Total", value: "{total}" },
        { label: "Tipo Entrega", value: "{tipoEntrega}" },
        { label: "Teléfono", value: "{telefono}" },
    ];

    const form = useForm<ConfigFormValues>({
        resolver: zodResolver(ConfigFormSchema),
        defaultValues: {
            business: {
                profile: initialData["business.profile"] || { name: "", address: "", logo: "" },
                hours: initialData["business.hours"] || DAYS.reduce((acc, day) => ({ ...acc, [day]: [{ start: "19:00", end: "23:00" }] }), {}),
                closedDays: initialData["business.closedDays"] || [],
            },
            payments: {
                methods: initialData["payments.methods"] || DEFAULT_PAYMENT_METHODS,
            },
            integrations: {
                mercadoPago: initialData["integrations.mercadoPago"] || { publicKey: "", enabled: false },
            },
            whatsapp: {
                settings: initialData["whatsapp.settings"] || {
                    phoneNumber: "",
                    templateMessage: "¡Hola {nombre}! Gracias por elegir La Trattoria.\n\nRecibimos tu pedido #{id} correctamente.\n\n- Entrega en: {direccion}\n- Total: {total}\n- Método de pago: {metodoPago}\n\nDetalle:\n{items}\n\n¡Estamos preparando tu pedido! Te avisaremos cuando esté en camino.\n\n- Tipo de entrega: {tipoEntrega}\n- Teléfono: {telefono}",
                    enabled: true
                },
            },
            delivery: {
                settings: {
                    enabled: true,
                    minPurchase: 0,
                    deliveryFee: 0,
                    estimatedTimeRange: "30-45 min",
                    allowPickup: true,
                    allowDelivery: true,
                    ...initialData["delivery.settings"]
                },
            },
            goals: {
                monthly: initialData["goals.monthly"] || { amount: 1000000, type: "revenue" },
            },
        },
    });

    const { fields: paymentMethods, append: appendPayment, remove: removePayment } = useFieldArray({
        control: form.control,
        name: "payments.methods"
    });



    const handleSave = async (section: string) => {
        setSaving(true);
        try {
            let fieldsToValidate: any[] = [];
            let payload: Record<string, any> = {};

            // Determine which fields to validate and save based on the active section
            switch (section) {
                case "general":
                    fieldsToValidate = ["business.profile", "whatsapp.settings"];
                    const businessProfile = form.getValues("business.profile");
                    const whatsappSettings = form.getValues("whatsapp.settings");
                    payload = {
                        "business.profile": businessProfile,
                        "whatsapp.settings": whatsappSettings,
                    };
                    break;
                case "delivery":
                    fieldsToValidate = ["delivery.settings"];
                    const deliverySettings = form.getValues("delivery.settings");
                    payload = {
                        "delivery.settings": deliverySettings,
                    };
                    break;
                case "payments":
                    fieldsToValidate = ["payments.methods", "integrations.mercadoPago"];
                    const paymentMethods = form.getValues("payments.methods");
                    const mercadoPago = form.getValues("integrations.mercadoPago");
                    payload = {
                        "payments.methods": paymentMethods,
                        "integrations.mercadoPago": mercadoPago,
                    };
                    break;
                case "hours":
                    fieldsToValidate = ["business.hours", "business.closedDays"];
                    const businessHours = form.getValues("business.hours");
                    const closedDays = form.getValues("business.closedDays");
                    payload = {
                        "business.hours": businessHours,
                        "business.closedDays": closedDays,
                    };
                    break;
                case "goals":
                    fieldsToValidate = ["goals.monthly"];
                    const monthlyGoals = form.getValues("goals.monthly");
                    payload = {
                        "goals.monthly": monthlyGoals,
                    };
                    break;
            }

            // Validate specific fields
            const isValid = await form.trigger(fieldsToValidate);
            if (!isValid) {
                toast.error("Por favor revisa los campos requeridos en esta sección");
                setSaving(false);
                return;
            }

            // Save Only the relevant config
            const result = await saveConfigs(payload);

            if (result.success) {
                toast.success("Sección actualizada con éxito");
                // We only reset the fields we saved to keep them "pristine" in the form state
                // This is a bit tricky with react-hook-form reset, so we might just want to 
                // re-initialize the specific fields or keep it simple. 
                // For now, let's just keep the form as is, but maybe we should update defaultValues?
                // A full reset might clear other dirty fields in other tabs which is not ideal.
                // So we do:
                form.reset({ ...form.getValues(), ...payload });
            } else {
                toast.error(result.error || "Error al guardar");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error de conexión");
        } finally {
            setSaving(false);
        }
    };

    const isDirty = form.formState.isDirty;

    const insertVariable = (variable: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = form.getValues("whatsapp.settings.templateMessage") || "";
        const newValue = value.substring(0, start) + variable + value.substring(end);
        form.setValue("whatsapp.settings.templateMessage", newValue, { shouldDirty: true });
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + variable.length, start + variable.length);
        }, 0);
    };

    const toggleClosedDay = (day: string) => {
        const currentBatch = form.getValues("business.closedDays");
        if (currentBatch.includes(day)) {
            form.setValue("business.closedDays", currentBatch.filter(d => d !== day), { shouldDirty: true });
        } else {
            form.setValue("business.closedDays", [...currentBatch, day], { shouldDirty: true });
        }
    };

    const addTimeRange = (day: string) => {
        const current = form.getValues(`business.hours.${day}`) || [];
        form.setValue(`business.hours.${day}`, [...current, { start: "19:00", end: "23:00" }], { shouldDirty: true });
    };

    const removeTimeRange = (day: string, index: number) => {
        const current = form.getValues(`business.hours.${day}`) || [];
        form.setValue(`business.hours.${day}`, current.filter((_, i) => i !== index), { shouldDirty: true });
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-10 pb-32 pt-6 px-4">
            {/* Header section with floating effect */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-white shadow-xl rotate-3">
                            <Settings className="h-6 w-6" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-zinc-900 uppercase italic">
                            Configuración
                        </h1>
                    </div>
                    <p className="text-zinc-500 font-medium ml-1">Personaliza el corazón operativo de tu Trattoria.</p>
                </div>


            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Lateral Navigation (Optional, or just for visual weight) */}
                <div className="lg:col-span-3 space-y-4">
                    <nav className="flex flex-row lg:flex-col gap-2 p-2 bg-white rounded-[2rem] border border-zinc-100 shadow-sm overflow-x-auto no-scrollbar">
                        {[
                            { id: "general", label: "General", icon: Store },
                            { id: "delivery", label: "Envío & Zonas", icon: Truck },
                            { id: "payments", label: "Pagos", icon: CreditCard },
                            { id: "hours", label: "Horarios", icon: Clock },
                            { id: "goals", label: "Metas", icon: Target },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200"
                                        : "text-zinc-500 hover:bg-zinc-50"
                                )}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    {/* Quick Info Card */}
                    <div className="hidden lg:block p-8 bg-zinc-900 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden group">
                        <div className="absolute top-[-20%] right-[-20%] h-40 w-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />
                        <div className="relative z-10 space-y-4">
                            <h3 className="text-xl font-black uppercase italic leading-none">Status del Sistema</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                                    <div className={cn("h-2 w-2 rounded-full", form.watch("whatsapp.settings.enabled") ? "bg-green-500" : "bg-red-500")} />
                                    WhatsApp: {form.watch("whatsapp.settings.enabled") ? "Activo" : "Inactivo"}
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                                    <div className={cn("h-2 w-2 rounded-full", form.watch("delivery.settings.enabled") ? "bg-green-500" : "bg-red-500")} />
                                    Delivery: {form.watch("delivery.settings.enabled") ? "Activo" : "Inactivo"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Areas */}
                <div className="lg:col-span-9 space-y-12">
                    {/* General Section */}
                    {activeTab === "general" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Proflie */}
                            <Card className="rounded-[3rem] border-zinc-100 shadow-xl overflow-hidden border-none bg-white">
                                <CardHeader className="p-10 pb-6 border-b border-zinc-50">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-2xl font-black uppercase tracking-tight italic flex items-center gap-2">
                                                <Store className="h-6 w-6 text-zinc-900" />
                                                Perfil del Negocio
                                            </CardTitle>
                                            <CardDescription className="text-zinc-400 font-medium">Información básica de tu establecimiento.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-10 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Nombre Fantasía</Label>
                                            <Input
                                                {...form.register("business.profile.name")}
                                                placeholder="Ej: La Trattoria"
                                                className="h-14 rounded-2xl border-zinc-100 focus:ring-zinc-900 bg-zinc-50/30 text-lg font-bold"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Dirección del Local</Label>
                                            <Input
                                                {...form.register("business.profile.address")}
                                                placeholder="Ej: Av. Principal 123"
                                                className="h-14 rounded-2xl border-zinc-100 focus:ring-zinc-900 bg-zinc-50/30 text-lg font-bold"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* WhatsApp */}
                            <Card className="rounded-[3rem] border-none shadow-xl bg-white overflow-hidden">
                                <CardHeader className="p-10 pb-6 border-b border-zinc-50">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-2xl font-black uppercase tracking-tight italic flex items-center gap-2 text-green-600">
                                                <Smartphone className="h-6 w-6" />
                                                WhatsApp Orders
                                            </CardTitle>
                                            <CardDescription className="text-zinc-400 font-medium tracking-tight">Configura la recepción de pedidos web.</CardDescription>
                                        </div>
                                        <Switch
                                            checked={form.watch("whatsapp.settings.enabled")}
                                            onCheckedChange={(v) => form.setValue("whatsapp.settings.enabled", v, { shouldDirty: true })}
                                            className="data-[state=checked]:bg-green-500 h-7 w-12"
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-10 space-y-8">
                                    <div className="space-y-3">
                                        <Label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Número de Recepción (Formato Internacional)</Label>
                                        <div className="relative group">
                                            <Input
                                                {...form.register("whatsapp.settings.phoneNumber")}
                                                placeholder="5493886033878"
                                                className="h-14 rounded-2xl pl-12 border-zinc-100 bg-zinc-50/30 text-lg font-bold tracking-widest"
                                            />
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-green-500 transition-colors">
                                                <Plus className="h-4 w-4" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-bold text-zinc-400 flex items-center gap-1 mt-1 uppercase tracking-tighter">
                                            <AlertCircle className="h-3 w-3" /> Sin símbolos ni espacios. Ej: 549...
                                        </p>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-zinc-50">
                                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                            <div className="space-y-1">
                                                <Label className="text-sm font-black uppercase tracking-tight">Plantilla del Mensaje</Label>
                                                <p className="text-xs text-zinc-400 font-medium">Usa los bloques dinámicos para automatizar el texto.</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2 p-2 bg-zinc-50 rounded-2xl border border-zinc-100">
                                                {whatsappVariables.map((v) => (
                                                    <button
                                                        key={v.value}
                                                        type="button"
                                                        onClick={() => insertVariable(v.value)}
                                                        className="px-3 py-1.5 bg-white rounded-xl text-[10px] font-black uppercase tracking-tighter text-zinc-600 border border-zinc-100 shadow-sm hover:border-zinc-900 transition-all active:scale-95"
                                                    >
                                                        {v.label}
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const cleanTemplate = "¡Hola {nombre}! Gracias por elegir La Trattoria.\n\nRecibimos tu pedido #{id} correctamente.\n\n- Entrega en: {direccion}\n- Total: {total}\n- Método de pago: {metodoPago}\n\nDetalle:\n{items}\n\n¡Estamos preparando tu pedido! Te avisaremos cuando esté en camino.\n\n- Tipo de entrega: {tipoEntrega}\n- Teléfono: {telefono}";
                                                        form.setValue("whatsapp.settings.templateMessage", cleanTemplate, { shouldDirty: true });
                                                    }}
                                                    className="px-3 py-1.5 bg-zinc-900 rounded-xl text-[10px] font-black uppercase tracking-tighter text-white border border-zinc-900 shadow-sm hover:bg-zinc-800 transition-all active:scale-95 ml-auto"
                                                >
                                                    Restablecer
                                                </button>
                                            </div>
                                        </div>
                                        <Textarea
                                            {...form.register("whatsapp.settings.templateMessage")}
                                            ref={(e) => {
                                                form.register("whatsapp.settings.templateMessage").ref(e);
                                                textareaRef.current = e;
                                            }}
                                            className="min-h-[220px] rounded-[2rem] p-8 border-zinc-100 bg-zinc-50/30 font-medium leading-relaxed resize-none focus:ring-green-500/20"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                            <div className="flex justify-end pt-4">
                                <Button
                                    type="button"
                                    onClick={() => handleSave("general")}
                                    disabled={saving || !isDirty}
                                    className={cn(
                                        "h-14 px-10 rounded-3xl font-bold text-lg transition-all duration-300 gap-3 shadow-2xl active:scale-95",
                                        isDirty
                                            ? "bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-200"
                                            : "bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none"
                                    )}
                                >
                                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                    {isDirty ? "Guardar Cambios" : "Configuración al día"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Delivery Section */}
                    {activeTab === "delivery" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Card className="rounded-[3rem] border-none shadow-xl bg-white overflow-hidden">
                                <CardHeader className="p-10 pb-6 border-b border-zinc-50">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-2xl font-black uppercase tracking-tight italic flex items-center gap-2 text-orange-500">
                                                <Truck className="h-6 w-6" />
                                                Logística de Envío
                                            </CardTitle>
                                            <CardDescription className="text-zinc-400 font-medium tracking-tight">Controla costos y reglas de entrega.</CardDescription>
                                        </div>
                                        <Switch
                                            checked={form.watch("delivery.settings.enabled")}
                                            onCheckedChange={(v) => form.setValue("delivery.settings.enabled", v, { shouldDirty: true })}
                                            className="data-[state=checked]:bg-orange-500 h-7 w-12"
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-10 space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Costo de Envío Fijo */}
                                        <div className="space-y-4 p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 hover:border-orange-200 transition-colors group">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm text-orange-500">
                                                    <DollarSign className="h-5 w-5" />
                                                </div>
                                                <Label className="text-sm font-black uppercase tracking-wide text-zinc-500 group-hover:text-orange-600 transition-colors">Costo de Envío Fijo</Label>
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-300">$</span>
                                                <Input
                                                    type="number"
                                                    {...form.register("delivery.settings.deliveryFee", { valueAsNumber: true })}
                                                    className="h-16 pl-10 rounded-2xl border-none bg-white text-3xl font-black shadow-sm focus:ring-0"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <p className="text-xs text-zinc-400 font-medium ml-2">Costo único aplicado a todos los pedidos con envío.</p>
                                        </div>

                                        {/* Compra Mínima */}
                                        <div className="space-y-4 p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 hover:border-orange-200 transition-colors group">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm text-orange-500">
                                                    <ShoppingBag className="h-5 w-5" />
                                                </div>
                                                <Label className="text-sm font-black uppercase tracking-wide text-zinc-500 group-hover:text-orange-600 transition-colors">Compra Mínima</Label>
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-300">$</span>
                                                <Input
                                                    type="number"
                                                    {...form.register("delivery.settings.minPurchase", { valueAsNumber: true })}
                                                    className="h-16 pl-10 rounded-2xl border-none bg-white text-3xl font-black shadow-sm focus:ring-0"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <p className="text-xs text-zinc-400 font-medium ml-2">Monto mínimo requerido para realizar un pedido.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Tiempo Estimado */}
                                        <div className="space-y-3">
                                            <Label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Tiempo Estimado de Entrega</Label>
                                            <Input
                                                {...form.register("delivery.settings.estimatedTimeRange")}
                                                placeholder="Ej: 30-45 min"
                                                className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 text-lg font-bold"
                                            />
                                        </div>

                                        {/* Switches */}
                                        <div className="flex flex-col justify-center gap-4 p-6 bg-zinc-50/50 rounded-3xl border border-zinc-100">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("h-2 w-2 rounded-full", form.watch("delivery.settings.allowPickup") ? "bg-green-500" : "bg-zinc-300")} />
                                                    <Label className="text-sm font-bold text-zinc-700">Habilitar Retiro (Pickup)</Label>
                                                </div>
                                                <Switch checked={form.watch("delivery.settings.allowPickup")} onCheckedChange={(v) => form.setValue("delivery.settings.allowPickup", v, { shouldDirty: true })} />
                                            </div>
                                            <Separator className="bg-zinc-200/50" />
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("h-2 w-2 rounded-full", form.watch("delivery.settings.allowDelivery") ? "bg-orange-500" : "bg-zinc-300")} />
                                                    <Label className="text-sm font-bold text-zinc-700">Habilitar Envío a Domicilio</Label>
                                                </div>
                                                <Switch checked={form.watch("delivery.settings.allowDelivery")} onCheckedChange={(v) => form.setValue("delivery.settings.allowDelivery", v, { shouldDirty: true })} />
                                            </div>
                                        </div>
                                    </div>

                                </CardContent>
                            </Card>
                            <div className="flex justify-end pt-4">
                                <Button
                                    type="button"
                                    onClick={() => handleSave("delivery")}
                                    disabled={saving || !isDirty}
                                    className={cn(
                                        "h-14 px-10 rounded-3xl font-bold text-lg transition-all duration-300 gap-3 shadow-2xl active:scale-95",
                                        isDirty
                                            ? "bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-200"
                                            : "bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none"
                                    )}
                                >
                                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                    {isDirty ? "Guardar Cambios" : "Configuración al día"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Payments Section */}
                    {activeTab === "payments" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Card className="rounded-[3rem] border-none shadow-xl bg-white overflow-hidden">
                                <CardHeader className="p-10 pb-6 border-b border-zinc-50">
                                    <div className="space-y-1">
                                        <CardTitle className="text-2xl font-black uppercase tracking-tight italic flex items-center gap-2 text-emerald-500">
                                            <CreditCard className="h-6 w-6" />
                                            Métodos de Cobro
                                        </CardTitle>
                                        <CardDescription className="text-zinc-400 font-medium tracking-tight">Activa las opciones de pago para tus clientes.</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-10 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {paymentMethods.map((field, index) => (
                                            <div key={field.id} className="p-6 bg-white rounded-[2rem] border border-zinc-100 shadow-sm flex items-center justify-between group transition-all hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/5">
                                                <div className="flex-1 space-y-0.5">
                                                    <Input
                                                        {...form.register(`payments.methods.${index}.label`)}
                                                        className="h-7 border-none p-0 text-base font-black focus:ring-0 shadow-none leading-none"
                                                    />
                                                    <p className="text-[10px] text-zinc-300 font-black uppercase italic tracking-tighter">
                                                        {form.watch(`payments.methods.${index}.id`)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Switch
                                                        checked={form.watch(`payments.methods.${index}.enabled`)}
                                                        onCheckedChange={(v) => form.setValue(`payments.methods.${index}.enabled`, v, { shouldDirty: true })}
                                                        className="data-[state=checked]:bg-emerald-500"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        disabled={form.watch(`payments.methods.${index}.id`) === 'EFECTIVO'}
                                                        onClick={() => removePayment(index)}
                                                        className={cn(
                                                            "h-8 w-8 rounded-lg",
                                                            form.watch(`payments.methods.${index}.id`) === 'EFECTIVO'
                                                                ? "text-zinc-100 cursor-not-allowed"
                                                                : "text-zinc-200 hover:text-red-500"
                                                        )}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}

                                        <Sheet>
                                            <SheetTrigger asChild>
                                                <Button
                                                    type="button"
                                                    className="h-full min-h-[100px] rounded-[2rem] border-2 border-dashed border-zinc-100 bg-zinc-50/10 hover:border-emerald-500/30 hover:bg-emerald-50 transition-all flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-emerald-600"
                                                >
                                                    <Plus className="h-6 w-6" />
                                                    <span className="text-xs font-black uppercase tracking-widest">Nuevo Método</span>
                                                </Button>
                                            </SheetTrigger>
                                            <SheetContent className="sm:max-w-xl rounded-l-[3rem] border-zinc-100 overflow-y-auto p-10">
                                                <SheetHeader className="mb-10">
                                                    <div className="flex items-center gap-4 mb-4">
                                                        <div className="h-14 w-14 bg-emerald-500 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-emerald-200">
                                                            <CreditCard size={28} />
                                                        </div>
                                                    </div>
                                                    <SheetTitle className="text-4xl font-bold text-zinc-900 tracking-tight">
                                                        Nuevo Método
                                                    </SheetTitle>
                                                    <SheetDescription className="text-zinc-500 text-lg">
                                                        Agrega una nueva opción de pago para tus clientes.
                                                    </SheetDescription>
                                                </SheetHeader>

                                                <div className="space-y-10">
                                                    <div className="space-y-6">
                                                        <Label className="text-sm font-bold uppercase tracking-widest text-zinc-400">Detalles del Método</Label>
                                                        <div className="space-y-2">
                                                            <div className="text-zinc-700 font-bold flex items-center gap-2 text-sm">
                                                                <CreditCard size={14} className="text-zinc-400" />
                                                                Nombre del Método
                                                            </div>
                                                            <Input
                                                                id="new-method-name"
                                                                placeholder="Ej: Yape, Plin, QR..."
                                                                className="h-12 rounded-xl border-zinc-200 bg-white focus-visible:ring-zinc-400 text-base font-medium shadow-sm"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") {
                                                                        e.preventDefault();
                                                                        const input = e.currentTarget as HTMLInputElement;
                                                                        const label = input.value.trim();
                                                                        if (label) {
                                                                            appendPayment({
                                                                                id: label.toUpperCase().replace(/\s+/g, '_'),
                                                                                label,
                                                                                enabled: true,
                                                                                sortOrder: paymentMethods.length
                                                                            });
                                                                            input.value = "";
                                                                            document.getElementById("close-sheet")?.click();
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                            <p className="text-xs text-zinc-400 font-medium ml-2">El nombre que verán tus clientes al pagar.</p>
                                                        </div>
                                                    </div>

                                                    <div className="pt-6">
                                                        <SheetClose asChild>
                                                            <Button
                                                                id="close-sheet"
                                                                type="button"
                                                                onClick={(e) => {
                                                                    const input = document.getElementById("new-method-name") as HTMLInputElement;
                                                                    const label = input?.value.trim();

                                                                    if (label) {
                                                                        appendPayment({
                                                                            id: label.toUpperCase().replace(/\s+/g, '_'),
                                                                            label,
                                                                            enabled: true,
                                                                            sortOrder: paymentMethods.length
                                                                        });
                                                                        input.value = "";
                                                                    } else {
                                                                        e.preventDefault();
                                                                        toast.error("Ingresa un nombre válido");
                                                                    }
                                                                }}
                                                                className="w-full h-14 rounded-[1.5rem] bg-zinc-900 text-white hover:bg-zinc-800 shadow-xl shadow-zinc-200 transition-all font-bold text-lg gap-3"
                                                            >
                                                                <Plus className="h-5 w-5" />
                                                                Agregar Método
                                                            </Button>
                                                        </SheetClose>
                                                    </div>
                                                </div>
                                            </SheetContent>
                                        </Sheet>
                                    </div>

                                    <Separator className="my-10 bg-zinc-50" />

                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500">
                                                <ShieldCheck className="h-6 w-6" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <h4 className="text-sm font-black uppercase tracking-tight italic">Mercado Pago</h4>
                                                <p className="text-[10px] text-sky-600/60 font-medium uppercase tracking-widest">Próximamente Integración Pro</p>
                                            </div>
                                            <div className="ml-auto">
                                                <Switch checked={form.watch("integrations.mercadoPago.enabled")} onCheckedChange={(v) => form.setValue("integrations.mercadoPago.enabled", v, { shouldDirty: true })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-40 pointer-events-none select-none">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Public Key</Label>
                                                <Input {...form.register("integrations.mercadoPago.publicKey")} className="h-12 rounded-2xl border-zinc-100 bg-zinc-50/50" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Access Token</Label>
                                                {/* F-09: Secret never stored in DB — configure via environment variable */}
                                                <div className="h-12 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 flex items-center gap-3 px-4">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Configurar en Vercel via</span>
                                                    <code className="text-[10px] font-bold bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded-md">MERCADOPAGO_ACCESS_TOKEN</code>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <div className="flex justify-end pt-4">
                                <Button
                                    type="button"
                                    onClick={() => handleSave("payments")}
                                    disabled={saving || !isDirty}
                                    className={cn(
                                        "h-14 px-10 rounded-3xl font-bold text-lg transition-all duration-300 gap-3 shadow-2xl active:scale-95",
                                        isDirty
                                            ? "bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-200"
                                            : "bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none"
                                    )}
                                >
                                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                    {isDirty ? "Guardar Cambios" : "Configuración al día"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Hours Section */}
                    {activeTab === "hours" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Card className="rounded-[3rem] border-none shadow-xl bg-white overflow-hidden">
                                <CardHeader className="p-10 pb-6 border-b border-zinc-50">
                                    <div className="space-y-1">
                                        <CardTitle className="text-2xl font-black uppercase tracking-tight italic flex items-center gap-2 text-zinc-900">
                                            <Clock className="h-6 w-6" />
                                            Horas de Operación
                                        </CardTitle>
                                        <CardDescription className="text-zinc-400 font-medium tracking-tight">Define cuándo se aceptan pedidos en la plataforma.</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                                        {DAYS.map((day) => {
                                            const isClosed = form.watch("business.closedDays").includes(day);
                                            return (
                                                <div
                                                    key={day}
                                                    className={cn(
                                                        "p-8 rounded-[2.5rem] border transition-all duration-500 relative overflow-hidden",
                                                        isClosed
                                                            ? "bg-zinc-50 border-zinc-100 grayscale-[0.8]"
                                                            : "bg-white border-zinc-50 shadow-sm shadow-zinc-200/20 hover:shadow-xl hover:shadow-zinc-300/10"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between mb-8">
                                                        <div className="space-y-0.5">
                                                            <h5 className={cn("text-lg font-black uppercase tracking-tight italic transition-colors", isClosed ? "text-zinc-400" : "text-zinc-900")}>
                                                                {day}
                                                            </h5>
                                                            <p className="text-[10px] font-black uppercase text-zinc-300 tracking-[0.2em]">{isClosed ? "Cerrado" : "Abierto"}</p>
                                                        </div>
                                                        <Switch
                                                            checked={!isClosed}
                                                            onCheckedChange={() => toggleClosedDay(day)}
                                                            className="data-[state=checked]:bg-zinc-900"
                                                        />
                                                    </div>

                                                    {!isClosed && (
                                                        <div className="space-y-4">
                                                            {(form.watch(`business.hours.${day}`) || []).map((range, idx) => (
                                                                <div key={idx} className="grid grid-cols-[1fr_auto_1fr_2rem] items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                                                                    <Input
                                                                        type="time"
                                                                        {...form.register(`business.hours.${day}.${idx}.start`)}
                                                                        className="h-10 w-full min-w-0 rounded-xl text-center font-black text-xs border-zinc-100 bg-zinc-50/20 px-1"
                                                                    />
                                                                    <span className="text-zinc-200 font-black">—</span>
                                                                    <Input
                                                                        type="time"
                                                                        {...form.register(`business.hours.${day}.${idx}.end`)}
                                                                        className="h-10 w-full min-w-0 rounded-xl text-center font-black text-xs border-zinc-100 bg-zinc-50/20 px-1"
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        onClick={() => removeTimeRange(day, idx)}
                                                                        className="h-8 w-8 text-zinc-300 hover:text-red-500 rounded-lg shrink-0 justify-self-end hover:bg-zinc-100"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                            <Button
                                                                type="button"
                                                                onClick={() => addTimeRange(day)}
                                                                variant="outline"
                                                                className="w-full h-10 rounded-2xl border-dashed border-zinc-200 text-zinc-400 hover:text-zinc-900 hover:border-zinc-900 transition-all font-bold text-xs gap-2"
                                                            >
                                                                <Plus className="h-3 w-3" /> Agregar Rango
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {isClosed && (
                                                        <div className="h-32 flex flex-col items-center justify-center text-zinc-300 space-y-2">
                                                            <PhoneOff className="h-8 w-8 opacity-20" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">No se reciben pedidos</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                            <div className="flex justify-end pt-4">
                                <Button
                                    type="button"
                                    onClick={() => handleSave("hours")}
                                    disabled={saving || !isDirty}
                                    className={cn(
                                        "h-14 px-10 rounded-3xl font-bold text-lg transition-all duration-300 gap-3 shadow-2xl active:scale-95",
                                        isDirty
                                            ? "bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-200"
                                            : "bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none"
                                    )}
                                >
                                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                    {isDirty ? "Guardar Cambios" : "Configuración al día"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Goals Section */}
                    {activeTab === "goals" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Card className="rounded-[3rem] border-none shadow-xl bg-white overflow-hidden">
                                <CardHeader className="p-10 pb-6 border-b border-zinc-50">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-2xl font-black uppercase tracking-tight italic flex items-center gap-2 text-indigo-500">
                                                <Target className="h-6 w-6" />
                                                Metas del Negocio
                                            </CardTitle>
                                            <CardDescription className="text-zinc-400 font-medium tracking-tight">Establece objetivos mensuales para motivar a tu equipo.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-10 space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Target Amount */}
                                        <div className="space-y-4 p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 hover:border-indigo-200 transition-colors group">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm text-indigo-500">
                                                    <Target className="h-5 w-5" />
                                                </div>
                                                <Label className="text-sm font-black uppercase tracking-wide text-zinc-500 group-hover:text-indigo-600 transition-colors">Meta Mensual</Label>
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-300">$</span>
                                                <Input
                                                    type="number"
                                                    {...form.register("goals.monthly.amount", { valueAsNumber: true })}
                                                    className="h-16 pl-10 rounded-2xl border-none bg-white text-3xl font-black shadow-sm focus:ring-0"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <p className="text-xs text-zinc-400 font-medium ml-2">El objetivo monetario que deseas alcanzar este mes.</p>
                                        </div>

                                        {/* Goal Type */}
                                        <div className="space-y-4 p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 transition-colors">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm text-zinc-600">
                                                    <Store className="h-5 w-5" />
                                                </div>
                                                <Label className="text-sm font-black uppercase tracking-wide text-zinc-800">Tipo de Meta</Label>
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => form.setValue("goals.monthly.type", "revenue", { shouldDirty: true })}
                                                    className={cn(
                                                        "flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left",
                                                        form.watch("goals.monthly.type") === "revenue"
                                                            ? "border-indigo-500 bg-indigo-500/5 shadow-sm"
                                                            : "border-zinc-200 bg-white hover:border-indigo-300 hover:bg-zinc-50"
                                                    )}
                                                >
                                                    <div>
                                                        <h4 className="font-bold text-zinc-900">Ingresos Totales</h4>
                                                        <p className="text-xs font-medium text-zinc-500">Mide el total facturado en el mes.</p>
                                                    </div>
                                                    {form.watch("goals.monthly.type") === "revenue" && <CheckCircle2 className="h-5 w-5 text-indigo-500" />}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => form.setValue("goals.monthly.type", "profit", { shouldDirty: true })}
                                                    className={cn(
                                                        "flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left",
                                                        form.watch("goals.monthly.type") === "profit"
                                                            ? "border-indigo-500 bg-indigo-500/5 shadow-sm"
                                                            : "border-zinc-200 bg-white hover:border-indigo-300 hover:bg-zinc-50"
                                                    )}
                                                >
                                                    <div>
                                                        <h4 className="font-bold text-zinc-900">Ganancia Neta</h4>
                                                        <p className="text-xs font-medium text-zinc-500">Mide los ingresos descontando los egresos.</p>
                                                    </div>
                                                    {form.watch("goals.monthly.type") === "profit" && <CheckCircle2 className="h-5 w-5 text-indigo-500" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <div className="flex justify-end pt-4">
                                <Button
                                    type="button"
                                    onClick={() => handleSave("goals")}
                                    disabled={saving || !isDirty}
                                    className={cn(
                                        "h-14 px-10 rounded-3xl font-bold text-lg transition-all duration-300 gap-3 shadow-2xl active:scale-95",
                                        isDirty
                                            ? "bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-200"
                                            : "bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none"
                                    )}
                                >
                                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                    {isDirty ? "Guardar Cambios" : "Configuración al día"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
