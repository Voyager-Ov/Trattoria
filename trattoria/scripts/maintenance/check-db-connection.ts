import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Checking database connection...')
    try {
        // Attempt to raw query table names
        const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
        console.log('✅ Connected successfully.')
        console.log('Tables found:', result)

        // Try to count users
        try {
            const userCount = await prisma.user.count();
            console.log(`✅ User table accessible. Count: ${userCount}`);
        } catch (e: any) {
            console.error('❌ Failed to query User table:', e.message);
        }

    } catch (e) {
        console.error('❌ Database connection failed:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
