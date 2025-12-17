import { prisma } from '../client';
import { User } from '../../../../../domain/entities/user.entity';
import { Role } from '../../../../../domain/enums/role.enum';

export class UserRepository {
    async runTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
        return prisma.$transaction(fn);
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        return {
            ...user,
            role: user.role as Role,
            tokenVersion: user.tokenVersion
        };
    }

    async create(user: Omit<User, 'id' | 'createdAt' | 'tokenVersion'>): Promise<User> {
        const created = await prisma.user.create({
            data: {
                email: user.email,
                password: user.password!,
                role: user.role,
            },
        });
        return {
            ...created,
            role: created.role as Role,
            tokenVersion: created.tokenVersion
        };
    }

    async findById(id: string): Promise<User | null> {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return null;
        return {
            ...user,
            role: user.role as Role,
            tokenVersion: user.tokenVersion
        };
    }

    async incrementTokenVersion(userId: string): Promise<number> {
        const updated = await prisma.user.update({
            where: { id: userId },
            data: { tokenVersion: { increment: 1 } },
        });
        return updated.tokenVersion;
    }
}

