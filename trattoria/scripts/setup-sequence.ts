import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Creando secuencia nativa en PostgreSQL...");
  await prisma.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS order_numero_seq START 1000;`);
  
  // Opcional: Alinear la secuencia con el último número usado en AppSequence
  const lastSeq = await prisma.appSequence.findUnique({ where: { tipo: 'order' } });
  if (lastSeq && lastSeq.ultimo) {
      const nextValue = lastSeq.ultimo + 1;
      console.log(`Alineando secuencia a partir de ${nextValue}`);
      await prisma.$executeRawUnsafe(`SELECT setval('order_numero_seq', ${nextValue}, false);`);
  }
  
  console.log("Secuencia creada/alineada exitosamente.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
