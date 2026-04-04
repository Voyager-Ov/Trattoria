"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    Clock,
    CreditCard,
    Loader2,
    LucideIcon,
    MapPin,
    PhoneOff,
    Plus,
    Save,
    Settings,
    ShieldCheck,
    Smartphone,
    Store,
    Target,
    Trash2,
    Truck,
} from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { useFieldArray, useForm, type Path, type UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { saveConfigs } from "@/app/actions/configActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsivePanel } from "@/components/ui/responsive-panel";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_PAYMENT_METHODS } from "@/lib/configDefaults";
import { DEFAULT_DELIVERY_SETTINGS, normalizeDeliverySettings, type DeliverySettings } from "@/lib/deliverySettings";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DEFAULT_WHATSAPP_TEMPLATE =
    "Hola {nombre}! Gracias por elegir La Trattoria.\n\nRecibimos tu pedido #{id} correctamente.\n\n- Entrega en: {direccion}\n- Total: {total}\n- Metodo de pago: {metodoPago}\n\nDetalle:\n{items}\n\nEstamos preparando tu pedido! Te avisaremos cuando este en camino.\n\n- Tipo de entrega: {tipoEntrega}\n- Telefono: {telefono}";

const DAYS = ["Lunes", "Martes", "Mi\u00e9rcoles", "Jueves", "Viernes", "S\u00e1bado", "Domingo"] as const;

const ConfigFormSchema = z.object({
    business: z.object({
        profile: z.object({
            name: z.string().min(1, "El nombre es requerido"),
            address: z.string().min(1, "La direccion es requerida"),
            logo: z.string().optional().or(z.literal("")),
        }),
        hours: z.record(
            z.string(),
            z.array(
                z.object({
                    start: z.string(),
                    end: z.string(),
                })
            )
        ),
        closedDays: z.array(z.string()).default([]),
    }),
    payments: z.object({
        methods: z.array(
            z.object({
                id: z.string(),
                label: z.string(),
                enabled: z.boolean(),
                sortOrder: z.number(),
            })
        ),
    }),
    integrations: z.object({
        mercadoPago: z.object({
            publicKey: z.string().optional().or(z.literal("")),
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
            deliveryFeeNear: z.number().min(0).default(0),
            deliveryFeeFar: z.number().min(0).default(0),
            estimatedTimeRange: z.string().optional().or(z.literal("")),
            allowPickup: z.boolean(),
            allowDelivery: z.boolean(),
        }),
    }),
    goals: z
        .object({
            monthly: z
                .object({
                    amount: z.number().min(0, "La meta debe ser un valor positivo."),
                    type: z.enum(["revenue", "profit"]),
                })
                .optional(),
        })
        .optional(),
});

type ConfigFormValues = z.infer<typeof ConfigFormSchema>;
type ConfigForm = UseFormReturn<ConfigFormValues>;
type ConfigSectionId = "general" | "delivery" | "payments" | "hours" | "goals";

type ConfigFormClientProps = {
    initialData: Record<string, unknown>;
};

type SectionOption = {
    id: ConfigSectionId;
    label: string;
    description: string;
    icon: LucideIcon;
};

type PaymentField = {
    id: string;
};

type SaveBarProps = {
    saving: boolean;
    isDirty: boolean;
    onSave: () => void;
};

const SECTION_OPTIONS: SectionOption[] = [
    { id: "general", label: "General", description: "Perfil y WhatsApp", icon: Store },
    { id: "delivery", label: "Delivery", description: "Envio y retiro", icon: Truck },
    { id: "payments", label: "Pagos", description: "Cobro e integraciones", icon: CreditCard },
    { id: "hours", label: "Horarios", description: "Dias y rangos", icon: Clock },
    { id: "goals", label: "Metas", description: "Objetivos mensuales", icon: Target },
];

const WHATSAPP_VARIABLES = [
    { label: "ID Pedido", value: "{id}" },
    { label: "Cliente", value: "{nombre}" },
    { label: "Direccion", value: "{direccion}" },
    { label: "Metodo Pago", value: "{metodoPago}" },
    { label: "Items", value: "{items}" },
    { label: "Total", value: "{total}" },
    { label: "Tipo Entrega", value: "{tipoEntrega}" },
    { label: "Telefono", value: "{telefono}" },
];

function getDefaultHours() {
    return DAYS.reduce<Record<string, { start: string; end: string }[]>>((accumulator, day) => {
        accumulator[day] = [{ start: "19:00", end: "23:00" }];
        return accumulator;
    }, {});
}

function getSectionOption(section: ConfigSectionId) {
    return SECTION_OPTIONS.find((option) => option.id === section) ?? SECTION_OPTIONS[0];
}

function SectionShell({
    icon: Icon,
    title,
    description,
    accentClassName,
    action,
    children,
}: {
    icon: LucideIcon;
    title: string;
    description: string;
    accentClassName: string;
    action?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm md:rounded-[2rem]">
            <div className="flex flex-col gap-4 border-b border-zinc-100 px-4 py-4 md:px-6 md:py-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", accentClassName)}>
                        <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-lg font-black tracking-tight text-zinc-900 md:text-xl">{title}</h2>
                        <p className="mt-1 text-sm leading-6 text-zinc-500">{description}</p>
                    </div>
                </div>
                {action ? <div className="shrink-0">{action}</div> : null}
            </div>
            <div className="px-4 py-4 md:px-6 md:py-6">{children}</div>
        </section>
    );
}

function StatusPill({ label, active, activeClassName }: { label: string; active: boolean; activeClassName: string }) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.14em]",
                active ? activeClassName : "bg-zinc-200/70 text-zinc-500"
            )}
        >
            <span className={cn("h-2 w-2 rounded-full", active ? "bg-current" : "bg-zinc-400")} />
            {label}: {active ? "Activo" : "Pausado"}
        </span>
    );
}

function ConfigHeader({
    currentSection,
    onOpenPicker,
    whatsappEnabled,
    deliveryEnabled,
}: {
    currentSection: SectionOption;
    onOpenPicker: () => void;
    whatsappEnabled: boolean;
    deliveryEnabled: boolean;
}) {
    const CurrentSectionIcon = currentSection.icon;

    return (
        <section className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm md:rounded-[2rem]">
            <div className="flex flex-col gap-4 px-4 py-4 md:px-6 md:py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                        <div className="text-[0.65rem] font-black uppercase tracking-[0.34em] text-zinc-400 md:text-xs">
                            Configuracion
                        </div>
                        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-900 md:text-4xl">
                            Ajustes del negocio
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 md:text-base">
                            Personaliza la operacion diaria sin perder contexto ni densidad en telefono.
                        </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-lg shadow-zinc-200 md:h-14 md:w-14">
                        <Settings size={22} />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onOpenPicker}
                    className="flex items-center justify-between rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-left lg:hidden"
                >
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-zinc-700 shadow-sm">
                            <CurrentSectionIcon size={18} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-[0.65rem] font-black uppercase tracking-[0.24em] text-zinc-400">
                                Seccion actual
                            </div>
                            <div className="truncate text-sm font-black text-zinc-900">{currentSection.label}</div>
                            <div className="truncate text-xs text-zinc-500">{currentSection.description}</div>
                        </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-zinc-500" />
                </button>

                <div className="flex flex-wrap gap-2">
                    <StatusPill label="WhatsApp" active={whatsappEnabled} activeClassName="bg-emerald-50 text-emerald-700" />
                    <StatusPill label="Delivery" active={deliveryEnabled} activeClassName="bg-orange-50 text-orange-700" />
                </div>
            </div>
        </section>
    );
}

function ConfigSectionPicker({
    open,
    onOpenChange,
    activeTab,
    onSelect,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    activeTab: ConfigSectionId;
    onSelect: (value: ConfigSectionId) => void;
}) {
    return (
        <ResponsivePanel
            open={open}
            onOpenChange={onOpenChange}
            title="Elegir seccion"
            description="Cambia entre los bloques principales de configuracion."
            mobileSide="bottom"
            contentClassName="pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
        >
            <div className="space-y-2">
                {SECTION_OPTIONS.map((section) => {
                    const Icon = section.icon;
                    const isActive = section.id === activeTab;

                    return (
                        <button
                            key={section.id}
                            type="button"
                            onClick={() => {
                                onSelect(section.id);
                                onOpenChange(false);
                            }}
                            className={cn(
                                "flex w-full items-center gap-3 rounded-[1.5rem] border px-4 py-3 text-left transition-all",
                                isActive
                                    ? "border-zinc-900 bg-zinc-900 text-white shadow-lg shadow-zinc-200"
                                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                            )}
                        >
                            <div
                                className={cn(
                                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                                    isActive ? "bg-white/10 text-white" : "bg-zinc-100 text-zinc-700"
                                )}
                            >
                                <Icon size={18} />
                            </div>
                            <div className="min-w-0">
                                <div className="font-black tracking-tight">{section.label}</div>
                                <div className={cn("text-xs", isActive ? "text-white/70" : "text-zinc-500")}>
                                    {section.description}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </ResponsivePanel>
    );
}

function ConfigDesktopNav({
    activeTab,
    onSelect,
}: {
    activeTab: ConfigSectionId;
    onSelect: (value: ConfigSectionId) => void;
}) {
    return (
        <nav className="hidden rounded-[2rem] border border-zinc-200 bg-white p-2 shadow-sm lg:flex lg:flex-col lg:gap-2">
            {SECTION_OPTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = section.id === activeTab;

                return (
                    <button
                        key={section.id}
                        type="button"
                        onClick={() => onSelect(section.id)}
                        className={cn(
                            "flex items-center gap-3 rounded-[1.5rem] px-4 py-3 text-left transition-all",
                            isActive
                                ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200"
                                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                        )}
                    >
                        <div
                            className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                                isActive ? "bg-white/10 text-white" : "bg-zinc-100 text-zinc-700"
                            )}
                        >
                            <Icon size={18} />
                        </div>
                        <div className="min-w-0">
                            <div className="font-black tracking-tight">{section.label}</div>
                            <div className={cn("text-xs", isActive ? "text-white/70" : "text-zinc-500")}>
                                {section.description}
                            </div>
                        </div>
                    </button>
                );
            })}
        </nav>
    );
}

function ConfigStatusCard({
    whatsappEnabled,
    deliveryEnabled,
}: {
    whatsappEnabled: boolean;
    deliveryEnabled: boolean;
}) {
    return (
        <div className="hidden overflow-hidden rounded-[2rem] bg-zinc-900 p-6 text-white shadow-sm lg:block">
            <div className="space-y-4">
                <div>
                    <div className="text-xs font-black uppercase tracking-[0.28em] text-zinc-400">Estado rapido</div>
                    <h3 className="mt-2 text-xl font-black tracking-tight">Sistema</h3>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-[1.25rem] bg-white/5 px-4 py-3">
                        <span className="text-sm font-semibold text-zinc-200">WhatsApp</span>
                        <span className={cn("text-xs font-black uppercase", whatsappEnabled ? "text-emerald-400" : "text-zinc-500")}>
                            {whatsappEnabled ? "Activo" : "Pausado"}
                        </span>
                    </div>
                    <div className="flex items-center justify-between rounded-[1.25rem] bg-white/5 px-4 py-3">
                        <span className="text-sm font-semibold text-zinc-200">Delivery</span>
                        <span className={cn("text-xs font-black uppercase", deliveryEnabled ? "text-orange-300" : "text-zinc-500")}>
                            {deliveryEnabled ? "Activo" : "Pausado"}
                        </span>
                    </div>
                </div>

                <p className="text-sm leading-6 text-zinc-400">
                    La configuracion se guarda por bloque para que puedas ajustar una parte sin tocar el resto.
                </p>
            </div>
        </div>
    );
}

function ConfigStickySaveBar({ saving, isDirty, onSave }: SaveBarProps) {
    return (
        <div className="sticky bottom-0 z-20 mt-6 border-t border-zinc-100 bg-[#FCFCFB]/95 px-1 pt-4 pb-[calc(0.85rem+env(safe-area-inset-bottom,0px))] supports-[backdrop-filter]:backdrop-blur md:static md:mt-4 md:border-0 md:bg-transparent md:px-0 md:pt-0 md:pb-0">
            <div className="flex md:justify-end">
                <Button
                    type="button"
                    onClick={onSave}
                    disabled={saving || !isDirty}
                    className={cn(
                        "h-12 w-full rounded-2xl border-none px-6 font-bold shadow-lg shadow-zinc-200 md:w-auto",
                        isDirty ? "bg-zinc-900 text-white hover:bg-zinc-800" : "bg-zinc-100 text-zinc-400 shadow-none"
                    )}
                >
                    {saving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            {isDirty ? "Guardar cambios" : "Configuracion al dia"}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

function GeneralSection({
    form,
    saving,
    isDirty,
    onSave,
    onInsertVariable,
    onResetTemplate,
    textareaRef,
}: {
    form: ConfigForm;
    saving: boolean;
    isDirty: boolean;
    onSave: () => void;
    onInsertVariable: (value: string) => void;
    onResetTemplate: () => void;
    textareaRef: React.MutableRefObject<HTMLTextAreaElement | null>;
}) {
    const templateField = form.register("whatsapp.settings.templateMessage");

    return (
        <div className="space-y-4 md:space-y-6">
            <SectionShell
                icon={Store}
                title="Perfil del negocio"
                description="Informacion basica de tu establecimiento para el panel y la operacion diaria."
                accentClassName="bg-zinc-100 text-zinc-700"
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">Nombre fantasia</Label>
                        <Input
                            {...form.register("business.profile.name")}
                            placeholder="Ej: La Trattoria"
                            className="h-12 rounded-2xl border-zinc-200 bg-zinc-50/60 text-base font-semibold focus-visible:ring-zinc-900"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">Direccion del local</Label>
                        <Input
                            {...form.register("business.profile.address")}
                            placeholder="Ej: Av. Principal 123"
                            className="h-12 rounded-2xl border-zinc-200 bg-zinc-50/60 text-base font-semibold focus-visible:ring-zinc-900"
                        />
                    </div>
                </div>
            </SectionShell>

            <SectionShell
                icon={Smartphone}
                title="Pedidos por WhatsApp"
                description="Configura el numero de recepcion y la plantilla automatica del mensaje."
                accentClassName="bg-emerald-100 text-emerald-600"
                action={
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                            {form.watch("whatsapp.settings.enabled") ? "Activo" : "Pausado"}
                        </span>
                        <Switch
                            checked={form.watch("whatsapp.settings.enabled")}
                            onCheckedChange={(value) =>
                                form.setValue("whatsapp.settings.enabled", value, { shouldDirty: true })
                            }
                            className="data-[state=checked]:bg-emerald-500"
                        />
                    </div>
                }
            >
                <div className="space-y-5">
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                            Numero de recepcion
                        </Label>
                        <Input
                            {...form.register("whatsapp.settings.phoneNumber")}
                            inputMode="tel"
                            placeholder="5493886033878"
                            className="h-12 rounded-2xl border-zinc-200 bg-zinc-50/60 text-base font-semibold tracking-wide focus-visible:ring-emerald-500"
                        />
                        <p className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Sin simbolos ni espacios. Ej: 549...
                        </p>
                    </div>

                    <div className="space-y-3 rounded-[1.5rem] border border-zinc-200 bg-zinc-50/60 p-4 md:p-5">
                        <div className="space-y-1">
                            <Label className="text-sm font-black tracking-tight text-zinc-900">Plantilla del mensaje</Label>
                            <p className="text-xs leading-5 text-zinc-500">
                                Inserta variables dinamicas para automatizar el texto que se envia al cliente.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {WHATSAPP_VARIABLES.map((variable) => (
                                <button
                                    key={variable.value}
                                    type="button"
                                    onClick={() => onInsertVariable(variable.value)}
                                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-600 transition hover:border-zinc-900 hover:text-zinc-900"
                                >
                                    {variable.label}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={onResetTemplate}
                                className="rounded-xl bg-zinc-900 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-zinc-800"
                            >
                                Restablecer
                            </button>
                        </div>

                        <Textarea
                            {...templateField}
                            ref={(element) => {
                                templateField.ref(element);
                                textareaRef.current = element;
                            }}
                            className="min-h-[220px] rounded-[1.5rem] border-zinc-200 bg-white p-4 text-sm leading-7 focus-visible:ring-emerald-500 md:p-5"
                        />
                    </div>
                </div>
            </SectionShell>

            <ConfigStickySaveBar saving={saving} isDirty={isDirty} onSave={onSave} />
        </div>
    );
}

function DeliverySection({
    form,
    saving,
    isDirty,
    onSave,
}: {
    form: ConfigForm;
    saving: boolean;
    isDirty: boolean;
    onSave: () => void;
}) {
    const allowPickup = form.watch("delivery.settings.allowPickup");
    const allowDelivery = form.watch("delivery.settings.allowDelivery");

    return (
        <div className="space-y-4 md:space-y-6">
            <SectionShell
                icon={Truck}
                title="Logistica de envio"
                description="Configura las referencias de entrega y las opciones disponibles para el cliente."
                accentClassName="bg-orange-100 text-orange-600"
                action={
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                            {form.watch("delivery.settings.enabled") ? "Activo" : "Pausado"}
                        </span>
                        <Switch
                            checked={form.watch("delivery.settings.enabled")}
                            onCheckedChange={(value) =>
                                form.setValue("delivery.settings.enabled", value, { shouldDirty: true })
                            }
                            className="data-[state=checked]:bg-orange-500"
                        />
                    </div>
                }
            >
                <div className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50/70 p-4">
                            <div className="mb-3 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-sm">
                                    <MapPin className="h-5 w-5" />
                                </div>
                                <div>
                                    <Label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                                        Zona cercana
                                    </Label>
                                    <div className="text-sm font-semibold text-zinc-900">Referencia de envio</div>
                                </div>
                            </div>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-zinc-300">$</span>
                                <Input
                                    type="number"
                                    {...form.register("delivery.settings.deliveryFeeNear", { valueAsNumber: true })}
                                    className="h-14 rounded-2xl border-none bg-white pl-10 text-2xl font-black shadow-sm focus-visible:ring-0"
                                    placeholder="0"
                                />
                            </div>
                            <p className="mt-3 text-xs leading-5 text-zinc-500">
                                Valor de referencia para clientes de zona proxima.
                            </p>
                        </div>

                        <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50/70 p-4">
                            <div className="mb-3 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-sm">
                                    <Truck className="h-5 w-5" />
                                </div>
                                <div>
                                    <Label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                                        Zona lejana
                                    </Label>
                                    <div className="text-sm font-semibold text-zinc-900">Referencia de envio</div>
                                </div>
                            </div>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-zinc-300">$</span>
                                <Input
                                    type="number"
                                    {...form.register("delivery.settings.deliveryFeeFar", { valueAsNumber: true })}
                                    className="h-14 rounded-2xl border-none bg-white pl-10 text-2xl font-black shadow-sm focus-visible:ring-0"
                                    placeholder="0"
                                />
                            </div>
                            <p className="mt-3 text-xs leading-5 text-zinc-500">
                                Valor de referencia para clientes de zona alejada.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-orange-100 bg-orange-50 px-4 py-4 text-sm leading-6 text-orange-800">
                        Estos valores son informativos. El costo real del envio se confirma manualmente por WhatsApp segun la zona del cliente.
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 rounded-[1.5rem] border border-zinc-200 bg-zinc-50/70 p-4">
                            <Label className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">
                                Tiempo estimado
                            </Label>
                            <Input
                                {...form.register("delivery.settings.estimatedTimeRange")}
                                placeholder="Ej: 30-45 min"
                                className="h-12 rounded-2xl border-zinc-200 bg-white text-base font-semibold focus-visible:ring-orange-500"
                            />
                            <p className="text-xs leading-5 text-zinc-500">Se muestra como referencia durante la atencion.</p>
                        </div>

                        <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50/70 p-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
                                    <div className="min-w-0">
                                        <div className="text-sm font-black text-zinc-900">Retiro en local</div>
                                        <div className="text-xs text-zinc-500">Permite modalidad pickup.</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={cn("text-xs font-black uppercase", allowPickup ? "text-emerald-600" : "text-zinc-400")}>
                                            {allowPickup ? "Activo" : "Off"}
                                        </span>
                                        <Switch
                                            checked={allowPickup}
                                            onCheckedChange={(value) =>
                                                form.setValue("delivery.settings.allowPickup", value, { shouldDirty: true })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
                                    <div className="min-w-0">
                                        <div className="text-sm font-black text-zinc-900">Envio a domicilio</div>
                                        <div className="text-xs text-zinc-500">Permite delivery tradicional.</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={cn("text-xs font-black uppercase", allowDelivery ? "text-orange-600" : "text-zinc-400")}>
                                            {allowDelivery ? "Activo" : "Off"}
                                        </span>
                                        <Switch
                                            checked={allowDelivery}
                                            onCheckedChange={(value) =>
                                                form.setValue("delivery.settings.allowDelivery", value, { shouldDirty: true })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SectionShell>

            <ConfigStickySaveBar saving={saving} isDirty={isDirty} onSave={onSave} />
        </div>
    );
}

function PaymentsSection({
    form,
    paymentFields,
    appendPayment,
    removePayment,
    saving,
    isDirty,
    onSave,
}: {
    form: ConfigForm;
    paymentFields: PaymentField[];
    appendPayment: (value: ConfigFormValues["payments"]["methods"][number]) => void;
    removePayment: (index: number) => void;
    saving: boolean;
    isDirty: boolean;
    onSave: () => void;
}) {
    const [panelOpen, setPanelOpen] = useState(false);
    const [newPaymentLabel, setNewPaymentLabel] = useState("");

    const addPaymentMethod = () => {
        const label = newPaymentLabel.trim();

        if (!label) {
            toast.error("Ingresa un nombre valido");
            return;
        }

        appendPayment({
            id: label.toUpperCase().replace(/\s+/g, "_"),
            label,
            enabled: true,
            sortOrder: paymentFields.length,
        });

        setNewPaymentLabel("");
        setPanelOpen(false);
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <SectionShell
                icon={CreditCard}
                title="Metodos de cobro"
                description="Activa, renombra o agrega opciones de pago para tus clientes."
                accentClassName="bg-emerald-100 text-emerald-600"
            >
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {paymentFields.map((field, index) => {
                            const paymentId = form.watch(`payments.methods.${index}.id`);
                            const isCash = paymentId === "EFECTIVO";

                            return (
                                <article
                                    key={field.id}
                                    className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50/70 p-4 transition hover:border-emerald-200"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <Input
                                                {...form.register(`payments.methods.${index}.label` as const)}
                                                className="h-auto border-none bg-transparent p-0 text-base font-black shadow-none focus-visible:ring-0"
                                            />
                                            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                                {paymentId}
                                            </p>
                                        </div>

                                        <Switch
                                            checked={form.watch(`payments.methods.${index}.enabled` as const)}
                                            onCheckedChange={(value) =>
                                                form.setValue(`payments.methods.${index}.enabled` as const, value, { shouldDirty: true })
                                            }
                                            className="data-[state=checked]:bg-emerald-500"
                                        />
                                    </div>

                                    <div className="mt-4 flex items-center justify-between gap-3">
                                        <span
                                            className={cn(
                                                "text-xs font-black uppercase tracking-[0.18em]",
                                                form.watch(`payments.methods.${index}.enabled` as const)
                                                    ? "text-emerald-600"
                                                    : "text-zinc-400"
                                            )}
                                        >
                                            {form.watch(`payments.methods.${index}.enabled` as const) ? "Activo" : "Pausado"}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            disabled={isCash}
                                            onClick={() => removePayment(index)}
                                            className={cn(
                                                "h-9 rounded-xl px-3 text-xs font-bold",
                                                isCash
                                                    ? "cursor-not-allowed text-zinc-300"
                                                    : "text-zinc-500 hover:bg-red-50 hover:text-red-500"
                                            )}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Eliminar
                                        </Button>
                                    </div>
                                </article>
                            );
                        })}

                        <button
                            type="button"
                            onClick={() => setPanelOpen(true)}
                            className="flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-[1.5rem] border-2 border-dashed border-zinc-200 bg-white px-4 py-6 text-center text-zinc-500 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                            <Plus className="h-6 w-6" />
                            <div className="space-y-1">
                                <div className="text-sm font-black uppercase tracking-[0.18em]">Nuevo metodo</div>
                                <div className="text-xs text-zinc-400">Agrega una opcion de pago manual.</div>
                            </div>
                        </button>
                    </div>
                </div>
            </SectionShell>

            <SectionShell
                icon={ShieldCheck}
                title="Mercado Pago"
                description="Estado de la integracion y referencia de claves publicas."
                accentClassName="bg-sky-100 text-sky-600"
                action={
                    <Switch
                        checked={form.watch("integrations.mercadoPago.enabled")}
                        onCheckedChange={(value) =>
                            form.setValue("integrations.mercadoPago.enabled", value, { shouldDirty: true })
                        }
                    />
                }
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 rounded-[1.5rem] border border-zinc-200 bg-zinc-50/70 p-4 opacity-60">
                        <Label className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">Public key</Label>
                        <Input
                            {...form.register("integrations.mercadoPago.publicKey")}
                            disabled
                            className="h-12 rounded-2xl border-zinc-200 bg-white disabled:opacity-100"
                        />
                        <p className="text-xs leading-5 text-zinc-500">
                            Campo reservado para la integracion avanzada.
                        </p>
                    </div>

                    <div className="space-y-2 rounded-[1.5rem] border border-dashed border-zinc-200 bg-zinc-50/70 p-4">
                        <Label className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">Access token</Label>
                        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-4">
                            <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                                Configurar en Vercel
                            </div>
                            <code className="mt-2 block rounded-xl bg-zinc-100 px-3 py-2 text-xs font-bold text-zinc-700">
                                MERCADOPAGO_ACCESS_TOKEN
                            </code>
                        </div>
                        <p className="text-xs leading-5 text-zinc-500">
                            El secreto no se guarda en base de datos y se administra desde variables de entorno.
                        </p>
                    </div>
                </div>
            </SectionShell>

            <ConfigStickySaveBar saving={saving} isDirty={isDirty} onSave={onSave} />

            <ResponsivePanel
                open={panelOpen}
                onOpenChange={setPanelOpen}
                title="Nuevo metodo"
                description="Agrega una nueva opcion de pago para tus clientes."
                contentClassName="pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
            >
                <div className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="new-method-name" className="text-sm font-semibold text-zinc-700">
                            Nombre del metodo
                        </Label>
                        <Input
                            id="new-method-name"
                            value={newPaymentLabel}
                            onChange={(event) => setNewPaymentLabel(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    addPaymentMethod();
                                }
                            }}
                            placeholder="Ej: Yape, Plin, QR..."
                            className="h-12 rounded-2xl border-zinc-200 text-base font-semibold"
                        />
                        <p className="text-xs leading-5 text-zinc-500">
                            El nombre sera visible para el cliente en el checkout.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setPanelOpen(false)}
                            className="h-11 rounded-2xl border-zinc-200 px-5 text-zinc-700"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={addPaymentMethod}
                            className="h-11 rounded-2xl border-none bg-zinc-900 px-5 font-bold text-white hover:bg-zinc-800"
                        >
                            <Plus className="h-4 w-4" />
                            Agregar metodo
                        </Button>
                    </div>
                </div>
            </ResponsivePanel>
        </div>
    );
}

function HoursSection({
    form,
    saving,
    isDirty,
    onSave,
    onToggleClosedDay,
    onAddTimeRange,
    onRemoveTimeRange,
}: {
    form: ConfigForm;
    saving: boolean;
    isDirty: boolean;
    onSave: () => void;
    onToggleClosedDay: (day: string) => void;
    onAddTimeRange: (day: string) => void;
    onRemoveTimeRange: (day: string, index: number) => void;
}) {
    const closedDays = form.watch("business.closedDays");

    return (
        <div className="space-y-4 md:space-y-6">
            <SectionShell
                icon={Clock}
                title="Horas de operacion"
                description="Define cuando se aceptan pedidos y cuantos rangos se atienden por dia."
                accentClassName="bg-zinc-100 text-zinc-700"
            >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {DAYS.map((day) => {
                        const isClosed = closedDays.includes(day);
                        const ranges = form.watch(`business.hours.${day}` as const) || [];

                        return (
                            <article
                                key={day}
                                className={cn(
                                    "rounded-[1.5rem] border p-4 transition-colors",
                                    isClosed ? "border-zinc-200 bg-zinc-50/80" : "border-zinc-200 bg-white"
                                )}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className={cn("text-base font-black tracking-tight", isClosed ? "text-zinc-500" : "text-zinc-900")}>
                                            {day}
                                        </h3>
                                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                            {isClosed ? "Cerrado" : "Abierto"}
                                        </p>
                                    </div>
                                    <Switch checked={!isClosed} onCheckedChange={() => onToggleClosedDay(day)} className="data-[state=checked]:bg-zinc-900" />
                                </div>

                                {!isClosed ? (
                                    <div className="mt-4 space-y-3">
                                        {ranges.map((_, index) => (
                                            <div key={`${day}-${index}`} className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50/70 p-3">
                                                <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center">
                                                    <Input
                                                        type="time"
                                                        {...form.register(`business.hours.${day}.${index}.start` as const)}
                                                        className="h-11 rounded-xl border-zinc-200 bg-white text-center font-bold"
                                                    />
                                                    <span className="hidden text-zinc-300 sm:block">-</span>
                                                    <Input
                                                        type="time"
                                                        {...form.register(`business.hours.${day}.${index}.end` as const)}
                                                        className="h-11 rounded-xl border-zinc-200 bg-white text-center font-bold"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() => onRemoveTimeRange(day, index)}
                                                        className="h-11 rounded-xl px-3 text-zinc-500 hover:bg-red-50 hover:text-red-500 sm:h-10 sm:w-10 sm:px-0"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sm:hidden">Eliminar</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => onAddTimeRange(day)}
                                            className="h-11 w-full rounded-2xl border-dashed border-zinc-200 px-4 text-sm font-bold text-zinc-600 hover:border-zinc-900 hover:text-zinc-900"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Agregar rango
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="mt-4 rounded-[1.25rem] border border-dashed border-zinc-200 bg-white px-4 py-6 text-center">
                                        <PhoneOff className="mx-auto h-6 w-6 text-zinc-300" />
                                        <p className="mt-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                            No se reciben pedidos
                                        </p>
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            </SectionShell>

            <ConfigStickySaveBar saving={saving} isDirty={isDirty} onSave={onSave} />
        </div>
    );
}

function GoalsSection({
    form,
    saving,
    isDirty,
    onSave,
}: {
    form: ConfigForm;
    saving: boolean;
    isDirty: boolean;
    onSave: () => void;
}) {
    const currentType = form.watch("goals.monthly.type") ?? "revenue";

    return (
        <div className="space-y-4 md:space-y-6">
            <SectionShell
                icon={Target}
                title="Metas del negocio"
                description="Establece un objetivo mensual para orientar el seguimiento del equipo."
                accentClassName="bg-indigo-100 text-indigo-600"
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50/70 p-4">
                        <div className="mb-3 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-indigo-500 shadow-sm">
                                <Target className="h-5 w-5" />
                            </div>
                            <div>
                                <Label className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                                    Meta mensual
                                </Label>
                                <div className="text-sm font-semibold text-zinc-900">Objetivo economico</div>
                            </div>
                        </div>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-zinc-300">$</span>
                            <Input
                                type="number"
                                {...form.register("goals.monthly.amount", { valueAsNumber: true })}
                                className="h-14 rounded-2xl border-none bg-white pl-10 text-2xl font-black shadow-sm focus-visible:ring-0"
                                placeholder="0"
                            />
                        </div>
                        <p className="mt-3 text-xs leading-5 text-zinc-500">
                            Monto que quieres alcanzar este mes con el negocio.
                        </p>
                    </div>

                    <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50/70 p-4">
                        <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                            Tipo de meta
                        </div>
                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() => form.setValue("goals.monthly.type", "revenue", { shouldDirty: true })}
                                className={cn(
                                    "flex w-full items-center justify-between rounded-[1.25rem] border p-4 text-left transition-all",
                                    currentType === "revenue"
                                        ? "border-indigo-500 bg-indigo-50 shadow-sm"
                                        : "border-zinc-200 bg-white hover:border-indigo-300"
                                )}
                            >
                                <div>
                                    <div className="font-black text-zinc-900">Ingresos totales</div>
                                    <div className="text-xs leading-5 text-zinc-500">Mide el total facturado en el mes.</div>
                                </div>
                                {currentType === "revenue" ? <CheckCircle2 className="h-5 w-5 text-indigo-500" /> : null}
                            </button>

                            <button
                                type="button"
                                onClick={() => form.setValue("goals.monthly.type", "profit", { shouldDirty: true })}
                                className={cn(
                                    "flex w-full items-center justify-between rounded-[1.25rem] border p-4 text-left transition-all",
                                    currentType === "profit"
                                        ? "border-indigo-500 bg-indigo-50 shadow-sm"
                                        : "border-zinc-200 bg-white hover:border-indigo-300"
                                )}
                            >
                                <div>
                                    <div className="font-black text-zinc-900">Ganancia neta</div>
                                    <div className="text-xs leading-5 text-zinc-500">Descuenta los egresos de los ingresos.</div>
                                </div>
                                {currentType === "profit" ? <CheckCircle2 className="h-5 w-5 text-indigo-500" /> : null}
                            </button>
                        </div>
                    </div>
                </div>
            </SectionShell>

            <ConfigStickySaveBar saving={saving} isDirty={isDirty} onSave={onSave} />
        </div>
    );
}

export default function ConfigFormClient({ initialData }: ConfigFormClientProps) {
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<ConfigSectionId>("general");
    const [sectionPickerOpen, setSectionPickerOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const getInitialValue = <T,>(key: string, fallback: T): T => {
        const value = initialData[key];
        return value === undefined ? fallback : (value as T);
    };

    const initialDeliverySettings = normalizeDeliverySettings(initialData["delivery.settings"]);

    const form = useForm<ConfigFormValues>({
        resolver: zodResolver(ConfigFormSchema),
        defaultValues: {
            business: {
                profile: getInitialValue("business.profile", { name: "", address: "", logo: "" }),
                hours: getInitialValue("business.hours", getDefaultHours()),
                closedDays: getInitialValue("business.closedDays", []),
            },
            payments: {
                methods: getInitialValue("payments.methods", DEFAULT_PAYMENT_METHODS),
            },
            integrations: {
                mercadoPago: getInitialValue("integrations.mercadoPago", { publicKey: "", enabled: false }),
            },
            whatsapp: {
                settings: getInitialValue("whatsapp.settings", {
                    phoneNumber: "",
                    templateMessage: DEFAULT_WHATSAPP_TEMPLATE,
                    enabled: true,
                }),
            },
            delivery: {
                settings: {
                    ...DEFAULT_DELIVERY_SETTINGS,
                    ...(initialDeliverySettings as DeliverySettings),
                },
            },
            goals: {
                monthly: getInitialValue("goals.monthly", { amount: 1000000, type: "revenue" as const }),
            },
        },
    });

    const { fields: paymentFields, append: appendPayment, remove: removePayment } = useFieldArray({
        control: form.control,
        name: "payments.methods",
    });

    const handleSave = async (section: ConfigSectionId) => {
        setSaving(true);

        try {
            let fieldsToValidate: Path<ConfigFormValues>[] = [];
            let payload: Record<string, unknown> = {};

            switch (section) {
                case "general":
                    fieldsToValidate = ["business.profile", "whatsapp.settings"];
                    payload = {
                        "business.profile": form.getValues("business.profile"),
                        "whatsapp.settings": form.getValues("whatsapp.settings"),
                    };
                    break;
                case "delivery":
                    fieldsToValidate = ["delivery.settings"];
                    payload = {
                        "delivery.settings": form.getValues("delivery.settings"),
                    };
                    break;
                case "payments":
                    fieldsToValidate = ["payments.methods", "integrations.mercadoPago"];
                    payload = {
                        "payments.methods": form.getValues("payments.methods"),
                        "integrations.mercadoPago": form.getValues("integrations.mercadoPago"),
                    };
                    break;
                case "hours":
                    fieldsToValidate = ["business.hours", "business.closedDays"];
                    payload = {
                        "business.hours": form.getValues("business.hours"),
                        "business.closedDays": form.getValues("business.closedDays"),
                    };
                    break;
                case "goals":
                    fieldsToValidate = ["goals.monthly"];
                    payload = {
                        "goals.monthly": form.getValues("goals.monthly"),
                    };
                    break;
            }

            const isValid = await form.trigger(fieldsToValidate);
            if (!isValid) {
                toast.error("Por favor revisa los campos requeridos en esta seccion");
                setSaving(false);
                return;
            }

            const result = await saveConfigs(payload);

            if (result.success) {
                toast.success("Seccion actualizada con exito");
                form.reset({ ...form.getValues(), ...payload });
            } else {
                toast.error(result.error || "Error al guardar");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error de conexion");
        } finally {
            setSaving(false);
        }
    };

    const insertVariable = (variable: string) => {
        const textarea = textareaRef.current;
        if (!textarea) {
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentValue = form.getValues("whatsapp.settings.templateMessage") || "";
        const nextValue = `${currentValue.substring(0, start)}${variable}${currentValue.substring(end)}`;

        form.setValue("whatsapp.settings.templateMessage", nextValue, { shouldDirty: true });

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + variable.length, start + variable.length);
        }, 0);
    };

    const resetWhatsAppTemplate = () => {
        form.setValue("whatsapp.settings.templateMessage", DEFAULT_WHATSAPP_TEMPLATE, { shouldDirty: true });
    };

    const toggleClosedDay = (day: string) => {
        const currentClosedDays = form.getValues("business.closedDays");

        if (currentClosedDays.includes(day)) {
            form.setValue(
                "business.closedDays",
                currentClosedDays.filter((value) => value !== day),
                { shouldDirty: true }
            );
        } else {
            form.setValue("business.closedDays", [...currentClosedDays, day], { shouldDirty: true });
        }
    };

    const addTimeRange = (day: string) => {
        const currentRanges = form.getValues(`business.hours.${day}` as const) || [];
        form.setValue(
            `business.hours.${day}` as const,
            [...currentRanges, { start: "19:00", end: "23:00" }],
            { shouldDirty: true }
        );
    };

    const removeTimeRange = (day: string, index: number) => {
        const currentRanges = form.getValues(`business.hours.${day}` as const) || [];
        form.setValue(
            `business.hours.${day}` as const,
            currentRanges.filter((_, currentIndex) => currentIndex !== index),
            { shouldDirty: true }
        );
    };

    const isDirty = form.formState.isDirty;
    const currentSection = getSectionOption(activeTab);

    return (
        <div className="app-page-safe-bottom mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-4 md:gap-6 md:px-5 md:py-6 xl:px-8">
            <ConfigHeader
                currentSection={currentSection}
                onOpenPicker={() => setSectionPickerOpen(true)}
                whatsappEnabled={form.watch("whatsapp.settings.enabled")}
                deliveryEnabled={form.watch("delivery.settings.enabled")}
            />

            <ConfigSectionPicker
                open={sectionPickerOpen}
                onOpenChange={setSectionPickerOpen}
                activeTab={activeTab}
                onSelect={setActiveTab}
            />

            <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
                <div className="space-y-4">
                    <ConfigDesktopNav activeTab={activeTab} onSelect={setActiveTab} />
                    <ConfigStatusCard
                        whatsappEnabled={form.watch("whatsapp.settings.enabled")}
                        deliveryEnabled={form.watch("delivery.settings.enabled")}
                    />
                </div>

                <main className="min-w-0">
                    {activeTab === "general" ? (
                        <GeneralSection
                            form={form}
                            saving={saving}
                            isDirty={isDirty}
                            onSave={() => handleSave("general")}
                            onInsertVariable={insertVariable}
                            onResetTemplate={resetWhatsAppTemplate}
                            textareaRef={textareaRef}
                        />
                    ) : null}

                    {activeTab === "delivery" ? (
                        <DeliverySection
                            form={form}
                            saving={saving}
                            isDirty={isDirty}
                            onSave={() => handleSave("delivery")}
                        />
                    ) : null}

                    {activeTab === "payments" ? (
                        <PaymentsSection
                            form={form}
                            paymentFields={paymentFields}
                            appendPayment={appendPayment}
                            removePayment={removePayment}
                            saving={saving}
                            isDirty={isDirty}
                            onSave={() => handleSave("payments")}
                        />
                    ) : null}

                    {activeTab === "hours" ? (
                        <HoursSection
                            form={form}
                            saving={saving}
                            isDirty={isDirty}
                            onSave={() => handleSave("hours")}
                            onToggleClosedDay={toggleClosedDay}
                            onAddTimeRange={addTimeRange}
                            onRemoveTimeRange={removeTimeRange}
                        />
                    ) : null}

                    {activeTab === "goals" ? (
                        <GoalsSection
                            form={form}
                            saving={saving}
                            isDirty={isDirty}
                            onSave={() => handleSave("goals")}
                        />
                    ) : null}
                </main>
            </div>

            <div
                aria-hidden="true"
                className="md:hidden"
                style={{ minHeight: "calc(var(--admin-mobile-nav-height) - 0.75rem)" }}
            />
        </div>
    );
}
