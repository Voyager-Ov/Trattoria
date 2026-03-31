"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Minus, Plus, Send, ShoppingBag, ShoppingCart, Store, Trash2 } from "lucide-react";
import { createPublicOrder } from "@/app/actions/orders";
import { getConfigs } from "@/app/actions/configActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DEFAULT_PAYMENT_METHODS } from "@/lib/configDefaults";
import { normalizeDeliverySettings } from "@/lib/deliverySettings";
import { getStoreStatus, type StoreStatus } from "@/lib/openingHours";
import { cn } from "@/lib/utils";
import { useCart } from "@/providers/CartProvider";

type Step = "cart" | "checkout";
type DeliveryMode = "envio" | "retiro";

export function CartDrawer() {
    const { items, removeItem, updateQuantity, totalPrice, totalItems, clearCart } = useCart();
    const [isBouncing, setIsBouncing] = useState(false);
    const [step, setStep] = useState<Step>("cart");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [configs, setConfigs] = useState<any>(null);
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
            setConfigs(res.data);
            const methods = res.data["payments.methods"]?.length ? res.data["payments.methods"] : DEFAULT_PAYMENT_METHODS;
            const firstEnabled = methods.find((method: any) => method.enabled);
            const deliverySettings = normalizeDeliverySettings(res.data["delivery.settings"]);
            setFormData((prev) => ({
                ...prev,
                metodoPago: firstEnabled?.id || prev.metodoPago,
                tipoEntrega: !deliverySettings.allowDelivery && deliverySettings.allowPickup ? "retiro" : prev.tipoEntrega,
            }));
            setStoreStatus(getStoreStatus(res.data["business.hours"] || {}, res.data["business.closedDays"] || []));
        }
        load();
    }, []);

    const deliverySettings = normalizeDeliverySettings(configs?.["delivery.settings"]);
    const paymentMethods = (configs?.["payments.methods"]?.length ? configs["payments.methods"] : DEFAULT_PAYMENT_METHODS).filter((method: any) => method.enabled);
    const isDelivery = formData.tipoEntrega === "envio";
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
                items: items.map((item) => ({ productId: item.id, cantidad: item.quantity, precioUnitario: Number(item.precio), nombreProduct: item.nombre })),
            });
            if (!result.success) return toast.error(result.error || "Error al procesar el pedido");

            const itemsText = items.map((item) => `• ${item.nombre} x${item.quantity} - $${(Number(item.precio) * item.quantity).toLocaleString("es-CL")}`).join("\n");
            const paymentLabel = paymentMethods.find((method: any) => method.id === formData.metodoPago)?.label || formData.metodoPago;
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
            if (formData.metodoPago === "EFECTIVO" && formData.pagaCon) {
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
                window.location.href = `https://wa.me/${whatsappSettings.phoneNumber.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
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
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 bg-background border-none rounded-l-[2rem]">
                <SheetHeader className="p-6 pb-2">
                    <div className="flex items-center gap-3 mb-2">
                        {step === "checkout" && <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setStep("cart")}><ArrowLeft className="h-5 w-5" /></Button>}
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><ShoppingBag className="h-5 w-5 text-primary" /></div>
                        <SheetTitle className="text-2xl font-bold font-outfit">{step === "cart" ? "Mi Pedido" : "Datos de Entrega"}</SheetTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">{step === "cart" ? "Revisa tus productos antes de confirmar" : "Completa la información para tu pedido"}</p>
                </SheetHeader>

                {!storeStatus.isOpen && <div className="mx-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 font-medium">{storeStatus.message || "Por el momento no estamos recibiendo pedidos."}</div>}

                <div className="flex-1 overflow-y-auto px-6 my-4 scrollbar-hide">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="h-20 w-20 rounded-full bg-secondary/50 flex items-center justify-center"><ShoppingCart className="h-10 w-10 text-muted-foreground" /></div>
                            <div className="space-y-1"><p className="font-bold text-lg">Tu carrito está vacío</p><p className="text-sm text-muted-foreground">Explora nuestro menú y agrega tus platos favoritos</p></div>
                        </div>
                    ) : step === "cart" ? (
                        <div className="space-y-6">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4 group">
                                    <div className="h-20 w-20 rounded-2xl overflow-hidden bg-secondary/30 flex-shrink-0"><img src={item.imagen || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200"} alt={item.nombre} className="h-full w-full object-cover" /></div>
                                    <div className="flex-1 flex flex-col justify-between py-0.5">
                                        <div className="flex justify-between gap-2"><h4 className="font-bold text-sm leading-tight line-clamp-2">{item.nombre}</h4><button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button></div>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center bg-secondary/50 rounded-lg p-1">
                                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-background transition-colors"><Minus className="h-3 w-3" /></button>
                                                <span className="w-8 text-center text-sm font-bold font-outfit">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-background transition-colors"><Plus className="h-3 w-3" /></button>
                                            </div>
                                            <span className="font-bold text-primary">${(Number(item.precio) * item.quantity).toLocaleString("es-CL")}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            {(deliverySettings.allowDelivery || deliverySettings.allowPickup) && <div className="flex p-1 bg-secondary/50 rounded-2xl">{deliverySettings.allowDelivery && <button onClick={() => setFormData((prev) => ({ ...prev, tipoEntrega: "envio" }))} className={`flex-1 py-3 rounded-xl font-bold ${isDelivery ? "bg-background shadow-md text-primary" : "text-muted-foreground"}`}>Delivery</button>}{deliverySettings.allowPickup && <button onClick={() => setFormData((prev) => ({ ...prev, tipoEntrega: "retiro" }))} className={`flex-1 py-3 rounded-xl font-bold ${!isDelivery ? "bg-background shadow-md text-primary" : "text-muted-foreground"}`}>Retiro</button>}</div>}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="nombre">Tu Nombre</Label><Input id="nombre" name="nombre" value={formData.nombre} onChange={onInput} className="rounded-xl h-12" /></div>
                                <div className="space-y-2"><Label htmlFor="telefono">Teléfono</Label><Input id="telefono" name="telefono" value={formData.telefono} onChange={onInput} className="rounded-xl h-12" /></div>
                            </div>
                            {isDelivery && <div className="space-y-2"><Label htmlFor="direccion">Dirección de Entrega</Label><Input id="direccion" name="direccion" value={formData.direccion} onChange={onInput} className="rounded-xl h-12" /></div>}
                            {isDelivery && <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 space-y-2"><p className="text-[11px] font-black uppercase tracking-wider text-orange-700">Envío informativo</p><div className="flex justify-between text-sm"><span className="text-orange-800">Zona cercana</span><span className="font-bold text-orange-900">${nearFee}</span></div><div className="flex justify-between text-sm"><span className="text-orange-800">Zona lejana</span><span className="font-bold text-orange-900">${farFee}</span></div><p className="text-[11px] text-orange-700">El costo final del envío se confirma por WhatsApp según la zona.</p></div>}
                            <div className="space-y-3">
                                <Label className="text-sm font-black text-zinc-900 uppercase tracking-tight">Método de Pago</Label>
                                <RadioGroup value={formData.metodoPago} onValueChange={(value) => setFormData((prev) => ({ ...prev, metodoPago: value }))} className="grid grid-cols-1 gap-2">
                                    {paymentMethods.map((method: any) => (
                                        <div key={method.id} onClick={() => setFormData((prev) => ({ ...prev, metodoPago: method.id }))} className={cn("relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer", formData.metodoPago === method.id ? "border-emerald-500 bg-emerald-50/50" : "border-zinc-100 hover:border-zinc-200 bg-white")}>
                                            <div className="flex items-center gap-3"><div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", formData.metodoPago === method.id ? "border-emerald-500" : "border-zinc-300")}>{formData.metodoPago === method.id && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}</div><span className={cn("font-bold", formData.metodoPago === method.id ? "text-emerald-900" : "text-zinc-600")}>{method.label}</span></div>
                                            <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                            {formData.metodoPago === "EFECTIVO" && <div className="space-y-2"><Label htmlFor="pagaCon">¿Con cuánto vas a pagar? (Opcional)</Label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span><Input id="pagaCon" name="pagaCon" type="number" value={formData.pagaCon} onChange={onInput} className="rounded-xl h-12 pl-8" /></div><p className="text-[10px] text-muted-foreground italic pl-1">{isDelivery ? "Para que el repartidor lleve el vuelto justo." : "Para agilizar tu pago en el local."}</p></div>}
                        </div>
                    )}
                </div>

                {items.length > 0 && <div className="p-6 bg-secondary/30 rounded-t-[2.5rem] space-y-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]"><div className="space-y-2"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Productos ({totalItems})</span><span>${totalPrice.toLocaleString("es-CL")}</span></div>{isDelivery && <div className="flex flex-col gap-1 pt-1 pb-1"><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Envío a confirmar por WhatsApp:</span><div className="flex justify-between text-xs"><span className="text-muted-foreground pl-2">Zona cercana</span><span className="text-orange-600 font-semibold">${nearFee}</span></div><div className="flex justify-between text-xs"><span className="text-muted-foreground pl-2">Zona lejana</span><span className="text-orange-600 font-semibold">${farFee}</span></div></div>}<Separator className="bg-border/50 my-2" /><div className="flex justify-between items-end"><span className="text-lg font-bold">Total productos</span><span className="text-2xl font-bold font-outfit text-primary">${totalPrice.toLocaleString("es-CL")}</span></div>{isDelivery && <p className="text-[10px] text-muted-foreground italic text-right">El envío se confirma manualmente según la zona.</p>}</div>{step === "cart" ? <Button onClick={() => setStep("checkout")} disabled={!storeStatus.isOpen} className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20">Continuar Pedido</Button> : <Button onClick={handleConfirmOrder} disabled={!formData.nombre || !formData.telefono || !formData.metodoPago || (isDelivery && !formData.direccion.trim()) || isSubmitting || !storeStatus.isOpen} className="w-full h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-xl shadow-green-600/20 flex items-center justify-center gap-2">{isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" />Procesando...</> : <><Send className="h-5 w-5" />Confirmar vía WhatsApp</>}</Button>}</div>}
            </SheetContent>
        </Sheet>
    );
}
