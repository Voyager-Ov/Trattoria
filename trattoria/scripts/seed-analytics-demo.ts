import {
    CategoriaEgreso,
    EstadoCompra,
    EstadoPedido,
    OrigenPedido,
    PrismaClient,
    TipoMovimientoStock,
    TipoEntregaPedido,
} from "@prisma/client";

const prisma = new PrismaClient();

const DAY_MS = 24 * 60 * 60 * 1000;

type ProductSeed = {
    id: string;
    nombre: string;
    precio: number;
    costoUnitario: number;
    recipeItems: Array<{
        supplyId: string;
        qtyPerUnit: number;
    }>;
};

function atTime(baseDate: Date, hour: number, minute: number) {
    const next = new Date(baseDate);
    next.setHours(hour, minute, 0, 0);
    return next;
}

async function nextSequence(tipo: string, prefijo: string) {
    const seq = await prisma.appSequence.upsert({
        where: { tipo },
        update: { ultimo: { increment: 1 } },
        create: { tipo, prefijo, ultimo: 1 },
    });

    return `${seq.prefijo || prefijo}${seq.ultimo.toString().padStart(4, "0")}`;
}

async function resetTransactionalData() {
    await prisma.orderEvent.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.purchaseItem.deleteMany();
    await prisma.purchase.deleteMany();
    await prisma.egreso.deleteMany();
    await prisma.provider.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.supply.updateMany({
        data: {
            stockActual: 0,
        },
    });

    await prisma.appSequence.upsert({
        where: { tipo: "order" },
        update: { ultimo: 0, prefijo: "P-" },
        create: { tipo: "order", prefijo: "P-", ultimo: 0 },
    });
    await prisma.appSequence.upsert({
        where: { tipo: "egreso" },
        update: { ultimo: 0, prefijo: "E-" },
        create: { tipo: "egreso", prefijo: "E-", ultimo: 0 },
    });
    await prisma.appSequence.upsert({
        where: { tipo: "purchase" },
        update: { ultimo: 0, prefijo: "C-" },
        create: { tipo: "purchase", prefijo: "C-", ultimo: 0 },
    });
}

async function seedProviders() {
    const providers = [
        "Mayorista Central",
        "Distribuidora Sur",
        "Mercado Fresco",
        "Lacteos del Barrio",
        "Carnes Premium",
        "Servicios Urbanos",
    ];

    const created = [];
    for (const nombre of providers) {
        created.push(
            await prisma.provider.create({
                data: {
                    nombre,
                    activo: true,
                },
            })
        );
    }

    return created;
}

async function seedCustomers() {
    const customers = [
        ["Ana", "11-3000-1000"],
        ["Bruno", "11-3000-1001"],
        ["Carla", "11-3000-1002"],
        ["Diego", "11-3000-1003"],
        ["Elena", "11-3000-1004"],
        ["Fabian", "11-3000-1005"],
        ["Gisela", "11-3000-1006"],
        ["Hector", "11-3000-1007"],
        ["Ines", "11-3000-1008"],
        ["Joaquin", "11-3000-1009"],
    ];

    const created = [];
    for (const [nombre, telefono] of customers) {
        created.push(
            await prisma.customer.create({
                data: {
                    nombre,
                    telefono,
                    direccion: `Calle ${nombre} 123`,
                    activo: true,
                },
            })
        );
    }

    return created;
}

async function loadProducts(): Promise<ProductSeed[]> {
    const products = await prisma.product.findMany({
        where: {
            deletedAt: null,
            activo: true,
        },
        include: {
            recipeItems: {
                select: {
                    supplyId: true,
                    qtyPerUnit: true,
                },
            },
        },
        orderBy: { orden: "asc" },
    });

    return products.map((product) => ({
        id: product.id,
        nombre: product.nombre,
        precio: Number(product.precio),
        costoUnitario: Number(product.costoUnitario || 0),
        recipeItems: product.recipeItems.map((item) => ({
            supplyId: item.supplyId,
            qtyPerUnit: Number(item.qtyPerUnit),
        })),
    }));
}

async function seedInitialInventory(providers: Array<{ id: string; nombre: string }>) {
    const supplies = await prisma.supply.findMany({
        where: {
            deletedAt: null,
            activo: true,
        },
        orderBy: { nombre: "asc" },
    });

    for (let index = 0; index < supplies.length; index += 1) {
        const supply = supplies[index];
        const provider = providers[index % providers.length];
        const quantity = 60 + (index % 6) * 15;
        const unitCost = Number(supply.costoUnitario || 0) || 100;
        const total = quantity * unitCost;
        const fecha = atTime(new Date(Date.now() - 95 * DAY_MS), 9 + (index % 4), 0);
        const purchaseNumber = await nextSequence("purchase", "C-");
        const expenseNumber = await nextSequence("egreso", "E-");

        await prisma.$transaction(async (tx) => {
            const egreso = await tx.egreso.create({
                data: {
                    numero: expenseNumber,
                    descripcion: `Compra inicial de ${supply.nombre}`,
                    monto: total,
                    categoria: CategoriaEgreso.INSUMOS,
                    fecha,
                    fechaPago: fecha,
                    fechaDevengado: fecha,
                    proveedor: provider.nombre,
                    providerId: provider.id,
                    metodoPago: "TRANSFERENCIA",
                    estadoPago: "PAGADO",
                    neto: total,
                    impuestos: 0,
                    percepciones: 0,
                    centroCosto: "Cocina",
                },
            });

            await tx.purchase.create({
                data: {
                    numero: purchaseNumber,
                    providerId: provider.id,
                    subtotal: total,
                    impuestos: 0,
                    total,
                    fecha,
                    estado: EstadoCompra.RECIBIDO,
                    observaciones: "Carga inicial para demo analytics",
                    egresoId: egreso.id,
                    items: {
                        create: {
                            supplyId: supply.id,
                            cantidad: quantity,
                            precioUnit: unitCost,
                        },
                    },
                },
            });

            await tx.supply.update({
                where: { id: supply.id },
                data: {
                    stockActual: quantity,
                    costoUnitario: unitCost,
                },
            });

            await tx.stockMovement.create({
                data: {
                    supplyId: supply.id,
                    tipo: TipoMovimientoStock.IN,
                    cantidad: quantity,
                    stockResultante: quantity,
                    motivo: "Carga inicial de inventario demo",
                    createdAt: fecha,
                },
            });
        });
    }
}

async function createRecurringExpenses(providers: Array<{ id: string; nombre: string }>) {
    const now = new Date();
    for (let monthOffset = 0; monthOffset < 4; monthOffset += 1) {
        const base = new Date(now.getFullYear(), now.getMonth() - monthOffset, 5, 10, 0, 0, 0);
        const expenseTemplates = [
            { categoria: CategoriaEgreso.NOMINA, monto: 1350000, provider: providers[5], center: "Operacion", day: 5 },
            { categoria: CategoriaEgreso.ALQUILER, monto: 520000, provider: providers[5], center: "Salon", day: 3 },
            { categoria: CategoriaEgreso.SERVICIOS, monto: 210000, provider: providers[5], center: "Local", day: 12 },
            { categoria: CategoriaEgreso.IMPUESTOS, monto: 280000, provider: providers[5], center: "Administracion", day: 18 },
            { categoria: CategoriaEgreso.PUBLICIDAD, monto: 90000, provider: providers[5], center: "Marketing", day: 20 },
        ];

        for (const template of expenseTemplates) {
            const fecha = new Date(base.getFullYear(), base.getMonth(), template.day, 11, 0, 0, 0);
            await prisma.egreso.create({
                data: {
                    numero: await nextSequence("egreso", "E-"),
                    descripcion: `Gasto ${template.categoria.toLowerCase()} ${formatMonth(fecha)}`,
                    monto: template.monto,
                    categoria: template.categoria,
                    fecha,
                    fechaPago: fecha,
                    fechaDevengado: fecha,
                    fechaVencimiento: fecha,
                    proveedor: template.provider.nombre,
                    providerId: template.provider.id,
                    metodoPago: template.categoria === CategoriaEgreso.NOMINA ? "TRANSFERENCIA" : "DEBITO",
                    estadoPago: "PAGADO",
                    centroCosto: template.center,
                    neto: template.monto,
                    impuestos: 0,
                    percepciones: 0,
                    periodoDesde: new Date(fecha.getFullYear(), fecha.getMonth(), 1),
                    periodoHasta: new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0),
                },
            });
        }
    }
}

function formatMonth(date: Date) {
    return `${date.getMonth() + 1}/${date.getFullYear()}`;
}

async function consumeInventory(product: ProductSeed, quantity: number, referenceDate: Date) {
    for (const recipeItem of product.recipeItems) {
        const supply = await prisma.supply.findUnique({
            where: { id: recipeItem.supplyId },
            select: {
                id: true,
                stockActual: true,
            },
        });

        if (!supply) {
            continue;
        }

        const consumption = recipeItem.qtyPerUnit * quantity;
        const nextStock = Number(supply.stockActual) - consumption;

        await prisma.$transaction(async (tx) => {
            await tx.supply.update({
                where: { id: recipeItem.supplyId },
                data: {
                    stockActual: nextStock,
                },
            });

            await tx.stockMovement.create({
                data: {
                    supplyId: recipeItem.supplyId,
                    tipo: TipoMovimientoStock.OUT,
                    cantidad: consumption,
                    stockResultante: nextStock,
                    motivo: `Consumo por pedido demo (${product.nombre})`,
                    createdAt: referenceDate,
                },
            });
        });
    }
}

async function seedOrders(products: ProductSeed[], customers: Array<{ id: string; nombre: string }>) {
    const days = 84;
    const paymentMethods = ["EFECTIVO", "TRANSFERENCIA", "MERCADOPAGO", "DEBITO", "CREDITO"];

    for (let dayOffset = days; dayOffset >= 0; dayOffset -= 1) {
        const baseDate = new Date(Date.now() - dayOffset * DAY_MS);
        const orderCount = 3 + ((baseDate.getDate() + baseDate.getMonth()) % 4);

        for (let index = 0; index < orderCount; index += 1) {
            const customer = customers[(dayOffset + index) % customers.length];
            const origin = (dayOffset + index) % 3 === 0 ? OrigenPedido.CATALOGO : OrigenPedido.INTERNO;
            const tipoEntrega = origin === OrigenPedido.CATALOGO ? TipoEntregaPedido.DELIVERY : TipoEntregaPedido.RETIRO;
            const hour = 11 + ((index * 3 + dayOffset) % 10);
            const recibidoEn = atTime(baseDate, hour, (index % 4) * 10);
            const enPreparacionEn = new Date(recibidoEn.getTime() + 5 * 60 * 1000);
            const listoEn = new Date(enPreparacionEn.getTime() + (18 + (index % 5) * 4) * 60 * 1000);
            const finalizadoEn = new Date(listoEn.getTime() + 8 * 60 * 1000);
            const deliveredAt = tipoEntrega === TipoEntregaPedido.DELIVERY ? new Date(finalizadoEn.getTime() + 18 * 60 * 1000) : finalizadoEn;
            const isCancelled = dayOffset % 11 === 0 && index === 0;
            const isOpenRecent = dayOffset < 2 && index === orderCount - 1;

            let estado: EstadoPedido = EstadoPedido.FINALIZADO;
            if (isCancelled) {
                estado = EstadoPedido.CANCELADO;
            } else if (isOpenRecent) {
                estado = index % 2 === 0 ? EstadoPedido.EN_PREPARACION : EstadoPedido.PENDIENTE;
            }

            const selectedProducts = [
                products[(dayOffset + index) % products.length],
                products[(dayOffset + index + 7) % products.length],
                ...(index % 2 === 0 ? [products[(dayOffset + index + 13) % products.length]] : []),
            ];

            let subtotal = 0;
            const items = selectedProducts.map((product, itemIndex) => {
                const quantity = 1 + ((dayOffset + index + itemIndex) % 2);
                const lineSubtotal = product.precio * quantity;
                subtotal += lineSubtotal;
                return {
                    product,
                    quantity,
                    lineSubtotal,
                };
            });

            const descuento = index % 5 === 0 ? Math.round(subtotal * 0.08) : 0;
            const deliveryFee = tipoEntrega === TipoEntregaPedido.DELIVERY ? 2500 : 0;
            const costoCanal = origin === OrigenPedido.CATALOGO ? Math.round((subtotal - descuento) * 0.04) : 0;
            const total = subtotal - descuento + deliveryFee;
            const cobrado = estado === EstadoPedido.FINALIZADO;
            const cobradoEn = cobrado ? new Date(finalizadoEn.getTime() + 6 * 60 * 1000) : null;
            const metodoPago = cobrado ? paymentMethods[(dayOffset + index) % paymentMethods.length] : null;

            const order = await prisma.order.create({
                data: {
                    numero: await nextSequence("order", "P-"),
                    origen: origin,
                    customerId: customer.id,
                    estado,
                    recibidoEn,
                    enPreparacionEn: estado === EstadoPedido.CANCELADO ? null : enPreparacionEn,
                    listoEn: estado === EstadoPedido.FINALIZADO ? listoEn : null,
                    finalizadoEn: estado === EstadoPedido.FINALIZADO ? finalizadoEn : null,
                    canceladoEn: estado === EstadoPedido.CANCELADO ? new Date(recibidoEn.getTime() + 15 * 60 * 1000) : null,
                    subtotal,
                    descuento,
                    total,
                    cobrado,
                    cobradoEn,
                    metodoPago,
                    notas: origin === OrigenPedido.CATALOGO ? "Pedido demo generado para analytics" : null,
                    motivoCancelacion: estado === EstadoPedido.CANCELADO ? "Cliente no confirmo pedido" : null,
                    clienteNombre: customer.nombre,
                    clienteTelefono: `11-4000-${(1000 + dayOffset + index).toString().slice(-4)}`,
                    clienteDireccion: `${customer.nombre} 456`,
                    tipoEntrega,
                    canalVenta: origin === OrigenPedido.CATALOGO ? "WhatsApp" : "Mostrador",
                    deliveryFee,
                    costoCanal,
                    promisedAt: new Date(recibidoEn.getTime() + 45 * 60 * 1000),
                    deliveredAt: estado === EstadoPedido.FINALIZADO ? deliveredAt : null,
                    items: {
                        create: items.map((item, itemIndex) => ({
                            productId: item.product.id,
                            nombreProduct: item.product.nombre,
                            cantidad: item.quantity,
                            precioUnitario: item.product.precio,
                            subtotal: item.lineSubtotal,
                            orden: itemIndex,
                        })),
                    },
                },
            });

            if (estado === EstadoPedido.FINALIZADO) {
                for (const item of items) {
                    await consumeInventory(item.product, item.quantity, finalizadoEn);
                }

                await prisma.orderEvent.createMany({
                    data: [
                        {
                            orderId: order.id,
                            tipo: "CREACION",
                            descripcion: "Pedido demo creado",
                            actorName: "Sistema Demo",
                            createdAt: recibidoEn,
                        },
                        {
                            orderId: order.id,
                            tipo: "CAMBIO_ESTADO",
                            descripcion: "Pedido finalizado",
                            actorName: "Sistema Demo",
                            createdAt: finalizadoEn,
                        },
                        {
                            orderId: order.id,
                            tipo: "COBRO",
                            descripcion: `Pedido cobrado por ${metodoPago}`,
                            actorName: "Sistema Demo",
                            createdAt: cobradoEn || finalizadoEn,
                        },
                    ],
                });
            }
        }
    }
}

async function main() {
    console.log("Resetting transactional analytics data...");
    await resetTransactionalData();

    console.log("Creating providers and customers...");
    const providers = await seedProviders();
    const customers = await seedCustomers();
    const products = await loadProducts();

    console.log("Creating purchases and initial inventory...");
    await seedInitialInventory(providers);

    console.log("Creating recurring expenses...");
    await createRecurringExpenses(providers);

    console.log("Creating historical orders and stock consumption...");
    await seedOrders(products, customers);

    console.log("Analytics demo seed completed.");
}

main()
    .catch((error) => {
        console.error("Analytics demo seed failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
