import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { serializePrisma } from '@/lib/utils';
import { requireEmployeeApiAuth } from '@/lib/serverAuth';

export async function GET(request: NextRequest) {
    const auth = await requireEmployeeApiAuth(request);
    if (auth.error) return auth.error;

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
                    categories: true,
                    items: {
                        include: {
                            product: {
                                include: {
                                    recipeItems: {
                                        include: {
                                            supply: true
                                        }
                                    }
                                }
                            }
                        }
                    }
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
            categoryIds: [p.categoryId],
            categoryNames: [p.category.nombre],
            activo: p.activo,
            disponible: p.disponible,
            unidad: p.unidad,
            costoUnitario: p.costoUnitario,
            catalogRole: p.catalogRole,
            createdAt: p.createdAt
        }));

        const normalizedPromotions = promotions.map(p => {
            const totalOriginal = p.items.reduce((sum, item) => 
                sum + (Number(item.product.precio) * item.quantity), 0);
            
            const finalPrice = p.discountType === 'PERCENTAGE'
                ? totalOriginal * (1 - p.discountValue / 100)
                : totalOriginal - p.discountValue;

            // Calcular costo total de insumos
            let totalSuppliesCost = 0;
            p.items.forEach(promoItem => {
                promoItem.product.recipeItems?.forEach(recipeItem => {
                    const qty = Number(recipeItem.qtyPerUnit) * promoItem.quantity;
                    const cost = Number(recipeItem.supply.costoUnitario || 0) * qty;
                    totalSuppliesCost += cost;
                });
            });

            return {
                ...p,
                type: 'PROMOCION',
                id: p.id,
                nombre: p.name,
                descripcion: p.description,
                precio: finalPrice, 
                imagen: p.imagen,
                categoria: p.categories.map(c => c.nombre).join(', ') || 'Varias',
                categoryId: p.categories[0]?.id || 'promo',
                categoryIds: p.categories.map(c => c.id),
                categoryNames: p.categories.map(c => c.nombre),
                activo: p.isActive,
                disponible: true,
                unidad: 'PROMO',
                costoUnitario: totalSuppliesCost,
                createdAt: p.createdAt
            };
        });

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
