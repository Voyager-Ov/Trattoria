"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, Save, X } from "lucide-react";
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
import { getSupplyById, getSupplyCategories, updateSupply } from "../../actions";

type SupplyCategory = { id: string; nombre: string };
type SupplyDetail = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  unidad: UnidadMedida;
  stockMinimo?: number | null;
  costoUnitario?: number | null;
  category?: { id: string; nombre: string } | null;
};

export default function EditarInsumoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<SupplyCategory[]>([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [unidad, setUnidad] = useState<UnidadMedida>(UnidadMedida.GRAMO);
  const [stockMinimo, setStockMinimo] = useState("1");
  const [costoUnitario, setCostoUnitario] = useState("0");
  const [categoryId, setCategoryId] = useState("none");

  useEffect(() => {
    async function loadData() {
      setLoadingData(true);
      const [categoriesResult, supplyResult] = await Promise.all([getSupplyCategories(), getSupplyById(id)]);

      if (categoriesResult.success && categoriesResult.data) {
        setCategories(categoriesResult.data as SupplyCategory[]);
      }

      if (!supplyResult.success || !supplyResult.data) {
        toast.error("No se pudo cargar el insumo");
        router.push("/admin/dashboard/insumos");
        return;
      }

      const supply = supplyResult.data as SupplyDetail;
      setNombre(supply.nombre);
      setDescripcion(supply.descripcion || "");
      setUnidad(supply.unidad);
      setStockMinimo(String(Number(supply.stockMinimo || 0)));
      setCostoUnitario(String(Number(supply.costoUnitario || 0)));
      setCategoryId(supply.category?.id || "none");
      setLoadingData(false);
    }

    loadData();
  }, [id, router]);

  async function handleSubmit(formData: FormData) {
    setSaving(true);

    const result = await updateSupply(id, {
      nombre: formData.get("nombre") as string,
      descripcion: (formData.get("descripcion") as string) || undefined,
      unidad: formData.get("unidad") as UnidadMedida,
      stockMinimo: Number(formData.get("stockMinimo")),
      costoUnitario: Number(formData.get("costoUnitario")),
      categoryId: (formData.get("categoryId") as string) !== "none" ? (formData.get("categoryId") as string) : undefined,
    });

    if (!result.success) {
      toast.error(result.error || "Error al actualizar el insumo");
      setSaving(false);
      return;
    }

    toast.success("Insumo actualizado correctamente");
    router.push(`/admin/dashboard/insumos/${id}`);
    router.refresh();
  }

  if (loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex items-center gap-3 text-zinc-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          Cargando insumo...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-8 bg-zinc-50 min-h-screen">
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
        <Link href="/admin/dashboard" className="hover:text-zinc-600 transition-colors">Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/admin/dashboard/insumos" className="hover:text-zinc-600 transition-colors">Inventario</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/admin/dashboard/insumos/${id}`} className="hover:text-zinc-600 transition-colors">{nombre}</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-zinc-900">Editar</span>
      </div>

      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tight">EDITAR INSUMO</h1>
          <p className="text-zinc-500 mt-2 font-medium">Actualiza categoria, costos y limites de stock.</p>
        </div>
        <Link href={`/admin/dashboard/insumos/${id}`}>
          <Button variant="outline" className="h-14 w-14 rounded-full border-zinc-200 p-0">
            <X className="h-6 w-6 text-zinc-400" />
          </Button>
        </Link>
      </div>

      <form action={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-zinc-200 shadow-sm space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Nombre</Label>
              <Input name="nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="h-16 bg-zinc-50 border-transparent rounded-[1.5rem] px-6 font-bold" />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Unidad</Label>
              <Select name="unidad" value={unidad} onValueChange={(value) => setUnidad(value as UnidadMedida)}>
                <SelectTrigger className="h-16 bg-zinc-50 border-transparent rounded-[1.5rem] px-6 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-zinc-100 shadow-xl">
                  {Object.values(UnidadMedida).map((value) => (
                    <SelectItem key={value} value={value}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Categoria</Label>
              <Select name="categoryId" value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-16 bg-zinc-50 border-transparent rounded-[1.5rem] px-6 font-bold">
                  <SelectValue placeholder="Seleccionar categoria" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-zinc-100 shadow-xl max-h-[300px]">
                  <SelectItem value="none">Sin categoria</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Descripcion</Label>
              <Input name="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="h-16 bg-zinc-50 border-transparent rounded-[1.5rem] px-6" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Stock minimo</Label>
              <Input name="stockMinimo" type="number" step="0.01" required value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)} className="h-16 bg-zinc-50 border-transparent rounded-[1.5rem] px-6 font-bold" />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Costo unitario</Label>
              <Input name="costoUnitario" type="number" step="any" required value={costoUnitario} onChange={(e) => setCostoUnitario(e.target.value)} className="h-16 bg-zinc-50 border-transparent rounded-[1.5rem] px-6 font-bold" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-6 ml-1">Vista Previa</h4>
            <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 space-y-3">
              <p className="font-black uppercase text-zinc-900">{nombre}</p>
              <p className="text-xs text-zinc-500">{categories.find((category) => category.id === categoryId)?.nombre || "Sin categoria"}</p>
              <p className="text-xs text-zinc-500">{unidad}</p>
              <p className="text-xs text-zinc-500">Stock minimo: {stockMinimo}</p>
              <p className="text-xs text-zinc-500">Costo unitario: ${Number(costoUnitario || 0).toFixed(2)}</p>
            </div>
          </div>

          <Button type="submit" disabled={saving || !nombre.trim()} className="h-16 w-full rounded-2xl bg-zinc-900 text-white font-black text-lg">
            <Save className="h-5 w-5 mr-2" />
            {saving ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
          </Button>
        </div>
      </form>
    </div>
  );
}
