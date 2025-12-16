import { LoginUseCase } from '../login.usecase';
import { UserRepository } from '../../../../infrastructure/database/prisma/repositories/user.repository';
import { RefreshTokenRepository } from '../../../../infrastructure/database/prisma/repositories/refresh-token.repository';
import { PasswordService } from '../../../../infrastructure/security/password.service';
import { JwtService } from '../../../../infrastructure/security/jwt.service';
import { Role } from '../../../../domain/enums/role.enum';

jest.mock('../../../../infrastructure/database/prisma/repositories/user.repository');
jest.mock('../../../../infrastructure/database/prisma/repositories/refresh-token.repository');
jest.mock('../../../../infrastructure/security/password.service');
jest.mock('../../../../infrastructure/security/jwt.service');
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

describe('LoginUseCase', () => {
    let loginUseCase: LoginUseCase;
    let userRepository: jest.Mocked<UserRepository>;
    let refreshTokenRepository: jest.Mocked<RefreshTokenRepository>;

    beforeEach(() => {
        userRepository = new UserRepository() as jest.Mocked<UserRepository>;
        refreshTokenRepository = new RefreshTokenRepository() as jest.Mocked<RefreshTokenRepository>;
        loginUseCase = new LoginUseCase(userRepository, refreshTokenRepository);
        jest.clearAllMocks();
    });

    it('should login successfully and return tokens', async () => {
        userRepository.findByEmail.mockResolvedValue({
            id: '123',
            email: 'test@example.com',
            password: 'hashedPassword',
            role: Role.USER,
            createdAt: new Date()
        });
        (PasswordService.compare as jest.Mock).mockResolvedValue(true);
        (JwtService.signAccessToken as jest.Mock).mockReturnValue('accessToken');
        (JwtService.signRefreshToken as jest.Mock).mockReturnValue('refreshToken');
        (JwtService.hashToken as jest.Mock).mockReturnValue('hashedToken');

        const result = await loginUseCase.execute({
            email: 'test@example.com',
            password: 'password123'
        });

        expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
        expect(PasswordService.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
        expect(JwtService.signAccessToken).toHaveBeenCalled();
        expect(JwtService.signRefreshToken).toHaveBeenCalled();
        expect(refreshTokenRepository.create).toHaveBeenCalled();
        expect(result.accessToken).toBe('accessToken');
        expect(result.refreshToken).toBe('refreshToken');
    });

    it('should throw error for invalid credentials', async () => {
        userRepository.findByEmail.mockResolvedValue(null);

        await expect(loginUseCase.execute({
            email: 'test@example.com',
            password: 'password123'
        })).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for wrong password', async () => {
        userRepository.findByEmail.mockResolvedValue({
            id: '123',
            email: 'test@example.com',
            password: 'hashedPassword',
            role: Role.USER,
            createdAt: new Date()
        });
        (PasswordService.compare as jest.Mock).mockResolvedValue(false);

        await expect(loginUseCase.execute({
            email: 'test@example.com',
            password: 'wrongpassword'
        })).rejects.toThrow('Invalid credentials');
    });
});
