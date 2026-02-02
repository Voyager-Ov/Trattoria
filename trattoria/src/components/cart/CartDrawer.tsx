"use client";

import { useCart } from "@/providers/CartProvider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Send } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createPublicOrder } from "@/app/actions/orders";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { getConfigs } from "@/app/actions/configActions";
import { getStoreStatus, StoreStatus } from "@/lib/openingHours";
import { Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_PAYMENT_METHODS } from "@/lib/configDefaults";

export function CartDrawer() {
    const { items, removeItem, updateQuantity, totalPrice, totalItems, clearCart } = useCart();
    const [step, setStep] = useState<'cart' | 'checkout'>('cart');
    const [formData, setFormData] = useState({
        nombre: '',
        telefono: '',
        direccion: '',
        metodoPago: '',
        tipoEntrega: 'envio' as 'envio' | 'retiro',
        pagaCon: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [configs, setConfigs] = useState<any>(null);
    const [storeStatus, setStoreStatus] = useState<StoreStatus>({ isOpen: true });

    useEffect(() => {
        async function fetchConfigs() {
            const res = await getConfigs([
                "whatsapp.settings",
                "payments.methods",
                "delivery.settings",
                "business.hours",
                "business.closedDays"
            ]);
            if (res.success && res.data) {
                const data = res.data;
                setConfigs(data);
                // Set default payment method if available
                const methods = (data["payments.methods"]?.length > 0)
                    ? data["payments.methods"]
                    : DEFAULT_PAYMENT_METHODS;

                const firstEnabled = methods.find((m: any) => m.enabled);

                setFormData(prev => ({
                    ...prev,
                    metodoPago: firstEnabled ? firstEnabled.id : prev.metodoPago,
                }));

                const dSettings = data["delivery.settings"];
                if (dSettings) {
                    if (!dSettings.allowDelivery && dSettings.allowPickup) {
                        setFormData(prev => ({ ...prev, tipoEntrega: 'retiro' }));
                    } else if (dSettings.allowDelivery && !dSettings.allowPickup) {
                        setFormData(prev => ({ ...prev, tipoEntrega: 'envio' }));
                    }
                }

                const status = getStoreStatus(
                    data["business.hours"] || {},
                    data["business.closedDays"] || []
                );
                setStoreStatus(status);
            }
        }
        fetchConfigs();
    }, []);

    const deliverySettings = configs?.["delivery.settings"];
    const deliveryFee = formData.tipoEntrega === 'envio' ? (deliverySettings?.deliveryFee || 0) : 0;

    const finalTotal = totalPrice + deliveryFee;
    const isMinPurchaseMet = (formData.tipoEntrega === 'envio' && deliverySettings) ? totalPrice >= deliverySettings.minPurchase : true;


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleConfirmOrder = async () => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            // 1. Create order in database
            const result = await createPublicOrder({
                clienteNombre: formData.nombre,
                clienteTelefono: formData.telefono,
                clienteDireccion: formData.tipoEntrega === 'envio' ? formData.direccion : 'Retiro en Local',
                metodoPago: formData.metodoPago,
                total: finalTotal, // Use finalTotal which includes delivery if applicable
                items: items.map(item => ({
                    productId: item.id,
                    cantidad: item.quantity,
                    precioUnitario: Number(item.precio),
                    nombreProduct: item.nombre
                }))
            });

            if (!result.success) {
                toast.error(result.error || "Error al procesar el pedido");
                return;
            }

            // 2. Prepare WhatsApp message
            const whatsappSettings = configs?.["whatsapp.settings"];
            if (!whatsappSettings?.phoneNumber || !whatsappSettings?.enabled) {
                toast.error("El pedido se guardó, pero la notificación por WhatsApp no está disponible en este momento.");
                // Clean up anyway
                clearCart();
                setStep('cart');
                return;
            }

            const WHATSAPP_NUMBER = whatsappSettings.phoneNumber.replace(/\D/g, '');
            let message = whatsappSettings.templateMessage || "Hola {nombre}, recibimos tu pedido #{id}.";

            const itemsText = items.map(item =>
                `• ${item.nombre} x${item.quantity} - $${(Number(item.precio) * item.quantity).toLocaleString('es-CL')}`
            ).join('\n');

            const allMethods = (configs?.["payments.methods"]?.length > 0)
                ? configs["payments.methods"]
                : DEFAULT_PAYMENT_METHODS;

            const pagoMethod = allMethods.find((m: any) => m.id === formData.metodoPago)?.label || formData.metodoPago;

            // Replace variables
            message = message
                .replace(/{id}/g, result.orderNumber?.toString() || '')
                .replace(/{nombre}/g, formData.nombre)
                .replace(/{direccion}/g, formData.tipoEntrega === 'envio' ? formData.direccion : 'Retiro en Local')
                .replace(/{metodoPago}/g, pagoMethod)
                .replace(/{items}/g, itemsText)
                .replace(/{total}/g, `$${finalTotal.toLocaleString('es-CL')}`);

            // Add delivery type and payment details
            const entregaLabel = formData.tipoEntrega === 'envio' ? "Delivery 🛵" : "Retiro en Local 🍕";
            message += `\n\n📌 *Tipo de entrega:* ${entregaLabel}`;

            if (formData.metodoPago === 'EFECTIVO' && formData.pagaCon) {
                const pagaConNum = Number(formData.pagaCon);
                const vuelto = pagaConNum - finalTotal;
                message += `\n💰 *Paga con:* $${pagaConNum.toLocaleString('es-CL')}`;
                message += `\n💵 *Vuelto:* $${vuelto.toLocaleString('es-CL')}`;
            }

            if (formData.telefono) {
                message += `\n📞 *Teléfono:* ${formData.telefono}`;
            }

            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

            window.location.assign(whatsappUrl);

            // Clear cart and reset state
            clearCart();
            setStep('cart');
            const finalMethods = (configs?.["payments.methods"]?.length > 0)
                ? configs["payments.methods"]
                : DEFAULT_PAYMENT_METHODS;

            setFormData({
                nombre: '',
                telefono: '',
                direccion: '',
                metodoPago: finalMethods.find((m: any) => m.enabled)?.id || '',
                tipoEntrega: 'envio',
                pagaCon: ''
            });
            toast.success("¡Pedido enviado con éxito!");
        } catch (error) {
            console.error(error);
            toast.error("Ocurrió un error inesperado");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Sheet onOpenChange={(open) => { if (!open) setStep('cart'); }}>
            <SheetTrigger asChild>
                <Button
                    variant="default"
                    className="h-14 rounded-full px-6 flex items-center gap-3 bg-primary text-primary-foreground shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-all border-none"
                >
                    <div className="relative">
                        <ShoppingCart className="h-6 w-6" />
                        {totalItems > 0 && (
                            <span className="absolute -top-2 -right-2 bg-foreground text-background text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center ring-2 ring-primary">
                                {totalItems}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[10px] opacity-80 font-medium uppercase tracking-wider">Tu Carrito</span>
                        <span className="text-sm font-bold">${totalPrice.toLocaleString('es-CL')}</span>
                    </div>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 bg-background border-none rounded-l-[2rem]">
                <SheetHeader className="p-6 pb-2">
                    <div className="flex items-center gap-3 mb-2">
                        {step === 'checkout' && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => setStep('cart')}
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        )}
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-primary" />
                        </div>
                        <SheetTitle className="text-2xl font-bold font-outfit">
                            {step === 'cart' ? 'Mi Pedido' : 'Datos de Entrega'}
                        </SheetTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {step === 'cart'
                            ? 'Revisa tus productos antes de confirmar'
                            : 'Completa la información para tu pedido'}
                    </p>
                </SheetHeader>

                {!storeStatus.isOpen && (
                    <div className="mx-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-red-500 shadow-sm shrink-0">
                            <Store className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                            <h4 className="text-sm font-black uppercase tracking-tight text-red-600">Local Cerrado</h4>
                            <p className="text-xs text-red-500 font-medium leading-tight">{storeStatus.message || "Por el momento no estamos recibiendo pedidos."}</p>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto px-6 my-4 scrollbar-hide">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="h-20 w-20 rounded-full bg-secondary/50 flex items-center justify-center">
                                <ShoppingCart className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-bold text-lg">Tu carrito está vacío</p>
                                <p className="text-sm text-muted-foreground">Explora nuestro menú y agrega tus platos favoritos</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {step === 'cart' ? (
                                items.map((item) => (
                                    <div key={item.id} className="flex gap-4 group">
                                        <div className="h-20 w-20 rounded-2xl overflow-hidden bg-secondary/30 flex-shrink-0">
                                            <img
                                                src={item.imagen || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200"}
                                                alt={item.nombre}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between py-0.5">
                                            <div className="flex justify-between gap-2">
                                                <h4 className="font-bold text-sm leading-tight line-clamp-2">{item.nombre}</h4>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-muted-foreground hover:text-destructive transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center bg-secondary/50 rounded-lg p-1">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-background transition-colors"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <span className="w-8 text-center text-sm font-bold font-outfit">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-background transition-colors"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>
                                                <span className="font-bold text-primary">
                                                    ${(Number(item.precio) * item.quantity).toLocaleString('es-CL')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    {(deliverySettings?.allowDelivery !== false || deliverySettings?.allowPickup !== false) && (
                                        <div className="flex p-1 bg-secondary/50 rounded-2xl mb-6">
                                            {deliverySettings?.allowDelivery !== false && (
                                                <button
                                                    onClick={() => setFormData(prev => ({ ...prev, tipoEntrega: 'envio' }))}
                                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold ${formData.tipoEntrega === 'envio' ? 'bg-background shadow-md text-primary scale-100' : 'text-muted-foreground scale-95 opacity-70 hover:opacity-100'}`}
                                                >
                                                    <ShoppingBag className="h-4 w-4" />
                                                    <span>Delivery</span>
                                                </button>
                                            )}
                                            {deliverySettings?.allowPickup !== false && (
                                                <button
                                                    onClick={() => setFormData(prev => ({ ...prev, tipoEntrega: 'retiro' }))}
                                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold ${formData.tipoEntrega === 'retiro' ? 'bg-background shadow-md text-primary scale-100' : 'text-muted-foreground scale-95 opacity-70 hover:opacity-100'}`}
                                                >
                                                    <Store className="h-4 w-4" />
                                                    <span>Retiro</span>
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="nombre">Tu Nombre</Label>
                                            <Input
                                                id="nombre"
                                                name="nombre"
                                                placeholder="Ej. Juan"
                                                value={formData.nombre}
                                                onChange={handleInputChange}
                                                className="rounded-xl h-12"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="telefono">Teléfono</Label>
                                            <Input
                                                id="telefono"
                                                name="telefono"
                                                placeholder="Ej. +569..."
                                                value={formData.telefono}
                                                onChange={handleInputChange}
                                                className="rounded-xl h-12"
                                            />
                                        </div>
                                    </div>

                                    {formData.tipoEntrega === 'envio' && (
                                        <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                                            <Label htmlFor="direccion">Dirección de Entrega</Label>
                                            <Input
                                                id="direccion"
                                                name="direccion"
                                                placeholder="Calle, Número, Depto"
                                                value={formData.direccion}
                                                onChange={handleInputChange}
                                                className="rounded-xl h-12"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <Label className="text-sm font-black text-zinc-900 uppercase tracking-tight">Método de Pago</Label>
                                        <RadioGroup
                                            value={formData.metodoPago}
                                            onValueChange={(v) => setFormData(prev => ({ ...prev, metodoPago: v }))}
                                            className="grid grid-cols-1 gap-2"
                                        >
                                            {((configs?.["payments.methods"]?.length > 0)
                                                ? configs["payments.methods"]
                                                : DEFAULT_PAYMENT_METHODS
                                            ).filter((m: any) => m.enabled).map((method: any) => (
                                                <div
                                                    key={method.id}
                                                    onClick={() => setFormData(prev => ({ ...prev, metodoPago: method.id }))}
                                                    className={cn(
                                                        "relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer",
                                                        formData.metodoPago === method.id
                                                            ? "border-emerald-500 bg-emerald-50/50"
                                                            : "border-zinc-100 hover:border-zinc-200 bg-white"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                                            formData.metodoPago === method.id
                                                                ? "border-emerald-500"
                                                                : "border-zinc-300"
                                                        )}>
                                                            {formData.metodoPago === method.id && (
                                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-in zoom-in duration-300" />
                                                            )}
                                                        </div>
                                                        <span className={cn(
                                                            "font-bold transition-colors",
                                                            formData.metodoPago === method.id ? "text-emerald-900" : "text-zinc-600"
                                                        )}>
                                                            {method.label}
                                                        </span>
                                                    </div>
                                                    <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>

                                    {/* Cash Payment Input (Conditional) */}
                                    {formData.metodoPago === 'EFECTIVO' && (
                                        <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                                            <Label htmlFor="pagaCon">¿Con cuánto vas a pagar? (Opcional)</Label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                                <Input
                                                    id="pagaCon"
                                                    name="pagaCon"
                                                    type="number"
                                                    placeholder="Ej. 10000"
                                                    value={formData.pagaCon}
                                                    onChange={handleInputChange}
                                                    className="rounded-xl h-12 pl-8"
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground italic pl-1">
                                                {formData.tipoEntrega === 'envio'
                                                    ? 'Para que el repartidor lleve el vuelto justo.'
                                                    : 'Para agilizar tu pago en el local.'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {
                    items.length > 0 && (
                        <div className="p-6 bg-secondary/30 rounded-t-[2.5rem] space-y-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Productos ({totalItems})</span>
                                    <span>${totalPrice.toLocaleString('es-CL')}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Envío</span>
                                    <span className={deliveryFee > 0 ? "text-foreground" : "text-green-600 font-medium"}>
                                        {deliveryFee > 0 ? `$${deliveryFee.toLocaleString('es-CL')}` : "Gratis"}
                                    </span>
                                </div>
                                {deliverySettings?.minPurchase > 0 && (
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-muted-foreground italic">Compra mínima para delivery</span>
                                        <span className={isMinPurchaseMet ? "text-green-600" : "text-destructive font-bold"}>
                                            ${deliverySettings.minPurchase.toLocaleString('es-CL')}
                                        </span>
                                    </div>
                                )}
                                <Separator className="bg-border/50 my-2" />
                                <div className="flex justify-between items-end">
                                    <span className="text-lg font-bold">Total</span>
                                    <span className="text-2xl font-bold font-outfit text-primary">${finalTotal.toLocaleString('es-CL')}</span>
                                </div>
                            </div>

                            {step === 'cart' ? (
                                <Button
                                    onClick={() => setStep('checkout')}
                                    disabled={!storeStatus.isOpen}
                                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Continuar Pedido
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleConfirmOrder}
                                    disabled={
                                        !formData.nombre ||
                                        !formData.telefono ||
                                        (formData.tipoEntrega === 'envio' && (!formData.direccion || !formData.metodoPago || !isMinPurchaseMet)) ||
                                        isSubmitting ||
                                        !storeStatus.isOpen
                                    }
                                    className="w-full h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-xl shadow-green-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-5 w-5" />
                                            Confirmar vía WhatsApp
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    )
                }
            </SheetContent >
        </Sheet >
    );
}
