
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking User Roles ---');
    // Adjust the search term if 'pipo' is not the exact name or email
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { displayName: { contains: 'pipo' } },
                { email: { contains: 'pipo' } }
            ]
        },
        select: {
            id: true,
            email: true,
            displayName: true,
            rol: true,
            estado: true
        }
    });

    console.log(`Found ${users.length} users matching 'pipo':`);
    users.forEach(u => {
        console.log(`- ID: ${u.id}`);
        console.log(`  Name: ${u.displayName}`);
        console.log(`  Email: ${u.email}`);
        console.log(`  Role: ${u.rol}`);
        console.log(`  Status: ${u.estado}`);
    });
    console.log('--- End Check ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
