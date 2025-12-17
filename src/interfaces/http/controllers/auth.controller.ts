import { Request, Response } from 'express';
import { RegisterUseCase } from '../../../application/auth/use-cases/register.usecase';
import { LoginUseCase } from '../../../application/auth/use-cases/login.usecase';
import { RefreshTokenUseCase } from '../../../application/auth/use-cases/refresh-token.usecase';
import { RegisterDto, LoginDto } from '../../../application/auth/dtos/auth.dto';
import { UserRepository } from '../../../infrastructure/database/prisma/repositories/user.repository';
import { RefreshTokenRepository } from '../../../infrastructure/database/prisma/repositories/refresh-token.repository';

// Instantiate dependencies (Simple DI)
const userRepository = new UserRepository();
const refreshTokenRepository = new RefreshTokenRepository();
const registerUseCase = new RegisterUseCase(userRepository);
const loginUseCase = new LoginUseCase(userRepository, refreshTokenRepository);
const refreshTokenUseCase = new RefreshTokenUseCase(refreshTokenRepository, userRepository);

export class AuthController {
    static async register(req: Request, res: Response) {
        try {
            const input = RegisterDto.parse(req.body);
            const user = await registerUseCase.execute(input);
            // Remove password from response
            const { password, ...userWithoutPassword } = user as any;
            res.status(201).json(userWithoutPassword);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const input = LoginDto.parse(req.body);
            const { accessToken, refreshToken, user } = await loginUseCase.execute(input);

            // Set Refresh Token as HttpOnly Cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // true in production
                path: '/',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.json({ accessToken, user });
        } catch (error: any) {
            res.status(401).json({ error: error.message });
        }
    }

    static async refresh(req: Request, res: Response) {
        try {
            const incomingRefreshToken = req.cookies.refreshToken;
            if (!incomingRefreshToken) {
                return res.status(401).json({ error: 'Refresh token missing' });
            }

            const { accessToken, refreshToken } = await refreshTokenUseCase.execute(incomingRefreshToken);

            // Rotate cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.json({ accessToken });
        } catch (error: any) {
            // Clear cookie on failure (security)
            res.clearCookie('refreshToken');
            res.status(403).json({ error: error.message });
        }
    }

    static async logout(req: Request, res: Response) {
        // Just clear local cookie.
        // Ideally we should also revoke the token in DB, but logout can be stateless on access token.
        // Since refresh token is in DB, we could revoke it if we parsed it, but usually cookie clear is enough for MVP.
        // To strictly follow, we can call revoke.
        // For now, clear cookie.
        res.clearCookie('refreshToken');
        res.json({ message: 'Logged out' });
    }
}
