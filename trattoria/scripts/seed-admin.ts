import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const adminEmails = process.env.BOOTSTRAP_ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];

    if (adminEmails.length === 0) {
        console.error('❌ Error: BOOTSTRAP_ADMIN_EMAILS is not defined in .env');
        process.exit(1);
    }

    console.log(`🚀 Starting admin seeding for: ${adminEmails.join(', ')}`);

    for (const email of adminEmails) {
        try {
            const user = await prisma.user.upsert({
                where: { email },
                update: {
                    rol: 'ADMIN',
                    estado: 'ACTIVO'
                },
                create: {
                    email,
                    rol: 'ADMIN',
                    estado: 'ACTIVO',
                    firebaseUid: '', // Will be linked on first login
                }
            });
            console.log(`✅ Success: User ${email} is now ADMIN (ID: ${user.id})`);
        } catch (error) {
            console.error(`❌ Error seeding ${email}:`, error);
        }
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
