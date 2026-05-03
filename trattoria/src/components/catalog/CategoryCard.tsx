"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

type CatalogCategory = {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  imagen: string | null;
};

interface CategoryCardProps {
  category: CatalogCategory;
  productCount?: number;
}

export function CategoryCard({ category, productCount }: CategoryCardProps) {
  return (
    <Link href={`/categoria/${category.slug}`}>
      <div className="group relative bg-white rounded-3xl p-4 flex gap-5 border border-zinc-200 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-zinc-300 active:scale-[0.98] items-center cursor-pointer overflow-hidden">
        
        {/* Subtle background decoration */}
        <div className="absolute right-0 top-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Image */}
        <div className="h-28 w-28 flex-shrink-0 relative rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100 shadow-sm">
          <img
            src={category.imagen || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400"}
            alt={category.nombre}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400";
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-outfit font-bold text-xl text-zinc-900 leading-tight mb-2 group-hover:text-[#E30909] transition-colors">
            {category.nombre}
          </h3>
          
          <p className="text-sm text-zinc-600 line-clamp-3 leading-relaxed font-medium">
            {category.descripcion || "Explora nuestros productos de esta categoría."}
          </p>
          
          {productCount !== undefined && (
            <div className="mt-3 flex items-center gap-2">
               <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-400 bg-zinc-100 px-2 py-1 rounded-md">
                 {productCount} Productos
               </span>
            </div>
          )}
        </div>

        {/* Action Icon */}
        <div className="flex-shrink-0 w-8 flex justify-end text-zinc-300 group-hover:text-[#E30909] transition-colors group-hover:translate-x-1 duration-300 relative z-10">
          <ChevronRight className="h-6 w-6" />
        </div>
      </div>
    </Link>
  );
}
