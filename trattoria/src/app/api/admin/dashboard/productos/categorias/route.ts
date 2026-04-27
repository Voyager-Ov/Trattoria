import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { serializePrisma } from '@/lib/utils';
import { requireEmployeeApiAuth } from '@/lib/serverAuth';

export async function GET(request: NextRequest) {
    const auth = await requireEmployeeApiAuth(request);
    if (auth.error) return auth.error;

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
