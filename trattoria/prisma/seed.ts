import { prisma } from '../src/lib/prisma';
import { UnidadMedida } from '@prisma/client';

/**
 * Seed script para Trattoria
 * Crea datos iniciales para testing
 */

async function main() {
    console.log('🌱 Starting seed...');

    // Seed Categories
    console.log('Creating categories...');
    const categorias = await Promise.all([
        prisma.category.upsert({
            where: { nombre: 'Pizzas' },
            update: {},
            create: {
                nombre: 'Pizzas',
                slug: 'pizzas',
                descripcion: 'Pizzas artesanales',
                activo: true,
            },
        }),
        prisma.category.upsert({
            where: { nombre: 'Bebidas' },
            update: {},
            create: {
                nombre: 'Bebidas',
                slug: 'bebidas',
                descripcion: 'Bebidas y refrescos',
                activo: true,
            },
        }),
        prisma.category.upsert({
            where: { nombre: 'Postres' },
            update: {},
            create: {
                nombre: 'Postres',
                slug: 'postres',
                descripcion: 'Postres caseros',
                activo: true,
            },
        }),
    ]);

    console.log(`✅ Created ${categorias.length} categories`);

    // Seed Supplies
    console.log('Creating supplies...');
    const insumos = await Promise.all([
        prisma.supply.upsert({
            where: { nombre: 'Harina 000' },
            update: {},
            create: {
                nombre: 'Harina 000',
                descripcion: 'Harina para pizza',
                unidad: UnidadMedida.KILOGRAMO,
                stockActual: 50,
                stockMinimo: 10,
                costoUnitario: 500,
                activo: true,
            },
        }),
        prisma.supply.upsert({
            where: { nombre: 'Queso Mozzarella' },
            update: {},
            create: {
                nombre: 'Queso Mozzarella',
                descripcion: 'Queso mozzarella',
                unidad: UnidadMedida.KILOGRAMO,
                stockActual: 20,
                stockMinimo: 5,
                costoUnitario: 3000,
                activo: true,
            },
        }),
        prisma.supply.upsert({
            where: { nombre: 'Salsa de Tomate' },
            update: {},
            create: {
                nombre: 'Salsa de Tomate',
                descripcion: 'Salsa de tomate casera',
                unidad: UnidadMedida.LITRO,
                stockActual: 15,
                stockMinimo: 3,
                costoUnitario: 800,
                activo: true,
            },
        }),
    ]);

    console.log(`✅ Created ${insumos.length} supplies`);

    // Seed Products
    console.log('Creating products...');
    const productos = await Promise.all([
        prisma.product.upsert({
            where: { nombre: 'Pizza Napolitana' },
            update: {},
            create: {
                nombre: 'Pizza Napolitana',
                descripcion: 'Pizza con mozzarella, tomate y albahaca',
                precio: 4500,
                costoUnitario: 1800,
                unidad: UnidadMedida.UNIDAD,
                categoryId: categorias[0].id,
                activo: true,
                disponible: true,
            },
        }),
        prisma.product.upsert({
            where: { nombre: 'Coca Cola 1.5L' },
            update: {},
            create: {
                nombre: 'Coca Cola 1.5L',
                descripcion: 'Gaseosa Coca Cola 1.5 litros',
                precio: 1500,
                costoUnitario: 900,
                unidad: UnidadMedida.UNIDAD,
                categoryId: categorias[1].id,
                activo: true,
                disponible: true,
            },
        }),
    ]);

    console.log(`✅ Created ${productos.length} products`);

    // Console log for completion
    console.log('✨ Seed completed successfully');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
