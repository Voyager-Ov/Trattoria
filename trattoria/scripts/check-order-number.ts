import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrderNumber() {
    try {
        console.log('🔍 Verificando número de pedido actual...\n');

        const seq = await prisma.appSequence.findUnique({
            where: { tipo: 'order' }
        });

        if (!seq) {
            console.log('ℹ️  No hay secuencia de pedidos creada aún');
            console.log('💡 Se creará automáticamente con el primer pedido');
        } else {
            console.log('📊 Secuencia encontrada:');
            console.log(`   Prefijo: ${seq.prefijo}`);
            console.log(`   Último número: ${seq.ultimo}`);
            console.log(`   Próximo pedido será: ${seq.prefijo}${(seq.ultimo + 1).toString().padStart(4, '0')}`);
        }

        console.log('\n📦 Pedidos en la base de datos:');
        const orders = await prisma.order.findMany({
            orderBy: { recibidoEn: 'desc' },
            take: 10,
            select: {
                numero: true,
                clienteNombre: true,
                total: true,
                estado: true,
                recibidoEn: true
            }
        });

        if (orders.length === 0) {
            console.log('   No hay pedidos aún');
        } else {
            console.log(`   Total: ${orders.length} pedido(s)`);
            orders.forEach((order, idx) => {
                console.log(`\n   ${idx + 1}. ${order.numero}`);
                console.log(`      Cliente: ${order.clienteNombre || 'N/A'}`);
                console.log(`      Total: $${Number(order.total).toLocaleString('es-CL')}`);
                console.log(`      Estado: ${order.estado}`);
                console.log(`      Fecha: ${order.recibidoEn.toLocaleString('es-CL')}`);
            });
        }

        console.log('\n✅ Formato actualizado a 4 dígitos (ORD-0001 a ORD-9999)');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkOrderNumber();
