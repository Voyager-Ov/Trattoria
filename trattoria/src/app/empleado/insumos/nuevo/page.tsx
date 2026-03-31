"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, Save, X } from "lucide-react";
import { UnidadMedida } from "@prisma/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSupply, getSupplyCategories } from "../actions";

type SupplyCategory = { id: string; nombre: string };

export default function NuevoInsumoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<SupplyCategory[]>([]);
  const [unidad, setUnidad] = useState<UnidadMedida>(UnidadMedida.GRAMO);
  const [categoryId, setCategoryId] = useState("none");

  useEffect(() => {
    async function loadCategories() {
      const result = await getSupplyCategories();
      if (result.success && result.data) {
        setCategories(result.data as SupplyCategory[]);
      }
    }
    loadCategories();
  }, []);

  async function handleSubmit(formData: FormData) {
    setLoading(true);

    const result = await createSupply({
      nombre: formData.get("nombre") as string,
      descripcion: (formData.get("descripcion") as string) || undefined,
      unidad: formData.get("unidad") as UnidadMedida,
      stockMinimo: Number(formData.get("stockMinimo")),
      costoUnitario: Number(formData.get("costoUnitario")),
      categoryId: (formData.get("categoryId") as string) !== "none" ? (formData.get("categoryId") as string) : undefined,
    });

    if (!result.success) {
      toast.error(result.error || "Error al crear el insumo");
      setLoading(false);
      return;
    }

    toast.success("Insumo creado correctamente");
    router.push("/empleado/insumos");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8 p-8 bg-zinc-50 min-h-screen">
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
        <Link href="/empleado" className="hover:text-zinc-600 transition-colors">Empleado</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/empleado/insumos" className="hover:text-zinc-600 transition-colors">Insumos</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-zinc-900">Nuevo Insumo</span>
      </div>

      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
            <div className="h-12 w-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-white">
              <Plus className="h-6 w-6" />
            </div>
            REGISTRAR INSUMO
          </h1>
          <p className="text-zinc-500 mt-2 font-medium">Alta rapida de inventario con categoria vinculada.</p>
        </div>
        <Link href="/empleado/insumos">
          <Button variant="outline" className="h-14 w-14 rounded-full border-zinc-200 p-0">
            <X className="h-6 w-6 text-zinc-400" />
          </Button>
        </Link>
      </div>

      <form action={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-zinc-200 shadow-sm space-y-8">
          <div className="space-y-3">
            <Label>Nombre</Label>
            <Input name="nombre" required className="h-14 bg-zinc-50 border-zinc-200 rounded-2xl" />
          </div>
          <div className="space-y-3">
            <Label>Descripcion</Label>
            <Input name="descripcion" className="h-14 bg-zinc-50 border-zinc-200 rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Unidad</Label>
              <Select name="unidad" value={unidad} onValueChange={(value) => setUnidad(value as UnidadMedida)}>
                <SelectTrigger className="h-14 bg-zinc-50 border-zinc-200 rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UnidadMedida).map((value) => (
                    <SelectItem key={value} value={value}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Categoria</Label>
              <Select name="categoryId" value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-14 bg-zinc-50 border-zinc-200 rounded-2xl">
                  <SelectValue placeholder="Sin categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin categoria</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Stock minimo</Label>
              <Input name="stockMinimo" type="number" step="0.01" defaultValue="1" className="h-14 bg-zinc-50 border-zinc-200 rounded-2xl" />
            </div>
            <div className="space-y-3">
              <Label>Costo unitario</Label>
              <Input name="costoUnitario" type="number" step="any" defaultValue="0" className="h-14 bg-zinc-50 border-zinc-200 rounded-2xl" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
            <p className="text-sm text-zinc-500">Las categorias ahora se guardan por relacion, igual que en admin.</p>
          </div>
          <Button type="submit" disabled={loading} className="h-16 w-full rounded-2xl bg-zinc-900 text-white font-black text-lg">
            <Save className="h-5 w-5 mr-2" />
            {loading ? "GUARDANDO..." : "GUARDAR INSUMO"}
          </Button>
        </div>
      </form>
    </div>
  );
}
