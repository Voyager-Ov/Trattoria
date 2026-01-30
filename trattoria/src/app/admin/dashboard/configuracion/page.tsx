"use client";

import React, { useState, useEffect } from "react";
import {
    Settings,
    Save,
    Plus,
    Trash2,
    CreditCard,
    Store,
    Clock,
    Loader2,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ConfiguracionPage() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Config States
    const [paymentMethods, setPaymentMethods] = useState<string[]>([
        "EFECTIVO", "TRANSFERENCIA", "TARJETA", "MERCADOPAGO"
    ]);
    const [newMethod, setNewMethod] = useState("");

    const [businessName, setBusinessName] = useState("Trattoria");
    const [address, setAddress] = useState("Calle Principal 123");
    const [phone, setPhone] = useState("11 5555-5555");

    const handleAddMethod = () => {
        if (!newMethod.trim()) return;
        if (paymentMethods.includes(newMethod.toUpperCase())) {
            toast.error("Este método ya existe");
            return;
        }
        setPaymentMethods([...paymentMethods, newMethod.toUpperCase().replace(/\s+/g, '_')]);
        setNewMethod("");
    };

    const handleRemoveMethod = (method: string) => {
        setPaymentMethods(paymentMethods.filter(m => m !== method));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success("Configuración guardada correctamente");
        } catch (error) {
            toast.error("Error al guardar la configuración");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-zinc-900 uppercase italic flex items-center gap-3">
                        <Settings className="h-8 w-8 text-primary" />
                        Configuración
                    </h1>
                    <p className="text-zinc-500 font-medium">Gestiona los parámetros generales de tu negocio.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl h-12 px-8 gap-2 shadow-lg shadow-zinc-200"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Guardar Cambios
                </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Métodos de Pago */}
                <Card className="rounded-[2.5rem] border-zinc-100 shadow-xl shadow-zinc-100/50 overflow-hidden">
                    <CardHeader className="bg-emerald-50/50 p-8 border-b border-emerald-100/50">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                <CreditCard className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold text-emerald-900">Métodos de Pago</CardTitle>
                                <CardDescription className="text-emerald-700/60 font-medium">Define cómo pueden pagar tus clientes.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-4">
                            {paymentMethods.map((method) => (
                                <div key={method} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group transition-all hover:bg-white hover:shadow-md">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                        <span className="font-bold text-zinc-900">{method}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveMethod(method)}
                                        className="rounded-xl text-zinc-300 hover:text-red-500 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <Separator className="bg-zinc-100" />

                        <div className="flex gap-2">
                            <Input
                                placeholder="Nuevo método (ej: TARJETA)"
                                className="rounded-2xl h-12 border-zinc-200 focus:ring-emerald-500 font-bold uppercase transition-all"
                                value={newMethod}
                                onChange={(e) => setNewMethod(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddMethod()}
                            />
                            <Button
                                onClick={handleAddMethod}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl h-12 px-6 shadow-lg shadow-emerald-100"
                            >
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Perfil del Negocio */}
                <Card className="rounded-[2.5rem] border-zinc-100 shadow-xl shadow-zinc-100/50 overflow-hidden">
                    <CardHeader className="bg-blue-50/50 p-8 border-b border-blue-100/50">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                <Store className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold text-blue-900">Perfil del Negocio</CardTitle>
                                <CardDescription className="text-blue-700/60 font-medium">Información pública de la Trattoria.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Nombre del Local</Label>
                                <Input
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    className="rounded-2xl h-12 border-zinc-200 font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Dirección</Label>
                                <Input
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="rounded-2xl h-12 border-zinc-200 font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Teléfono de Contacto</Label>
                                <Input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="rounded-2xl h-12 border-zinc-200 font-bold"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Operación */}
                <Card className="rounded-[2.5rem] border-zinc-100 shadow-xl shadow-zinc-100/50 overflow-hidden md:col-span-2">
                    <CardHeader className="bg-orange-50/50 p-8 border-b border-orange-100/50">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-200">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold text-orange-900">Operación y Pedidos</CardTitle>
                                <CardDescription className="text-orange-700/60 font-medium">Configura cómo funciona el flujo de pedidos.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-6 bg-orange-50/30 rounded-[2rem] border border-orange-100/50">
                                    <div className="space-y-1">
                                        <p className="font-bold text-orange-900">Auto-Refresco Dashboard</p>
                                        <p className="text-xs text-orange-700/70">Actualizar pedidos automáticamente.</p>
                                    </div>
                                    <Badge className="bg-emerald-500 text-white border-none rounded-full px-4 h-8">Activo (10s)</Badge>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100">
                                    <div className="space-y-1">
                                        <p className="font-bold text-zinc-900">Notificaciones Sonoras</p>
                                        <p className="text-xs text-zinc-500">Alertar ante nuevos pedidos web.</p>
                                    </div>
                                    <Badge variant="outline" className="border-zinc-200 text-zinc-400 rounded-full px-4 h-8 italic">Próximamente</Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
