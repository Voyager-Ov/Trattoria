import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { serializePrisma } from "@/lib/utils";

export async function GET() {
    try {
        const now = new Date();
        
        // Obtener promociones activas
        const promotions = await prisma.promotion.findMany({
            where: {
                isActive: true,
                deletedAt: null,
                OR: [
                    {
                        AND: [
                            { startDate: { lte: now } },
                            { endDate: { gte: now } }
                        ]
                    },
                    {
                        AND: [
                            { startDate: null },
                            { endDate: null }
                        ]
                    }
                ]
            },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                categories: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Filtrar por día de la semana si está configurado
        const dayOfWeek = now.getDay(); // 0 = Domingo, 1 = Lunes, etc.
        const dayMap = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
        const dayMapLong = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
        const todayCode = dayMap[dayOfWeek];
        const todayLong = dayMapLong[dayOfWeek];

        const validPromotions = promotions.filter(promo => {
            if (!promo.daysOfWeek) return true; // Sin restricción de días
            const validDays = promo.daysOfWeek.split(',').map(d => d.trim().toUpperCase());
            return validDays.includes(todayCode) || validDays.includes(todayLong);
        });

        return NextResponse.json({
            success: true,
            data: serializePrisma(validPromotions)
        });
    } catch (error) {
        console.error("Error fetching public promotions:", error);
        return NextResponse.json({
            success: false,
            error: "Error al cargar las promociones"
        }, { status: 500 });
    }
}
