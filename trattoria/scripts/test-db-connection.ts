import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
});

async function testConnection() {
    console.log('🔍 Probando conexión a la base de datos...\n');
    console.log('📊 DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));

    try {
        console.log('\n⏳ Intentando conectar...');
        
        // Test 1: Simple query
        const result = await prisma.$queryRaw`SELECT 1 as test`;
        console.log('✅ Conexión exitosa!');
        console.log('📋 Resultado de prueba:', result);

        // Test 2: Count users
        const userCount = await prisma.user.count();
        console.log(`\n👥 Usuarios en la base de datos: ${userCount}`);

        // Test 3: Count orders
        const orderCount = await prisma.order.count();
        console.log(`📦 Pedidos en la base de datos: ${orderCount}`);

        // Test 4: Count products
        const productCount = await prisma.product.count();
        console.log(`🍕 Productos en la base de datos: ${productCount}`);

        console.log('\n✅ Todas las pruebas pasaron correctamente');

    } catch (error: any) {
        console.error('\n❌ Error de conexión:', error.message);
        console.error('\n🔧 Detalles del error:');
        console.error('   Código:', error.code);
        console.error('   Nombre:', error.name);
        
        if (error.message.includes("Can't reach database server")) {
            console.error('\n💡 Posibles soluciones:');
            console.error('   1. Verifica que tu conexión a internet esté funcionando');
            console.error('   2. Verifica que el proyecto Neon esté activo en https://console.neon.tech');
            console.error('   3. Verifica que la DATABASE_URL en .env sea correcta');
            console.error('   4. El servidor de Neon podría estar experimentando problemas temporales');
        }
    } finally {
        await prisma.$disconnect();
        console.log('\n🔌 Desconectado de la base de datos');
    }
}

testConnection();
