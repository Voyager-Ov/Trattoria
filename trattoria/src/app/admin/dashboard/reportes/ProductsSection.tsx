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
    ResponsiveContainer,
    Cell,
} from "recharts";
import { Loader2, TrendingUp } from "lucide-react";
import {
    getTopProductsData,
    getProductMarginsData,
    TopProductData,
    ProductMarginData,
} from "./analyticsActions";

interface ProductsSectionProps {
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

export default function ProductsSection({ dateRange }: ProductsSectionProps) {
    const [loading, setLoading] = useState(true);
    const [topProducts, setTopProducts] = useState<TopProductData[]>([]);
    const [productMargins, setProductMargins] = useState<ProductMarginData[]>([]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Top productos
            const topResult = await getTopProductsData(dateRange.from, dateRange.to, 10);
            if (topResult.success && topResult.data) {
                setTopProducts(topResult.data);
            }

            // Márgenes de productos
            const marginsResult = await getProductMarginsData(dateRange.from, dateRange.to);
            if (marginsResult.success && marginsResult.data) {
                setProductMargins(marginsResult.data);
            }
        } catch (error) {
            console.error("Error loading products data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top 10 Productos Más Vendidos */}
            <Card className="p-6 rounded-3xl border border-zinc-200">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-zinc-900">
                        Top 10 Productos Más Vendidos
                    </h3>
                    <p className="text-sm text-zinc-500">
                        Productos ordenados por frecuencia de pedidos
                    </p>
                </div>

                {topProducts.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={topProducts}
                            layout="vertical"
                            margin={{ left: 120, right: 20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                type="number"
                                stroke="#71717a"
                                style={{ fontSize: "12px" }}
                            />
                            <YAxis
                                type="category"
                                dataKey="nombre"
                                stroke="#71717a"
                                style={{ fontSize: "12px" }}
                                width={110}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "12px",
                                    padding: "12px",
                                }}
                                formatter={(value, name?: string) => {
                                    if (name === "count") return [Number(value || 0), "Pedidos"];
                                    if (name === "revenue") return [formatCurrency(Number(value || 0)), "Ingresos"];
                                    return [Number(value || 0), name];
                                }}
                            />
                            <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                                {topProducts.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={`hsl(${220 - index * 10}, 70%, ${50 + index * 3}%)`}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center text-zinc-500 py-12">
                        No hay datos de productos
                    </div>
                )}

                {/* Lista de productos */}
                {topProducts.length > 0 && (
                    <div className="mt-6 space-y-2">
                        {topProducts.map((product, index) => (
                            <div
                                key={product.id}
                                className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium text-zinc-900">{product.nombre}</p>
                                        <p className="text-xs text-zinc-500">
                                            {product.count} pedidos ({product.percentage.toFixed(1)}%)
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-zinc-900">
                                        {formatCurrency(product.revenue)}
                                    </p>
                                    <p className="text-xs text-zinc-500">ingresos totales</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Productos con Mejor Margen */}
            <Card className="p-6 rounded-3xl border border-zinc-200">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-zinc-900">
                        Análisis de Márgenes por Producto
                    </h3>
                    <p className="text-sm text-zinc-500">
                        Rentabilidad de cada producto vendido
                    </p>
                </div>

                {productMargins.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-200">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-700">
                                        Producto
                                    </th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-700">
                                        Precio
                                    </th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-700">
                                        Costo
                                    </th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-700">
                                        Margen
                                    </th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-700">
                                        Margen %
                                    </th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-700">
                                        Veces Vendido
                                    </th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-700">
                                        Margen Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {productMargins.slice(0, 15).map((product) => (
                                    <tr
                                        key={product.id}
                                        className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
                                    >
                                        <td className="py-3 px-4 text-sm font-medium text-zinc-900">
                                            {product.nombre}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right text-zinc-700">
                                            {formatCurrency(product.precio)}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right text-zinc-700">
                                            {formatCurrency(product.costo)}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right text-zinc-700">
                                            {formatCurrency(product.margen)}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                                                    product.margenPorcentaje >= 50
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : product.margenPorcentaje >= 30
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-amber-100 text-amber-700"
                                                }`}
                                            >
                                                {product.margenPorcentaje >= 50 && (
                                                    <TrendingUp className="h-3 w-3" />
                                                )}
                                                {product.margenPorcentaje.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right text-zinc-700">
                                            {product.vecesVendido}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right font-bold text-emerald-700">
                                            {formatCurrency(product.margenTotal)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center text-zinc-500 py-12">
                        No hay datos de márgenes
                    </div>
                )}
            </Card>
        </div>
    );
}
