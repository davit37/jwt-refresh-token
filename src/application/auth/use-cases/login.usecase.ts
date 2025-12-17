import { UserRepository } from '../../../infrastructure/database/prisma/repositories/user.repository';
import { RefreshTokenRepository } from '../../../infrastructure/database/prisma/repositories/refresh-token.repository';
import { PasswordService } from '../../../infrastructure/security/password.service';
import { JwtService } from '../../../infrastructure/security/jwt.service';
import { LoginInput } from '../dtos/auth.dto';
import { v4 as uuidv4 } from 'uuid';

export class LoginUseCase {
    constructor(
        private userRepository: UserRepository,
        private refreshTokenRepository: RefreshTokenRepository
    ) { }

    async execute(input: LoginInput) {
        const user = await this.userRepository.findByEmail(input.email);
        if (!user || !user.password) {
            throw new Error('Invalid credentials');
        }

        const isPasswordValid = await PasswordService.compare(input.password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        // Generate tokens
        const accessToken = JwtService.signAccessToken({ userId: user.id, role: user.role, tokenVersion: user.tokenVersion });

        // Generate new Family ID for this login session
        const familyId = uuidv4();
        const expiresInDays = 7;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);

        const refreshTokenPayload = { userId: user.id, familyId };
        const refreshToken = JwtService.signRefreshToken(refreshTokenPayload);

        const hashedToken = JwtService.hashToken(refreshToken);

        await this.refreshTokenRepository.create({
            hashedToken,
            userId: user.id,
            familyId,
            expiresAt,
            revoked: false,
        });

        return {
            accessToken,
            refreshToken,
            user: { id: user.id, email: user.email, role: user.role }
        };
    }
}
