// Server Component — sin "use client", sin useEffect, sin fetch del lado browser
// ISR: Next.js regenera esta página cada 60 segundos en background
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { CatalogHeader } from "@/components/catalog/Header";
import { CategoryCard } from "@/components/catalog/CategoryCard";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ReceiptText } from "lucide-react";
import { CatalogSearch } from "@/components/catalog/CatalogSearch";

// ISR: revalida en background cada 60 segundos. El primer usuario tras 60s
// dispara una regeneración, pero recibe la versión cacheada (no espera).
export const revalidate = 60;

async function getCategories() {
    const categories = await prisma.category.findMany({
        where: { activo: true, deletedAt: null },
        orderBy: { orden: "asc" },
        // Solo los campos que necesitamos → menos datos
        select: {
            id: true,
            nombre: true,
            slug: true,
            descripcion: true,
            imagen: true,
            orden: true,
        },
    });
    return categories;
}

export default async function CatalogHomePage() {
    const categories = await getCategories();

    return (
        <div className="min-h-screen bg-[#FDFCFB] pb-32">
            {/* Header es un Server Component base. CatalogSearch maneja el filtro client-side */}
            <CatalogHeader />

            {/* Decorative background */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none" aria-hidden>
                <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-[#E30909]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-[10%] left-[-10%] w-[50%] h-[50%] bg-zinc-200/50 rounded-full blur-3xl opacity-60" />
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                {/* CatalogSearch: componente cliente liviano solo para filtrar */}
                <Suspense fallback={null}>
                    <CatalogSearch categories={categories} />
                </Suspense>
            </main>

            {/* Cart flotante */}
            <div className="fixed bottom-6 left-0 right-0 px-4 z-40 pointer-events-none flex justify-center">
                <div className="pointer-events-auto">
                    <CartDrawer />
                </div>
            </div>
        </div>
    );
}
