"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArchiveX, Eye, Filter, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CategoryDrawer } from "./components/CategoryDrawer";
import { archiveSupply, getSupplies } from "./actions";

type Supply = {
  id: string;
  nombre: string;
  unidad: string;
  stockActual: number;
  stockMinimo?: number | null;
  costoUnitario?: number | null;
  activo: boolean;
  category?: { id: string; nombre: string } | null;
};

export default function InsumosPage() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [showCategories, setShowCategories] = useState(false);

  async function loadSupplies() {
    setLoading(true);
    const result = await getSupplies();
    if (result.success && result.data) {
      setSupplies(result.data as Supply[]);
    } else {
      toast.error(result.error || "No se pudieron cargar los insumos");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadSupplies();
  }, []);

  const filteredSupplies = useMemo(
    () => supplies.filter((supply) => supply.nombre.toLowerCase().includes(search.toLowerCase())),
    [search, supplies],
  );

  async function handleArchive() {
    if (!archiveId) return;
    const result = await archiveSupply(archiveId);
    if (!result.success) {
      toast.error(result.error || "No se pudo archivar el insumo");
      return;
    }
    toast.success("Insumo archivado");
    setArchiveId(null);
    loadSupplies();
  }

  return (
    <div className="flex flex-col gap-8 p-8 bg-zinc-50 min-h-screen">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Inventario de Insumos</h1>
          <p className="text-zinc-500 mt-1">Categorias relacionales, costos base y stock operativo.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-zinc-200" onClick={() => setShowCategories(true)}>
            <Filter className="h-4 w-4 mr-2" />
            Categorias
          </Button>
          <Link href="/admin/dashboard/insumos/stock">
            <Button variant="outline" className="border-zinc-200">Registrar Stock</Button>
          </Link>
          <Link href="/admin/dashboard/insumos/nuevo">
            <Button className="bg-zinc-900 hover:bg-zinc-800">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Insumo
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm p-5">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar insumos..." className="pl-11 h-12 rounded-full bg-zinc-50 border-zinc-200" />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="text-left px-6 py-4 text-xs uppercase tracking-widest text-zinc-500">Insumo</th>
                <th className="text-left px-6 py-4 text-xs uppercase tracking-widest text-zinc-500">Categoria</th>
                <th className="text-left px-6 py-4 text-xs uppercase tracking-widest text-zinc-500">Stock</th>
                <th className="text-left px-6 py-4 text-xs uppercase tracking-widest text-zinc-500">Unidad</th>
                <th className="text-left px-6 py-4 text-xs uppercase tracking-widest text-zinc-500">Costo</th>
                <th className="text-right px-6 py-4 text-xs uppercase tracking-widest text-zinc-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-zinc-500">
                    <div className="inline-flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Cargando inventario...
                    </div>
                  </td>
                </tr>
              ) : filteredSupplies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-zinc-500">No se encontraron insumos.</td>
                </tr>
              ) : (
                filteredSupplies.map((supply) => (
                  <tr key={supply.id}>
                    <td className="px-6 py-4 font-semibold text-zinc-900">{supply.nombre}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="border-zinc-200">{supply.category?.nombre || "Sin categoria"}</Badge>
                    </td>
                    <td className="px-6 py-4 text-zinc-600">
                      {Number(supply.stockActual).toFixed(2)}
                      <div className="text-xs text-zinc-400">Min: {Number(supply.stockMinimo || 0).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600">{supply.unidad}</td>
                    <td className="px-6 py-4 text-zinc-600">${Number(supply.costoUnitario || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/dashboard/insumos/${supply.id}`}>
                          <Button variant="outline" size="sm" className="border-zinc-200">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </Link>
                        {supply.activo && (
                          <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => setArchiveId(supply.id)}>
                            <ArchiveX className="h-4 w-4 mr-1" />
                            Archivar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CategoryDrawer open={showCategories} onClose={() => setShowCategories(false)} />

      <AlertDialog open={!!archiveId} onOpenChange={() => setArchiveId(null)}>
        <AlertDialogContent className="rounded-[2rem] border-zinc-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Archivar insumo</AlertDialogTitle>
            <AlertDialogDescription>El insumo dejara de aparecer en las altas activas, pero mantendra su historial.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} className="bg-rose-600 hover:bg-rose-700">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
