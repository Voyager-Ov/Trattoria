"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Minus, Plus, Send, ShoppingBag, ShoppingCart, Trash2 } from "lucide-react";
import { createPublicOrder } from "@/app/actions/orders";
import { getConfigs } from "@/app/actions/configActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DEFAULT_PAYMENT_METHODS } from "@/lib/configDefaults";
import { normalizeDeliverySettings, type DeliverySettings } from "@/lib/deliverySettings";
import { getStoreStatus, type BusinessHours, type StoreStatus } from "@/lib/openingHours";
import { cn } from "@/lib/utils";
import { useCart } from "@/providers/CartProvider";

type Step = "cart" | "checkout";
type DeliveryMode = "envio" | "retiro";
type PaymentMethod = {
    id: string;
    label: string;
    enabled: boolean;
    sortOrder?: number;
};
type WhatsAppSettings = {
    enabled?: boolean;
    phoneNumber?: string;
    templateMessage?: string;
};
type CartConfigs = {
    "whatsapp.settings"?: WhatsAppSettings;
    "payments.methods"?: PaymentMethod[];
    "delivery.settings"?: DeliverySettings;
    "business.hours"?: BusinessHours;
    "business.closedDays"?: string[];
};

export function CartDrawer() {
    const { items, removeItem, updateQuantity, totalPrice, totalItems, clearCart } = useCart();
    const [isBouncing, setIsBouncing] = useState(false);
    const [step, setStep] = useState<Step>("cart");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [configs, setConfigs] = useState<CartConfigs | null>(null);
    const [storeStatus, setStoreStatus] = useState<StoreStatus>({ isOpen: true });
    const [formData, setFormData] = useState({
        nombre: "",
        telefono: "",
        direccion: "",
        metodoPago: "",
        tipoEntrega: "envio" as DeliveryMode,
        pagaCon: "",
    });

    useEffect(() => {
        if (!totalItems) return;
        setIsBouncing(true);
        const timer = setTimeout(() => setIsBouncing(false), 300);
        return () => clearTimeout(timer);
    }, [totalItems]);

    useEffect(() => {
        async function load() {
            const res = await getConfigs(["whatsapp.settings", "payments.methods", "delivery.settings", "business.hours", "business.closedDays"]);
            if (!res.success || !res.data) return;
            const data = res.data as CartConfigs;
            setConfigs(data);
            const methods: PaymentMethod[] = data["payments.methods"]?.length ? data["payments.methods"] : DEFAULT_PAYMENT_METHODS;
            const firstEnabled = methods.find((method) => method.enabled);
            const deliverySettings = normalizeDeliverySettings(data["delivery.settings"]);
            setFormData((prev) => ({
                ...prev,
                metodoPago: firstEnabled?.id || prev.metodoPago,
                tipoEntrega: !deliverySettings.allowDelivery && deliverySettings.allowPickup ? "retiro" : prev.tipoEntrega,
            }));
            setStoreStatus(getStoreStatus(data["business.hours"] || {}, data["business.closedDays"] || []));
        }
        load();
    }, []);

    const deliverySettings = normalizeDeliverySettings(configs?.["delivery.settings"]);
    const paymentMethods: PaymentMethod[] = (configs?.["payments.methods"]?.length ? configs["payments.methods"] : DEFAULT_PAYMENT_METHODS).filter((method) => method.enabled);
    const isDelivery = formData.tipoEntrega === "envio";
    const isCashPayment = formData.metodoPago === "EFECTIVO";
    const cashAmount = Number(formData.pagaCon);
    const hasValidCashAmount = !isCashPayment || (formData.pagaCon.trim() !== "" && Number.isFinite(cashAmount) && cashAmount > 0);
    const isCheckoutFormValid =
        formData.nombre.trim() !== "" &&
        formData.telefono.trim() !== "" &&
        formData.metodoPago !== "" &&
        (!isDelivery || formData.direccion.trim() !== "") &&
        hasValidCashAmount;
    const nearFee = deliverySettings.deliveryFeeNear.toLocaleString("es-CL");
    const farFee = deliverySettings.deliveryFeeFar.toLocaleString("es-CL");

    const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    async function handleConfirmOrder() {
        if (isSubmitting) return;
        if (!formData.nombre || !formData.telefono || !formData.metodoPago) return toast.error("Por favor completa todos los campos requeridos");
        if (isDelivery && !formData.direccion.trim()) return toast.error("Por favor ingresa una dirección de entrega");
        if (!hasValidCashAmount) return toast.error("Por favor indica con cuánto vas a pagar en efectivo");
        const whatsappSettings = configs?.["whatsapp.settings"];
        if (!whatsappSettings?.enabled || !whatsappSettings?.phoneNumber) return toast.error("La confirmación por WhatsApp no está disponible en este momento.");

        setIsSubmitting(true);
        try {
            const result = await createPublicOrder({
                clienteNombre: formData.nombre,
                clienteTelefono: formData.telefono,
                clienteDireccion: isDelivery ? formData.direccion.trim() : "",
                tipoEntrega: isDelivery ? "DELIVERY" : "RETIRO",
                metodoPago: formData.metodoPago,
                total: totalPrice,
                items: items.map((item) => ({ 
                    productId: item.id, 
                    cantidad: item.quantity, 
                    precioUnitario: Number(item.precio), 
                    nombreProduct: item.nombre,
                    options: item.selectedOptions
                })),
            });
            if (!result.success) return toast.error(result.error || "Error al procesar el pedido");

            const itemsText = items.map((item) => {
                const optionsText = item.selectedOptions?.length 
                    ? ` (${item.selectedOptions.map(o => o.optionLabel).join(", ")})` 
                    : "";
                const itemPrice = Number(item.precio) + (item.selectedOptions || []).reduce((sum, opt) => sum + opt.priceDelta, 0);
                return `• ${item.nombre}${optionsText} x${item.quantity} - $${(itemPrice * item.quantity).toLocaleString("es-CL")}`;
            }).join("\n");
            const paymentLabel = paymentMethods.find((method) => method.id === formData.metodoPago)?.label || formData.metodoPago;
            const addressLabel = isDelivery ? formData.direccion.trim() : "Retiro en el local";
            let message = (whatsappSettings.templateMessage || "Hola {nombre}, recibimos tu pedido #{id}.")
                .replace(/{id}/g, result.orderNumber?.toString() || "")
                .replace(/{nombre}/g, formData.nombre)
                .replace(/{direccion}/g, addressLabel)
                .replace(/{metodoPago}/g, paymentLabel)
                .replace(/{items}/g, itemsText)
                .replace(/{tipoEntrega}/g, isDelivery ? "Delivery" : "Retiro")
                .replace(/{total}/g, `$${totalPrice.toLocaleString("es-CL")}`);
            message += `\n\n📌 *Tipo de entrega:* ${isDelivery ? "Delivery" : "Retiro en el local"}`;
            message += `\n\n💵 *Total productos: $${totalPrice.toLocaleString("es-CL")}*`;
            if (isDelivery) {
                message += `\n\n🚚 *Costo de envío a confirmar según zona:*`;
                message += `\n• Zona cercana: $${nearFee}`;
                message += `\n• Zona lejana: $${farFee}`;
                message += `\nEl monto final de envío será informado por el local.`;
            }
            if (isCashPayment && formData.pagaCon) {
                const pagaCon = Number(formData.pagaCon);
                message += `\n\n💰 *Paga con:* $${pagaCon.toLocaleString("es-CL")}`;
                message += `\n💵 *Vuelto aprox (sin envío):* $${(pagaCon - totalPrice).toLocaleString("es-CL")}`;
            }
            if (formData.telefono) message += `\n📞 *Teléfono:* ${formData.telefono}`;

            clearCart();
            setStep("cart");
            setFormData({
                nombre: "",
                telefono: "",
                direccion: "",
                metodoPago: paymentMethods[0]?.id || "",
                tipoEntrega: !deliverySettings.allowDelivery && deliverySettings.allowPickup ? "retiro" : "envio",
                pagaCon: "",
            });
            toast.success("¡Pedido creado! Redirigiendo a WhatsApp...");
            setTimeout(() => {
                window.location.href = `https://wa.me/${(whatsappSettings.phoneNumber ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
            }, 100);
        } catch (error) {
            console.error("Error inesperado al crear el pedido:", error);
            toast.error("Ocurrió un error inesperado al crear el pedido");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Sheet onOpenChange={(open) => !open && setStep("cart")}>
            <SheetTrigger asChild>
                <Button variant="default" className={`h-16 rounded-full px-8 flex items-center gap-4 bg-[#E30909] text-white shadow-2xl shadow-[#E30909]/40 hover:shadow-[#A00101]/50 hover:bg-[#A00101] transition-all border-none ${isBouncing ? "scale-110" : "hover:scale-105 active:scale-95"}`}>
                    <div className="relative">
                        <ShoppingCart className="h-7 w-7" />
                        {totalItems > 0 && <span className="absolute -top-2 -right-3 bg-zinc-900 text-white text-[11px] font-black h-6 w-6 rounded-full flex items-center justify-center ring-4 ring-[#E30909] shadow-lg">{totalItems}</span>}
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#FFF]">Tu Carrito</span>
                        <span className="text-lg font-black font-outfit">${totalPrice.toLocaleString("es-CL")}</span>
                    </div>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-full flex-col rounded-l-[2rem] border-none bg-background p-0 sm:max-w-md">
                <SheetHeader className="p-5 pb-1">
                    <div className="mb-1.5 flex items-center gap-3">
                        {step === "checkout" && <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setStep("cart")}><ArrowLeft className="h-5 w-5" /></Button>}
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><ShoppingBag className="h-4.5 w-4.5 text-primary" /></div>
                        <SheetTitle className="font-outfit text-[1.9rem] font-bold leading-none">{step === "cart" ? "Mi Pedido" : "Datos de Entrega"}</SheetTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">{step === "cart" ? "Revisa tus productos antes de confirmar" : "Completa la información para tu pedido"}</p>
                </SheetHeader>

                {!storeStatus.isOpen && <div className="mx-5 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-600">{storeStatus.message || "Por el momento no estamos recibiendo pedidos."}</div>}

                <div className="my-3 flex-1 overflow-y-auto px-5 scrollbar-hide">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="h-20 w-20 rounded-full bg-secondary/50 flex items-center justify-center"><ShoppingCart className="h-10 w-10 text-muted-foreground" /></div>
                            <div className="space-y-1"><p className="font-bold text-lg">Tu carrito está vacío</p><p className="text-sm text-muted-foreground">Explora nuestro menú y agrega tus platos favoritos</p></div>
                        </div>
                    ) : step === "cart" ? (
                        <div className="space-y-6">
                            {items.map((item) => (
                                <div key={item.lineKey} className="flex gap-4 group">
                                    <div className="h-20 w-20 rounded-2xl overflow-hidden bg-secondary/30 flex-shrink-0"><img src={item.imagen || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200"} alt={item.nombre} className="h-full w-full object-cover" /></div>
                                    <div className="flex-1 flex flex-col justify-between py-0.5">
                                        <div className="flex justify-between gap-2"><div className="min-w-0"><h4 className="font-bold text-sm leading-tight line-clamp-2">{item.nombre}</h4>{item.selectedOptions?.length ? <p className="mt-1 text-[10px] font-medium text-zinc-500 line-clamp-2">{item.selectedOptions.map((option) => `${option.groupLabel}: ${option.optionLabel}`).join(" · ")}</p> : null}</div><button onClick={() => removeItem(item.lineKey)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button></div>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center bg-secondary/50 rounded-lg p-1">
                                                <button onClick={() => updateQuantity(item.lineKey, item.quantity - 1)} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-background transition-colors"><Minus className="h-3 w-3" /></button>
                                                <span className="w-8 text-center text-sm font-bold font-outfit">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.lineKey, item.quantity + 1)} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-background transition-colors"><Plus className="h-3 w-3" /></button>
                                            </div>
                                             <span className="font-bold text-primary">
                                                 ${((Number(item.precio) + (item.selectedOptions || []).reduce((sum, opt) => sum + opt.priceDelta, 0)) * item.quantity).toLocaleString("es-CL")}
                                             </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                            {(deliverySettings.allowDelivery || deliverySettings.allowPickup) && <div className="flex gap-1 rounded-xl bg-secondary/55 p-1">{deliverySettings.allowDelivery && <button onClick={() => setFormData((prev) => ({ ...prev, tipoEntrega: "envio" }))} className={cn("flex-1 rounded-lg px-3 py-2.5 text-[15px] font-bold transition-all", isDelivery ? "border border-zinc-200 bg-background text-zinc-950 shadow-[0_6px_18px_rgba(15,23,42,0.12)]" : "text-muted-foreground hover:text-zinc-700")}>Delivery</button>}{deliverySettings.allowPickup && <button onClick={() => setFormData((prev) => ({ ...prev, tipoEntrega: "retiro" }))} className={cn("flex-1 rounded-lg px-3 py-2.5 text-[15px] font-bold transition-all", !isDelivery ? "border border-zinc-200 bg-background text-zinc-950 shadow-[0_6px_18px_rgba(15,23,42,0.12)]" : "text-muted-foreground hover:text-zinc-700")}>Retiro</button>}</div>}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5"><Label htmlFor="nombre" className="text-[13px] font-semibold text-zinc-800">Tu Nombre</Label><Input id="nombre" name="nombre" value={formData.nombre} onChange={onInput} className="h-10 rounded-lg border-[1.5px] px-3 text-sm" /></div>
                                <div className="space-y-1.5"><Label htmlFor="telefono" className="text-[13px] font-semibold text-zinc-800">Teléfono</Label><Input id="telefono" name="telefono" type="tel" inputMode="tel" value={formData.telefono} onChange={onInput} className="h-10 rounded-lg border-[1.5px] px-3 text-sm" /></div>
                            </div>
                            {isDelivery && <div className="space-y-1.5"><Label htmlFor="direccion" className="text-[13px] font-semibold text-zinc-800">Dirección de Entrega</Label><Input id="direccion" name="direccion" value={formData.direccion} onChange={onInput} className="h-10 rounded-lg border-[1.5px] px-3 text-sm" /></div>}
                            {isDelivery && <div className="space-y-1.5 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2.5"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-orange-700">Envío informativo</p><div className="flex justify-between text-[13px]"><span className="text-orange-800">Zona cercana</span><span className="font-bold text-orange-900">${nearFee}</span></div><div className="flex justify-between text-[13px]"><span className="text-orange-800">Zona lejana</span><span className="font-bold text-orange-900">${farFee}</span></div><p className="text-[10px] leading-tight text-orange-700">El costo final del envío se confirma por WhatsApp según la zona.</p></div>}
                            <div className="space-y-2.5">
                                <Label className="text-[13px] font-black uppercase tracking-[0.08em] text-zinc-900">Método de Pago</Label>
                                <RadioGroup value={formData.metodoPago} onValueChange={(value) => setFormData((prev) => ({ ...prev, metodoPago: value }))} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {paymentMethods.map((method) => (
                                        <div key={method.id} onClick={() => setFormData((prev) => ({ ...prev, metodoPago: method.id }))} className={cn("relative flex min-h-[52px] cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 transition-all", formData.metodoPago === method.id ? "border-emerald-500 bg-emerald-50 shadow-[0_6px_16px_rgba(16,185,129,0.16)]" : "border-zinc-200 bg-white hover:border-zinc-300")}>
                                            <div className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border", formData.metodoPago === method.id ? "border-emerald-500" : "border-zinc-300")}>{formData.metodoPago === method.id && <div className="h-2 w-2 rounded-full bg-emerald-500" />}</div>
                                            <span className={cn("text-sm font-semibold leading-tight", formData.metodoPago === method.id ? "text-emerald-900" : "text-zinc-700")}>{method.label}</span>
                                            <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                            {isCashPayment && <div className="space-y-1.5"><Label htmlFor="pagaCon" className="text-[13px] font-semibold text-zinc-800">¿Con cuánto vas a pagar? *</Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span><Input id="pagaCon" name="pagaCon" type="number" inputMode="numeric" min="1" value={formData.pagaCon} onChange={onInput} className="h-10 rounded-lg border-[1.5px] pl-7 text-sm" /></div><p className="pl-1 text-[10px] leading-tight text-muted-foreground">{isDelivery ? "Obligatorio para que el repartidor lleve cambio." : "Obligatorio para preparar tu vuelto en caja."}</p></div>}
                        </div>
                    )}
                </div>

                {items.length > 0 && <div className="space-y-3 rounded-t-[2.2rem] bg-secondary/30 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]"><div className="space-y-2"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Productos ({totalItems})</span><span>${totalPrice.toLocaleString("es-CL")}</span></div>{isDelivery && <div className="flex flex-col gap-0.5 pt-0.5"><span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Envío a confirmar por WhatsApp:</span><div className="flex justify-between text-[11px]"><span className="pl-2 text-muted-foreground">Zona cercana</span><span className="font-semibold text-orange-600">${nearFee}</span></div><div className="flex justify-between text-[11px]"><span className="pl-2 text-muted-foreground">Zona lejana</span><span className="font-semibold text-orange-600">${farFee}</span></div></div>}<Separator className="my-1.5 bg-border/50" /><div className="flex items-end justify-between"><span className="text-base font-bold">Total productos</span><span className="font-outfit text-[2rem] font-bold leading-none text-primary">${totalPrice.toLocaleString("es-CL")}</span></div>{isDelivery && <p className="text-[10px] italic text-muted-foreground text-right">El envío se confirma manualmente según la zona.</p>}</div>{step === "cart" ? <Button onClick={() => setStep("checkout")} disabled={!storeStatus.isOpen} className="h-12 w-full rounded-xl bg-primary text-base font-bold text-white shadow-xl shadow-primary/20 hover:bg-primary/90">Continuar Pedido</Button> : <Button onClick={handleConfirmOrder} disabled={!isCheckoutFormValid || isSubmitting || !storeStatus.isOpen} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-base font-bold text-white shadow-xl shadow-green-600/20 hover:bg-green-700">{isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" />Procesando...</> : <><Send className="h-5 w-5" />Confirmar vía WhatsApp</>}</Button>}</div>}
            </SheetContent>
        </Sheet>
    );
}
