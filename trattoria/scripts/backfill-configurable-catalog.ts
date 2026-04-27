import { PrismaClient } from "@prisma/client";
import {
  CATEGORY_SEEDS,
  PRODUCT_OPTION_GROUP_SEEDS,
  PRODUCT_OPTION_LINK_SEEDS,
  PRODUCT_OPTION_SEEDS,
  PRODUCT_SEEDS,
  type CatalogProductSeed,
} from "../prisma/seed-data/masterData";

const prisma = new PrismaClient();

const LEGACY_PASTA_NAMES = new Set([
  "Ñoquis Bolognesa",
  "Ravioles Fileto",
  "Canelones Parisienne",
  "Tallarines Peceto",
]);

function isLegacyPizzaName(nombre: string) {
  return /^Pizza .+ - (Entera|Media)$/i.test(nombre);
}

function isLegacyEmpanadaName(nombre: string) {
  return /\sx(1|6|12)$/i.test(nombre);
}

async function loadCategoryIds() {
  const categories = await prisma.category.findMany({
    where: {
      deletedAt: null,
      slug: { in: CATEGORY_SEEDS.map((category) => category.slug) },
    },
    select: { id: true, slug: true },
  });

  return new Map(categories.map((category) => [category.slug, category.id]));
}

async function loadSupplyIds() {
  const supplies = await prisma.supply.findMany({
    where: { deletedAt: null },
    select: { id: true, nombre: true },
  });

  return new Map(supplies.map((supply) => [supply.nombre, supply.id]));
}

async function upsertProduct(seed: CatalogProductSeed, categoryId: string, supplyIds: Map<string, string>) {
  const product = await prisma.product.upsert({
    where: { nombre: seed.nombre },
    update: {
      descripcion: seed.descripcion,
      precio: seed.precio,
      costoUnitario: seed.costoUnitario,
      categoryId,
      unidad: "UNIDAD",
      orden: seed.orden,
      catalogRole: seed.catalogRole,
      activo: true,
      disponible: true,
      deletedAt: null,
    },
    create: {
      nombre: seed.nombre,
      descripcion: seed.descripcion,
      precio: seed.precio,
      costoUnitario: seed.costoUnitario,
      categoryId,
      unidad: "UNIDAD",
      orden: seed.orden,
      catalogRole: seed.catalogRole,
      activo: true,
      disponible: true,
      stockActual: 0,
      stockMinimo: 0,
      stockMaximo: 0,
    },
    select: { id: true, nombre: true },
  });

  await prisma.productRecipeItem.deleteMany({
    where: { productId: product.id },
  });

  if (seed.recipe.length > 0) {
    const validRecipeItems = seed.recipe
      .map((item) => {
        const supplyId = supplyIds.get(item.supplyName);
        if (!supplyId) {
          console.warn(`Warning: Missing supply "${item.supplyName}" for product "${seed.nombre}". Skipping recipe item.`);
          return null;
        }

        return {
          productId: product.id,
          supplyId,
          qtyPerUnit: item.qtyPerUnit,
          unidad: item.unidad,
        };
      })
      .filter((item) => item !== null);

    if (validRecipeItems.length > 0) {
      await prisma.productRecipeItem.createMany({
        data: validRecipeItems as any,
      });
    }
  }

  return product;
}

async function upsertConfigurableOptions(productIdsByName: Map<string, string>) {
  const groupIdsByKey = new Map<string, string>();
  const optionIdsByKey = new Map<string, string>();

  for (const groupSeed of PRODUCT_OPTION_GROUP_SEEDS) {
    const group = await prisma.productOptionGroup.upsert({
      where: { key: groupSeed.key },
      update: {
        nombre: groupSeed.nombre,
        priceMode: groupSeed.priceMode,
        required: groupSeed.required,
        orden: groupSeed.orden,
      },
      create: {
        key: groupSeed.key,
        nombre: groupSeed.nombre,
        priceMode: groupSeed.priceMode,
        required: groupSeed.required,
        orden: groupSeed.orden,
      },
      select: { id: true, key: true },
    });

    groupIdsByKey.set(group.key, group.id);
  }

  for (const optionSeed of PRODUCT_OPTION_SEEDS) {
    const groupId = groupIdsByKey.get(optionSeed.groupKey);
    if (!groupId) {
      throw new Error(`Missing option group "${optionSeed.groupKey}".`);
    }

    const optionProductId = optionSeed.optionProductName
      ? productIdsByName.get(optionSeed.optionProductName) ?? null
      : null;

    const option = await prisma.productOption.upsert({
      where: {
        groupId_slug: {
          groupId,
          slug: optionSeed.slug,
        },
      },
      update: {
        label: optionSeed.label,
        optionProductId,
        orden: optionSeed.orden,
        recipeMultiplier: optionSeed.recipeMultiplier,
        metadata: optionSeed.metadata as object | undefined,
        activo: true,
        deletedAt: null,
      },
      create: {
        groupId,
        label: optionSeed.label,
        slug: optionSeed.slug,
        optionProductId,
        orden: optionSeed.orden,
        recipeMultiplier: optionSeed.recipeMultiplier,
        metadata: optionSeed.metadata as object | undefined,
      },
      select: { id: true },
    });

    optionIdsByKey.set(`${optionSeed.groupKey}:${optionSeed.slug}`, option.id);
  }

  for (const groupSeed of PRODUCT_OPTION_GROUP_SEEDS) {
    const groupId = groupIdsByKey.get(groupSeed.key);
    if (!groupId) continue;

    const baseProductNames = [
      ...new Set(
        PRODUCT_OPTION_LINK_SEEDS.filter((link) => link.groupKey === groupSeed.key).map(
          (link) => link.baseProductName
        )
      ),
    ];

    for (const [index, baseProductName] of baseProductNames.entries()) {
      const productId = productIdsByName.get(baseProductName);
      if (!productId) {
        throw new Error(`Missing base product "${baseProductName}" for option group "${groupSeed.key}".`);
      }

      await prisma.productOptionGroupAssignment.upsert({
        where: {
          productId_groupId: {
            productId,
            groupId,
          },
        },
        update: { orden: index },
        create: {
          productId,
          groupId,
          orden: index,
        },
      });
    }
  }

  for (const linkSeed of PRODUCT_OPTION_LINK_SEEDS) {
    const baseProductId = productIdsByName.get(linkSeed.baseProductName);
    const optionId = optionIdsByKey.get(`${linkSeed.groupKey}:${linkSeed.optionSlug}`);
    if (!baseProductId || !optionId) {
      throw new Error(`Missing option link refs for "${linkSeed.baseProductName}" -> "${linkSeed.optionSlug}".`);
    }

    await prisma.productOptionLink.upsert({
      where: {
        baseProductId_optionId: {
          baseProductId,
          optionId,
        },
      },
      update: {
        price: linkSeed.price,
        orden: linkSeed.orden,
        activo: true,
      },
      create: {
        baseProductId,
        optionId,
        price: linkSeed.price,
        orden: linkSeed.orden,
      },
    });
  }
}

async function archiveLegacyProducts() {
  const legacyProducts = await prisma.product.findMany({
    where: {
      deletedAt: null,
      OR: [
        { nombre: { in: Array.from(LEGACY_PASTA_NAMES) } },
        { category: { slug: "pizzas" } },
        { category: { slug: "empanadas" } },
      ],
    },
    include: {
      category: {
        select: { slug: true },
      },
    },
  });

  const legacyIds = legacyProducts
    .filter((product) => {
      if (LEGACY_PASTA_NAMES.has(product.nombre)) return true;
      if (product.category.slug === "pizzas") return isLegacyPizzaName(product.nombre);
      if (product.category.slug === "empanadas") return isLegacyEmpanadaName(product.nombre);
      return false;
    })
    .map((product) => product.id);

  if (!legacyIds.length) {
    return 0;
  }

  const result = await prisma.product.updateMany({
    where: { id: { in: legacyIds } },
    data: {
      activo: false,
      disponible: false,
    },
  });

  return result.count;
}

async function main() {
  const categoryIds = await loadCategoryIds();
  const supplyIds = await loadSupplyIds();
  const productIdsByName = new Map<string, string>();

  for (const productSeed of PRODUCT_SEEDS) {
    const categoryId = categoryIds.get(productSeed.categorySlug);
    if (!categoryId) {
      throw new Error(`Missing category "${productSeed.categorySlug}" for product "${productSeed.nombre}".`);
    }

    const product = await upsertProduct(productSeed, categoryId, supplyIds);
    productIdsByName.set(product.nombre, product.id);
  }

  await upsertConfigurableOptions(productIdsByName);
  const archivedCount = await archiveLegacyProducts();

  console.log(`Configurable catalog upserted: ${PRODUCT_SEEDS.length} products synced.`);
  console.log(`Option groups synced: ${PRODUCT_OPTION_GROUP_SEEDS.length}.`);
  console.log(`Legacy products archived: ${archivedCount}.`);
}

main()
  .catch((error) => {
    console.error("Configurable catalog backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
