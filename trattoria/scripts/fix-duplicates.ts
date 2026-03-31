/**
 * Script de reparación: elimina duplicados de usuario y deja solo el correcto
 * (con el firebaseUid real de Firebase Auth).
 *
 * Uso: npx tsx --env-file=.env scripts/fix-duplicates.ts
 */

import 'dotenv/config';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}
const auth = getAuth();

const EMAILS_TO_FIX = [
  'octavio.velo2022@gmail.com',
  'koch.carlos@hotmail.com',
];

async function main() {
  for (const email of EMAILS_TO_FIX) {
    console.log(`\n👤 Revisando: ${email}`);

    // 1. Obtener el UID real de Firebase
    let realUid: string;
    try {
      const fbUser = await auth.getUserByEmail(email);
      realUid = fbUser.uid;
      console.log(`  🔥 Firebase UID real: ${realUid}`);
    } catch {
      console.log(`  ⚠️  No encontrado en Firebase, saltando...`);
      continue;
    }

    // 2. Buscar todos los registros en DB para este email
    const allRecords = await prisma.user.findMany({
      where: { email },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`  🗄️  Registros en DB: ${allRecords.length}`);
    allRecords.forEach(r => console.log(`       id=${r.id}  uid=${r.firebaseUid}  rol=${r.rol}`));

    if (allRecords.length === 0) {
      // Crear desde cero
      const created = await prisma.user.create({
        data: { firebaseUid: realUid, email, rol: 'ADMIN', estado: 'ACTIVO' },
      });
      console.log(`  ✅ Creado: ${created.id}`);
      continue;
    }

    // 3. Elegir el "correcto": preferir el que ya tiene el UID real, sino el primero
    const correct = allRecords.find(r => r.firebaseUid === realUid) ?? allRecords[0];

    // 4. Actualizar el correcto con el UID real y asegurarse que sea ADMIN
    await prisma.user.update({
      where: { id: correct.id },
      data: { firebaseUid: realUid, rol: 'ADMIN', estado: 'ACTIVO' },
    });
    console.log(`  ✅ Registro correcto actualizado: ${correct.id}`);

    // 5. Eliminar los duplicados sobrantes
    const duplicates = allRecords.filter(r => r.id !== correct.id);
    if (duplicates.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: duplicates.map(d => d.id) } },
      });
      console.log(`  🗑️  Duplicados eliminados: ${duplicates.map(d => d.id).join(', ')}`);
    }
  }

  console.log('\n🎉 Reparación finalizada. Ambos usuarios están listos.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
