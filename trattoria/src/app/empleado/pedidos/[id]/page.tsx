"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    ChevronLeft,
    Clock,
    CheckCircle2,
    ChefHat,
    XCircle,
    ShoppingBag,
    User,
    Phone,
    MapPin,
    CreditCard,
    Package,
    Loader2,
    Banknote,
    Store,
    Calendar,
    LucideIcon,
    TrendingUp,
    DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EstadoPedido, TipoEventoPedido } from "@prisma/client";
import { updateOrderStatus, toggleOrderPayment, getOrderSuppliesAndCost } from "@/app/admin/dashboard/pedidos/actions";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { getConfigs } from "@/app/actions/configActions";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getOrderDeliveryLabel, getOrderDisplayAddress } from "@/lib/orderDelivery";

interface OrderItem {
    id: string;
    nombreProduct: string;
    cantidad: number;
    precioUnitario: number | string;
    subtotal: number | string;
}

interface Order {
    id: string;
    numero: string;
    origen: string;
    clienteNombre: string | null;
    clienteTelefono: string | null;
    clienteDireccion: string | null;
    tipoEntrega?: "DELIVERY" | "RETIRO" | null;
    recibidoEn: string;
    estado: EstadoPedido;
    cobrado: boolean;
    cobradoEn: string | null;
    metodoPago: string | null;
    total: number | string;
    subtotal: number | string;
    descuento: number | string;
    notas: string | null;
    items: OrderItem[];
    enPreparacionEn: string | null;
    listoEn: string | null;
    finalizadoEn: string | null;
    canceladoEn: string | null;
    motivoCancelacion: string | null;
    events: {
        id: string;
        tipo: TipoEventoPedido;
        descripcion: string;
        actorName: string | null;
        createdAt: string;
    }[];
}

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: LucideIcon, bg: string }> = {
    RECIBIDO: {
        label: "Recibido (Web)",
        color: "text-blue-600",
        bg: "bg-blue-50",
        icon: ShoppingBag,
    },
    PENDIENTE: {
        label: "Pendiente",
        color: "text-orange-600",
        bg: "bg-orange-50",
        icon: Clock,
    },
    EN_PREPARACION: {
        label: "En Preparación",
        color: "text-purple-600",
        bg: "bg-purple-50",
        icon: ChefHat,
    },
    LISTO: {
        label: "Listo para Retirar",
        color: "text-green-600",
        bg: "bg-green-50",
        icon: Package,
    },
    FINALIZADO: {
        label: "Finalizado",
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        icon: CheckCircle2,
    },
    CANCELADO: {
        label: "Cancelado",
        color: "text-red-600",
        bg: "bg-red-50",
        icon: XCircle,
    },
};

const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
};

const formatShortDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
};

export default function EmpleadoOrderDetailPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params.id as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
    const [paymentMethods, setPaymentMethods] = useState<{ id: string; label: string; enabled: boolean }[]>([]);
    const [suppliesData, setSuppliesData] = useState<{
        insumos: Array<{
            nombre: string;
            unidad: string;
            cantidadTotal: number;
            costoUnitario: number;
            costoTotal: number;
        }>;
        costoTotal: number;
        totalPedido: number;
        ganancia: number;
        margenGanancia: number;
    } | null>(null);

    useEffect(() => {
        fetchOrderDetail();
        loadPaymentMethods();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    const loadPaymentMethods = async () => {
        try {
            const result = await getConfigs(["payments.methods"]);
            if (result.success && result.data && result.data["payments.methods"]) {
                const methods = result.data["payments.methods"].filter((m: any) => m.enabled);
                setPaymentMethods(methods);
                if (methods.length > 0) {
                    setSelectedPaymentMethod(methods[0].id);
                }
            }
        } catch (error) {
            console.error("Error loading payment methods:", error);
        }
    };

    const loadSuppliesData = async () => {
        try {
            const result = await getOrderSuppliesAndCost(orderId);
            if (result.success && result.data) {
                setSuppliesData(result.data);
            }
        } catch (error) {
            console.error("Error loading supplies data:", error);
        }
    };

    const fetchOrderDetail = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/admin/dashboard/pedidos/${orderId}`);
            const data = await res.json();

            if (data.success) {
                setOrder(data.order);
            } else {
                toast.error("No se pudo cargar el pedido");
                router.push("/empleado/pedidos");
            }
        } catch (error) {
            console.error("Error fetching order:", error);
            toast.error("Error al cargar el pedido");
            router.push("/empleado/pedidos");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: EstadoPedido) => {
        if (!order) return;

        setIsUpdating(true);
        try {
            const result = await updateOrderStatus(order.id, newStatus);
            if (result.success) {
                toast.success("Estado actualizado correctamente");
                fetchOrderDetail();
            } else {
                toast.error(result.error || "Error al actualizar el estado");
            }
        } catch {
            toast.error("Error al actualizar el estado");
        } finally {
            setIsUpdating(false);
        }
    };

    const handlePaymentClick = () => {
        if (!order) return;

        if (order.cobrado) {
            // Si ya está cobrado, descobrar directamente
            handleTogglePayment(false, "");
        } else {
            // Si no está cobrado, mostrar dialog para seleccionar método
            setShowPaymentDialog(true);
        }
    };

    const handleTogglePayment = async (cobrado: boolean, metodoPago: string) => {
        if (!order) return;

        setIsUpdating(true);
        try {
            const result = await toggleOrderPayment(order.id, cobrado, metodoPago);
            if (result.success) {
                toast.success(cobrado ? "Pedido cobrado exitosamente" : "Pago marcado como pendiente");
                setShowPaymentDialog(false);
                fetchOrderDetail();
            } else {
                toast.error(result.error || "Error al actualizar el pago");
            }
        } catch {
            toast.error("Error al actualizar el pago");
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!order) {
        return null;
    }

    const statusConfig = STATUS_CONFIG[order.estado];
    const StatusIcon = statusConfig.icon;

    return (
        <div className="flex flex-col min-h-screen bg-zinc-50/30">
            {/* Header Section */}
            <div className="px-8 pt-8 pb-6 space-y-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="rounded-2xl h-10 px-4 hover:bg-zinc-100"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Volver
                    </Button>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                                <Package size={24} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black tracking-tighter text-zinc-900 uppercase">Pedido {order.numero}</h2>
                                <p className="text-sm text-zinc-500 font-medium">
                                    <Calendar className="inline h-3 w-3 mr-1" />
                                    {formatShortDate(order.recibidoEn)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Badge className={cn("px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider", statusConfig.bg, statusConfig.color)}>
                            <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                            {statusConfig.label}
                        </Badge>

                        {order.cobrado ? (
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
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-8 pb-12 flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Order Items */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Items Card */}
                        <Card className="rounded-[2.5rem] border-zinc-200 shadow-xl shadow-zinc-200/50 overflow-hidden bg-white">
                            <div className="p-8">
                                <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 mb-6">Productos del Pedido</h3>
                                <div className="space-y-4">
                                    {order.items.map((item, index) => (
                                        <div key={item.id} className={cn(
                                            "flex items-center justify-between py-4",
                                            index !== order.items.length - 1 && "border-b border-zinc-100"
                                        )}>
                                            <div className="flex-1">
                                                <p className="font-bold text-zinc-900">{item.nombreProduct}</p>
                                                <p className="text-sm text-zinc-500 font-medium mt-0.5">
                                                    {item.cantidad} × ${Number(item.precioUnitario).toLocaleString('es-AR')}
                                                </p>
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
                                        <span className="text-2xl font-black text-primary tracking-tight">
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
                                        {suppliesData.insumos.map((insumo, index) => (
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
                                        order.events.map((event, index) => {
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
                                                        <p className="text-sm text-zinc-500 font-medium mt-0.5">{formatDate(event.createdAt)}</p>
                                                        {event.actorName && (
                                                            <p className="text-xs text-zinc-400 mt-1 font-medium italic">
                                                                Por: {event.actorName}
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

                    {/* Right Column - Actions & Info */}
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
                                            <SelectContent>
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
                                            variant={order.cobrado ? "outline" : "default"}
                                            className={cn(
                                                "w-full h-11 rounded-xl font-bold text-xs uppercase tracking-wider transition-all",
                                                order.cobrado
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
                                            {order.cobrado ? "Marcar No Cobrado" : "Marcar como Cobrado"}
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
                                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Nombre</p>
                                            <p className="font-bold text-zinc-900 truncate">{order.clienteNombre || "N/A"}</p>
                                        </div>
                                    </div>

                                    {order.clienteTelefono && (
                                        <div className="flex items-start gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                                                <Phone className="h-4 w-4 text-zinc-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Teléfono</p>
                                                <p className="font-bold text-zinc-900 truncate">{order.clienteTelefono}</p>
                                            </div>
                                        </div>
                                    )}

                                    {getOrderDeliveryLabel(order) && (
                                        <div className="flex items-start gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                                                <ShoppingBag className="h-4 w-4 text-zinc-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Tipo de entrega</p>
                                                <p className="font-bold text-zinc-900">{getOrderDeliveryLabel(order)}</p>
                                            </div>
                                        </div>
                                    )}

                                    {getOrderDisplayAddress(order) && (
                                        <div className="flex items-start gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                                                <MapPin className="h-4 w-4 text-zinc-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Dirección</p>
                                                <p className="font-bold text-zinc-900">{getOrderDisplayAddress(order)}</p>
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
                                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Método</p>
                                            <p className="font-bold text-zinc-900">{order.metodoPago || "No especificado"}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                                            <Banknote className="h-4 w-4 text-zinc-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Estado</p>
                                            <div className="mt-1">
                                                <Badge className={cn(
                                                    "px-3 py-1 rounded-lg text-xs font-bold uppercase",
                                                    order.cobrado ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                                                )}>
                                                    {order.cobrado ? "Cobrado" : "Pendiente"}
                                                </Badge>
                                                {order.cobrado && order.cobradoEn && (
                                                    <p className="text-xs text-zinc-500 mt-1 font-medium">
                                                        {formatShortDate(order.cobradoEn)}
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
                                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Origen</p>
                                            <Badge variant="outline" className="mt-1 font-bold">{order.origen}</Badge>
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
            <Sheet open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
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

                        <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                            <div className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center flex-shrink-0">
                                    <Banknote className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-zinc-900">Total a cobrar</p>
                                    <p className="text-2xl font-black text-zinc-900 tracking-tight mt-1">
                                        ${Number(order?.total || 0).toLocaleString('es-AR')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <SheetFooter className="flex-col gap-2 sm:flex-col">
                        <Button
                            onClick={() => handleTogglePayment(true, selectedPaymentMethod)}
                            disabled={isUpdating || !selectedPaymentMethod}
                            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-200 h-12"
                        >
                            {isUpdating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <Banknote className="h-4 w-4 mr-2" />
                                    Confirmar Cobro
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowPaymentDialog(false)}
                            className="w-full rounded-xl font-medium h-12"
                            disabled={isUpdating}
                        >
                            Cancelar
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
