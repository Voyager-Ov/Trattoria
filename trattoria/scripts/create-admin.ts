/**
 * Script para crear un usuario ADMIN en la base de datos.
 * Uso: npx tsx scripts/create-admin.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'octavio.velo2022@gmail.com';

async function main() {
  console.log(`🔍 Verificando si existe el usuario: ${ADMIN_EMAIL}`);

  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existing) {
    console.log(`⚠️  El usuario ya existe en la base de datos:`);
    console.log(`   ID: ${existing.id}`);
    console.log(`   Email: ${existing.email}`);
    console.log(`   Rol: ${existing.rol}`);
    console.log(`   Estado: ${existing.estado}`);

    if (existing.rol !== 'ADMIN') {
      const updated = await prisma.user.update({
        where: { email: ADMIN_EMAIL },
        data: { rol: 'ADMIN', estado: 'ACTIVO' },
      });
      console.log(`✅ Rol actualizado a ADMIN.`);
      console.log(updated);
    } else {
      console.log(`✅ El usuario ya tiene rol ADMIN. No se requieren cambios.`);
    }
    return;
  }

  console.log(`➕ Creando nuevo usuario ADMIN...`);
  // firebaseUid es requerido en el schema pero se llenará automáticamente
  // al primer login con Google (el route.ts lo actualiza via upsert).
  // Usamos un placeholder temporal único para satisfacer la constraint.
  const tempUid = `pending-google-${Date.now()}`;
  const user = await prisma.user.create({
    data: {
      firebaseUid: tempUid,
      email: ADMIN_EMAIL,
      rol: 'ADMIN',
      estado: 'ACTIVO',
    },
  });

  console.log(`✅ Usuario ADMIN creado exitosamente:`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Rol: ${user.rol}`);
  console.log(`   Estado: ${user.estado}`);
  console.log('');
  console.log('🎉 El usuario puede iniciar sesión con Google ahora.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
