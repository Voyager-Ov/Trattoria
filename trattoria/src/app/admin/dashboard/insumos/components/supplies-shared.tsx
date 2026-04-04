export type Supply = {
    id: string;
    nombre: string;
    unidad: string;
    stockActual: number;
    stockMinimo?: number | null;
    costoUnitario?: number | null;
    activo: boolean;
    category?: { id: string; nombre: string } | null;
};

export type FilterStatus = "todos" | "activos" | "archivados" | "criticos";

export function getCategoryColor(nombre: string) {
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
    for (let index = 0; index < nombre.length; index += 1) {
        hash = nombre.charCodeAt(index) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
}

export function formatArCurrency(value: number) {
    return `$${value.toLocaleString("es-AR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })}`;
}

export function formatArCurrencyDetailed(value: number) {
    return `$${value.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

export function isCriticalSupply(supply: Supply) {
    return supply.activo && Number(supply.stockActual) <= Number(supply.stockMinimo || 0);
}

export const FILTER_LABEL: Record<FilterStatus, string> = {
    todos: "Todos",
    activos: "Activos",
    archivados: "Archivados",
    criticos: "Criticos",
};
