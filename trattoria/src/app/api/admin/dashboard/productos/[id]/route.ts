import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { requireEmployeeApiAuth } from '@/lib/serverAuth';
import { serializePrisma } from '@/lib/utils';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireEmployeeApiAuth(request);
    if (auth.error) {
        return auth.error;
    }

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
                },
                optionGroupAssignments: {
                    include: {
                        group: {
                            include: {
                                options: {
                                    where: { deletedAt: null },
                                    orderBy: { orden: "asc" }
                                }
                            }
                        }
                    },
                    orderBy: { orden: "asc" }
                },
                optionLinksAsBase: {
                    include: {
                        option: {
                            include: {
                                group: true
                            }
                        }
                    },
                    orderBy: { orden: "asc" }
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
