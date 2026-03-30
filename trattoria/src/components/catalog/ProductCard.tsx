"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@prisma/client";
import { useCart } from "@/providers/CartProvider";
import { toast } from "sonner";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);
    addItem(product);
    
    // Add visual bouncing effect
    setTimeout(() => setIsAdding(false), 200);

    // Trigger cart global animation via custom event if needed
    window.dispatchEvent(new Event('cartChanged'));

    toast.success(`${product.nombre} agregado al carrito`, {
      duration: 2000,
      position: 'top-center'
    });
  };

  return (
    <div className="group relative bg-white rounded-3xl p-4 flex gap-4 border border-zinc-200 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-red-100 hover:shadow-red-50 active:scale-[0.98]">
      
      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Item Image */}
      <div className="h-32 w-32 flex-shrink-0 relative rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100 shadow-sm">
        <img
          src={product.imagen || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400"}
          alt={product.nombre}
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
            {product.nombre}
          </h4>
          <p className="text-[13px] text-zinc-500 line-clamp-2 leading-relaxed font-medium pr-6">
            {product.descripcion}
          </p>
        </div>

        <div className="flex items-end justify-between mt-3">
          <div className="flex flex-col">
            <span className="text-2xl font-black font-outfit text-[#E30909]">
              ${Number(product.precio).toLocaleString('es-CL')}
            </span>
            
            {/* Solo mostramos stock crítico si es mayor a 0 y menor igual a 5. Evita el "0" suelto */}
            {product.stockActual !== null && product.stockActual > 0 && product.stockActual <= 5 && (
              <span className="text-[10px] text-amber-600 font-bold uppercase mt-1 px-2 py-0.5 bg-amber-50 rounded-md w-fit">
                ¡Últimas unidades!
              </span>
            )}
          </div>
          
          <Button
            size="icon"
            onClick={handleAddToCart}
            className={`h-12 w-12 rounded-[1rem] bg-[#E30909] text-white transition-all duration-200 shadow-[0_4px_12px_rgba(203,1,1,0.25)] hover:bg-[#A00101] hover:shadow-[0_6px_16px_rgba(203,1,1,0.35)] ${isAdding ? 'scale-90 bg-[#A00101]' : 'hover:scale-105'}`}
          >
            <Plus className={`h-6 w-6 transition-transform ${isAdding ? 'rotate-90' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}
