"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Category } from "@prisma/client";
import { CatalogHeader } from "@/components/catalog/Header";
import { ProductCard } from "@/components/catalog/ProductCard";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { SearchX, PackageOpen, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { PublicCatalogProduct } from "@/lib/catalog-config";

interface Props {
  category: Category;
  products: PublicCatalogProduct[];
}

type DisplayItem =
  | {
      id: string;
      kind: "single";
      product: PublicCatalogProduct;
    }
  | {
      id: string;
      kind: "group";
      product: PublicCatalogProduct;
      variants: PublicCatalogProduct[];
      title: string;
      description: string | null;
      price: number;
    };

const VARIANT_GROUP_CATEGORIES = new Set(["pizzas", "tartas", "empanadas"]);

function stripSuffix(value: string, suffix: string) {
  return value.toLowerCase().endsWith(suffix.toLowerCase())
    ? value.slice(0, value.length - suffix.length).trim()
    : value;
}

function buildDisplayItems(categorySlug: string, items: PublicCatalogProduct[]): DisplayItem[] {
  if (!VARIANT_GROUP_CATEGORIES.has(categorySlug.toLowerCase())) {
    return items.map((product) => ({ id: product.id, kind: "single", product }));
  }

  const groups = new Map<string, PublicCatalogProduct[]>();

  for (const product of items) {
    const normalizedName = product.nombre.toLowerCase();
    let groupKey = product.nombre;

    if (categorySlug.toLowerCase() === "pizzas") {
      groupKey = stripSuffix(stripSuffix(product.nombre, " - Entera"), " - Media");
    } else if (categorySlug.toLowerCase() === "tartas") {
      groupKey = stripSuffix(stripSuffix(product.nombre, " - Individual"), " - Familiar");
      groupKey = stripSuffix(groupKey, "Tarta de ");
      groupKey = `Tarta de ${groupKey}`;
    } else if (categorySlug.toLowerCase() === "empanadas") {
      groupKey = product.nombre.replace(/\s+x(1|6|12)$/i, "");
    }

    const groupProducts = groups.get(groupKey) ?? [];
    groupProducts.push(product);
    groups.set(groupKey, groupProducts);
  }

  const orderedGroups = Array.from(groups.entries()).sort((a, b) => {
    const firstA = a[1][0];
    const firstB = b[1][0];
    return (firstA.orden ?? 0) - (firstB.orden ?? 0);
  });

  return orderedGroups.map(([groupKey, groupProducts]) => {
    const sortedVariants = [...groupProducts].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    const representative = sortedVariants[0];

    if (sortedVariants.length === 1) {
      return { id: representative.id, kind: "single", product: representative };
    }

    const title = categorySlug.toLowerCase() === "pizzas"
      ? groupKey.replace(/^Pizza\s+/i, "Pizza ")
      : categorySlug.toLowerCase() === "tartas"
        ? groupKey
        : groupKey;

    return {
      id: groupKey,
      kind: "group",
      product: representative,
      variants: sortedVariants,
      title,
      description: representative.descripcion,
      price: Math.min(...sortedVariants.map((variant) => Number(variant.precio))),
    };
  });
}

export default function CategoryClientPage({ category, products }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const expandedCardRef = useRef<HTMLDivElement | null>(null);

  const filteredProducts = products.filter(prod => 
    prod.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (prod.descripcion?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const displayItems = useMemo(() => buildDisplayItems(category.slug, filteredProducts), [category.slug, filteredProducts]);

  useEffect(() => {
    if (!expandedItemId) return;

    const handlePointerDown = (event: PointerEvent) => {
      const card = expandedCardRef.current;
      const target = event.target as Node | null;
      if (!card || !target) return;
      if (!card.contains(target)) {
        setExpandedItemId(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [expandedItemId]);

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
                  {displayItems.length}
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

        {/* Product Grid / Flex Layout */}
        {displayItems.length > 0 ? (
            <div className="flex flex-wrap gap-4 md:gap-6">
                {displayItems.map((item) => {
                    const isExpanded = expandedItemId === item.id;
                    return (
                    <div
                      key={item.id}
                      ref={isExpanded ? expandedCardRef : null}
                      className={cn(
                        "transition-all duration-500 ease-in-out shrink-0",
                        isExpanded ? "w-full" : "w-full md:w-[calc(50%-0.75rem)]"
                      )}
                    >
                      {item.kind === "single" ? (
                        <ProductCard 
                          product={item.product} 
                          isExpanded={isExpanded}
                          onToggleExpand={() => setExpandedItemId((current) => (current === item.id ? null : item.id))}
                        />
                      ) : (
                        <ProductCard
                          product={item.product}
                          title={item.title}
                          description={item.description}
                          image={item.product.imagen}
                          displayPrice={item.price}
                          variants={item.variants}
                          isExpanded={isExpanded}
                          onToggleExpand={() =>
                            setExpandedItemId((current) => (current === item.id ? null : item.id))
                          }
                        />
                      )}
                    </div>
                  );
                })}
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
