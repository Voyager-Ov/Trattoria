import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { serializePrisma } from '@/lib/utils';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
                recipeItems: {
                    include: {
                        supply: true
                    }
                }
            },
        });

        if (!product) {
            return NextResponse.json(
                { success: false, error: 'Producto no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: serializePrisma(product)
        });

    } catch (error) {
        console.error('Product Detail API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
