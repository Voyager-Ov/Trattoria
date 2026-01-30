import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { serializePrisma } from "@/lib/utils";

export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            where: {
                activo: true,
                deletedAt: null
            },
            orderBy: {
                orden: 'asc'
            }
        });

        return NextResponse.json({
            success: true,
            data: serializePrisma(categories)
        });
    } catch (error) {
        console.error("Error fetching public categories:", error);
        return NextResponse.json({
            success: false,
            error: "Error al cargar las categorías"
        }, { status: 500 });
    }
}
