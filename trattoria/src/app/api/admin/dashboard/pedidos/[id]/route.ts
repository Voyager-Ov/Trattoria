import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const order = await prisma.order.findFirst({
            where: {
                id: id,
                deletedAt: null
            },
            include: {
                customer: true,
                events: {
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                items: {
                    include: {
                        product: true
                    },
                    orderBy: {
                        orden: 'asc'
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json(
                { success: false, error: "Pedido no encontrado" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            order: serializePrisma(order)
        });
    } catch (error) {
        console.error("Error fetching order detail:", error);
        return NextResponse.json(
            { success: false, error: "Error al obtener el pedido" },
            { status: 500 }
        );
    }
}
