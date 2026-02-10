import { PrismaClient } from '@prisma/client';

async function wakeUpDatabase() {
    console.log('🌅 Intentando despertar la base de datos Neon...\n');
    console.log('💤 Neon suspende las DBs gratuitas después de 5 minutos de inactividad');
    console.log('⏳ Esto puede tomar 10-15 segundos...\n');

    const maxRetries = 5;
    let retryCount = 0;

    while (retryCount < maxRetries) {
        const prisma = new PrismaClient({
            log: retryCount === 0 ? ['error'] : [],
        });

        try {
            console.log(`🔄 Intento ${retryCount + 1} de ${maxRetries}...`);
            
            await prisma.$queryRaw`SELECT 1`;
            
            console.log('\n✅ ¡Base de datos despertada y lista!');
            console.log('🎉 Ahora puedes ejecutar: npm run dev\n');
            
            await prisma.$disconnect();
            process.exit(0);
        } catch (error: any) {
            retryCount++;
            
            if (retryCount < maxRetries) {
                console.log(`⏸️  Esperando 3 segundos antes del siguiente intento...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            
            await prisma.$disconnect();
        }
    }

    console.log('\n❌ No se pudo conectar después de varios intentos\n');
    console.log('💡 Posibles soluciones:');
    console.log('   1. Ve a https://console.neon.tech');
    console.log('   2. Selecciona tu proyecto');
    console.log('   3. Busca un botón "Wake up" o "Resume" y haz clic');
    console.log('   4. Espera unos segundos y vuelve a ejecutar este script\n');
    console.log('   O verifica que la DATABASE_URL en .env sea correcta\n');
    
    process.exit(1);
}

wakeUpDatabase();
