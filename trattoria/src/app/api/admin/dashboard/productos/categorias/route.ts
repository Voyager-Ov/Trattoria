import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { serializePrisma } from '@/lib/utils';

export async function GET(request: NextRequest) {
    try {
        const categories = await prisma.category.findMany({
            where: {
                deletedAt: null,
            },
            orderBy: [
                { orden: "asc" },
                { nombre: "asc" },
            ],
        });

        return NextResponse.json({
            success: true,
            data: serializePrisma(categories)
        });

    } catch (error) {
        console.error('Categories API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
