import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../../config/env.config';

export interface AccessTokenPayload {
    userId: string;
    role: string;
    tokenVersion: number;
}

export interface RefreshTokenPayload {
    userId: string;
    familyId: string;
    jti?: string; // Optional JWT ID
}

export class JwtService {
    static signAccessToken(payload: AccessTokenPayload): string {
        return jwt.sign(payload, config.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    }

    static signRefreshToken(payload: RefreshTokenPayload): string {
        return jwt.sign(payload, config.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    }

    static verifyAccessToken(token: string): AccessTokenPayload {
        return jwt.verify(token, config.JWT_ACCESS_SECRET) as AccessTokenPayload;
    }

    static verifyRefreshToken(token: string): RefreshTokenPayload {
        return jwt.verify(token, config.JWT_REFRESH_SECRET) as RefreshTokenPayload;
    }

    // Hash the token for storage using SHA256 (fast & secure)
    static hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    // Verify if a token matches the hash
    static verifyTokenHash(token: string, hash: string): boolean {
        return this.hashToken(token) === hash;
    }
}
