"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Loader2, AlertTriangle, TrendingUp, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    getStockAlertsData,
    getStockMovementsData,
    getInventoryValuation,
    StockAlertData,
    StockMovementData,
} from "./analyticsActions";

interface InventorySectionProps {
    dateRange: {
        from: Date;
       to: Date;
    };
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(value);
};

export default function InventorySection({ dateRange }: InventorySectionProps) {
    const [loading, setLoading] = useState(true);
    const [stockAlerts, setStockAlerts] = useState<StockAlertData[]>([]);
    const [stockMovements, setStockMovements] = useState<StockMovementData[]>([]);
    const [inventoryValuation, setInventoryValuation] = useState<{ totalValue: number; top10: { nombre: string; valorTotal: number }[] } | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const alertsResult = await getStockAlertsData();
            if (alertsResult.success && alertsResult.data) {
                setStockAlerts(alertsResult.data);
            }

            const movementsResult = await getStockMovementsData(dateRange.from, dateRange.to);
            if (movementsResult.success && movementsResult.data) {
                setStockMovements(movementsResult.data);
            }

            const valuationResult = await getInventoryValuation();
            if (valuationResult.success && valuationResult.data) {
                setInventoryValuation(valuationResult.data);
            }
        } catch (error) {
            console.error("Error loading inventory data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange]);

    const criticalStock = stockAlerts.filter((s) => s.status === "critical");
    const warningStock = stockAlerts.filter((s) => s.status === "warning");

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 rounded-3xl border border-zinc-200">
                    <div className="flex items-start justify-between mb-4">
                        <div className="h-12 w-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-sm text-zinc-500 font-medium mb-1">Stock Crítico</p>
                    <p className="text-2xl font-bold text-zinc-900">{criticalStock.length}</p>
                    <p className="text-xs text-zinc-500 mt-1">insumos bajo mínimo</p>
                </Card>

                <Card className="p-6 rounded-3xl border border-zinc-200">
                    <div className="flex items-start justify-between mb-4">
                        <div className="h-12 w-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                            <Package className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-sm text-zinc-500 font-medium mb-1">En Advertencia</p>
                    <p className="text-2xl font-bold text-zinc-900">{warningStock.length}</p>
                    <p className="text-xs text-zinc-500 mt-1">cerca del mínimo</p>
                </Card>

                <Card className="p-6 rounded-3xl border border-zinc-200">
                    <div className="flex items-start justify-between mb-4">
                        <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="text-sm text-zinc-500 font-medium mb-1">Valor Total Inventario</p>
                    <p className="text-2xl font-bold text-zinc-900">
                        {inventoryValuation?.totalValue
                            ? formatCurrency(inventoryValuation.totalValue)
                            : "N/A"}
                    </p>
                </Card>
            </div>

            {/* Estado de Stock */}
            <Card className="p-6 rounded-3xl border border-zinc-200">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-zinc-900">Estado de Stock</h3>
                    <p className="text-sm text-zinc-500">Alertas de inventario bajo</p>
                </div>

                {stockAlerts.length > 0 ? (
                    <div className="space-y-2">
                        {stockAlerts.slice(0, 20).map((item) => (
                            <div
                                key={item.id}
                                className={`flex items-center justify-between p-4 rounded-xl ${
                                    item.status === "critical"
                                        ? "bg-red-50 border border-red-200"
                                        : item.status === "warning"
                                        ? "bg-amber-50 border border-amber-200"
                                        : "bg-emerald-50 border border-emerald-200"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`h-3 w-3 rounded-full ${
                                            item.status === "critical"
                                                ? "bg-red-500"
                                                : item.status === "warning"
                                                ? "bg-amber-500"
                                                : "bg-emerald-500"
                                        }`}
                                    />
                                    <div>
                                        <p className="font-medium text-zinc-900">{item.nombre}</p>
                                        <p className="text-xs text-zinc-500">
                                            {item.stockActual.toFixed(2)} {item.unidad.toLowerCase()} disponible
                                        </p>
                                    </div>
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
                                        {item.status === "critical"
                                            ? "Crítico"
                                            : item.status === "warning"
                                            ? "Advertencia"
                                            : "OK"}
                                    </Badge>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        Mínimo: {item.stockMinimo.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-zinc-500 py-12">No hay alertas de stock</div>
                )}
            </Card>

            {/* Movimientos de Stock */}
            {stockMovements.length > 0 && (
                <Card className="p-6 rounded-3xl border border-zinc-200">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-zinc-900">Movimientos de Stock</h3>
                        <p className="text-sm text-zinc-500">Entradas, salidas y ajustes</p>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stockMovements}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(date) => format(new Date(date), "dd MMM", { locale: es })}
                                stroke="#71717a"
                                style={{ fontSize: "12px" }}
                            />
                            <YAxis stroke="#71717a" style={{ fontSize: "12px" }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "12px",
                                    padding: "12px",
                                }}
                                labelFormatter={(date) =>
                                    format(new Date(date), "dd 'de' MMMM, yyyy", { locale: es })
                                }
                            />
                            <Legend />
                            <Bar dataKey="in" fill="#10b981" name="Entradas" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="out" fill="#ef4444" name="Salidas" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="ajuste" fill="#f59e0b" name="Ajustes" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            )}

            {/* Valorización Top 10 */}
            {inventoryValuation?.top10 && inventoryValuation.top10.length > 0 && (
                <Card className="p-6 rounded-3xl border border-zinc-200">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-zinc-900">
                            Top 10 Insumos Más Costosos
                        </h3>
                        <p className="text-sm text-zinc-500">Por valor total en inventario</p>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={inventoryValuation.top10}
                            layout="vertical"
                            margin={{ left: 100, right: 20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                type="number"
                                tickFormatter={(value) => formatCurrency(Number(value || 0))}
                                stroke="#71717a"
                                style={{ fontSize: "12px" }}
                            />
                            <YAxis
                                type="category"
                                dataKey="nombre"
                                stroke="#71717a"
                                style={{ fontSize: "12px" }}
                                width={90}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "12px",
                                    padding: "12px",
                                }}
                                formatter={(value) => [formatCurrency(Number(value || 0)), "Valor"]}
                            />
                            <Bar dataKey="valorTotal" fill="#f59e0b" radius={[0, 8, 8, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            )}
        </div>
    );
}
