import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { serializePrisma } from "@/lib/utils";

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            where: {
                activo: true,
                disponible: true,
                deletedAt: null
            },
            include: {
                category: true
            },
            orderBy: {
                nombre: 'asc'
            }
        });

        return NextResponse.json({
            success: true,
            data: serializePrisma(products)
        });
    } catch (error) {
        console.error("Error fetching public products:", error);
        return NextResponse.json({
            success: false,
            error: "Error al cargar los productos"
        }, { status: 500 });
    }
}
