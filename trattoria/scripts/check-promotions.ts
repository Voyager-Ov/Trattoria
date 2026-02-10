import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPromotions() {
    try {
        console.log('📊 Verificando promociones en la base de datos...\n');

        const promotions = await prisma.promotion.findMany({
            where: {
                deletedAt: null
            },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                categories: true
            }
        });

        console.log(`✅ Total de promociones: ${promotions.length}\n`);

        if (promotions.length === 0) {
            console.log('⚠️  No hay promociones en la base de datos');
            return;
        }

        promotions.forEach((promo, index) => {
            console.log(`${index + 1}. ${promo.name}`);
            console.log(`   ID: ${promo.id}`);
            console.log(`   Activa: ${promo.isActive ? '✅ Sí' : '❌ No'}`);
            console.log(`   Descripción: ${promo.description || 'Sin descripción'}`);
            console.log(`   Imagen: ${promo.imagen ? '✅ Tiene' : '❌ Sin imagen'}`);
            console.log(`   Descuento: $${promo.discountValue} (${promo.discountType})`);
            console.log(`   Inicio: ${promo.startDate ? new Date(promo.startDate).toLocaleDateString() : 'Sin inicio'}`);
            console.log(`   Fin: ${promo.endDate ? new Date(promo.endDate).toLocaleDateString() : 'Sin fin'}`);
            console.log(`   Días activos: ${promo.daysOfWeek || 'Todos los días'}`);
            
            if (promo.items && promo.items.length > 0) {
                console.log(`   Productos incluidos (${promo.items.length}):`);
                promo.items.forEach(item => {
                    const precio = Number(item.product.precio);
                    const subtotal = precio * item.quantity;
                    console.log(`     - ${item.quantity}x ${item.product.nombre} ($${precio.toLocaleString()} c/u = $${subtotal.toLocaleString()})`);
                });
                
                const totalOriginal = promo.items.reduce((sum, item) => 
                    sum + (Number(item.product.precio) * item.quantity), 0);
                const finalPrice = totalOriginal - Number(promo.discountValue);
                const savingsPercentage = totalOriginal > 0 ? Math.round((Number(promo.discountValue) / totalOriginal) * 100) : 0;
                
                console.log(`   Precio original: $${totalOriginal.toLocaleString()}`);
                console.log(`   Precio final: $${finalPrice.toLocaleString()}`);
                console.log(`   Ahorro: ${savingsPercentage}% ($${Number(promo.discountValue).toLocaleString()})`);
            }
            
            if (promo.categories && promo.categories.length > 0) {
                console.log(`   Categorías (${promo.categories.length}): ${promo.categories.map(c => c.nombre).join(', ')}`);
            }
            
            console.log('');
        });

        // Verificar promociones activas para hoy
        const now = new Date();
        const dayOfWeek = now.getDay();
        const dayMap = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
        const todayCode = dayMap[dayOfWeek];

        const activeToday = promotions.filter(promo => {
            // Check if active
            if (!promo.isActive) return false;
            
            // Check date range
            if (promo.startDate && new Date(promo.startDate) > now) return false;
            if (promo.endDate && new Date(promo.endDate) < now) return false;
            
            // Check day of week
            if (promo.daysOfWeek) {
                const validDays = promo.daysOfWeek.split(',').map(d => d.trim());
                if (!validDays.includes(todayCode)) return false;
            }
            
            return true;
        });

        console.log(`🔥 Promociones activas HOY (${dayMap[dayOfWeek]} - ${now.toLocaleDateString()}): ${activeToday.length}`);
        if (activeToday.length > 0) {
            activeToday.forEach(p => console.log(`   ✅ ${p.name}`));
        }

    } catch (error) {
        console.error('❌ Error al verificar promociones:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPromotions();
