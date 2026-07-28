"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { createCategory } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsivePanel } from "@/components/ui/responsive-panel";
import { Switch } from "@/components/ui/switch";

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

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

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
                toast.success("Categoria creada");
                setNombre("");
                setActivo(true);
                setEsPromocion(false);
                onOpenChange(false);
                onSuccess?.();
            } else {
                toast.error(result.error || "Error al crear la categoria");
            }
        } catch {
            toast.error("Ocurrio un error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ResponsivePanel
            open={open}
            onOpenChange={onOpenChange}
            title="Nueva categoria"
            description="Crea una categoria para organizar el menu."
            mobileSide="bottom"
            desktopMode="sheet"
            contentClassName="sm:max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="nombre" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Nombre de la categoria
                    </Label>
                    <Input
                        id="nombre"
                        placeholder="Ej: Pizzas, Bebidas, Postres"
                        value={nombre}
                        onChange={(event) => setNombre(event.target.value)}
                        className="h-12 rounded-2xl border-zinc-200 bg-white text-sm shadow-sm"
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-[1.5rem] border border-zinc-100 bg-zinc-50 p-4">
                        <div className="space-y-1">
                            <Label className="text-sm font-bold text-zinc-900">Categoria activa</Label>
                            <p className="text-xs text-zinc-500">Visible para organizar productos del menu.</p>
                        </div>
                        <Switch checked={activo} onCheckedChange={setActivo} />
                    </div>

                    <div className="flex items-center justify-between rounded-[1.5rem] border border-zinc-100 bg-zinc-50 p-4">
                        <div className="space-y-1">
                            <Label className="text-sm font-bold text-zinc-900">Es promocion</Label>
                            <p className="text-xs text-zinc-500">Usa esta categoria para agrupar promociones.</p>
                        </div>
                        <Switch checked={esPromocion} onCheckedChange={setEsPromocion} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button type="button" variant="outline" className="h-11 rounded-2xl border-zinc-200" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading} className="h-11 rounded-2xl bg-zinc-900 hover:bg-zinc-800">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar
                    </Button>
                </div>
            </form>
        </ResponsivePanel>
    );
}
