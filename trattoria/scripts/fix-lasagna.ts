import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find Lasagna product
  const lasagna = await prisma.product.findFirst({
    where: { nombre: { contains: "Lasagna", mode: "insensitive" } }
  });

  if (!lasagna) {
    console.log("Lasagna not found");
    return;
  }

  // Set Lasagna as CONFIGURABLE_BASE
  await prisma.product.update({
    where: { id: lasagna.id },
    data: { catalogRole: "CONFIGURABLE_BASE" }
  });

  console.log("Updated Lasagna role to CONFIGURABLE_BASE");

  // Find salsas-pasta group
  const salsaGroup = await prisma.productOptionGroup.findUnique({
    where: { key: "pasta-salsa" }
  });

  if (!salsaGroup) {
    console.log("pasta-salsa group not found");
    return;
  }

  // Link Lasagna to salsas-pasta
  await prisma.productOptionGroupAssignment.upsert({
    where: {
      productId_groupId: {
        productId: lasagna.id,
        groupId: salsaGroup.id
      }
    },
    update: {},
    create: {
      productId: lasagna.id,
      groupId: salsaGroup.id,
      orden: 0
    }
  });

  console.log("Linked Lasagna to Salsas");

  // Now, link the base product to all options in the group (with price 0 or whatever is default)
  // Let's check what options are in the group
  const options = await prisma.productOption.findMany({
    where: { groupId: salsaGroup.id }
  });

  for (const option of options) {
    await prisma.productOptionLink.upsert({
      where: {
        baseProductId_optionId: {
          baseProductId: lasagna.id,
          optionId: option.id
        }
      },
      update: {},
      create: {
        baseProductId: lasagna.id,
        optionId: option.id,
        price: 0,
        orden: option.orden
      }
    });
  }

  console.log("Linked Lasagna to all Salsa options");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
