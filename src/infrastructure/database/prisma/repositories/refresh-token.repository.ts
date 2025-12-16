import { prisma } from '../client';
import { RefreshToken } from '../../../../../domain/entities/refresh-token.entity';

export class RefreshTokenRepository {
    async create(token: Omit<RefreshToken, 'id' | 'createdAt'>): Promise<RefreshToken> {
        return prisma.refreshToken.create({
            data: token,
        });
    }

    async findByTokenHash(hashedToken: string): Promise<RefreshToken | null> {
        return prisma.refreshToken.findFirst({
            where: { hashedToken },
        });
    }

    // Revoke a specific token (Rotation)
    async revoke(id: string): Promise<void> {
        await prisma.refreshToken.update({
            where: { id },
            data: { revoked: true },
        });
    }

    // Revoke all tokens in a family (Reuse Detection / Security Breach)
    async revokeFamily(familyId: string): Promise<void> {
        await prisma.refreshToken.updateMany({
            where: { familyId },
            data: { revoked: true },
        });
    }

    // Clean up expired tokens (Maintenance)
    async deleteExpired(): Promise<void> {
        await prisma.refreshToken.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        });
    }
}
