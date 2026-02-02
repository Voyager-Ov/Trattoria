"use server";

import { prisma } from "@/lib/prisma";

export type SearchResult = {
    id: string;
    title: string;
    subtitle?: string;
    type: 'PEDIDO' | 'PRODUCTO' | 'EMPLEADO';
    href: string;
};

/**
 * Perform a global search across the system
 */
export async function globalSearch(query: string): Promise<{ success: boolean; data: SearchResult[] }> {
    if (!query || query.length < 2) {
        return { success: true, data: [] };
    }

    try {
        const searchTerm = query.toLowerCase();

        // 1. Search Orders
        const orders = await prisma.order.findMany({
            where: {
                OR: [
                    { numero: { contains: searchTerm, mode: 'insensitive' } },
                    { clienteNombre: { contains: searchTerm, mode: 'insensitive' } },
                ],
                deletedAt: null
            },
            take: 4,
            select: {
                id: true,
                numero: true,
                clienteNombre: true,
            }
        });

        // 2. Search Products
        const products = await prisma.product.findMany({
            where: {
                nombre: { contains: searchTerm, mode: 'insensitive' },
                deletedAt: null
            },
            take: 4,
            select: {
                id: true,
                nombre: true,
                category: {
                    select: {
                        nombre: true
                    }
                },
            }
        });

        // 3. Search Employees
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { displayName: { contains: searchTerm, mode: 'insensitive' } },
                    { email: { contains: searchTerm, mode: 'insensitive' } },
                ],
                deletedAt: null
            },
            take: 4,
            select: {
                id: true,
                displayName: true,
                email: true,
            }
        });

        const results: SearchResult[] = [
            ...orders.map(o => ({
                id: o.id,
                title: o.numero,
                subtitle: o.clienteNombre || 'Sin cliente',
                type: 'PEDIDO' as const,
                href: `/admin/dashboard/pedidos?search=${o.numero}`
            })),
            ...products.map(p => ({
                id: p.id,
                title: p.nombre,
                subtitle: p.category.nombre,
                type: 'PRODUCTO' as const,
                href: `/admin/dashboard/productos?search=${p.nombre}`
            })),
            ...users.map(u => ({
                id: u.id,
                title: u.displayName || u.email.split('@')[0],
                subtitle: u.email,
                type: 'EMPLEADO' as const,
                href: `/admin/dashboard/usuarios?search=${u.displayName || u.email}`
            }))
        ];

        return { success: true, data: results };
    } catch (error) {
        console.error("Global search error:", error);
        return { success: false, data: [] };
    }
}
