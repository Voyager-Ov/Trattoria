"use client";

import { ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@prisma/client";
import { useCart } from "@/providers/CartProvider";
import { toast } from "sonner";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
  title?: string;
  description?: string | null;
  image?: string | null;
  displayPrice?: number;
  variants?: Product[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  registerExpandedRef?: (node: HTMLDivElement | null) => void;
}

export function ProductCard({
  product,
  title,
  description,
  image,
  displayPrice,
  variants,
  isExpanded = false,
  onToggleExpand,
  registerExpandedRef,
}: ProductCardProps) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const isExpandable = Boolean(variants && variants.length > 1);
  const cardTitle = title ?? product.nombre;
  const cardDescription = description ?? product.descripcion;
  const cardImage = image ?? product.imagen;
  const cardPrice = displayPrice ?? Number(product.precio);

  const handleSelectVariant = (variant: Product) => {
    setIsAdding(true);
    addItem(variant);

    window.setTimeout(() => setIsAdding(false), 160);
    window.dispatchEvent(new Event("cartChanged"));

    toast.success(`${variant.nombre} agregado al carrito`, {
      duration: 1800,
      position: "top-center",
    });

    onToggleExpand?.();
  };

  const handleAddToCart = () => {
    setIsAdding(true);
    addItem(product);

    window.setTimeout(() => setIsAdding(false), 160);
    window.dispatchEvent(new Event("cartChanged"));

    toast.success(`${product.nombre} agregado al carrito`, {
      duration: 1800,
      position: "top-center",
    });
  };

  const handleCardClick = () => {
    if (isExpandable) {
      onToggleExpand?.();
      return;
    }

    handleAddToCart();
  };

  return (
    <div
      ref={registerExpandedRef}
      onClick={handleCardClick}
      data-testid={`product-card-${product.id}`}
      className={`group relative bg-white rounded-3xl p-4 border border-zinc-200 transition-[box-shadow,border-color,transform,background-color] duration-200 ease-out hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-red-100 hover:shadow-red-50 ${isExpandable ? "cursor-pointer" : "active:scale-[0.98]"}`}
    >
      
      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex gap-4">
        {/* Item Image */}
        <div className="h-32 w-32 flex-shrink-0 relative rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100 shadow-sm">
          <img
            src={cardImage || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400"}
            alt={cardTitle}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400";
            }}
          />
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 min-w-0 justify-between py-1 pr-1 relative z-10">
          <div>
            <h4 className="font-outfit font-bold text-zinc-900 text-[1.1rem] leading-tight mb-1 group-hover:text-[#CB0101] transition-colors">
              {cardTitle}
            </h4>
            <p className="text-[13px] text-zinc-500 line-clamp-2 leading-relaxed font-medium pr-6">
              {cardDescription}
            </p>
          </div>

          <div className="flex items-end justify-between mt-3">
            <div className="flex flex-col">
              <span className="text-2xl font-black font-outfit text-[#E30909]">
                ${cardPrice.toLocaleString("es-CL")}
              </span>
              {product.stockActual !== null && product.stockActual > 0 && product.stockActual <= 5 && (
                <span className="text-[10px] text-amber-600 font-bold uppercase mt-1 px-2 py-0.5 bg-amber-50 rounded-md w-fit">
                  ¡Últimas unidades!
                </span>
              )}
            </div>

            {isExpandable ? (
              <Button
                size="icon"
                data-testid={`product-expand-button-${product.id}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleExpand?.();
                }}
                className={`h-12 w-12 rounded-[1rem] bg-zinc-900 text-white transition-all duration-200 shadow-[0_4px_12px_rgba(24,24,27,0.25)] hover:bg-zinc-800 hover:shadow-[0_6px_16px_rgba(24,24,27,0.35)] ${isExpanded ? "scale-95" : "hover:scale-105"}`}
              >
                <ChevronsUpDown className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
              </Button>
            ) : (
              <Button
                size="icon"
                data-testid={`product-add-button-${product.id}`}
                onClick={(event) => {
                  event.stopPropagation();
                  handleAddToCart();
                }}
                className={`h-12 w-12 rounded-[1rem] bg-[#E30909] text-white transition-all duration-200 shadow-[0_4px_12px_rgba(203,1,1,0.25)] hover:bg-[#A00101] hover:shadow-[0_6px_16px_rgba(203,1,1,0.35)] ${isAdding ? "scale-90 bg-[#A00101]" : "hover:scale-105"}`}
              >
                <Plus className={`h-6 w-6 transition-transform ${isAdding ? "rotate-90" : ""}`} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {isExpandable && variants ? (
        <div
          data-testid="configurable-options-panel"
          className={`overflow-hidden transition-[max-height,opacity,margin-top] duration-200 ease-out ${isExpanded ? "mt-4 max-h-[26rem] opacity-100" : "mt-0 max-h-0 opacity-0"}`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-4 border-t border-zinc-100">
            {variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                data-testid={`variant-option-${variant.id}`}
                onClick={(event) => {
                  event.stopPropagation();
                  handleSelectVariant(variant);
                }}
                className="group/option rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left transition-all duration-200 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold leading-tight">{variant.nombre}</span>
                  <span className="text-sm font-black text-[#E30909] group-hover/option:text-white">
                    ${Number(variant.precio).toLocaleString("es-CL")}
                  </span>
                </div>
                {variant.descripcion ? (
                  <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 group-hover/option:text-white/80 line-clamp-2">
                    {variant.descripcion}
                  </p>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
