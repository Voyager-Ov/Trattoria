import { PrismaClient, Rol, EstadoUsuario } from "@prisma/client";
import {
  APP_CONFIGS,
  APP_SEQUENCES,
  CATEGORY_SEEDS,
  PRODUCT_SEEDS,
  PROMOTION_SEEDS,
  PROVIDER_SEEDS,
  SUPPLY_SEEDS,
} from "./seed-data/masterData";

const prisma = new PrismaClient();

function toBootstrapEmails() {
  const raw = process.env.BOOTSTRAP_ADMIN_EMAILS ?? "admin@trattoria.local";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function placeholderFirebaseUid(email: string, index: number) {
  const safeEmail = email.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
  return `bootstrap-${index + 1}-${safeEmail || "admin"}`;
}

async function cleanDatabase() {
  console.log("Cleaning existing data...");

  await prisma.auditLog.deleteMany();
  await prisma.orderEvent.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.egreso.deleteMany();
  await prisma.promotionProduct.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.productRecipeItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.supplyCategory.deleteMany();
  await prisma.supply.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.appConfig.deleteMany();
  await prisma.appSequence.deleteMany();
  await prisma.user.deleteMany();
}

async function seedUsers() {
  const bootstrapEmails = toBootstrapEmails();

  for (const [index, email] of bootstrapEmails.entries()) {
    await prisma.user.create({
      data: {
        firebaseUid: placeholderFirebaseUid(email, index),
        email,
        displayName: email.split("@")[0],
        rol: Rol.ADMIN,
        estado: EstadoUsuario.ACTIVO,
      },
    });
  }

  console.log(`Created ${bootstrapEmails.length} bootstrap admin user(s).`);
}

async function seedSequences() {
  for (const sequence of APP_SEQUENCES) {
    await prisma.appSequence.create({ data: sequence });
  }

  console.log(`Created ${APP_SEQUENCES.length} sequence(s).`);
}

async function seedConfigs() {
  for (const [key, value] of Object.entries(APP_CONFIGS)) {
    await prisma.appConfig.create({
      data: {
        key,
        value: value as unknown as object,
      },
    });
  }

  console.log(`Created ${Object.keys(APP_CONFIGS).length} app config record(s).`);
}

async function seedCategories() {
  const categoryBySlug = new Map<string, string>();

  for (const category of CATEGORY_SEEDS) {
    const created = await prisma.category.create({
      data: {
        slug: category.slug,
        nombre: category.nombre,
        descripcion: category.descripcion,
        orden: category.orden,
        esPromocion: category.esPromocion,
        activo: true,
      },
    });

    categoryBySlug.set(category.slug, created.id);
  }

  console.log(`Created ${CATEGORY_SEEDS.length} category(ies).`);
  return categoryBySlug;
}

async function seedSupplies() {
  const supplyByName = new Map<string, string>();

  for (const supply of SUPPLY_SEEDS) {
    const created = await prisma.supply.create({
      data: {
        nombre: supply.nombre,
        categoria: supply.categoria,
        unidad: supply.unidad,
        stockActual: 0,
        stockMinimo: supply.stockMinimo,
        costoUnitario: supply.costoUnitario,
        activo: true,
      },
    });

    supplyByName.set(supply.nombre, created.id);
  }

  console.log(`Created ${SUPPLY_SEEDS.length} supply(ies).`);
  return supplyByName;
}

async function seedProviders() {
  for (const provider of PROVIDER_SEEDS) {
    await prisma.provider.create({ data: provider });
  }

  console.log(`Created ${PROVIDER_SEEDS.length} provider(s).`);
}

async function seedProducts(categoryBySlug: Map<string, string>) {
  const productByName = new Map<string, string>();

  for (const product of PRODUCT_SEEDS) {
    const categoryId = categoryBySlug.get(product.categorySlug);

    if (!categoryId) {
      throw new Error(`Missing category "${product.categorySlug}" for product "${product.nombre}".`);
    }

    const created = await prisma.product.create({
      data: {
        nombre: product.nombre,
        descripcion: product.descripcion,
        precio: product.precio,
        costoUnitario: product.costoUnitario,
        categoryId,
        unidad: "UNIDAD",
        activo: true,
        disponible: true,
        stockActual: 0,
        stockMinimo: 0,
        stockMaximo: 0,
        orden: product.orden,
      },
    });

    productByName.set(product.nombre, created.id);
  }

  console.log(`Created ${PRODUCT_SEEDS.length} product(s).`);
  return productByName;
}

async function seedRecipes(productByName: Map<string, string>, supplyByName: Map<string, string>) {
  let recipeCount = 0;

  for (const product of PRODUCT_SEEDS) {
    const productId = productByName.get(product.nombre);
    if (!productId) {
      throw new Error(`Missing product "${product.nombre}" while creating recipes.`);
    }

    for (const recipeItem of product.recipe) {
      const supplyId = supplyByName.get(recipeItem.supplyName);
      if (!supplyId) {
        throw new Error(`Missing supply "${recipeItem.supplyName}" for product "${product.nombre}".`);
      }

      await prisma.productRecipeItem.create({
        data: {
          productId,
          supplyId,
          qtyPerUnit: recipeItem.qtyPerUnit,
          unidad: recipeItem.unidad,
        },
      });

      recipeCount += 1;
    }
  }

  console.log(`Created ${recipeCount} recipe item(s).`);
}

async function seedPromotions(categoryBySlug: Map<string, string>, productByName: Map<string, string>) {
  for (const promotion of PROMOTION_SEEDS) {
    const categoryId = categoryBySlug.get(promotion.categorySlug);

    if (!categoryId) {
      throw new Error(`Missing promotion category "${promotion.categorySlug}" for promotion "${promotion.name}".`);
    }

    await prisma.promotion.create({
      data: {
        name: promotion.name,
        description: promotion.description,
        code: promotion.code,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        isActive: true,
        items: {
          create: promotion.items.map((item) => {
            const productId = productByName.get(item.productName);

            if (!productId) {
              throw new Error(`Missing product "${item.productName}" for promotion "${promotion.name}".`);
            }

            return {
              productId,
              quantity: item.quantity,
            };
          }),
        },
        categories: {
          connect: [{ id: categoryId }],
        },
      },
    });
  }

  console.log(`Created ${PROMOTION_SEEDS.length} promotion(s).`);
}

async function main() {
  console.log("Starting master seed...");

  await cleanDatabase();
  await seedUsers();
  await seedSequences();
  await seedConfigs();

  const categoryBySlug = await seedCategories();
  const supplyByName = await seedSupplies();
  await seedProviders();
  const productByName = await seedProducts(categoryBySlug);
  await seedRecipes(productByName, supplyByName);
  await seedPromotions(categoryBySlug, productByName);

  console.log("Master seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Master seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
