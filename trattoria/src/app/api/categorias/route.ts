import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { serializePrisma } from "@/lib/utils";

// Next.js route-level cache: esta ruta se cachea en la CDN de Vercel.
// stale-while-revalidate: sirve la versión cacheada mientras regenera en background.
export const revalidate = 60;

export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            where: {
                activo: true,
                deletedAt: null
            },
            orderBy: {
                orden: 'asc'
            },
            select: {
                id: true,
                nombre: true,
                slug: true,
                descripcion: true,
                imagen: true,
                orden: true,
                activo: true,
            }
        });

        const response = NextResponse.json({
            success: true,
            data: serializePrisma(categories)
        });

        // Cache en CDN (s-maxage) y browsers (max-age).
        // stale-while-revalidate permite servir datos viejos mientras regenera.
        response.headers.set(
            'Cache-Control',
            'public, s-maxage=60, stale-while-revalidate=300'
        );

        return response;
    } catch (error) {
        console.error("Error fetching public categories:", error);
        return NextResponse.json(
            { success: false, error: "Error al cargar las categorías" },
            { status: 500 }
        );
    }
}

