import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CategoryClientPage from "./CategoryClientPage";
import { serializePrisma } from "@/lib/utils";

export default async function CategoriaPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    
    // Database Fetch Server-Side
    const category = await prisma.category.findUnique({
        where: { 
            slug: slug,
            deletedAt: null 
        }
    });
    
    if (!category || !category.activo) {
        notFound();
    }
    
    const products = await prisma.product.findMany({
        where: {
            categoryId: category.id,
            activo: true,
            deletedAt: null
        },
        orderBy: {
            orden: 'asc'
        }
    });

    const serializedCat = serializePrisma(category);
    const serializedProducts = serializePrisma(products);

    return <CategoryClientPage category={serializedCat as any} products={serializedProducts as any} />;
}
