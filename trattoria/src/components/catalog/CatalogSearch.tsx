"use client";

// Componente cliente que maneja búsqueda dual: productos (primario) + categorías.
// Recibe las categorías y productos pre-cargados por el Server Component padre.
// Sin fetch, sin useEffect, sin Firebase.

import { useState, useMemo } from "react";
import { Search, SearchX, ReceiptText, ChevronRight, ArrowRight } from "lucide-react";
import { CategoryCard } from "./CategoryCard";
import Link from "next/link";
import type { SearchableProduct } from "@/app/page";

interface Category {
    id: string;
    nombre: string;
    slug: string;
    descripcion: string | null;
    imagen: string | null;
    orden: number | null;
}

interface Props {
    categories: Category[];
    products: SearchableProduct[];
}

function formatPrice(price: number) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}

export function CatalogSearch({ categories, products }: Props) {
    const [query, setQuery] = useState("");

    const hasQuery = query.trim().length > 0;
    const normalizedQuery = query.trim().toLowerCase();

    // Filtrar categorías
    const filteredCategories = useMemo(() => {
        if (!hasQuery) return categories;
        return categories.filter(c =>
            c.nombre.toLowerCase().includes(normalizedQuery) ||
            (c.descripcion?.toLowerCase() || "").includes(normalizedQuery)
        );
    }, [categories, normalizedQuery, hasQuery]);

    // Filtrar productos y agrupar por categoría
    const productResults = useMemo(() => {
        if (!hasQuery) return [];
        const matched = products.filter(p =>
            p.nombre.toLowerCase().includes(normalizedQuery) ||
            (p.descripcion?.toLowerCase() || "").includes(normalizedQuery)
        );
        // Agrupar por categoría
        const grouped = new Map<string, { categoryNombre: string; categorySlug: string; products: SearchableProduct[] }>();
        for (const product of matched) {
            const existing = grouped.get(product.categorySlug);
            if (existing) {
                existing.products.push(product);
            } else {
                grouped.set(product.categorySlug, {
                    categoryNombre: product.categoryNombre,
                    categorySlug: product.categorySlug,
                    products: [product],
                });
            }
        }
        return Array.from(grouped.values());
    }, [products, normalizedQuery, hasQuery]);

    const totalProductMatches = productResults.reduce((sum, g) => sum + g.products.length, 0);

    return (
        <>
            {/* Título + Buscador */}
            <div className="mb-8">
                <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-black text-zinc-900 font-outfit tracking-tight mb-1">
                            {hasQuery ? "Resultados" : "Categorías"}
                        </h1>
                        <p className="text-zinc-500 font-medium">
                            {hasQuery
                                ? totalProductMatches > 0 || filteredCategories.length > 0
                                    ? `${totalProductMatches} producto${totalProductMatches !== 1 ? "s" : ""}${filteredCategories.length > 0 ? ` · ${filteredCategories.length} categoría${filteredCategories.length !== 1 ? "s" : ""}` : ""}`
                                    : "Sin resultados"
                                : "Explorá nuestro menú y encontrá lo que buscás"
                            }
                            {!hasQuery && (
                                <span className="ml-2 bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md text-xs font-bold">
                                    {categories.length} categorías
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Buscador principal */}
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                        <input
                            type="search"
                            placeholder="Buscar en el menú..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="w-full h-11 rounded-2xl border border-zinc-200 bg-white pl-10 pr-4 text-sm font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#E30909]/30 shadow-sm transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Contenido principal */}
            {hasQuery ? (
                /* === RESULTADOS DE BÚSQUEDA === */
                <div className="space-y-8">
                    {/* Productos encontrados — agrupados por categoría */}
                    {productResults.length > 0 && (
                        <section>
                            <h2 className="text-sm uppercase tracking-wider font-bold text-zinc-400 mb-4">
                                Productos
                            </h2>
                            <div className="space-y-6">
                                {productResults.map(group => (
                                    <div key={group.categorySlug}>
                                        {/* Category label */}
                                        <Link
                                            href={`/categoria/${group.categorySlug}`}
                                            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-[#E30909]/70 hover:text-[#E30909] transition-colors mb-3"
                                        >
                                            {group.categoryNombre}
                                            <ChevronRight className="h-3 w-3" />
                                        </Link>

                                        {/* Product result cards */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                            {group.products.map(product => (
                                                <Link
                                                    key={product.id}
                                                    href={`/categoria/${product.categorySlug}`}
                                                    className="group flex items-center gap-3.5 bg-white rounded-2xl p-3 border border-zinc-200 hover:border-zinc-300 hover:shadow-[0_4px_20px_rgb(0,0,0,0.05)] transition-all active:scale-[0.98]"
                                                >
                                                    {/* Mini thumbnail */}
                                                    <div className="h-14 w-14 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100">
                                                        <img
                                                            src={product.imagen || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200"}
                                                            alt={product.nombre}
                                                            className="h-full w-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.src = "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200";
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm text-zinc-900 truncate group-hover:text-[#E30909] transition-colors">
                                                            {product.nombre}
                                                        </p>
                                                        <p className="text-xs text-zinc-500 font-semibold mt-0.5">
                                                            {formatPrice(product.precio)}
                                                        </p>
                                                    </div>

                                                    {/* Arrow */}
                                                    <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-[#E30909] transition-colors flex-shrink-0" />
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Categorías encontradas */}
                    {filteredCategories.length > 0 && (
                        <section>
                            <h2 className="text-sm uppercase tracking-wider font-bold text-zinc-400 mb-4">
                                {productResults.length > 0 ? "Categorías relacionadas" : "Categorías"}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                                {filteredCategories.map((category) => (
                                    <CategoryCard key={category.id} category={category} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Sin resultados */}
                    {totalProductMatches === 0 && filteredCategories.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-zinc-100 shadow-sm text-center px-4">
                            <div className="h-20 w-20 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                                <SearchX className="h-8 w-8 text-zinc-400" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-800 mb-2">
                                No se encontraron resultados
                            </h3>
                            <p className="text-zinc-500 max-w-sm">
                                No hay productos ni categorías que coincidan con &ldquo;{query}&rdquo;. Probá buscar con otra palabra.
                            </p>
                            <button
                                onClick={() => setQuery("")}
                                className="mt-4 text-sm font-bold text-zinc-500 underline underline-offset-2 hover:text-zinc-800"
                            >
                                Limpiar búsqueda
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                /* === VISTA NORMAL DE CATEGORÍAS === */
                <>
                    {categories.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            {categories.map((category) => (
                                <CategoryCard key={category.id} category={category} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-zinc-100 shadow-sm text-center px-4">
                            <div className="h-20 w-20 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                                <ReceiptText className="h-8 w-8 text-zinc-400" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-800 mb-2">
                                Menú vacío
                            </h3>
                            <p className="text-zinc-500 max-w-sm">
                                Aún no hay categorías activas en el menú.
                            </p>
                        </div>
                    )}
                </>
            )}
        </>
    );
}
