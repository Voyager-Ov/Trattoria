"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Loader2, Package, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";

import {
    getInventoryValuation,
    getStockAlertsData,
    getStockMovementsData,
    StockAlertData,
    StockMovementData,
} from "./analyticsActions";
import { ReportLegendList, ReportSurface, truncateLabel } from "./reportes-ui";

interface InventorySectionProps {
    dateRange: {
        from: Date;
        to: Date;
    };
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(value);

export default function InventorySection({ dateRange }: InventorySectionProps) {
    const isMobile = useIsMobile();
    const [loading, setLoading] = useState(true);
    const [stockAlerts, setStockAlerts] = useState<StockAlertData[]>([]);
    const [stockMovements, setStockMovements] = useState<StockMovementData[]>([]);
    const [inventoryValuation, setInventoryValuation] = useState<{
        totalValue: number;
        top10: { nombre: string; valorTotal: number }[];
    } | null>(null);

    useEffect(() => {
        let active = true;

        async function loadData() {
            setLoading(true);

            try {
                const [alertsResult, movementsResult, valuationResult] = await Promise.all([
                    getStockAlertsData(),
                    getStockMovementsData(dateRange.from, dateRange.to),
                    getInventoryValuation(),
                ]);

                if (!active) {
                    return;
                }

                if (alertsResult.success && alertsResult.data) {
                    setStockAlerts(alertsResult.data);
                }

                if (movementsResult.success && movementsResult.data) {
                    setStockMovements(movementsResult.data);
                }

                if (valuationResult.success && valuationResult.data) {
                    setInventoryValuation(valuationResult.data);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void loadData();

        return () => {
            active = false;
        };
    }, [dateRange]);

    if (loading) {
        return (
            <div className="flex h-72 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
            </div>
        );
    }

    const criticalStock = stockAlerts.filter((supply) => supply.status === "critical");
    const warningStock = stockAlerts.filter((supply) => supply.status === "warning");
    const valuationLegend = (inventoryValuation?.top10 || []).slice(0, isMobile ? 5 : 10).map((item) => ({
        label: item.nombre,
        value: formatCurrency(item.valorTotal),
        color: "#f59e0b",
    }));

    return (
        <div className="space-y-5 md:space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 md:gap-6">
                <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-zinc-500">Stock critico</p>
                    <p className="mt-1 text-2xl font-black tracking-tight text-zinc-900 md:text-3xl">{criticalStock.length}</p>
                    <p className="mt-1 text-xs text-zinc-500">insumos por debajo del minimo</p>
                </div>

                <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                        <Package className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-zinc-500">En advertencia</p>
                    <p className="mt-1 text-2xl font-black tracking-tight text-zinc-900 md:text-3xl">{warningStock.length}</p>
                    <p className="mt-1 text-xs text-zinc-500">cerca del minimo</p>
                </div>

                <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-6 sm:col-span-2 xl:col-span-1">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                        <TrendingUp className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-zinc-500">Valor total inventario</p>
                    <p className="mt-1 break-words text-2xl font-black tracking-tight text-zinc-900 md:text-3xl">
                        {inventoryValuation?.totalValue ? formatCurrency(inventoryValuation.totalValue) : "N/A"}
                    </p>
                </div>
            </div>

            <ReportSurface
                title="Estado de stock"
                description="Alertas activas de inventario bajo."
            >
                {stockAlerts.length > 0 ? (
                    <div className="space-y-2.5">
                        {stockAlerts.slice(0, 20).map((item) => (
                            <div
                                key={item.id}
                                className={`flex items-center justify-between gap-3 rounded-[1.35rem] border p-4 ${
                                    item.status === "critical"
                                        ? "border-red-200 bg-red-50"
                                        : item.status === "warning"
                                          ? "border-amber-200 bg-amber-50"
                                          : "border-emerald-200 bg-emerald-50"
                                }`}
                            >
                                <div className="min-w-0">
                                    <p className="truncate font-semibold text-zinc-900">{item.nombre}</p>
                                    <p className="text-xs text-zinc-500">
                                        {item.stockActual.toFixed(2)} {item.unidad.toLowerCase()} disponible
                                    </p>
                                </div>
                                <div className="text-right">
                                    <Badge
                                        variant={
                                            item.status === "critical"
                                                ? "destructive"
                                                : item.status === "warning"
                                                  ? "default"
                                                  : "secondary"
                                        }
                                    >
                                        {item.status === "critical" ? "Critico" : item.status === "warning" ? "Advertencia" : "OK"}
                                    </Badge>
                                    <p className="mt-1 text-xs text-zinc-500">Minimo {item.stockMinimo.toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center text-sm font-medium text-zinc-500">No hay alertas de stock.</div>
                )}
            </ReportSurface>

            {stockMovements.length > 0 ? (
                <ReportSurface
                    title="Movimientos de stock"
                    description="Entradas, salidas y ajustes del periodo."
                >
                    <div className="h-[250px] w-full md:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stockMovements}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="date"
                                    minTickGap={isMobile ? 26 : 14}
                                    tickFormatter={(date) => format(new Date(date), "dd MMM", { locale: es })}
                                    stroke="#71717a"
                                    style={{ fontSize: "12px" }}
                                />
                                <YAxis hide={isMobile} stroke="#71717a" style={{ fontSize: "12px" }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#ffffff",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "12px",
                                        padding: "12px",
                                    }}
                                    labelFormatter={(date) => format(new Date(date), "dd 'de' MMMM, yyyy", { locale: es })}
                                />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Bar dataKey="in" fill="#10b981" name="Entradas" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="out" fill="#ef4444" name="Salidas" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="ajuste" fill="#f59e0b" name="Ajustes" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </ReportSurface>
            ) : null}

            {inventoryValuation?.top10?.length ? (
                <ReportSurface
                    title="Top insumos mas costosos"
                    description="Mayor valor total acumulado en inventario."
                >
                    <div className="space-y-4">
                        <div className="h-[250px] w-full md:h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={(inventoryValuation.top10 || []).slice(0, isMobile ? 5 : 10)}
                                    layout={isMobile ? "horizontal" : "vertical"}
                                    margin={isMobile ? { left: 4, right: 8, top: 8 } : { left: 100, right: 20 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    {isMobile ? (
                                        <>
                                            <XAxis
                                                dataKey="nombre"
                                                tickFormatter={(value: string) => truncateLabel(value, 8)}
                                                stroke="#71717a"
                                                style={{ fontSize: "12px" }}
                                            />
                                            <YAxis hide stroke="#71717a" style={{ fontSize: "12px" }} />
                                        </>
                                    ) : (
                                        <>
                                            <XAxis
                                                type="number"
                                                tickFormatter={(value) => formatCurrency(Number(value || 0))}
                                                stroke="#71717a"
                                                style={{ fontSize: "12px" }}
                                            />
                                            <YAxis
                                                type="category"
                                                dataKey="nombre"
                                                width={90}
                                                stroke="#71717a"
                                                style={{ fontSize: "12px" }}
                                            />
                                        </>
                                    )}
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#ffffff",
                                            border: "1px solid #e5e7eb",
                                            borderRadius: "12px",
                                            padding: "12px",
                                        }}
                                        formatter={(value) => [formatCurrency(Number(value || 0)), "Valor"]}
                                    />
                                    <Bar dataKey="valorTotal" fill="#f59e0b" radius={isMobile ? [8, 8, 0, 0] : [0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <ReportLegendList items={valuationLegend} />
                    </div>
                </ReportSurface>
            ) : null}
        </div>
    );
}
