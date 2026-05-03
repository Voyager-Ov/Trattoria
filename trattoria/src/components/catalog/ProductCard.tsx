"use client";

import { Check, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@prisma/client";
import { useCart, type ProductSelectionOption } from "@/providers/CartProvider";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { PublicCatalogProduct } from "@/lib/catalog-config";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

interface ProductCardProps {
  product: PublicCatalogProduct;
  title?: string;
  description?: string | null;
  image?: string | null;
  displayPrice?: number;
  variants?: PublicCatalogProduct[];
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
  const [selectedOptions, setSelectedOptions] = useState<Record<string, ProductSelectionOption>>({});
  
  const containerRef = useRef<HTMLDivElement>(null);
  const expandWrapperRef = useRef<HTMLDivElement>(null);
  
  const isExpandable = Boolean((variants && variants.length > 1) || (product.optionGroups && product.optionGroups.length > 0));
  const cardTitle = title ?? product.nombre;
  const cardDescription = description ?? product.descripcion;
  const cardImage = image ?? product.imagen;
  const cardPrice = displayPrice ?? Number(product.precio);

  // GSAP Animation for expansion
  useGSAP(() => {
    if (!expandWrapperRef.current) return;
    
    if (isExpanded) {
      gsap.set(expandWrapperRef.current, { display: "block", overflow: "hidden" });
      
      const tl = gsap.timeline();
      tl.to(expandWrapperRef.current, {
        height: "auto",
        opacity: 1,
        marginTop: 16,
        duration: 0.5,
        ease: "power3.out"
      });
      
      tl.fromTo(
        ".anim-option",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.04, ease: "back.out(1.2)" },
        "-=0.3"
      );
    } else {
      gsap.to(expandWrapperRef.current, {
        height: 0,
        opacity: 0,
        marginTop: 0,
        duration: 0.4,
        ease: "power3.inOut",
        onComplete: () => {
          gsap.set(expandWrapperRef.current, { display: "none" });
        }
      });
    }
  }, { dependencies: [isExpanded], scope: containerRef });

  useEffect(() => {
    if (!isExpanded) {
      setSelectedOptions({});
    }
  }, [isExpanded]);

  const handleSelectOption = (
    groupId: string,
    groupLabel: string,
    optionId: string,
    optionLabel: string,
    priceDelta: number,
    recipeMultiplier?: number | null,
    optionProductId?: string | null
  ) => {
    setSelectedOptions(prev => ({
      ...prev,
      [groupId]: { 
        groupId, 
        groupLabel, 
        optionId, 
        optionLabel, 
        priceDelta,
        recipeMultiplier,
        optionProductId
      }
    }));
  };

  const handleSelectVariant = (variant: PublicCatalogProduct) => {
    setIsAdding(true);
    addItem(variant as any);

    window.setTimeout(() => setIsAdding(false), 160);
    window.dispatchEvent(new Event("cartChanged"));

    toast.success(`${variant.nombre} agregado al carrito`, {
      duration: 1800,
      position: "top-center",
    });

    onToggleExpand?.();
  };

  const handleAddToCart = () => {
    if (product.optionGroups) {
      for (const group of product.optionGroups) {
        if (group.required && !selectedOptions[group.id]) {
          if (!isExpanded) {
            onToggleExpand?.();
          }
          toast.error(`Por favor seleccioná una opción para ${group.nombre}`);
          return;
        }
      }
    }

    setIsAdding(true);
    const optionsArray = Object.values(selectedOptions);
    addItem(product as any, optionsArray);

    window.setTimeout(() => setIsAdding(false), 160);
    window.dispatchEvent(new Event("cartChanged"));

    toast.success(`${product.nombre} agregado al carrito`, {
      duration: 1800,
      position: "top-center",
    });

    if (isExpanded) onToggleExpand?.();
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
      ref={(node) => {
        // Combinamos el ref del contenedor interno (GSAP) con el del padre (click-outside)
        if (registerExpandedRef) registerExpandedRef(node);
        // @ts-ignore
        containerRef.current = node;
      }}
      onClick={handleCardClick}
      data-testid={`product-card-${product.id}`}
      className={cn(
        "group relative bg-white rounded-[2.5rem] p-4 border border-zinc-100 transition-[box-shadow,border-color,transform,background-color] duration-300 ease-out hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] hover:border-red-100/60 hover:shadow-red-50/50",
        isExpandable ? "cursor-pointer" : "active:scale-[0.98]",
        isExpanded && "shadow-[0_24px_60px_rgba(227,9,9,0.08)] border-red-100/80"
      )}
    >
      
      {/* Decorative Organic Blur */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-rose-50 to-orange-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="flex gap-4">
        {/* Item Image - Organic squircle */}
        <div className="h-32 w-32 flex-shrink-0 relative rounded-[2rem] overflow-hidden bg-zinc-50 border border-zinc-100/50 shadow-sm transition-transform duration-500 group-hover:shadow-md">
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
            <h4 className="font-outfit font-black text-zinc-900 text-lg leading-tight mb-1 group-hover:text-[#CB0101] transition-colors">
              {cardTitle}
            </h4>
            <p className="text-[13px] text-zinc-500 line-clamp-2 leading-relaxed font-medium pr-6">
              {cardDescription}
            </p>
          </div>

          <div className="flex items-end justify-between mt-3">
            <div className="flex flex-col">
              <span className="text-2xl font-black font-outfit text-[#E30909] tracking-tight">
                ${cardPrice.toLocaleString("es-CL")}
              </span>
              {product.stockActual !== null && product.stockActual > 0 && product.stockActual <= 5 && (
                <span className="text-[10px] text-amber-600 font-bold uppercase mt-1 px-2.5 py-0.5 bg-amber-50 rounded-full w-fit tracking-wide">
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
                className={cn(
                  "h-12 w-12 rounded-full bg-zinc-900 text-white transition-all duration-300 shadow-[0_4px_16px_rgba(24,24,27,0.2)] hover:bg-zinc-800 hover:shadow-[0_8px_24px_rgba(24,24,27,0.3)]",
                  isExpanded ? "scale-95 bg-zinc-800" : "hover:scale-105"
                )}
              >
                <ChevronDown className={cn("h-5 w-5 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]", isExpanded && "rotate-180")} />
              </Button>
            ) : (
              <Button
                size="icon"
                data-testid={`product-add-button-${product.id}`}
                onClick={(event) => {
                  event.stopPropagation();
                  handleAddToCart();
                }}
                className={cn(
                  "h-12 w-12 rounded-full bg-[#E30909] text-white transition-all duration-300 shadow-[0_4px_16px_rgba(227,9,9,0.25)] hover:bg-[#A00101] hover:shadow-[0_8px_24px_rgba(227,9,9,0.35)]",
                  isAdding ? "scale-90 bg-[#A00101]" : "hover:scale-105"
                )}
              >
                <Plus className={cn("h-6 w-6 transition-transform duration-300", isAdding && "rotate-90")} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {isExpandable && (
        <div
          ref={expandWrapperRef}
          className="h-0 opacity-0 hidden"
        >
          <div className="pt-5 pb-1 border-t border-zinc-100/80">
            {variants && variants.length > 1 && (
              <div data-testid="variants-panel">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {variants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      data-testid={`variant-option-${variant.id}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSelectVariant(variant);
                      }}
                      className="anim-option group/option rounded-[1.5rem] border border-zinc-200/80 bg-white px-5 py-3.5 text-left transition-all duration-300 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[15px] font-bold leading-tight tracking-tight">{variant.nombre}</span>
                        <span className="text-sm font-black text-[#E30909] group-hover/option:text-white transition-colors">
                          ${Number(variant.precio).toLocaleString("es-CL")}
                        </span>
                      </div>
                      {variant.descripcion ? (
                        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 group-hover/option:text-white/80 line-clamp-2 transition-colors">
                          {variant.descripcion}
                        </p>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.optionGroups && product.optionGroups.length > 0 && (
              <div data-testid="options-panel" className={cn(variants && variants.length > 1 && "mt-7")}>
                {product.optionGroups.map((group) => (
                  <div key={group.id} className="mb-5 last:mb-0">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <h5 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                        {group.nombre}
                      </h5>
                      {group.required && (
                        <span className="text-[10px] bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                          Obligatorio
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((option) => {
                        const isSelected = selectedOptions[group.id]?.optionId === option.id;
                        const priceDelta = group.priceMode === "ADD" ? option.price : (option.price - cardPrice);
                        
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectOption(
                                group.id,
                                group.nombre,
                                option.id,
                                option.label,
                                priceDelta,
                                option.recipeMultiplier,
                                option.optionProductId
                              );
                            }}
                            className={cn(
                              "anim-option flex items-center gap-3 px-5 py-3 rounded-full border transition-all duration-300 ease-out",
                              isSelected 
                                ? "border-[#E30909] bg-[#E30909] text-white shadow-[0_8px_20px_rgba(227,9,9,0.25)] scale-[1.02]" 
                                : "border-zinc-200/80 bg-zinc-50/50 hover:border-zinc-300 hover:bg-white hover:shadow-sm"
                            )}
                          >
                            <span className="text-[14px] font-bold tracking-tight">{option.label}</span>
                            {option.price > 0 && (
                              <span className={cn(
                                "text-xs font-black px-2 py-0.5 rounded-full transition-colors",
                                isSelected ? "bg-white/20 text-white" : "bg-zinc-200/50 text-zinc-600"
                              )}>
                                {group.priceMode === "ADD" ? `+ $${option.price}` : `$${option.price}`}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart();
                  }}
                  className="anim-option w-full mt-7 h-[3.5rem] rounded-full bg-zinc-900 text-white font-black text-lg shadow-[0_8px_24px_rgba(24,24,27,0.2)] hover:bg-zinc-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Agregar al pedido
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
