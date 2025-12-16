import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('password123', 10);

    // Admin
    await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            password: passwordHash,
            role: 'ADMIN',
        },
    });

    // User 1
    await prisma.user.upsert({
        where: { email: 'user1@example.com' },
        update: {},
        create: {
            email: 'user1@example.com',
            password: passwordHash,
            role: 'USER',
        },
    });

    // User 2
    await prisma.user.upsert({
        where: { email: 'user2@example.com' },
        update: {},
        create: {
            email: 'user2@example.com',
            password: passwordHash,
            role: 'USER',
        },
    });

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
