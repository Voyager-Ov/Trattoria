import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const orderBy = searchParams.get("orderBy") || "recibidoEn";
        const orderDir = (searchParams.get("orderDir") || "desc") as 'asc' | 'desc';

        const skip = (page - 1) * limit;

        // Construir filtros
        const where: any = {
            deletedAt: null,
        };

        if (status && status !== "TODOS") {
            where.estado = status;
        }

        if (search) {
            where.OR = [
                { numero: { contains: search, mode: 'insensitive' } },
                { clienteNombre: { contains: search, mode: 'insensitive' } },
                { clienteTelefono: { contains: search, mode: 'insensitive' } },
                { customer: { nombre: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    customer: true,
                    items: {
                        include: {
                            product: true
                        }
                    }
                },
                orderBy: {
                    [orderBy]: orderDir
                },
                skip,
                take: limit,
            }),
            prisma.order.count({ where })
        ]);

        return NextResponse.json({
            orders: serializePrisma(orders),
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json({ error: "Error al obtener los pedidos" }, { status: 500 });
    }
}
