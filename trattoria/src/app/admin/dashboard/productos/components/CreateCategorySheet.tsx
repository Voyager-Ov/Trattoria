"use client";

import React, { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { createCategory } from "../actions";
import { Loader2, Save } from "lucide-react";

interface CreateCategorySheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function CreateCategorySheet({ open, onOpenChange, onSuccess }: CreateCategorySheetProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [nombre, setNombre] = useState("");
    const [activo, setActivo] = useState(true);
    const [esPromocion, setEsPromocion] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim()) {
            toast.error("El nombre es obligatorio");
            return;
        }

        setIsLoading(true);
        try {
            const result = await createCategory({
                nombre: nombre.trim(),
                activo,
                esPromocion,
            });

            if (result.success) {
                toast.success("Categoría creada exitosamente");
                setNombre("");
                setActivo(true);
                setEsPromocion(false);
                onOpenChange(false);
                onSuccess?.();
            } else {
                toast.error(result.error || "Error al crear la categoría");
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md rounded-l-[2rem] border-zinc-200 shadow-2xl p-0 overflow-hidden flex flex-col">
                <SheetHeader className="p-8 bg-zinc-50 border-b border-zinc-100">
                    <SheetTitle className="text-2xl font-bold text-zinc-900 tracking-tight">Nueva Categoría</SheetTitle>
                    <SheetDescription className="text-zinc-500 font-medium">
                        Crea una nueva categoría para organizar tus productos.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto">
                    <div className="space-y-2">
                        <Label htmlFor="nombre" className="text-xs font-bold uppercase tracking-wider text-zinc-400">Nombre de la Categoría</Label>
                        <Input
                            id="nombre"
                            placeholder="Ej: Pizzas, Bebidas, Postres..."
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className="h-12 bg-white border-zinc-200 rounded-xl focus-visible:ring-zinc-400 transition-all text-sm shadow-none"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-bold text-zinc-900">Categoría Activa</Label>
                            <p className="text-[0.7rem] text-zinc-500 font-medium">Determina si la categoría es visible en el menú.</p>
                        </div>
                        <Switch
                            checked={activo}
                            onCheckedChange={setActivo}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-bold text-zinc-900">Es Promoción</Label>
                            <p className="text-[0.7rem] text-zinc-500 font-medium">Marca esto si la categoría contendrá promociones.</p>
                        </div>
                        <Switch
                            checked={esPromocion}
                            onCheckedChange={setEsPromocion}
                        />
                    </div>

                    <div className="mt-auto pt-6 flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 h-12 rounded-full border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-all"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 h-12 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-zinc-200"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Crear Categoría
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
