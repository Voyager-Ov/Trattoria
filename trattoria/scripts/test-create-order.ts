import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
});

async function testCreateOrder() {
    console.log('🔍 Probando creación de pedido...\n');

    try {
        // Primero, obtener un producto existente
        console.log('📦 Obteniendo producto de prueba...');
        const producto = await prisma.product.findFirst({
            where: { disponible: true }
        });

        if (!producto) {
            console.error('❌ No hay productos disponibles en la base de datos');
            console.log('💡 Crea un producto primero desde el panel de administración');
            return;
        }

        console.log('✅ Producto encontrado:', producto.nombre);
        console.log('💰 Precio:', producto.precio);

        // Crear secuencia
        console.log('\n🔢 Creando secuencia de orden...');
        const seq = await prisma.appSequence.upsert({
            where: { tipo: "order" },
            update: { ultimo: { increment: 1 } },
            create: { tipo: "order", prefijo: "ORD-", ultimo: 1 }
        });
        const numeroOrden = `${seq.prefijo}${seq.ultimo.toString().padStart(4, '0')}`;
        console.log('📋 Número de orden:', numeroOrden);

        // Intentar crear el pedido
        console.log('\n💾 Creando pedido de prueba...');
        const order = await prisma.order.create({
            data: {
                numero: numeroOrden,
                origen: "CATALOGO",
                estado: "RECIBIDO",
                clienteNombre: "Cliente de Prueba",
                clienteTelefono: "+5491112345678",
                clienteDireccion: "Dirección de Prueba 123",
                subtotal: 5000,
                total: 5000,
                metodoPago: "EFECTIVO",
                notas: "Pedido de prueba",
                items: {
                    create: [
                        {
                            product: { connect: { id: producto.id } },
                            nombreProduct: producto.nombre,
                            cantidad: 2,
                            precioUnitario: Number(producto.precio),
                            subtotal: Number(producto.precio) * 2
                        }
                    ]
                }
            },
            include: {
                items: true
            }
        });

        console.log('\n✅ Pedido creado exitosamente!');
        console.log('📊 Detalles del pedido:');
        console.log('   ID:', order.id);
        console.log('   Número:', order.numero);
        console.log('   Cliente:', order.clienteNombre);
        console.log('   Total:', order.total);
        console.log('   Items:', order.items.length);

        // Crear audit log
        await prisma.auditLog.create({
            data: {
                action: "CREATE_ORDER",
                objectType: "order",
                objectId: order.id,
                after: JSON.parse(JSON.stringify(order)),
                origin: "CATALOGO",
                notes: "Pedido de prueba desde script"
            }
        });

        console.log('✅ Audit log creado');

    } catch (error: any) {
        console.error('\n❌ Error al crear pedido:', error.message);
        console.error('\n🔧 Detalles:');
        console.error('   Código:', error.code);
        console.error('   Meta:', error.meta);
        console.error('\n📋 Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testCreateOrder();
