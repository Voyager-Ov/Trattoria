import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { adminAuth } from '../src/lib/firebase-admin';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
    const email = 'koch.carlos@hotmail.com';
    const password = '123456789';

    console.log(`🚀 Recreating admin user: ${email}`);

    // 1. Delete from Firebase if it exists
    try {
        const userRecord = await adminAuth.getUserByEmail(email);
        if (userRecord) {
            console.log(`Found user in Firebase Auth with UID: ${userRecord.uid}. Deleting...`);
            await adminAuth.deleteUser(userRecord.uid);
            console.log(`✅ Deleted user from Firebase Auth`);
        }
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            console.log(`User not found in Firebase Auth, proceeding...`);
        } else {
            console.error(`❌ Error fetching/deleting Firebase user:`, error);
            throw error;
        }
    }

    // 2. Create in Firebase Auth
    let newUserRecord;
    try {
        newUserRecord = await adminAuth.createUser({
            email,
            password,
            emailVerified: true,
        });
        console.log(`✅ Created user in Firebase Auth with UID: ${newUserRecord.uid}`);
    } catch (error) {
        console.error(`❌ Error creating user in Firebase Auth:`, error);
        throw error;
    }

    // 3. Upsert in Prisma
    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                firebaseUid: newUserRecord.uid,
                rol: 'ADMIN',
                estado: 'ACTIVO',
                deletedAt: null // Restore if soft-deleted
            },
            create: {
                email,
                firebaseUid: newUserRecord.uid,
                rol: 'ADMIN',
                estado: 'ACTIVO',
            }
        });
        console.log(`✅ Success: User ${email} is now ADMIN in DB (ID: ${user.id}, UID: ${user.firebaseUid})`);
    } catch (error) {
        console.error(`❌ Error upserting user in DB:`, error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
