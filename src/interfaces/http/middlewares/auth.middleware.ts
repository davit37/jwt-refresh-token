import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../../../infrastructure/security/jwt.service';
import { UserRepository } from '../../../infrastructure/database/prisma/repositories/user.repository';

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                role: string;
            };
        }
    }
}

const userRepository = new UserRepository();

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>
    try {
        const payload = JwtService.verifyAccessToken(token);

        // Verify tokenVersion against database
        const user = await userRepository.findById(payload.userId);
        if (!user || user.tokenVersion !== payload.tokenVersion) {
            return res.status(401).json({ error: 'Token revoked' });
        }

        req.user = { userId: payload.userId, role: payload.role };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

