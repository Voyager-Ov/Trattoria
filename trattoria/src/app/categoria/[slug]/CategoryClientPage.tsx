"use client";

import { useState } from "react";
import { Category, Product } from "@prisma/client";
import { CatalogHeader } from "@/components/catalog/Header";
import { ProductCard } from "@/components/catalog/ProductCard";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { SearchX, PackageOpen, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Props {
  category: Category;
  products: Product[];
}

export default function CategoryClientPage({ category, products }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter(prod => 
    prod.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (prod.descripcion?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-32">
      <CatalogHeader />

      {/* Decorative Blur Background */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#E30909]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[20%] left-[-15%] w-[60%] h-[60%] bg-zinc-200/50 rounded-full blur-3xl opacity-60" />
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">

        {/* Botón volver + cabecera categoría */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-zinc-400 hover:text-zinc-800 transition-colors mb-4">
            <ChevronLeft className="h-4 w-4" />
            Volver al menú
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-black text-zinc-900 font-outfit tracking-tight mb-1">
                {category.nombre}
              </h1>
              <p className="text-zinc-500 font-medium leading-relaxed max-w-xl">
                {category.descripcion || `Mostrando todos los productos de ${category.nombre.toLowerCase()}`}
                <span className="ml-2 bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md text-xs font-bold inline-block relative -top-0.5">
                  {filteredProducts.length}
                </span>
              </p>
            </div>

            {/* Buscador inline */}
            <div className="relative w-full max-w-xs">
              <input
                type="search"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-11 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#E30909]/30 shadow-sm transition-all"
              />
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-zinc-100 shadow-sm text-center px-4">
                <div className="h-20 w-20 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                    {searchQuery ? <SearchX className="h-8 w-8 text-zinc-400" /> : <PackageOpen className="h-8 w-8 text-zinc-400" />}
                </div>
                <h3 className="text-xl font-bold text-zinc-800 mb-2">
                    {searchQuery ? "No se encontraron productos" : "Categoría vacía"}
                </h3>
                <p className="text-zinc-500 max-w-sm mb-6">
                    {searchQuery 
                        ? `No hay resultados que coincidan con "${searchQuery}". Probá buscar con otra palabra.` 
                        : "Aún no hay productos cargados en esta categoría."}
                </p>
                
                {searchQuery && (
                    <Button 
                        variant="ghost" 
                        onClick={() => setSearchQuery("")}
                        className="rounded-xl border-2 border-zinc-200 font-bold"
                    >
                        Limpiar búsqueda
                    </Button>
                )}
            </div>
        )}
      </main>

      {/* Floating Cart Drawer */}
      <div className="fixed bottom-6 left-0 right-0 px-4 z-40 pointer-events-none flex justify-center">
        <div className="pointer-events-auto">
            <CartDrawer />
        </div>
      </div>
    </div>
  );
}
