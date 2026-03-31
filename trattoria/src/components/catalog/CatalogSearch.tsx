"use client";

// Componente cliente MÍNIMO: solo maneja el filtro de búsqueda.
// Recibe las categorías pre-cargadas por el Server Component padre.
// Sin fetch, sin useEffect, sin Firebase.

import { useState } from "react";
import { SearchX, ReceiptText } from "lucide-react";
import { CategoryCard } from "./CategoryCard";

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
}

export function CatalogSearch({ categories }: Props) {
    const [query, setQuery] = useState("");

    const filtered = query.trim()
        ? categories.filter(c =>
            c.nombre.toLowerCase().includes(query.toLowerCase())
          )
        : categories;

    return (
        <>
            {/* Título + Buscador */}
            <div className="mb-8">
                <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-black text-zinc-900 font-outfit tracking-tight mb-1">
                            Categorías
                        </h1>
                        <p className="text-zinc-500 font-medium">
                            Explorá nuestro menú y encontrá lo que buscás
                            <span className="ml-2 bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md text-xs font-bold">
                                {filtered.length}
                            </span>
                        </p>
                    </div>

                    {/* Buscador local */}
                    <div className="relative w-full max-w-xs">
                        <input
                            type="search"
                            placeholder="Buscar categorías..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="w-full h-11 rounded-2xl border border-zinc-200 bg-white px-4 pr-10 text-sm font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#E30909]/30 shadow-sm transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Grid de categorías */}
            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {filtered.map((category) => (
                        <CategoryCard key={category.id} category={category} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-zinc-100 shadow-sm text-center px-4">
                    <div className="h-20 w-20 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                        {query ? <SearchX className="h-8 w-8 text-zinc-400" /> : <ReceiptText className="h-8 w-8 text-zinc-400" />}
                    </div>
                    <h3 className="text-xl font-bold text-zinc-800 mb-2">
                        {query ? "No se encontraron categorías" : "Menú vacío"}
                    </h3>
                    <p className="text-zinc-500 max-w-sm">
                        {query
                            ? `No hay resultados para "${query}". Probá buscar otra cosa.`
                            : "Aún no hay categorías activas en el menú."}
                    </p>
                    {query && (
                        <button
                            onClick={() => setQuery("")}
                            className="mt-4 text-sm font-bold text-zinc-500 underline underline-offset-2 hover:text-zinc-800"
                        >
                            Limpiar búsqueda
                        </button>
                    )}
                </div>
            )}
        </>
    );
}
