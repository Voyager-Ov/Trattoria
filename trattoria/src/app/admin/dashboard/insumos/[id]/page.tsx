import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Edit, History } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSupplyById } from "../actions";

export default async function InsumoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getSupplyById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const supply = result.data as {
    id: string;
    nombre: string;
    descripcion?: string | null;
    unidad: string;
    stockActual: number;
    stockMinimo?: number | null;
    costoUnitario?: number | null;
    activo: boolean;
    category?: { nombre: string } | null;
    createdAt: string | Date;
    movements?: Array<{ id: string; tipo: string; cantidad: number; motivo?: string | null; createdAt: string | Date }>;
  };

  return (
    <div className="flex flex-col gap-8 p-8 bg-zinc-50 min-h-screen">
      <div className="flex items-center justify-between">
        <Link href="/admin/dashboard/insumos" className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900">
          <ChevronLeft className="h-4 w-4" />
          Volver a insumos
        </Link>

        <Link href={`/admin/dashboard/insumos/${supply.id}/editar`}>
          <Button variant="outline" className="rounded-xl border-zinc-200">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm p-8 space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-zinc-900">{supply.nombre}</h1>
          {!supply.activo && <Badge variant="secondary">Archivado</Badge>}
        </div>
        {supply.descripcion && <p className="text-zinc-500">{supply.descripcion}</p>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Categoria</p>
            <p className="mt-2 font-semibold text-zinc-900">{supply.category?.nombre || "Sin categoria"}</p>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Unidad</p>
            <p className="mt-2 font-semibold text-zinc-900">{supply.unidad}</p>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Stock</p>
            <p className="mt-2 font-semibold text-zinc-900">{Number(supply.stockActual).toFixed(2)}</p>
            <p className="text-xs text-zinc-500 mt-1">Minimo: {Number(supply.stockMinimo || 0).toFixed(2)}</p>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Costo unitario</p>
            <p className="mt-2 font-semibold text-zinc-900">${Number(supply.costoUnitario || 0).toFixed(2)}</p>
            <p className="text-xs text-zinc-500 mt-1">{format(new Date(supply.createdAt), "dd/MM/yyyy", { locale: es })}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-6 border-b border-zinc-100">
          <History className="h-5 w-5 text-zinc-500" />
          <h2 className="text-lg font-bold text-zinc-900">Historial de movimientos</h2>
        </div>

        <div className="divide-y divide-zinc-100">
          {supply.movements && supply.movements.length > 0 ? (
            supply.movements.map((movement) => (
              <div key={movement.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 text-sm">
                <div className="font-medium text-zinc-900">{format(new Date(movement.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}</div>
                <div className="text-zinc-600">{movement.tipo}</div>
                <div className="text-zinc-600">{Number(movement.cantidad).toFixed(2)} {supply.unidad}</div>
                <div className="text-zinc-500">{movement.motivo || "-"}</div>
              </div>
            ))
          ) : (
            <div className="p-8 text-sm text-zinc-500">No hay movimientos registrados.</div>
          )}
        </div>
      </div>
    </div>
  );
}
