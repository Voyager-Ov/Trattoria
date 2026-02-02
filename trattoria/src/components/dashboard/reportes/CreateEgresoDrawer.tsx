"use client";

import { useState, useEffect } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CategoriaEgreso } from "@prisma/client";
import { createEgreso, updateEgreso } from "@/app/actions/egresoActions";
import { toast } from "sonner";
import { Loader2, Save, FileText, DollarSign, Calendar, Tag, User, TrendingDown, ShoppingCart, Zap, Users, MoreHorizontal } from "lucide-react";

interface CreateEgresoDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    editingEgreso?: any;
}

export function CreateEgresoDrawer({
    open,
    onOpenChange,
    onSuccess,
    editingEgreso
}: CreateEgresoDrawerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        descripcion: "",
        monto: "",
        categoria: "OTROS" as CategoriaEgreso,
        fecha: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (editingEgreso) {
            setFormData({
                descripcion: editingEgreso.descripcion || "",
                monto: editingEgreso.monto.toString() || "",
                categoria: (editingEgreso.categoria as CategoriaEgreso) || "OTROS",
                fecha: new Date(editingEgreso.fecha).toISOString().split('T')[0]
            });
        } else {
            setFormData({
                descripcion: "",
                monto: "",
                categoria: "OTROS",
                fecha: new Date().toISOString().split('T')[0]
            });
        }
    }, [editingEgreso, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

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
                proveedor: undefined // No longer using provider
            };

            let result;
            if (editingEgreso) {
                result = await updateEgreso(editingEgreso.id, data);
            } else {
                result = await createEgreso(data);
            }

            if (result.success) {
                toast.success(editingEgreso ? "Gasto actualizado" : "Gasto registrado correctamente");
                onSuccess();
                onOpenChange(false);
            } else {
                toast.error(result.error || "Ocurrió un error");
            }
        } catch (error) {
            toast.error("Error al procesar la solicitud");
        } finally {
            setIsLoading(false);
        }
    };

    const categories = [
        { id: "INSUMOS", label: "Insumos", icon: ShoppingCart, color: "blue" },
        { id: "SERVICIOS", label: "Servicios", icon: Zap, color: "amber" },
        { id: "NOMINA", label: "Nómina", icon: Users, color: "violet" },
        { id: "MANTENIMIENTO", label: "Mantenimiento", icon: TrendingDown, color: "emerald" },
        { id: "OTROS", label: "Otros", icon: MoreHorizontal, color: "zinc" },
    ];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl rounded-l-[3rem] border-zinc-100 overflow-y-auto p-10 bg-white">
                <form onSubmit={handleSubmit} className="flex flex-col min-h-full">
                    <SheetHeader className="mb-10 text-left">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-14 w-14 bg-red-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-red-100">
                                {editingEgreso ? <FileText size={28} /> : <TrendingDown size={20} />}
                            </div>
                        </div>
                        <SheetTitle className="text-4xl font-bold text-zinc-900 tracking-tight">
                            {editingEgreso ? "Editar Gasto" : "Registrar Gasto"}
                        </SheetTitle>
                        <SheetDescription className="text-zinc-500 text-lg">
                            {editingEgreso
                                ? "Modifica los detalles del gasto registrado."
                                : "Registra un nuevo egreso de dinero para tu negocio."}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 space-y-10 pb-8">
                        {/* Section: Clasificación - MOVED UP and ENLARGED */}
                        <div className="space-y-6">
                            <Label className="text-sm font-bold uppercase tracking-widest text-zinc-400">Seleccionar Categoría</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {categories.map((cat) => {
                                    const Icon = cat.icon;
                                    const isSelected = formData.categoria === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, categoria: cat.id as CategoriaEgreso })}
                                            className={`
                                                flex flex-col items-center justify-center gap-3 p-4 rounded-[1.5rem] border-2 transition-all duration-200
                                                ${isSelected
                                                    ? `border-red-500 bg-red-50 text-red-600 shadow-md transform scale-[1.02]`
                                                    : "border-zinc-100 bg-zinc-50 text-zinc-400 hover:border-zinc-200 hover:bg-zinc-100 hover:text-zinc-500"
                                                }
                                            `}
                                        >
                                            <div className={`
                                                h-12 w-12 rounded-2xl flex items-center justify-center transition-colors
                                                ${isSelected ? "bg-red-600 text-white" : "bg-white text-zinc-400"}
                                            `}>
                                                <Icon size={24} />
                                            </div>
                                            <span className="font-bold text-xs uppercase tracking-wider text-center">{cat.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Section: Información Principal */}
                        <div className="space-y-6">
                            <Label className="text-sm font-bold uppercase tracking-widest text-zinc-400">Detalles del Gasto</Label>

                            <div className="space-y-2">
                                <Label htmlFor="descripcion" className="text-zinc-700 font-bold flex items-center gap-2">
                                    <FileText size={14} className="text-zinc-400" />
                                    Descripción *
                                </Label>
                                <Textarea
                                    id="descripcion"
                                    placeholder="Ej. Pago de luz local principal"
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    className="min-h-[100px] rounded-xl border-zinc-200 bg-white focus-visible:ring-red-400 text-base font-medium shadow-sm resize-none"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="monto" className="text-zinc-700 font-bold flex items-center gap-2">
                                        <DollarSign size={14} className="text-zinc-400" />
                                        Monto *
                                    </Label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                                        <Input
                                            id="monto"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={formData.monto}
                                            onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                                            className="h-12 pl-8 rounded-xl border-zinc-200 bg-white focus-visible:ring-red-400 text-base font-medium shadow-sm"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fecha" className="text-zinc-700 font-bold flex items-center gap-2">
                                        <Calendar size={14} className="text-zinc-400" />
                                        Fecha
                                    </Label>
                                    <Input
                                        id="fecha"
                                        type="date"
                                        value={formData.fecha}
                                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                        className="h-12 rounded-xl border-zinc-200 bg-white focus-visible:ring-red-400 text-base font-medium shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 mt-auto border-t border-zinc-100">
                        <Button
                            type="submit"
                            className="w-full h-14 rounded-[1.5rem] bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-100 transition-all font-bold text-lg gap-3 disabled:grayscale"
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
                            className="w-full mt-2 h-12 rounded-xl font-medium text-zinc-500 hover:bg-zinc-50"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}

