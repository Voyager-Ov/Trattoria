"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsivePanel } from "@/components/ui/responsive-panel";

import { createSupplyCategory, getSupplyCategories } from "../actions";

interface CategoryDrawerProps {
    open: boolean;
    onClose: () => void;
    onCategoryCreated?: (category: Record<string, unknown>) => void;
}

export function CategoryDrawer({ open, onClose, onCategoryCreated }: CategoryDrawerProps) {
    const [categories, setCategories] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newCatName, setNewCatName] = useState("");

    const loadCategories = useCallback(async () => {
        setLoading(true);
        const response = await getSupplyCategories();
        if (response.success) {
            setCategories(response.data as Record<string, unknown>[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            void loadCategories();
        }
    }, [loadCategories, open]);

    const handleCreate = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!newCatName.trim()) return;

        if (
            categories.some((category) => {
                const name = typeof category.nombre === "string" ? category.nombre : "";
                return name.toLowerCase() === newCatName.toLowerCase().trim();
            })
        ) {
            toast.error("La categoria ya existe");
            return;
        }

        setSaving(true);
        const result = await createSupplyCategory(newCatName.trim());
        if (result.success && result.data) {
            toast.success("Categoria creada");
            setNewCatName("");
            setCategories((current) => [...current, result.data as Record<string, unknown>]);
            onCategoryCreated?.(result.data as Record<string, unknown>);
        } else {
            toast.error(result.error || "Error al crear categoria");
        }
        setSaving(false);
    };

    return (
        <ResponsivePanel
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) onClose();
            }}
            title={<span className="sr-only">Categorias de insumos</span>}
            description={<span className="sr-only">Gestiona categorias de inventario</span>}
            contentClassName="flex h-full w-full flex-col overflow-hidden border-zinc-100 bg-white px-0 pt-0 shadow-2xl sm:max-w-md"
            desktopContentClassName="p-0"
        >
            <div className="flex h-full min-h-0 flex-col">
                <div className="border-b border-zinc-50 px-5 pb-5 pt-5 sm:px-10 sm:pb-6 sm:pt-10">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-900">
                            <Tag className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-zinc-950">Categorias de Insumos</h2>
                            <p className="text-sm font-medium text-zinc-500">Organiza tus insumos por tipo</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 flex-col gap-6 overflow-hidden bg-zinc-50/50 p-5 sm:gap-8 sm:p-10">
                    <form onSubmit={handleCreate} className="space-y-4">
                        <Label className="text-sm font-bold uppercase tracking-widest text-zinc-600">Anadir nueva</Label>
                        <div className="flex gap-2">
                            <Input
                                value={newCatName}
                                onChange={(event) => setNewCatName(event.target.value)}
                                placeholder="Ej: Lacteos, Carnes, Empaques..."
                                className="h-12 rounded-2xl border-zinc-200 bg-white"
                            />
                            <Button
                                type="submit"
                                disabled={saving || !newCatName.trim()}
                                className="h-12 w-12 shrink-0 rounded-2xl bg-zinc-900 text-white"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}
                            </Button>
                        </div>
                    </form>

                    <div className="flex flex-1 flex-col overflow-hidden">
                        <Label className="mb-4 text-sm font-bold uppercase tracking-widest text-zinc-600">
                            Categorias existentes
                        </Label>

                        <div className="flex-1 overflow-y-auto rounded-[1.5rem] border border-zinc-200 bg-white">
                            {loading ? (
                                <div className="flex items-center justify-center p-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                                </div>
                            ) : categories.length === 0 ? (
                                <div className="p-8 text-center text-sm font-medium text-zinc-500">
                                    No hay categorias registradas
                                </div>
                            ) : (
                                <div className="divide-y divide-zinc-100">
                                    {categories.map((category) => {
                                        const name = typeof category.nombre === "string" ? category.nombre : "Categoria";
                                        const id = typeof category.id === "string" ? category.id : name;

                                        return (
                                            <div key={id} className="group flex items-center justify-between p-4">
                                                <span className="font-medium text-zinc-800">{name}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                                                    disabled
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ResponsivePanel>
    );
}
