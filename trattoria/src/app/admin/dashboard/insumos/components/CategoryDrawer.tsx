"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Tag, Trash2 } from "lucide-react";
import { getSupplyCategories, createSupplyCategory } from "../actions";
import { toast } from "sonner";

interface CategoryDrawerProps {
  open: boolean;
  onClose: () => void;
  onCategoryCreated?: (category: Record<string, any>) => void;
}

export function CategoryDrawer({ open, onClose, onCategoryCreated }: CategoryDrawerProps) {
  const [categories, setCategories] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);

  const loadCategories = async () => {
    setLoading(true);
    const res = await getSupplyCategories();
    if (res.success) {
      setCategories(res.data as Record<string, any>[]);
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    // Check if category exists locally
    if (categories.some(c => c.nombre.toLowerCase() === newCatName.toLowerCase().trim())) {
      toast.error("La categoría ya existe");
      return;
    }

    setSaving(true);
    const result = await createSupplyCategory(newCatName.trim());
    if (result.success && result.data) {
      toast.success("Categoría creada");
      setNewCatName("");
      setCategories([...categories, result.data as Record<string, any>]);
      if (onCategoryCreated) onCategoryCreated(result.data);
    } else {
      toast.error(result.error || "Error al crear categoría");
    }
    setSaving(false);
  };

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetContent side="right" className="sm:max-w-md w-full p-0 flex flex-col rounded-l-[3rem] border-zinc-100 bg-white shadow-2xl">
        <div className="px-10 pt-10 pb-6 border-b border-zinc-50">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-900 border border-zinc-200">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-xl font-bold tracking-tight">Categorías de Insumos</SheetTitle>
                <SheetDescription className="text-sm font-medium">
                  Organiza tus insumos por tipo
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
        </div>

        <div className="p-10 flex-1 overflow-hidden flex flex-col gap-8 bg-zinc-50/50">
          <form onSubmit={handleCreate} className="space-y-4">
            <Label className="text-sm font-bold text-zinc-600 uppercase tracking-widest">Añadir Nueva</Label>
            <div className="flex gap-2">
              <Input 
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Ej: Lácteos, Carnes, Empaques..." 
                className="h-12 bg-white rounded-xl border-zinc-200"
              />
              <Button 
                type="submit" 
                disabled={saving || !newCatName.trim()}
                className="h-12 w-12 shrink-0 bg-zinc-900 text-white rounded-xl"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}
              </Button>
            </div>
          </form>

          <div className="flex-1 overflow-hidden flex flex-col">
            <Label className="text-sm font-bold text-zinc-600 uppercase tracking-widest mb-4">Categorías Existentes</Label>
            
            <div className="flex-1 bg-white rounded-2xl border border-zinc-200 overflow-y-auto">
              {loading ? (
                <div className="p-8 flex justify-center items-center">
                  <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
                </div>
              ) : categories.length === 0 ? (
                <div className="p-8 text-center text-sm font-medium text-zinc-500">
                  No hay categorías registradas
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {categories.map((cat) => (
                    <div key={cat.id} className="p-4 flex items-center justify-between group">
                      <span className="font-medium text-zinc-800">{cat.nombre}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 hover:bg-red-50" disabled>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
