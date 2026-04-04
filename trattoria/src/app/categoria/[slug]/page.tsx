import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ChevronLeft } from "lucide-react";
import type { Category, Product } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CatalogHeader } from "@/components/catalog/Header";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { serializePrisma } from "@/lib/utils";
import CategoryClientPage from "./CategoryClientPage";

export const dynamic = "force-dynamic";

type CategoryPageData =
    | { status: "ok"; category: Category; products: Product[] }
    | { status: "not-found" }
    | { status: "error" };

async function loadCategoryPageData(slug: string): Promise<CategoryPageData> {
    try {
        const category = await prisma.category.findUnique({
            where: {
                slug,
                deletedAt: null,
            },
        });

        if (!category || !category.activo) {
            return { status: "not-found" };
        }

        const products = await prisma.product.findMany({
            where: {
                categoryId: category.id,
                activo: true,
                deletedAt: null,
            },
            orderBy: {
                orden: "asc",
            },
        });

        return { status: "ok", category, products };
    } catch (error) {
        console.error(`Error fetching category page for slug "${slug}":`, error);
        return { status: "error" };
    }
}

export default async function CategoriaPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const result = await loadCategoryPageData(slug);

    if (result.status === "not-found") {
        notFound();
    }

    if (result.status === "error") {
        return (
            <div className="min-h-screen bg-[#FDFCFB] pb-32">
                <CatalogHeader />

                <div className="fixed top-0 left-0 h-full w-full overflow-hidden -z-10 pointer-events-none" aria-hidden>
                    <div className="absolute top-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-[#E30909]/5 blur-3xl" />
                    <div className="absolute bottom-[20%] left-[-15%] h-[60%] w-[60%] rounded-full bg-zinc-200/50 blur-3xl opacity-60" />
                </div>

                <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
                    <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-zinc-400 transition-colors hover:text-zinc-800">
                        <ChevronLeft className="h-4 w-4" />
                        Volver al menu
                    </Link>

                    <section className="rounded-[2rem] border border-red-100 bg-white/95 px-8 py-16 text-center shadow-[0_25px_80px_rgba(15,23,42,0.08)]">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                            <AlertTriangle className="h-8 w-8" />
                        </div>
                        <h1 className="font-outfit text-3xl font-black tracking-tight text-zinc-950">
                            Esta categoria no se pudo cargar
                        </h1>
                        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-zinc-600">
                            Ocurrio un problema al recuperar los productos. Reintenta en unos minutos o vuelve al menu principal.
                        </p>
                    </section>
                </main>

                <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
                    <div className="pointer-events-auto">
                        <CartDrawer />
                    </div>
                </div>
            </div>
        );
    }

    const serializedCategory = serializePrisma(result.category) as Category;
    const serializedProducts = serializePrisma(result.products) as Product[];

    return <CategoryClientPage category={serializedCategory} products={serializedProducts} />;
}
