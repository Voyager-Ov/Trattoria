import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWhatsAppConfig() {
    try {
        console.log('🔍 Verificando configuración de WhatsApp...\n');

        const whatsappConfig = await prisma.appConfig.findUnique({
            where: {
                key: 'whatsapp.settings'
            }
        });

        if (!whatsappConfig) {
            console.log('❌ No se encontró configuración de WhatsApp');
            console.log('💡 Creando configuración por defecto...\n');
            
            const defaultConfig = {
                phoneNumber: '56912345678', // Reemplaza con tu número real
                templateMessage: '¡Hola {nombre}! Gracias por elegir La Trattoria.\n\nRecibimos tu pedido #{id} correctamente.\n\n- Entrega en: {direccion}\n- Total: {total}\n- Método de pago: {metodoPago}\n\nDetalle:\n{items}\n\n¡Estamos preparando tu pedido! Te avisaremos cuando esté en camino.',
                enabled: true
            };

            await prisma.appConfig.create({
                data: {
                    key: 'whatsapp.settings',
                    value: defaultConfig
                }
            });

            console.log('✅ Configuración de WhatsApp creada con éxito');
            console.log('📱 Número de teléfono por defecto:', defaultConfig.phoneNumber);
            console.log('⚠️  IMPORTANTE: Actualiza el número de teléfono en la configuración del sistema');
        } else {
            console.log('✅ Configuración de WhatsApp encontrada');
            console.log('📝 Configuración actual:');
            console.log(JSON.stringify(whatsappConfig.value, null, 2));
            
            const settings = whatsappConfig.value as any;
            
            if (!settings.phoneNumber || settings.phoneNumber === '') {
                console.log('\n⚠️  El número de teléfono está vacío');
            } else {
                console.log('\n📱 Número de WhatsApp:', settings.phoneNumber);
                console.log('🟢 Estado:', settings.enabled ? 'ACTIVO' : 'INACTIVO');
            }
        }

        // Verificar últimos pedidos
        console.log('\n🔍 Verificando últimos pedidos...\n');
        const recentOrders = await prisma.order.findMany({
            take: 5,
            orderBy: {
                recibidoEn: 'desc'
            },
            select: {
                id: true,
                numero: true,
                origen: true,
                estado: true,
                clienteNombre: true,
                total: true,
                recibidoEn: true
            }
        });

        if (recentOrders.length === 0) {
            console.log('ℹ️  No hay pedidos en el sistema');
        } else {
            console.log('📦 Últimos 5 pedidos:');
            recentOrders.forEach((order, index) => {
                console.log(`\n${index + 1}. Pedido ${order.numero}`);
                console.log(`   Cliente: ${order.clienteNombre}`);
                console.log(`   Total: $${order.total}`);
                console.log(`   Origen: ${order.origen}`);
                console.log(`   Estado: ${order.estado}`);
                console.log(`   Fecha: ${order.recibidoEn.toLocaleString('es-CL')}`);
            });
        }

    } catch (error) {
        console.error('❌ Error al verificar configuración:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkWhatsAppConfig();
