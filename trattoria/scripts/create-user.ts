/**
 * Script para crear o reparar usuarios en Firebase Auth + DB.
 *
 * Uso:
 *   npx tsx scripts/create-user.ts
 *
 * Qué hace:
 *   1. Crea (o busca) el usuario en Firebase Auth con email + password
 *   2. Crea (o actualiza) el registro en la DB con el UID real de Firebase
 */

import 'dotenv/config';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { PrismaClient } from '@prisma/client';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const USERS_TO_CREATE = [
  {
    email: 'octavio.velo2022@gmail.com',
    password: null,          // null = solo Google OAuth, no password
    rol: 'ADMIN' as const,
  },
  {
    email: 'koch.carlos@hotmail.com',
    password: '123456789',
    rol: 'ADMIN' as const,
  },
];
// ─────────────────────────────────────────────────────────────────────────────

const prisma = new PrismaClient();

// Init Firebase Admin con las env vars
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

async function ensureFirebaseUser(email: string, password: string | null) {
  // Intentar buscar usuario existente en Firebase
  try {
    const existing = await auth.getUserByEmail(email);
    console.log(`  🔥 Firebase: usuario ya existe (uid: ${existing.uid})`);

    // Si se pasó contraseña, actualizarla
    if (password) {
      await auth.updateUser(existing.uid, { password });
      console.log(`  🔑 Firebase: contraseña actualizada`);
    }
    return existing.uid;
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      // Crear nuevo usuario en Firebase
      const created = await auth.createUser({
        email,
        password: password ?? undefined,
        emailVerified: false,
      });
      console.log(`  🔥 Firebase: usuario creado (uid: ${created.uid})`);
      return created.uid;
    }
    throw err;
  }
}

async function ensureDbUser(email: string, firebaseUid: string, rol: 'ADMIN' | 'EMPLEADO') {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ firebaseUid }, { email }] },
  });

  if (existing) {
    // Actualizar con UID real si estaba con placeholder
    const needsUpdate = existing.firebaseUid !== firebaseUid || existing.rol !== rol;
    if (needsUpdate) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: { firebaseUid, rol, estado: 'ACTIVO' },
      });
      console.log(`  🗄️  DB: usuario actualizado (id: ${updated.id}, rol: ${updated.rol})`);
      return updated;
    } else {
      console.log(`  🗄️  DB: usuario ya está correcto (id: ${existing.id})`);
      return existing;
    }
  } else {
    const created = await prisma.user.create({
      data: { firebaseUid, email, rol, estado: 'ACTIVO' },
    });
    console.log(`  🗄️  DB: usuario creado (id: ${created.id})`);
    return created;
  }
}

async function main() {
  for (const userConfig of USERS_TO_CREATE) {
    console.log(`\n👤 Procesando: ${userConfig.email}`);
    try {
      const firebaseUid = await ensureFirebaseUser(userConfig.email, userConfig.password);
      await ensureDbUser(userConfig.email, firebaseUid, userConfig.rol);
      console.log(`  ✅ Listo`);
    } catch (err) {
      console.error(`  ❌ Error:`, err);
    }
  }

  console.log('\n🎉 Proceso finalizado.');
}

main()
  .catch((e) => {
    console.error('Error fatal:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
