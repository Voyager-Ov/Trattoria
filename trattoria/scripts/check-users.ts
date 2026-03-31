/**
 * Verifica el estado actual de los usuarios en la DB
 * Uso: npx tsx --env-file=.env scripts/check-users.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      email: { in: ['octavio.velo2022@gmail.com', 'koch.carlos@hotmail.com'] }
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, firebaseUid: true, rol: true, estado: true, createdAt: true }
  });

  console.log(`\nUsuarios encontrados: ${users.length}\n`);
  users.forEach(u => {
    console.log(`📧 ${u.email}`);
    console.log(`   ID:          ${u.id}`);
    console.log(`   Firebase UID: ${u.firebaseUid}`);
    console.log(`   Rol:          ${u.rol}`);
    console.log(`   Estado:       ${u.estado}`);
    console.log(`   Creado:       ${u.createdAt.toISOString()}`);
    console.log('');
  });
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
