import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { CatalogHeader } from "@/components/catalog/Header";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ReceiptText } from "lucide-react";
import { CatalogSearch } from "@/components/catalog/CatalogSearch";

export const dynamic = "force-dynamic";

async function getCategories() {
    try {
        return await prisma.category.findMany({
            where: { activo: true, deletedAt: null },
            orderBy: { orden: "asc" },
            select: {
                id: true,
                nombre: true,
                slug: true,
                descripcion: true,
                imagen: true,
                orden: true,
            },
        });
    } catch (error) {
        console.error("Error fetching public categories:", error);
        return null;
    }
}

export type SearchableProduct = {
    id: string;
    nombre: string;
    descripcion: string | null;
    imagen: string | null;
    precio: number;
    categorySlug: string;
    categoryNombre: string;
};

async function getSearchableProducts(): Promise<SearchableProduct[]> {
    try {
        const products = await prisma.product.findMany({
            where: {
                activo: true,
                disponible: true,
                deletedAt: null,
                catalogRole: { not: "OPTION_PRODUCT" },
                category: {
                    activo: true,
                    deletedAt: null,
                },
            },
            select: {
                id: true,
                nombre: true,
                descripcion: true,
                imagen: true,
                precio: true,
                category: {
                    select: {
                        slug: true,
                        nombre: true,
                    },
                },
            },
            orderBy: { nombre: "asc" },
        });
        return products.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            descripcion: p.descripcion,
            imagen: p.imagen,
            precio: Number(p.precio),
            categorySlug: p.category.slug,
            categoryNombre: p.category.nombre,
        }));
    } catch (error) {
        console.error("Error fetching searchable products:", error);
        return [];
    }
}

export default async function CatalogHomePage() {
    const [categories, products] = await Promise.all([
        getCategories(),
        getSearchableProducts(),
    ]);
    const hasCatalogError = categories === null;

    return (
        <div className="min-h-screen bg-[#FDFCFB] pb-32">
            <CatalogHeader />

            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none" aria-hidden>
                <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-[#E30909]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-[10%] left-[-10%] w-[50%] h-[50%] bg-zinc-200/50 rounded-full blur-3xl opacity-60" />
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                {hasCatalogError ? (
                    <section className="mx-auto flex max-w-2xl flex-col items-center rounded-[2rem] border border-red-100 bg-white/95 px-8 py-16 text-center shadow-[0_25px_80px_rgba(15,23,42,0.08)]">
                        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                            <ReceiptText className="h-8 w-8" />
                        </div>
                        <h1 className="font-outfit text-3xl font-black tracking-tight text-zinc-950">
                            El catalogo no esta disponible ahora
                        </h1>
                        <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-600">
                            Tuvimos un problema al cargar los productos. Reintenta en unos minutos o vuelve a abrir la pagina.
                        </p>
                    </section>
                ) : (
                    <Suspense fallback={null}>
                        <CatalogSearch categories={categories} products={products} />
                    </Suspense>
                )}
            </main>

            <div className="fixed bottom-6 left-0 right-0 px-4 z-40 pointer-events-none flex justify-center">
                <div className="pointer-events-auto">
                    <CartDrawer />
                </div>
            </div>
        </div>
    );
}

