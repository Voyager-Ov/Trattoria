"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
    ChevronLeft, 
    Banknote, 
    Clock, 
    CreditCard, 
    MapPin, 
    Phone, 
    ShoppingBag, 
    User, 
    XCircle,
    Calendar,
    ChefHat,
    Truck,
    Package,
    Printer,
    CheckCircle2,
    History,
    TrendingUp,
    DollarSign,
    Box,
    Share2,
    Save,
    Store,
    Loader2
} from "lucide-react";
import { EstadoPedido } from "@prisma/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    Sheet, 
    SheetContent, 
    SheetDescription, 
    SheetFooter, 
    SheetHeader, 
    SheetTitle 
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { getOrderDeliveryLabel, getOrderDisplayAddress } from "@/lib/orderDelivery";
import { cn } from "@/lib/utils";

import { updateOrderStatus, toggleOrderPayment, getOrderSuppliesAndCost } from "../actions";
import { getConfigs } from "@/app/actions/configActions";
import { STATUS_CONFIG, formatOrderDate, getPaymentMethodLabel, type OrderDetail } from "../components/pedido-shared";

interface PedidoDetailClientProps {
    order: OrderDetail;
}

const formatShortDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
};

export function PedidoDetailClient({ order: initialOrder }: PedidoDetailClientProps) {
    const router = useRouter();
    const [order, setOrder] = useState<any>(initialOrder);
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Performance & Supplies data
    const [suppliesData, setSuppliesData] = useState<any>(null);
    const [isLoadingSupplies, setIsLoadingSupplies] = useState(true);

    // Payment Sheet states
    const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");

    const statusConfig = STATUS_CONFIG[order.estado as EstadoPedido] || STATUS_CONFIG.PENDIENTE;
    const StatusIcon = statusConfig.icon;
    
    const deliveryLabel = getOrderDeliveryLabel(order);
    const address = getOrderDisplayAddress(order);
    const customerName = order.clienteNombre || order.customer?.nombre || "Venta de Mostrador";

    useEffect(() => {
        void loadSupplies();
        void loadPaymentMethods();
    }, [order.id]);

    const loadSupplies = async () => {
        setIsLoadingSupplies(true);
        const result = await getOrderSuppliesAndCost(order.id);
        if (result.success) {
            setSuppliesData(result.data);
        }
        setIsLoadingSupplies(false);
    };

    const loadPaymentMethods = async () => {
        const result = await getConfigs(["payments.methods"]);
        if (result.success && result.data?.["payments.methods"]) {
            const methods = (result.data["payments.methods"] as any[]).filter(m => m.enabled);
            setPaymentMethods(methods);
            if (methods.length > 0) setSelectedPaymentMethod(methods[0].id);
        }
    };

    const handleStatusChange = async (newStatus: EstadoPedido) => {
        setIsUpdating(true);
        const result = await updateOrderStatus(order.id, newStatus);
        if (result.success) {
            toast.success("Estado actualizado");
            setOrder({ ...order, estado: newStatus });
            router.refresh();
        } else {
            toast.error(result.error || "Error al actualizar");
        }
        setIsUpdating(false);
    };

    const handleRegisterPayment = async () => {
        setIsUpdating(true);
        const result = await toggleOrderPayment(order.id, !order.payment.isPaid, selectedPaymentMethod);
        if (result.success) {
            toast.success(order.payment.isPaid ? "Cobro anulado" : "Pago registrado correctamente");
            setIsPaymentSheetOpen(false);
            setOrder({ 
                ...order, 
                payment: { 
                    ...order.payment, 
                    isPaid: !order.payment.isPaid, 
                    method: selectedPaymentMethod, 
                    paidAt: !order.payment.isPaid ? new Date().toISOString() : null 
                } 
            });
            router.refresh();
        } else {
            toast.error(result.error || "Error al actualizar pago");
        }
        setIsUpdating(false);
    };

    const handlePaymentClick = () => {
        if (order.payment.isPaid) {
            handleRegisterPayment(); // Automatically un-pay
        } else {
            setIsPaymentSheetOpen(true);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-zinc-50/30">
            {/* Header Section */}
            <div className="px-8 pt-8 pb-6 space-y-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/admin/dashboard/pedidos")}
                        className="rounded-2xl h-10 px-4 hover:bg-zinc-100"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Volver
                    </Button>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200/50 shadow-sm">
                                <Package size={24} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black tracking-tighter text-zinc-900 uppercase">Pedido {order.numero}</h2>
                                <p className="text-sm text-zinc-500 font-medium mt-0.5">
                                    <Calendar className="inline h-3 w-3 mr-1" />
                                    {formatShortDate(order.recibidoEn)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Badge className={cn("px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider", statusConfig.bg || "bg-zinc-100", statusConfig.color || "text-zinc-600")}>
                            <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                            {statusConfig.label}
                        </Badge>

                        {order.payment.isPaid ? (
                            <Badge className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600">
                                <Banknote className="h-3.5 w-3.5 mr-1.5" />
                                Cobrado
                            </Badge>
                        ) : (
                            <Badge className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-600">
                                <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                                No Cobrado
                            </Badge>
                        )}
                        
                        {/* Admin extra actions */}
                        <div className="flex gap-2 ml-2 pl-4 border-l border-zinc-200">
                            <Button variant="outline" size="sm" className="rounded-xl h-9 px-3">
                                <Printer className="h-4 w-4 mr-1.5" /> Imprimir
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-8 pb-12 flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Order Items (col-span-2) */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Items Card */}
                        <Card className="rounded-[2.5rem] border-zinc-200 shadow-xl shadow-zinc-200/50 overflow-hidden bg-white">
                            <div className="p-8">
                                <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 mb-6">Productos del Pedido</h3>
                                <div className="space-y-4">
                                    {order.items.map((item: any, index: number) => (
                                        <div key={item.id} className={cn(
                                            "flex items-center justify-between py-4",
                                            index !== order.items.length - 1 && "border-b border-zinc-100"
                                        )}>
                                            <div className="flex-1">
                                                <p className="font-bold text-zinc-900">{item.nombreProduct}</p>
                                                <p className="text-sm text-zinc-500 font-medium mt-0.5">
                                                    {item.cantidad} × ${Number(item.precioUnitario).toLocaleString('es-AR')}
                                                </p>
                                                {item.notas && (
                                                    <p className="text-sm text-orange-600 font-medium mt-1 italic">
                                                        Nota: {item.notas}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-zinc-900 tracking-tight">
                                                    ${Number(item.subtotal).toLocaleString('es-AR')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 pt-6 border-t border-zinc-200 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-600 font-medium">Subtotal</span>
                                        <span className="font-bold text-zinc-900">${Number(order.subtotal).toLocaleString('es-AR')}</span>
                                    </div>
                                    {Number(order.deliveryFee) > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-600 font-medium">Costo de Envío</span>
                                            <span className="font-bold text-zinc-900">${Number(order.deliveryFee).toLocaleString('es-AR')}</span>
                                        </div>
                                    )}
                                    {Number(order.descuento) > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-600 font-medium">Descuento</span>
                                            <span className="font-bold text-green-600">
                                                -${Number(order.descuento).toLocaleString('es-AR')}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pt-3 border-t border-zinc-200">
                                        <span className="text-lg font-black uppercase tracking-tight text-zinc-900">Total</span>
                                        <span className="text-2xl font-black text-indigo-600 tracking-tight">
                                            ${Number(order.total).toLocaleString('es-AR')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Supplies and Cost Card */}
                        {suppliesData && suppliesData.insumos.length > 0 && (
                            <Card className="rounded-[2.5rem] border-zinc-200 shadow-xl shadow-zinc-200/50 overflow-hidden bg-white">
                                <div className="p-8">
                                    <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 mb-6">Insumos Necesarios</h3>
                                    <div className="space-y-3">
                                        {suppliesData.insumos.map((insumo: any, index: number) => (
                                            <div key={index} className={cn(
                                                "flex items-center justify-between py-3",
                                                index !== suppliesData.insumos.length - 1 && "border-b border-zinc-100"
                                            )}>
                                                <div className="flex-1">
                                                    <p className="font-bold text-zinc-900">{insumo.nombre}</p>
                                                    <p className="text-sm text-zinc-500 font-medium mt-0.5">
                                                        {insumo.cantidadTotal.toFixed(2)} {insumo.unidad.toLowerCase()}
                                                        {insumo.costoUnitario > 0 && (
                                                            <span className="ml-2">× ${insumo.costoUnitario.toLocaleString('es-AR')}</span>
                                                        )}
                                                    </p>
                                                </div>
                                                {insumo.costoTotal > 0 && (
                                                    <div className="text-right">
                                                        <p className="font-bold text-zinc-700 text-sm">
                                                            ${insumo.costoTotal.toLocaleString('es-AR')}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {suppliesData.costoTotal > 0 && (
                                        <div className="mt-6 pt-6 border-t border-zinc-200 space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-zinc-600 font-medium flex items-center gap-2">
                                                    <DollarSign className="h-4 w-4" />
                                                    Costo Total de Insumos
                                                </span>
                                                <span className="font-bold text-red-600">
                                                    ${suppliesData.costoTotal.toLocaleString('es-AR')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-zinc-600 font-medium flex items-center gap-2">
                                                    <TrendingUp className="h-4 w-4" />
                                                    Ganancia Estimada
                                                </span>
                                                <span className="font-bold text-green-600">
                                                    ${suppliesData.ganancia.toLocaleString('es-AR')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between pt-3 border-t border-zinc-200">
                                                <span className="text-base font-black uppercase tracking-tight text-zinc-900">
                                                    Margen de Ganancia
                                                </span>
                                                <span className="text-xl font-black text-emerald-600 tracking-tight">
                                                    {suppliesData.margenGanancia.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* Timeline Card */}
                        <Card className="rounded-[2.5rem] border-zinc-200 shadow-xl shadow-zinc-200/50 overflow-hidden bg-white">
                            <div className="p-8">
                                <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 mb-6">Historial del Pedido</h3>
                                <div className="space-y-6">
                                    {order.events && order.events.length > 0 ? (
                                        order.events.map((event: any, index: number) => {
                                            let EventIcon = Clock;
                                            let iconBg = "bg-zinc-100";
                                            let iconColor = "text-zinc-600";

                                            switch (event.tipo) {
                                                case "CREACION":
                                                    EventIcon = ShoppingBag;
                                                    iconBg = "bg-blue-100";
                                                    iconColor = "text-blue-600";
                                                    break;
                                                case "COBRO":
                                                    EventIcon = Banknote;
                                                    iconBg = "bg-emerald-100";
                                                    iconColor = "text-emerald-600";
                                                    break;
                                                case "CANCELACION":
                                                    EventIcon = XCircle;
                                                    iconBg = "bg-red-100";
                                                    iconColor = "text-red-600";
                                                    break;
                                                case "CAMBIO_ESTADO":
                                                    if (event.descripcion.includes('En Preparación')) {
                                                        EventIcon = ChefHat;
                                                        iconBg = "bg-purple-100";
                                                        iconColor = "text-purple-600";
                                                    } else if (event.descripcion.includes('Listo')) {
                                                        EventIcon = Package;
                                                        iconBg = "bg-green-100";
                                                        iconColor = "text-green-600";
                                                    } else if (event.descripcion.includes('Finalizado')) {
                                                        EventIcon = CheckCircle2;
                                                        iconBg = "bg-emerald-100";
                                                        iconColor = "text-emerald-600";
                                                    }
                                                    break;
                                            }

                                            return (
                                                <div key={event.id} className="flex gap-4">
                                                    <div className="flex flex-col items-center">
                                                        <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                                                            <EventIcon className={`h-5 w-5 ${iconColor}`} />
                                                        </div>
                                                        {index < order.events.length - 1 && (
                                                            <div className="h-full w-0.5 bg-zinc-200 mt-2 flex-1 min-h-[30px]" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 pb-2">
                                                        <p className="font-bold text-zinc-900">{event.descripcion}</p>
                                                        <p className="text-sm text-zinc-500 font-medium mt-0.5">{formatOrderDate(event.createdAt)}</p>
                                                        {event.actor?.displayName && (
                                                            <p className="text-xs text-zinc-400 mt-1 font-medium italic">
                                                                Por: {event.actor.displayName}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-zinc-500 font-medium text-sm italic">No hay eventos registrados.</p>
                                    )}
                                </div>
                            </div>
                        </Card>

                    </div>

                    {/* Right Column - Actions & Info (col-span-1) */}
                    <div className="space-y-6">
                        
                        {/* Actions Card */}
                        <Card className="rounded-[2.5rem] border-zinc-200 shadow-xl shadow-zinc-200/50 overflow-hidden bg-white">
                            <div className="p-6 space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900">Acciones Rápidas</h3>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Cambiar Estado</p>
                                        <Select
                                            value={order.estado}
                                            onValueChange={(value) => handleStatusChange(value as EstadoPedido)}
                                            disabled={isUpdating || order.estado === 'FINALIZADO' || order.estado === 'CANCELADO'}
                                        >
                                            <SelectTrigger className="w-full h-11 rounded-xl border-zinc-200 font-medium">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-zinc-200">
                                                <SelectItem value="RECIBIDO">Recibido</SelectItem>
                                                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                                                <SelectItem value="EN_PREPARACION">En Preparación</SelectItem>
                                                <SelectItem value="LISTO">Listo</SelectItem>
                                                <SelectItem value="FINALIZADO">Finalizado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="pt-3 border-t border-zinc-100">
                                        <Button
                                            variant={order.payment.isPaid ? "outline" : "default"}
                                            className={cn(
                                                "w-full h-11 rounded-xl font-bold text-xs uppercase tracking-wider transition-all",
                                                order.payment.isPaid
                                                    ? "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                                                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
                                            )}
                                            onClick={handlePaymentClick}
                                            disabled={isUpdating}
                                        >
                                            {isUpdating ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Banknote className="h-4 w-4 mr-2" />
                                            )}
                                            {order.payment.isPaid ? "Cobro registrado (Anular)" : "Marcar como Cobrado"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Customer Info Card */}
                        <Card className="rounded-[2.5rem] border-zinc-200 shadow-xl shadow-zinc-200/50 overflow-hidden bg-white">
                            <div className="p-6 space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900">Información del Cliente</h3>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                                            <User className="h-4 w-4 text-zinc-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Nombre</p>
                                            <p className="font-bold text-zinc-900 truncate">{customerName}</p>
                                        </div>
                                    </div>

                                    {order.clienteTelefono && (
                                        <div className="flex items-start gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                                                <Phone className="h-4 w-4 text-zinc-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Teléfono</p>
                                                <p className="font-bold text-zinc-900 truncate">{order.clienteTelefono}</p>
                                            </div>
                                        </div>
                                    )}

                                    {deliveryLabel && (
                                        <div className="flex items-start gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                                                <ShoppingBag className="h-4 w-4 text-zinc-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Tipo de entrega</p>
                                                <p className="font-bold text-zinc-900">{deliveryLabel}</p>
                                            </div>
                                        </div>
                                    )}

                                    {address && (
                                        <div className="flex items-start gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                                                <MapPin className="h-4 w-4 text-zinc-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Dirección</p>
                                                <p className="font-bold text-zinc-900 leading-tight">{address}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Payment Info Card */}
                        <Card className="rounded-[2.5rem] border-zinc-200 shadow-xl shadow-zinc-200/50 overflow-hidden bg-white">
                            <div className="p-6 space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900">Detalles de Pago</h3>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                                            <CreditCard className="h-4 w-4 text-zinc-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Método</p>
                                            <p className="font-bold text-zinc-900">{getPaymentLabel(order, true)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                                            <Banknote className="h-4 w-4 text-zinc-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Estado</p>
                                            <div className="mt-1">
                                                <Badge className={cn(
                                                    "px-3 py-1 rounded-lg text-xs font-bold uppercase",
                                                    order.payment.isPaid ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                                                )}>
                                                    {order.payment.isPaid ? "Cobrado" : "Pendiente"}
                                                </Badge>
                                                {order.payment.isPaid && order.payment.paidAt && (
                                                    <p className="text-xs text-zinc-500 mt-1 font-medium">
                                                        {formatShortDate(order.payment.paidAt)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                                            <Store className="h-4 w-4 text-zinc-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Origen</p>
                                            <Badge variant="outline" className="mt-1 font-bold rounded-lg border-zinc-200">
                                                {order.origen || "DESCONOCIDO"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Notes Card */}
                        {order.notas && (
                            <Card className="rounded-[2.5rem] border-zinc-200 shadow-xl shadow-zinc-200/50 overflow-hidden bg-white">
                                <div className="p-6">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 mb-3">Notas</h3>
                                    <p className="text-sm text-zinc-700 font-medium leading-relaxed">{order.notas}</p>
                                </div>
                            </Card>
                        )}

                    </div>
                </div>
            </div>

            {/* Payment Method Sheet */}
            <Sheet open={isPaymentSheetOpen} onOpenChange={setIsPaymentSheetOpen}>
                <SheetContent className="sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle className="text-xl font-black uppercase tracking-tight text-zinc-900">Confirmar Cobro</SheetTitle>
                        <SheetDescription className="text-sm text-zinc-500 font-medium">
                            Selecciona el método de pago utilizado para este pedido.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-6 py-6">
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-wider text-zinc-500">Método de Pago</Label>
                            <Select
                                value={selectedPaymentMethod}
                                onValueChange={setSelectedPaymentMethod}
                            >
                                <SelectTrigger className="h-12 rounded-xl border-zinc-200 font-medium">
                                    <SelectValue placeholder="Seleccionar método" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-zinc-200">
                                    {paymentMethods.map((method) => (
                                        <SelectItem key={method.id} value={method.id} className="font-medium">
                                            {method.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <SheetFooter>
                        <Button 
                            className="w-full h-12 rounded-xl text-sm font-bold tracking-wider uppercase shadow-xl"
                            onClick={handleRegisterPayment}
                            disabled={isUpdating}
                        >
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Marcar como Cobrado
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

        </div>
    );
}

function getPaymentLabel(order: any, short: boolean = false) {
    if (!order.payment.isPaid) return short ? "Pendiente" : "El pedido no ha sido cobrado aún.";
    const method = order.payment.method || "No especificado";
    return short ? method : `Cobrado vía ${method} el ${formatOrderDate(order.payment.paidAt)}`;
}
