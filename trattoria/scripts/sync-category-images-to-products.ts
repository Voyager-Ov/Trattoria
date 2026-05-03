import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando sincronización de imágenes de categorías a productos...");
  
  // 1. Obtener todas las categorías que tengan una imagen
  const categories = await prisma.category.findMany({
    where: { 
      imagen: { not: null },
      deletedAt: null
    },
    select: { id: true, imagen: true, nombre: true }
  });

  console.log(`📂 Se encontraron ${categories.length} categorías con imágenes.`);

  if (categories.length === 0) {
    console.log("⚠️ No hay categorías con imágenes para sincronizar.");
    return;
  }

  for (const category of categories) {
    if (!category.imagen) continue;
    
    console.log(`\n🔄 Sincronizando productos de la categoría: ${category.nombre}...`);
    
    // 2. Actualizar todos los productos de esa categoría
    // Nota: Sobrescribimos la imagen del producto con la de la categoría como solicitó el usuario
    const result = await prisma.product.updateMany({
      where: {
        categoryId: category.id,
        deletedAt: null
      },
      data: {
        imagen: category.imagen
      }
    });
    
    console.log(`✅ Se actualizaron ${result.count} productos con la imagen: ${category.imagen}`);
  }
  
  console.log("\n✨ ¡Sincronización de imágenes completada con éxito!");
}

main()
  .catch((e) => {
    console.error("\n❌ Error durante la sincronización:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
