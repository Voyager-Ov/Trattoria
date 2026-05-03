import { PrismaClient, ProductCatalogRole, ProductOptionPriceMode, UnidadMedida, Rol } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando configuración inicial del sistema Trattoria...');

  // 1. Configuración del local
  console.log('--- 1. Configuración del local ---');
  const localConfig = {
    nombre: 'Trattoria',
    direccion: 'Rivadavia y 25 de Mayo',
    telefono: '+54 357 6419 141',
    tiempoEstimado: '30 a 45 minutos',
    modalidades: {
      retiroLocal: true,
      delivery: true,
    },
    delivery: {
      zonaCercana: 1500,
      zonaLejana: 2500,
    },
    metodosPago: ['Transferencia', 'Mercado Pago', 'Efectivo'],
    horarios: {
      martesADomingo: {
        manana: '08:00 a 13:30',
        noche: '19:00 a 23:00',
      },
      lunes: 'cerrado'
    }
  };

  await prisma.appConfig.upsert({
    where: { key: 'local_config' },
    update: { value: localConfig },
    create: { key: 'local_config', value: localConfig }
  });
  console.log('Configuración del local actualizada.');

  // 2. Gestión de accesos
  console.log('--- 2. Gestión de accesos ---');
  const users = [
    { 
      email: 'octavio.velo2022@gmail.com', 
      displayName: 'octavio velo', 
      rol: Rol.ADMIN,
      firebaseUid: 'qBFeItwQ1RhDJWL3IIWtBiLMAsp1'
    },
    { 
      email: 'koch.carlos@hotmail.com', 
      displayName: 'Carlos Koch', 
      rol: Rol.ADMIN,
      firebaseUid: 'hBLh0h3L87c6jJctm6RtRGYLwy33'
    },
    {
      email: 'octavio.velo2024@gmail.com',
      displayName: 'vista empleado',
      rol: Rol.EMPLEADO,
      firebaseUid: 'ojjhfQJ0ZQa8ttGPWbfLmP8ksys2'
    }
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        displayName: user.displayName,
        rol: user.rol,
        firebaseUid: user.firebaseUid,
      },
      create: {
        email: user.email,
        displayName: user.displayName,
        rol: user.rol,
        firebaseUid: user.firebaseUid,
      }
    });
  }
  console.log(`Usuarios verificados: ${users.length}`);

  // 3. Categorías de insumos
  console.log('--- 3. Categorías de insumos ---');
  const supplyCategoriesNames = [
    'Harinas y masas', 'Lácteos', 'Carnes', 'Fiambres', 'Verduras',
    'Salsas', 'Condimentos', 'Conservas', 'Bebidas y líquidos', 'Postres', 'Otros'
  ];

  const supplyCategories: Record<string, string> = {};
  for (const name of supplyCategoriesNames) {
    const cat = await prisma.supplyCategory.upsert({
      where: { nombre: name },
      update: {},
      create: { nombre: name }
    });
    supplyCategories[name] = cat.id;
  }
  console.log(`Categorías de insumos: ${Object.keys(supplyCategories).length}`);

  // 4. Insumos
  console.log('--- 4. Insumos ---');
  const suppliesData = [
    { nombre: 'Harina', category: 'Harinas y masas', unidad: UnidadMedida.KILOGRAMO, min: 10, cost: 800 },
    { nombre: 'Masa de pizza', category: 'Harinas y masas', unidad: UnidadMedida.UNIDAD, min: 20, cost: 300 },
    { nombre: 'Masa de empanada', category: 'Harinas y masas', unidad: UnidadMedida.UNIDAD, min: 50, cost: 50 },
    { nombre: 'Masa de tarta', category: 'Harinas y masas', unidad: UnidadMedida.UNIDAD, min: 10, cost: 200 },
    { nombre: 'Masa de pasta', category: 'Harinas y masas', unidad: UnidadMedida.KILOGRAMO, min: 5, cost: 600 },
    { nombre: 'Mozzarella', category: 'Lácteos', unidad: UnidadMedida.KILOGRAMO, min: 10, cost: 6500 },
    { nombre: 'Queso tybo', category: 'Lácteos', unidad: UnidadMedida.KILOGRAMO, min: 3, cost: 7000 },
    { nombre: 'Queso sardo', category: 'Lácteos', unidad: UnidadMedida.KILOGRAMO, min: 2, cost: 8000 },
    { nombre: 'Roquefort', category: 'Lácteos', unidad: UnidadMedida.KILOGRAMO, min: 2, cost: 9000 },
    { nombre: 'Jamón cocido', category: 'Fiambres', unidad: UnidadMedida.KILOGRAMO, min: 5, cost: 5000 },
    { nombre: 'Jamón crudo', category: 'Fiambres', unidad: UnidadMedida.KILOGRAMO, min: 2, cost: 12000 },
    { nombre: 'Carne picada', category: 'Carnes', unidad: UnidadMedida.KILOGRAMO, min: 5, cost: 6000 },
    { nombre: 'Pollo', category: 'Carnes', unidad: UnidadMedida.KILOGRAMO, min: 10, cost: 3500 },
    { nombre: 'Milanesa', category: 'Carnes', unidad: UnidadMedida.UNIDAD, min: 20, cost: 800 },
    { nombre: 'Huevo', category: 'Lácteos', unidad: UnidadMedida.UNIDAD, min: 60, cost: 150 },
    { nombre: 'Cebolla', category: 'Verduras', unidad: UnidadMedida.KILOGRAMO, min: 5, cost: 1000 },
    { nombre: 'Cebolla de verdeo', category: 'Verduras', unidad: UnidadMedida.KILOGRAMO, min: 2, cost: 1200 },
    { nombre: 'Morrón', category: 'Verduras', unidad: UnidadMedida.KILOGRAMO, min: 2, cost: 2000 },
    { nombre: 'Tomate', category: 'Verduras', unidad: UnidadMedida.KILOGRAMO, min: 5, cost: 1500 },
    { nombre: 'Rúcula', category: 'Verduras', unidad: UnidadMedida.KILOGRAMO, min: 1, cost: 1000 },
    { nombre: 'Albahaca', category: 'Verduras', unidad: UnidadMedida.KILOGRAMO, min: 0.5, cost: 3000 },
    { nombre: 'Ajo', category: 'Verduras', unidad: UnidadMedida.KILOGRAMO, min: 0.5, cost: 4000 },
    { nombre: 'Perejil', category: 'Verduras', unidad: UnidadMedida.KILOGRAMO, min: 0.5, cost: 2000 },
    { nombre: 'Choclo', category: 'Conservas', unidad: UnidadMedida.KILOGRAMO, min: 2, cost: 1800 },
    { nombre: 'Palmito', category: 'Conservas', unidad: UnidadMedida.KILOGRAMO, min: 2, cost: 5000 },
    { nombre: 'Champignones', category: 'Conservas', unidad: UnidadMedida.KILOGRAMO, min: 2, cost: 4000 },
    { nombre: 'Aceitunas', category: 'Conservas', unidad: UnidadMedida.KILOGRAMO, min: 2, cost: 3000 },
    { nombre: 'Ananá', category: 'Conservas', unidad: UnidadMedida.KILOGRAMO, min: 1, cost: 3500 },
    { nombre: 'Salame / calabresa', category: 'Fiambres', unidad: UnidadMedida.KILOGRAMO, min: 2, cost: 8000 },
    { nombre: 'Salchicha', category: 'Carnes', unidad: UnidadMedida.KILOGRAMO, min: 2, cost: 4000 },
    { nombre: 'Anchoas', category: 'Conservas', unidad: UnidadMedida.KILOGRAMO, min: 1, cost: 15000 },
    { nombre: 'Papas fritas', category: 'Verduras', unidad: UnidadMedida.KILOGRAMO, min: 10, cost: 1500 },
    { nombre: 'Salsa de tomate', category: 'Salsas', unidad: UnidadMedida.LITRO, min: 5, cost: 2000 },
    { nombre: 'Salsa fileto', category: 'Salsas', unidad: UnidadMedida.LITRO, min: 5, cost: 2200 },
    { nombre: 'Salsa boloñesa', category: 'Salsas', unidad: UnidadMedida.LITRO, min: 5, cost: 3500 },
    { nombre: 'Salsa parisienne', category: 'Salsas', unidad: UnidadMedida.LITRO, min: 2, cost: 4000 },
    { nombre: 'Salsa peceto', category: 'Salsas', unidad: UnidadMedida.LITRO, min: 2, cost: 4500 },
    { nombre: 'Salsa golf', category: 'Salsas', unidad: UnidadMedida.LITRO, min: 1, cost: 2000 },
    { nombre: 'Mostaza', category: 'Condimentos', unidad: UnidadMedida.KILOGRAMO, min: 1, cost: 1500 },
    { nombre: 'Orégano', category: 'Condimentos', unidad: UnidadMedida.KILOGRAMO, min: 0.5, cost: 8000 },
    { nombre: 'Azúcar morena', category: 'Otros', unidad: UnidadMedida.KILOGRAMO, min: 1, cost: 2000 },
    { nombre: 'Oreo', category: 'Postres', unidad: UnidadMedida.KILOGRAMO, min: 1, cost: 4000 },
    { nombre: 'Ingredientes tiramisú', category: 'Postres', unidad: UnidadMedida.KILOGRAMO, min: 1, cost: 5000 },
    { nombre: 'Ingredientes chocotorta/chocolina', category: 'Postres', unidad: UnidadMedida.KILOGRAMO, min: 1, cost: 4500 },
  ];

  const supplies: Record<string, string> = {};
  for (const s of suppliesData) {
    const categoryId = supplyCategories[s.category];
    if (!categoryId) {
      console.warn(`Categoría no encontrada para el insumo ${s.nombre}: ${s.category}`);
      continue;
    }
    const supply = await prisma.supply.upsert({
      where: { nombre: s.nombre },
      update: {
        categoryId,
        unidad: s.unidad,
        stockMinimo: s.min,
        costoUnitario: s.cost,
      },
      create: {
        nombre: s.nombre,
        categoryId,
        unidad: s.unidad,
        stockMinimo: s.min,
        costoUnitario: s.cost,
        stockActual: 0,
      }
    });
    supplies[s.nombre] = supply.id;
  }
  console.log(`Insumos verificados: ${Object.keys(supplies).length}`);

  // 5. Categorías de productos
  console.log('--- 5. Categorías de productos ---');
  const productCategoriesData = [
    { nombre: 'Pizzas', slug: 'pizzas', orden: 1 },
    { nombre: 'Pastas', slug: 'pastas', orden: 2 },
    { nombre: 'Tartas', slug: 'tartas', orden: 3 },
    { nombre: 'Empanadas', slug: 'empanadas', orden: 4 },
    { nombre: 'Calzoni', slug: 'calzoni', orden: 5 },
    { nombre: 'Milanesas', slug: 'milanesas', orden: 6 },
    { nombre: 'Hamburguesas', slug: 'hamburguesas', orden: 7 },
    { nombre: 'Postres', slug: 'postres', orden: 8 },
    { nombre: 'Promociones', slug: 'promociones', orden: 9, esPromocion: true },
    { nombre: 'Salsas', slug: 'salsas', orden: 99 }, // Oculta o auxiliar
  ];

  const categories: Record<string, string> = {};
  for (const c of productCategoriesData) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {
        nombre: c.nombre,
        orden: c.orden,
        esPromocion: c.esPromocion || false
      },
      create: {
        nombre: c.nombre,
        slug: c.slug,
        orden: c.orden,
        esPromocion: c.esPromocion || false
      }
    });
    categories[c.slug] = cat.id;
  }
  console.log(`Categorías de productos: ${Object.keys(categories).length}`);

  // 6. Productos auxiliares (Salsas como OPTION_PRODUCT)
  console.log('--- 6. Productos auxiliares (Salsas) ---');
  const salsasProducts = [
    { nombre: 'Salsa Fileto (Porción)', precio: 1500, insumo: 'Salsa fileto', cantidadInsumo: 0.2 },
    { nombre: 'Salsa Boloñesa (Porción)', precio: 2500, insumo: 'Salsa boloñesa', cantidadInsumo: 0.2 },
    { nombre: 'Salsa Parisienne (Porción)', precio: 3000, insumo: 'Salsa parisienne', cantidadInsumo: 0.2 },
    { nombre: 'Salsa Peceto (Porción)', precio: 3500, insumo: 'Salsa peceto', cantidadInsumo: 0.2 },
  ];

  const optionProducts: Record<string, string> = {};
  for (const s of salsasProducts) {
    const prod = await prisma.product.upsert({
      where: { nombre: s.nombre },
      update: { precio: s.precio },
      create: {
        nombre: s.nombre,
        categoryId: categories['salsas'],
        precio: s.precio,
        catalogRole: ProductCatalogRole.OPTION_PRODUCT,
        unidad: UnidadMedida.PORCION,
        activo: true
      }
    });
    optionProducts[s.nombre] = prod.id;

    // Receta
    const supplyId = supplies[s.insumo];
    if (supplyId) {
      await prisma.productRecipeItem.upsert({
        where: { productId_supplyId: { productId: prod.id, supplyId } },
        update: { qtyPerUnit: s.cantidadInsumo },
        create: {
          productId: prod.id,
          supplyId,
          qtyPerUnit: s.cantidadInsumo,
          unidad: UnidadMedida.LITRO
        }
      });
    }
  }

  // 7. Grupos de opciones
  console.log('--- 7. Grupos de opciones ---');
  
  // Grupo: Salsa
  const salsaGroup = await prisma.productOptionGroup.upsert({
    where: { key: 'salsas_pastas' },
    update: { nombre: 'Elegí tu salsa', priceMode: ProductOptionPriceMode.ADD, required: true },
    create: { key: 'salsas_pastas', nombre: 'Elegí tu salsa', priceMode: ProductOptionPriceMode.ADD, required: true }
  });

  const salsaOptions = [
    { label: 'Fileto', slug: 'fileto', optionProductName: 'Salsa Fileto (Porción)' },
    { label: 'Boloñesa', slug: 'bolonesa', optionProductName: 'Salsa Boloñesa (Porción)' },
    { label: 'Parisienne', slug: 'parisienne', optionProductName: 'Salsa Parisienne (Porción)' },
    { label: 'Peceto', slug: 'peceto', optionProductName: 'Salsa Peceto (Porción)' }
  ];

  for (const opt of salsaOptions) {
    const optionProductId = optionProducts[opt.optionProductName];
    await prisma.productOption.upsert({
      where: { groupId_slug: { groupId: salsaGroup.id, slug: opt.slug } },
      update: { label: opt.label, optionProductId },
      create: { groupId: salsaGroup.id, slug: opt.slug, label: opt.label, optionProductId }
    });
  }

  // Grupo: Tamaño Pizza
  const tamanoPizzaGroup = await prisma.productOptionGroup.upsert({
    where: { key: 'tamano_pizza' },
    update: { nombre: 'Tamaño', priceMode: ProductOptionPriceMode.OVERRIDE, required: true },
    create: { key: 'tamano_pizza', nombre: 'Tamaño', priceMode: ProductOptionPriceMode.OVERRIDE, required: true }
  });
  
  const tamanoOptions = [
    { label: 'Entera', slug: 'entera' },
    { label: 'Media', slug: 'media' }
  ];

  const pizzaOptionsRecord: Record<string, string> = {};
  for (const opt of tamanoOptions) {
    const o = await prisma.productOption.upsert({
      where: { groupId_slug: { groupId: tamanoPizzaGroup.id, slug: opt.slug } },
      update: { label: opt.label },
      create: { groupId: tamanoPizzaGroup.id, slug: opt.slug, label: opt.label }
    });
    pizzaOptionsRecord[opt.slug] = o.id;
  }

  // 8. Productos
  console.log('--- 8. Productos Base ---');
  const baseProducts = [
    // PASTAS
    { nombre: 'Ñoquis', category: 'pastas', precio: 5000, configurable: true, group: salsaGroup.id },
    { nombre: 'Ravioles', category: 'pastas', precio: 6000, configurable: true, group: salsaGroup.id },
    { nombre: 'Canelones', category: 'pastas', precio: 6500, configurable: true, group: salsaGroup.id },
    { nombre: 'Tallarines', category: 'pastas', precio: 5000, configurable: true, group: salsaGroup.id },
    { nombre: 'Lasagna', category: 'pastas', precio: 7500, configurable: false },
    
    // TARTAS
    { nombre: 'Tarta de Pollo', category: 'tartas', precio: 4500 },
    { nombre: 'Tarta Jamón y Queso', category: 'tartas', precio: 4000 },
    { nombre: 'Tarta Choclo', category: 'tartas', precio: 4000 },
    
    // CALZONI
    { nombre: 'Calzone Sanvito', category: 'calzoni', precio: 8000 },
    { nombre: 'Calzone Ghiottone', category: 'calzoni', precio: 8500 },
    
    // EMPANADAS (Si no soporta grupo cantidad bien, creamos separados)
    { nombre: 'Empanada Árabe (Unidad)', category: 'empanadas', precio: 800 },
    { nombre: 'Empanadas Árabes (Media Docena)', category: 'empanadas', precio: 4500 },
    { nombre: 'Empanadas Árabes (Docena)', category: 'empanadas', precio: 8500 },
    
    // MILANESAS
    { nombre: 'Milanesa con Fritas', category: 'milanesas', precio: 7000 },
    { nombre: 'Milanesa Napolitana con Fritas', category: 'milanesas', precio: 8500 },
    
    // HAMBURGUESAS
    { nombre: 'Hamburguesa Simple', category: 'hamburguesas', precio: 5000 },
    { nombre: 'Hamburguesa Doble', category: 'hamburguesas', precio: 6500 },
    
    // POSTRES
    { nombre: 'Postre Oreo', category: 'postres', precio: 3000 },
    { nombre: 'Tiramisú', category: 'postres', precio: 3500 },
  ];

  for (const p of baseProducts) {
    const prod = await prisma.product.upsert({
      where: { nombre: p.nombre },
      update: { 
        precio: p.precio, 
        categoryId: categories[p.category],
        catalogRole: p.configurable ? ProductCatalogRole.CONFIGURABLE_BASE : ProductCatalogRole.STANDARD
      },
      create: {
        nombre: p.nombre,
        categoryId: categories[p.category],
        precio: p.precio,
        catalogRole: p.configurable ? ProductCatalogRole.CONFIGURABLE_BASE : ProductCatalogRole.STANDARD,
      }
    });

    if (p.configurable && p.group) {
      await prisma.productOptionGroupAssignment.upsert({
        where: { productId_groupId: { productId: prod.id, groupId: p.group } },
        update: {},
        create: { productId: prod.id, groupId: p.group }
      });
    }
  }

  // PIZZAS CON TAMAÑO (CONFIGURABLES)
  console.log('--- 8.1 Pizzas (Configurables por tamaño) ---');
  const pizzasData = [
    { nombre: 'Pizza Mozzarella', entera: 7000, media: 3800 },
    { nombre: 'Pizza Fugazzeta', entera: 8000, media: 4200 },
    { nombre: 'Pizza Especial', entera: 9000, media: 4800 },
    { nombre: 'Pizza Napolitana', entera: 8500, media: 4500 },
  ];

  for (const p of pizzasData) {
    const prod = await prisma.product.upsert({
      where: { nombre: p.nombre },
      update: { categoryId: categories['pizzas'], catalogRole: ProductCatalogRole.CONFIGURABLE_BASE, precio: p.entera },
      create: {
        nombre: p.nombre,
        categoryId: categories['pizzas'],
        precio: p.entera, // Precio base = entera
        catalogRole: ProductCatalogRole.CONFIGURABLE_BASE
      }
    });

    // Asignar el grupo de tamaño
    await prisma.productOptionGroupAssignment.upsert({
      where: { productId_groupId: { productId: prod.id, groupId: tamanoPizzaGroup.id } },
      update: {},
      create: { productId: prod.id, groupId: tamanoPizzaGroup.id }
    });

    // Option Links para definir los precios según tamaño
    // Precio Entera
    await prisma.productOptionLink.upsert({
      where: { baseProductId_optionId: { baseProductId: prod.id, optionId: pizzaOptionsRecord['entera'] } },
      update: { price: p.entera },
      create: { baseProductId: prod.id, optionId: pizzaOptionsRecord['entera'], price: p.entera }
    });

    // Precio Media
    await prisma.productOptionLink.upsert({
      where: { baseProductId_optionId: { baseProductId: prod.id, optionId: pizzaOptionsRecord['media'] } },
      update: { price: p.media },
      create: { baseProductId: prod.id, optionId: pizzaOptionsRecord['media'], price: p.media }
    });
  }

  // 9. Promociones (TODO)
  console.log('--- 9. Promociones ---');
  // TODO: Implementar lógica de creación de promociones cuando haya reglas claras
  console.log('NOTA: Promociones no insertadas, pendientes de definir estructura real de promociones en la carta.');

  console.log('======================================================');
  console.log('¡SEED FINALIZADO CON ÉXITO!');
  console.log('Las configuraciones, insumos y productos base fueron cargados.');
  console.log('======================================================');
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
