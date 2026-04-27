
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const slug = 'pastas';
  try {
    console.log(`Checking category with slug: ${slug}`);
    const category = await prisma.category.findUnique({
      where: {
        slug,
        deletedAt: null,
      },
    });

    if (!category) {
      console.log('Category not found');
      return;
    }

    console.log('Category found:', category.nombre);

    const products = await prisma.product.findMany({
      where: {
        categoryId: category.id,
        activo: true,
        disponible: true,
        deletedAt: null,
        catalogRole: {
          not: 'OPTION_PRODUCT',
        },
      },
      include: {
        optionGroupAssignments: {
          include: {
            group: true,
          },
        },
        optionLinksAsBase: {
          include: {
            option: {
              include: {
                group: true,
                optionProduct: true,
              },
            },
          },
        },
      },
    });

    console.log(`Found ${products.length} products`);
    products.forEach(p => console.log(`- ${p.nombre}`));

  } catch (error) {
    console.error('Error in script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
