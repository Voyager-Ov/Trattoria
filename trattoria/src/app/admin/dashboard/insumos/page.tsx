"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArchiveX,
  Eye,
  Filter,
  Loader2,
  Plus,
  Search,
  Settings,
  AlertTriangle,
  TrendingUp,
  History,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

type FilterStatus = "todos" | "activos" | "archivados";

/* ─── Stat card ─── */
function StatCard({
  label,
  value,
  icon: Icon,
  headerClass,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  headerClass: string;
}) {
  return (
    <div className="rounded-[2rem] border-2 border-zinc-100 bg-white shadow-sm overflow-hidden flex flex-col">
      {/* Colored header */}
      <div className={`flex items-center justify-between px-5 py-3 rounded-t-[2rem] ${headerClass}`}>
        <span className="text-sm font-semibold text-white">{label}</span>
        <Icon className="h-5 w-5 text-white/80" />
      </div>
      {/* White body */}
      <div className="px-6 py-6">
        <span className="text-4xl font-bold text-zinc-900">{value}</span>
      </div>
    </div>
  );
}

/* ─── Category badge color ─── */
function getCategoryColor(nombre: string) {
  const colors = [
    "bg-blue-100 text-blue-800 border-blue-200",
    "bg-purple-100 text-purple-800 border-purple-200",
    "bg-amber-100 text-amber-800 border-amber-200",
    "bg-emerald-100 text-emerald-800 border-emerald-200",
    "bg-rose-100 text-rose-800 border-rose-200",
    "bg-cyan-100 text-cyan-800 border-cyan-200",
    "bg-orange-100 text-orange-800 border-orange-200",
    "bg-indigo-100 text-indigo-800 border-indigo-200",
  ];
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

/* ─── Page ─── */
export default function InsumosPage() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("todos");
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

  useEffect(() => { loadSupplies(); }, []);

  /* Filtered list */
  const filteredSupplies = useMemo(() => {
    return supplies.filter((s) => {
      const matchSearch = s.nombre.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        filterStatus === "todos"
          ? true
          : filterStatus === "activos"
          ? s.activo
          : !s.activo;
      return matchSearch && matchStatus;
    });
  }, [search, filterStatus, supplies]);

  /* Stats (always based on full list) */
  const totalInsumos = supplies.length;
  const activeSupplies = supplies.filter((s) => s.activo);
  const totalActivos = activeSupplies.length;
  const inversionTotal = activeSupplies.reduce(
    (acc, s) => acc + Number(s.stockActual) * Number(s.costoUnitario || 0),
    0,
  );
  const stockCritico = supplies.filter(
    (s) => s.activo && Number(s.stockActual) <= Number(s.stockMinimo || 0),
  ).length;

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

  const filterLabel: Record<FilterStatus, string> = {
    todos: "Todos Los Estados",
    activos: "Solo Activos",
    archivados: "Archivados",
  };

  return (
    <div className="flex flex-col gap-6 p-8 bg-white min-h-screen">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Inventario de Insumos</h1>
        <p className="text-zinc-500 mt-1 text-sm">Gestiona las materias primas y el stock de tu trattoria.</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Insumos"
          value={loading ? "—" : totalInsumos}
          icon={Settings}
          headerClass="bg-blue-600"
        />
        <StatCard
          label="Insumos Activos"
          value={loading ? "—" : totalActivos}
          icon={Settings}
          headerClass="bg-violet-600"
        />
        <StatCard
          label="Inversión Total (Activos)"
          value={
            loading
              ? "—"
              : `$${inversionTotal.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`
          }
          icon={TrendingUp}
          headerClass="bg-amber-500"
        />
        <StatCard
          label="Stock Crítico"
          value={loading ? "—" : stockCritico}
          icon={AlertTriangle}
          headerClass="bg-emerald-600"
        />
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-white rounded-[2rem] border-2 border-zinc-100 shadow-sm px-5 py-4 flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative w-60">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="pl-10 bg-zinc-50 border-2 border-zinc-200 rounded-full h-9 text-sm"
          />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Categorías */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-full border-2 border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:translate-x-[-1px] hover:translate-y-[-1px] text-sm font-medium px-4 h-9 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] transition-all"
          onClick={() => setShowCategories(true)}
        >
          <Filter className="h-3.5 w-3.5" />
          Categorías
        </Button>

        {/* Estado filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 rounded-full border-2 border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:translate-x-[-1px] hover:translate-y-[-1px] text-sm font-medium px-4 h-9 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] transition-all">
              {filterLabel[filterStatus]}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-lg border-zinc-200">
            <DropdownMenuItem onClick={() => setFilterStatus("todos")}>Todos Los Estados</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus("activos")}>Solo Activos</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus("archivados")}>Archivados</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Registrar Stock */}
        <Link href="/admin/dashboard/insumos/stock">
          <Button variant="outline" size="sm" className="gap-2 rounded-full border-2 border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:translate-x-[-1px] hover:translate-y-[-1px] text-sm font-medium px-4 h-9 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)] transition-all">
            <History className="h-3.5 w-3.5" />
            Registrar Stock
          </Button>
        </Link>

        {/* Nuevo Insumo */}
        <Link href="/admin/dashboard/insumos/nuevo">
          <Button size="sm" className="gap-2 rounded-full border-2 border-zinc-900 bg-zinc-900 hover:bg-zinc-800 text-white hover:translate-x-[-1px] hover:translate-y-[-1px] text-sm font-semibold px-5 h-9 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
            <Plus className="h-3.5 w-3.5" />
            Nuevo Insumo
          </Button>
        </Link>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-zinc-100">
              <tr>
                {["Insumo", "Categoría", "Stock Actual", "Unidad", "Costo Unit.", "Valor Inv.", "Estado", "Acciones"].map(
                  (col, i) => (
                    <th
                      key={col}
                      className={`px-6 py-3 text-xs uppercase tracking-widest text-zinc-400 font-semibold ${
                        i === 7 ? "text-right" : "text-left"
                      }`}
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-zinc-400">
                    <div className="inline-flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Cargando inventario...
                    </div>
                  </td>
                </tr>
              ) : filteredSupplies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 text-zinc-300" />
                      <p className="text-sm text-blue-500">No se encontraron resultados</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSupplies.map((supply) => {
                  const isCritical =
                    supply.activo && Number(supply.stockActual) <= Number(supply.stockMinimo || 0);
                  const valorInv =
                    Number(supply.stockActual) * Number(supply.costoUnitario || 0);
                  const catColor = getCategoryColor(supply.category?.nombre || "Sin categoría");

                  return (
                    <tr key={supply.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isCritical && <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />}
                          <span className="font-semibold text-zinc-900">{supply.nombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${catColor}`}>
                          {supply.category?.nombre || "Sin categoría"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${isCritical ? "text-amber-600" : "text-zinc-700"}`}>
                          {Number(supply.stockActual).toFixed(2)}
                        </span>
                        <div className="text-xs text-zinc-400">
                          Mín: {Number(supply.stockMinimo || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-500 text-sm">{supply.unidad}</td>
                      <td className="px-6 py-4 text-zinc-700 font-medium">
                        ${Number(supply.costoUnitario || 0).toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-4 text-zinc-700 font-medium">
                        ${valorInv.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-4">
                        {supply.activo ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-500 border border-zinc-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                            Archivado
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/dashboard/insumos/${supply.id}`}>
                            <Button variant="outline" size="sm" className="border-zinc-200 gap-1 h-8">
                              <Eye className="h-3.5 w-3.5" />
                              Ver
                            </Button>
                          </Link>
                          {supply.activo && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1 h-8"
                              onClick={() => setArchiveId(supply.id)}
                            >
                              <ArchiveX className="h-3.5 w-3.5" />
                              Archivar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredSupplies.length > 0 && (
          <div className="px-6 py-3 border-t border-zinc-100 bg-zinc-50/50">
            <p className="text-xs text-zinc-400">
              Mostrando {filteredSupplies.length} de {supplies.length} insumos
            </p>
          </div>
        )}
      </div>

      <CategoryDrawer open={showCategories} onClose={() => setShowCategories(false)} />

      <AlertDialog open={!!archiveId} onOpenChange={() => setArchiveId(null)}>
        <AlertDialogContent className="rounded-2xl border-zinc-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Archivar insumo</AlertDialogTitle>
            <AlertDialogDescription>
              El insumo dejará de aparecer en las listas activas, pero mantendrá su historial.
            </AlertDialogDescription>
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
