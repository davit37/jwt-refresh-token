import { RefreshTokenRepository } from '../../../infrastructure/database/prisma/repositories/refresh-token.repository';
import { UserRepository } from '../../../infrastructure/database/prisma/repositories/user.repository';
import { JwtService } from '../../../infrastructure/security/jwt.service';
import { v4 as uuidv4 } from 'uuid';

export class RefreshTokenUseCase {
    constructor(
        private refreshTokenRepository: RefreshTokenRepository,
        private userRepository: UserRepository
    ) { }

    async execute(incomingRefreshToken: string) {
        // 1. Verify JWT signature (stateless check)
        let payload;
        try {
            payload = JwtService.verifyRefreshToken(incomingRefreshToken);
        } catch (e) {
            throw new Error('Invalid refresh token');
        }

        const hashedToken = JwtService.hashToken(incomingRefreshToken);

        // 2. Find token in DB
        const tokenRecord = await this.refreshTokenRepository.findByTokenHash(hashedToken);

        if (!tokenRecord) {
            // Token not found (maybe expired and deleted, or fake).
            // However, if we verified signature, it means it was issued by us.
            // If it's not in DB, it might be a malicious reuse attempt where the record was already rotated (and thus might be under a new hash or deleted if cleanup ran).
            // But typically we keep rotated tokens marked as revoked.
            // If we can't find it, we can't trace family. We fail securely.
            throw new Error('Invalid refresh token');
        }

        // 3. Reuse Detection (CRITICAL)
        if (tokenRecord.revoked) {
            // REVOKED TOKEN USED!
            // This means someone is trying to use an old token. 
            // It could be the legitimate user (race condition) or a thief.
            // Security Policy: Revoke the entire family AND increment tokenVersion.
            await this.refreshTokenRepository.revokeFamily(tokenRecord.familyId);
            await this.userRepository.incrementTokenVersion(tokenRecord.userId);
            throw new Error('Refresh token reuse detected. Access denied.');
        }

        // 4. Expiry Check (DB level check, optimizing for revocation status first)
        if (new Date() > tokenRecord.expiresAt) {
            throw new Error('Refresh token expired');
        }

        // 5. Token Rotation (Normal Scenario)
        // a. Revoke current token
        await this.refreshTokenRepository.revoke(tokenRecord.id);

        // b. Fetch user to get current role and tokenVersion
        const user = await this.userRepository.findById(tokenRecord.userId);
        if (!user) {
            throw new Error('User not found');
        }

        // c. Generate NEW tokens
        // Important: Keep SAME familyId
        const newAccessToken = JwtService.signAccessToken({
            userId: user.id,
            role: user.role,
            tokenVersion: user.tokenVersion
        });

        const newRefreshToken = JwtService.signRefreshToken({ userId: tokenRecord.userId, familyId: tokenRecord.familyId });
        const newHashedToken = JwtService.hashToken(newRefreshToken);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // d. Store NEW refresh token
        await this.refreshTokenRepository.create({
            hashedToken: newHashedToken,
            userId: tokenRecord.userId,
            familyId: tokenRecord.familyId,
            expiresAt,
            revoked: false,
        });

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        };
    }
}

