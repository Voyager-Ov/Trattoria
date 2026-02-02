import { PrismaClient, Rol, EstadoUsuario, OrigenPedido, EstadoPedido, UnidadMedida, CategoriaEgreso, DiscountType } from '@prisma/client';
import { subDays, startOfDay, addHours } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting comprehensive seed...');

    // 1. Clean up existing data (optional but recommended for a clean seed)
    // Careful with order of deletion due to foreign keys
    await prisma.auditLog.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.productRecipeItem.deleteMany();
    await prisma.promotionProduct.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.promotion.deleteMany();
    await prisma.supply.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.egreso.deleteMany();
    await prisma.appSequence.deleteMany();
    await prisma.appConfig.deleteMany();
    await prisma.user.deleteMany();

    console.log('🧹 Database cleaned');

    // 2. Create Admin User
    const admin = await prisma.user.create({
        data: {
            firebaseUid: 'seed-admin-uid',
            email: 'admin@trattoria.com',
            displayName: 'Admin Trattoria',
            rol: Rol.ADMIN,
            estado: EstadoUsuario.ACTIVO
        }
    });
    console.log('👤 Admin user created');

    // 3. Initialize Sequences
    await prisma.appSequence.createMany({
        data: [
            { tipo: 'pedido', prefijo: 'P-', ultimo: 0 },
            { tipo: 'egreso', prefijo: 'E-', ultimo: 0 }
        ]
    });
    console.log('🔢 Sequences initialized');

    // 4. Create Categories
    const categoriesData = [
        { nombre: 'Pizzas', slug: 'pizzas', descripcion: 'Pizzas artesanales al horno de barro' },
        { nombre: 'Empanadas', slug: 'empanadas', descripcion: 'Empanadas caseras fritas o al horno' },
        { nombre: 'Bebidas', slug: 'bebidas', descripcion: 'Gaseosas, cervezas y jugos' },
        { nombre: 'Postres', slug: 'postres', descripcion: 'Final dulce para tu comida' },
        { nombre: 'Promos', slug: 'promos', descripcion: 'Combos ideales para compartir', esPromocion: true }
    ];

    const categories = [];
    for (const cat of categoriesData) {
        const created = await prisma.category.create({ data: cat });
        categories.push(created);
    }
    console.log(`📂 ${categories.length} categories created`);

    // 5. Create Products
    const productsData = [
        // Pizzas
        { nombre: 'Muzzarella', precio: 8500, costoUnitario: 3200, categoryId: categories[0].id, descripcion: 'Salsa de tomate, muzzarella, orégano y aceitunas' },
        { nombre: 'Napolitana', precio: 9500, costoUnitario: 3800, categoryId: categories[0].id, descripcion: 'Muzzarella, rodajas de tomate, ajo y perejil' },
        { nombre: 'Fugazzeta', precio: 9800, costoUnitario: 4000, categoryId: categories[0].id, descripcion: 'Muzzarella y cebolla en juliana' },
        { nombre: 'Calabresa', precio: 10500, costoUnitario: 4500, categoryId: categories[0].id, descripcion: 'Muzzarella y longaniza de primera calidad' },

        // Empanadas
        { nombre: 'Carne Suave', precio: 1200, costoUnitario: 450, categoryId: categories[1].id, descripcion: 'Carne cortada a cuchillo' },
        { nombre: 'Jamón y Queso', precio: 1100, costoUnitario: 400, categoryId: categories[1].id, descripcion: 'Clásica combinación' },
        { nombre: 'Humita', precio: 1100, costoUnitario: 420, categoryId: categories[1].id, descripcion: 'Choclo, queso y salsa blanca' },

        // Bebidas
        { nombre: 'Coca Cola 1.5L', precio: 2500, costoUnitario: 1200, categoryId: categories[2].id },
        { nombre: 'Agua Mineral 500ml', precio: 1200, costoUnitario: 500, categoryId: categories[2].id },
        { nombre: 'Cerveza Quilmes 1L', precio: 3200, costoUnitario: 1800, categoryId: categories[2].id },

        // Postres
        { nombre: 'Flan Casero', precio: 2800, costoUnitario: 1000, categoryId: categories[3].id, descripcion: 'Con dulce de leche y crema' },
        { nombre: 'Tiramisú', precio: 3500, costoUnitario: 1500, categoryId: categories[3].id }
    ];

    const products = [];
    for (const prod of productsData) {
        const created = await prisma.product.create({ data: prod });
        products.push(created);
    }
    console.log(`🍕 ${products.length} products created`);

    // 6. Generate Orders (Last 30 days)
    console.log('🛒 Generating orders...');
    let orderCounter = 1;
    for (let i = 0; i < 30; i++) {
        const date = subDays(new Date(), i);
        const dayOrders = Math.floor(Math.random() * 5) + 3; // 3 to 7 orders per day

        for (let j = 0; j < dayOrders; j++) {
            const hour = Math.floor(Math.random() * 5) + 19; // Between 19:00 and 24:00
            const orderDate = addHours(startOfDay(date), hour + Math.random());

            const numItems = Math.floor(Math.random() * 3) + 1;
            const items = [];
            let subtotal = 0;

            for (let k = 0; k < numItems; k++) {
                const product = products[Math.floor(Math.random() * products.length)];
                const quantity = Math.floor(Math.random() * 2) + 1;
                const price = Number(product.precio);
                const itemSubtotal = price * quantity;

                items.push({
                    productId: product.id,
                    nombreProduct: product.nombre,
                    cantidad: quantity,
                    precioUnitario: price,
                    subtotal: itemSubtotal
                });
                subtotal += itemSubtotal;
            }

            const total = subtotal;
            const status = Math.random() > 0.1 ? EstadoPedido.FINALIZADO : EstadoPedido.CANCELADO;
            const metodo = ['Efectivo', 'Transferencia', 'Mercado Pago'][Math.floor(Math.random() * 3)];

            await prisma.order.create({
                data: {
                    numero: `P-${orderCounter.toString().padStart(3, '0')}`,
                    origen: Math.random() > 0.5 ? OrigenPedido.CATALOGO : OrigenPedido.INTERNO,
                    estado: status,
                    recibidoEn: orderDate,
                    finalizadoEn: status === EstadoPedido.FINALIZADO ? addHours(orderDate, 1) : null,
                    canceladoEn: status === EstadoPedido.CANCELADO ? addHours(orderDate, 0.5) : null,
                    subtotal,
                    total,
                    cobrado: status === EstadoPedido.FINALIZADO,
                    cobradoEn: status === EstadoPedido.FINALIZADO ? addHours(orderDate, 1) : null,
                    metodoPago: status === EstadoPedido.FINALIZADO ? metodo : null,
                    clienteNombre: 'Cliente Seed ' + orderCounter,
                    clienteTelefono: '1122334455',
                    clienteDireccion: status === EstadoPedido.FINALIZADO ? 'Calle Falsa 123' : null,
                    createdBy: admin.id,
                    items: {
                        create: items
                    }
                }
            });
            orderCounter++;
        }
    }

    // Update sequence
    await prisma.appSequence.update({
        where: { tipo: 'pedido' },
        data: { ultimo: orderCounter - 1 }
    });
    console.log(`✅ ${orderCounter - 1} orders generated`);

    // 7. Generate Egresos (Last 30 days)
    console.log('💸 Generating expenses...');
    let egresoCounter = 1;
    const egresoCats = Object.values(CategoriaEgreso);

    for (let i = 0; i < 20; i++) {
        const date = subDays(new Date(), Math.floor(Math.random() * 30));
        const cat = egresoCats[Math.floor(Math.random() * egresoCats.length)];
        const monto = Math.floor(Math.random() * 50000) + 5000;

        const descMap: Record<string, string[]> = {
            INSUMOS: ['Harina', 'Queso Mozzarella', 'Cajón de tomates', 'Bolsas'],
            SERVICIOS: ['Luz - Edesur', 'Gas - Metrogas', 'Internet - Fibertel'],
            NOMINA: ['Sueldo Pepe', 'Adelanto María'],
            MANTENIMIENTO: ['Arreglo Horno', 'Pintura Fachada'],
            OTROS: ['Papelería', 'Limpieza']
        };

        const possibleDescs = descMap[cat] || ['Gasto general'];
        const desc = possibleDescs[Math.floor(Math.random() * possibleDescs.length)];

        await prisma.egreso.create({
            data: {
                numero: `E-${egresoCounter.toString().padStart(3, '0')}`,
                fecha: date,
                descripcion: desc,
                monto,
                categoria: cat,
                proveedor: 'Proveedor Seed ' + egresoCounter
            }
        });
        egresoCounter++;
    }

    // Update sequence
    await prisma.appSequence.update({
        where: { tipo: 'egreso' },
        data: { ultimo: egresoCounter - 1 }
    });
    console.log(`✅ ${egresoCounter - 1} expenses generated`);

    // 8. Initial Config
    await prisma.appConfig.createMany({
        data: [
            { key: 'store_name', value: { name: 'Trattoria del Sole' } },
            { key: 'delivery_cost', value: { amount: 500 } },
            { key: 'business_hours', value: { open: '19:00', close: '23:59' } }
        ]
    });
    console.log('⚙️ Initial config created');

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
