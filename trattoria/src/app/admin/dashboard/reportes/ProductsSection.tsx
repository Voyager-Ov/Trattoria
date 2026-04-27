"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Loader2, TrendingUp } from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";

import {
    getProductMarginsData,
    getTopProductsData,
    ProductMarginData,
    TopProductData,
    type ReportBasis,
} from "./analyticsActions";
import { ReportLegendList, ReportSurface, truncateLabel } from "./reportes-ui";

interface ProductsSectionProps {
    dateRange: {
        from: Date;
        to: Date;
    };
    basis: ReportBasis;
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(value);

export default function ProductsSection({ dateRange, basis }: ProductsSectionProps) {
    const isMobile = useIsMobile();
    const [loading, setLoading] = useState(true);
    const [topProducts, setTopProducts] = useState<TopProductData[]>([]);
    const [productMargins, setProductMargins] = useState<ProductMarginData[]>([]);

    useEffect(() => {
        let active = true;

        async function loadData() {
            setLoading(true);

            try {
                const [topResult, marginsResult] = await Promise.all([
                    getTopProductsData(dateRange.from, dateRange.to, 10, basis),
                    getProductMarginsData(dateRange.from, dateRange.to, basis),
                ]);

                if (!active) {
                    return;
                }

                if (topResult.success && topResult.data) {
                    setTopProducts(topResult.data);
                }

                if (marginsResult.success && marginsResult.data) {
                    setProductMargins(marginsResult.data);
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
    }, [basis, dateRange]);

    if (loading) {
        return (
            <div className="flex h-72 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const topChartData = isMobile ? topProducts.slice(0, 5) : topProducts;
    const topLegendItems = topProducts.slice(0, isMobile ? 5 : 10).map((product, index) => ({
        label: `${index + 1}. ${product.nombre}`,
        value: `${product.count}`,
        meta: formatCurrency(product.revenue),
        color: `hsl(${220 - index * 10}, 70%, ${50 + index * 3}%)`,
    }));

    return (
        <div className="space-y-5 md:space-y-6">
            <ReportSurface
                title="Top productos mas vendidos"
                description="Productos ordenados por frecuencia de pedidos."
            >
                {topProducts.length > 0 ? (
                    <div className="space-y-5">
                        <div className="h-[260px] w-full md:h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={topChartData}
                                    layout={isMobile ? "horizontal" : "vertical"}
                                    margin={isMobile ? { left: 4, right: 8, top: 8 } : { left: 120, right: 20 }}
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
                                            <XAxis type="number" stroke="#71717a" style={{ fontSize: "12px" }} />
                                            <YAxis
                                                type="category"
                                                dataKey="nombre"
                                                width={110}
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
                                        formatter={(value, name) => {
                                            if (name === "count") return [Number(value || 0), "Unidades"];
                                            if (name === "revenue") return [formatCurrency(Number(value || 0)), "Ingresos"];
                                            return [Number(value || 0), name];
                                        }}
                                    />
                                    <Bar dataKey="count" radius={isMobile ? [8, 8, 0, 0] : [0, 8, 8, 0]}>
                                        {topChartData.map((product, index) => (
                                            <Cell
                                                key={`${product.id}-${index}`}
                                                fill={`hsl(${220 - index * 10}, 70%, ${50 + index * 3}%)`}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <ReportLegendList items={topLegendItems} />
                    </div>
                ) : (
                    <div className="py-12 text-center text-sm font-medium text-zinc-500">No hay datos de productos.</div>
                )}
            </ReportSurface>

            <ReportSurface
                title="Analisis de margenes por producto"
                description="Rentabilidad unitaria y total por producto vendido."
            >
                {productMargins.length > 0 ? (
                    isMobile ? (
                        <div className="space-y-3">
                            {productMargins.slice(0, 15).map((product) => (
                                <article key={product.id} className="rounded-[1.4rem] border border-zinc-200 bg-zinc-50 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h4 className="truncate text-base font-black tracking-tight text-zinc-900">{product.nombre}</h4>
                                            <p className="text-xs text-zinc-500">{product.vecesVendido} ventas</p>
                                        </div>
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${product.margenPorcentaje >= 50
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : product.margenPorcentaje >= 30
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-amber-100 text-amber-700"
                                                }`}
                                        >
                                            <TrendingUp className="h-3 w-3" />
                                            {product.margenPorcentaje.toFixed(1)}%
                                        </span>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Precio</p>
                                            <p className="mt-1 text-sm font-semibold text-zinc-700">{formatCurrency(product.precio)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Costo</p>
                                            <p className="mt-1 text-sm font-semibold text-zinc-700">{formatCurrency(product.costo)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Margen unit.</p>
                                            <p className="mt-1 text-sm font-semibold text-zinc-700">{formatCurrency(product.margen)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Margen total</p>
                                            <p className="mt-1 text-sm font-bold text-emerald-700">{formatCurrency(product.margenTotal)}</p>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-zinc-200">
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-700">Producto</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-700">Precio</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-700">Costo</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-700">Margen</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-700">Margen %</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-700">Veces vendido</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-zinc-700">Margen total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productMargins.slice(0, 15).map((product) => (
                                        <tr key={product.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                                            <td className="px-4 py-3 text-sm font-medium text-zinc-900">{product.nombre}</td>
                                            <td className="px-4 py-3 text-right text-sm text-zinc-700">{formatCurrency(product.precio)}</td>
                                            <td className="px-4 py-3 text-right text-sm text-zinc-700">{formatCurrency(product.costo)}</td>
                                            <td className="px-4 py-3 text-right text-sm text-zinc-700">{formatCurrency(product.margen)}</td>
                                            <td className="px-4 py-3 text-right text-sm">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${product.margenPorcentaje >= 50
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : product.margenPorcentaje >= 30
                                                                ? "bg-blue-100 text-blue-700"
                                                                : "bg-amber-100 text-amber-700"
                                                        }`}
                                                >
                                                    {product.margenPorcentaje.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm text-zinc-700">{product.vecesVendido}</td>
                                            <td className="px-4 py-3 text-right text-sm font-bold text-emerald-700">{formatCurrency(product.margenTotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    <div className="py-12 text-center text-sm font-medium text-zinc-500">No hay datos de margenes.</div>
                )}
            </ReportSurface>
        </div>
    );
}
