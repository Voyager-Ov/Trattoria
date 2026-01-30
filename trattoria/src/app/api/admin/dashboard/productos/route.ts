import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { serializePrisma } from '@/lib/utils';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const q = searchParams.get('q')?.toLowerCase() || '';
        const categoryId = searchParams.get('categoryId') || '';

        // Fetch products and promotions in parallel
        const [products, promotions] = await Promise.all([
            prisma.product.findMany({
                where: {
                    deletedAt: null,
                    ...(q ? {
                        OR: [
                            { nombre: { contains: q, mode: 'insensitive' } },
                            { descripcion: { contains: q, mode: 'insensitive' } }
                        ]
                    } : {}),
                    ...(categoryId ? { categoryId } : {})
                },
                include: {
                    category: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prisma.promotion.findMany({
                where: {
                    deletedAt: null,
                    ...(q ? {
                        OR: [
                            { name: { contains: q, mode: 'insensitive' } },
                            { description: { contains: q, mode: 'insensitive' } }
                        ]
                    } : {}),
                    ...(categoryId ? {
                        categories: {
                            some: { id: categoryId }
                        }
                    } : {})
                },
                include: {
                    categories: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })
        ]);

        // Normalize data
        const normalizedProducts = products.map(p => ({
            ...p,
            type: 'PRODUCTO',
            id: p.id,
            nombre: p.nombre,
            descripcion: p.descripcion,
            precio: p.precio,
            imagen: p.imagen,
            categoria: p.category.nombre,
            categoryId: p.categoryId,
            activo: p.activo,
            disponible: p.disponible,
            unidad: p.unidad,
            createdAt: p.createdAt
        }));

        const normalizedPromotions = promotions.map(p => ({
            ...p,
            type: 'PROMOCION',
            id: p.id,
            nombre: p.name,
            descripcion: p.description,
            precio: p.discountValue, // This might need logic if it's percentage vs fixed
            imagen: p.imagen,
            categoria: p.categories.map(c => c.nombre).join(', ') || 'Varias',
            categoryId: p.categories[0]?.id || 'promo',
            activo: p.isActive,
            disponible: true,
            unidad: 'PROMO',
            createdAt: p.createdAt
        }));

        const combined = [...normalizedProducts, ...normalizedPromotions].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return NextResponse.json({
            success: true,
            data: serializePrisma(combined)
        });

    } catch (error) {
        console.error('Menu API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
