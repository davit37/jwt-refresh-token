import { RefreshTokenUseCase } from '../refresh-token.usecase';
import { RefreshTokenRepository } from '../../../../infrastructure/database/prisma/repositories/refresh-token.repository';
import { UserRepository } from '../../../../infrastructure/database/prisma/repositories/user.repository';
import { JwtService } from '../../../../infrastructure/security/jwt.service';
import { Role } from '../../../../domain/enums/role.enum';

jest.mock('../../../../infrastructure/database/prisma/repositories/refresh-token.repository');
jest.mock('../../../../infrastructure/database/prisma/repositories/user.repository');
jest.mock('../../../../infrastructure/security/jwt.service');

describe('RefreshTokenUseCase', () => {
    let refreshTokenUseCase: RefreshTokenUseCase;
    let refreshTokenRepository: jest.Mocked<RefreshTokenRepository>;
    let userRepository: jest.Mocked<UserRepository>;

    const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        password: 'hashed',
        role: Role.USER,
        tokenVersion: 1,
        createdAt: new Date()
    };

    beforeEach(() => {
        refreshTokenRepository = new RefreshTokenRepository() as jest.Mocked<RefreshTokenRepository>;
        userRepository = new UserRepository() as jest.Mocked<UserRepository>;
        refreshTokenUseCase = new RefreshTokenUseCase(refreshTokenRepository, userRepository);
        jest.clearAllMocks();
    });

    it('should rotate token successfully', async () => {
        const incomingToken = 'validToken';
        const hashedToken = 'hashedValidToken';
        const tokenRecord = {
            id: '123',
            hashedToken,
            userId: 'user1',
            familyId: 'family1',
            revoked: false,
            expiresAt: new Date(Date.now() + 100000), // Valid
            createdAt: new Date()
        };

        (JwtService.verifyRefreshToken as jest.Mock).mockReturnValue({ userId: 'user1', familyId: 'family1' });
        (JwtService.hashToken as jest.Mock).mockReturnValue(hashedToken);
        refreshTokenRepository.findByTokenHash.mockResolvedValue(tokenRecord);
        userRepository.findById.mockResolvedValue(mockUser);
        (JwtService.signAccessToken as jest.Mock).mockReturnValue('newAccess');
        (JwtService.signRefreshToken as jest.Mock).mockReturnValue('newRefresh');

        const result = await refreshTokenUseCase.execute(incomingToken);

        expect(refreshTokenRepository.revoke).toHaveBeenCalledWith('123'); // Rotation
        expect(userRepository.findById).toHaveBeenCalledWith('user1');
        expect(refreshTokenRepository.create).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'user1',
            familyId: 'family1' // Same Family
        }));
        expect(result.accessToken).toBe('newAccess');
        expect(result.refreshToken).toBe('newRefresh');
    });

    it('should detect reuse, revoke family, and increment tokenVersion', async () => {
        const incomingToken = 'stolenToken';
        const hashedToken = 'hashedStolenToken';
        const tokenRecord = {
            id: '123',
            hashedToken,
            userId: 'user1',
            familyId: 'family1',
            revoked: true, // ALREADY REVOKED!
            expiresAt: new Date(Date.now() + 100000),
            createdAt: new Date()
        };

        (JwtService.verifyRefreshToken as jest.Mock).mockReturnValue({ userId: 'user1', familyId: 'family1' });
        (JwtService.hashToken as jest.Mock).mockReturnValue(hashedToken);
        refreshTokenRepository.findByTokenHash.mockResolvedValue(tokenRecord);
        userRepository.incrementTokenVersion.mockResolvedValue(2);

        await expect(refreshTokenUseCase.execute(incomingToken)).rejects.toThrow('Refresh token reuse detected. Access denied.');

        expect(refreshTokenRepository.revokeFamily).toHaveBeenCalledWith('family1'); // Security breach handling
        expect(userRepository.incrementTokenVersion).toHaveBeenCalledWith('user1'); // Token versioning
    });

    it('should throw error for invalid token signature', async () => {
        (JwtService.verifyRefreshToken as jest.Mock).mockImplementation(() => { throw new Error('Invalid'); });

        await expect(refreshTokenUseCase.execute('invalid')).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error if token not found in DB', async () => {
        (JwtService.verifyRefreshToken as jest.Mock).mockReturnValue({ userId: 'user1' });
        refreshTokenRepository.findByTokenHash.mockResolvedValue(null);

        await expect(refreshTokenUseCase.execute('validSignatureButMissing')).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error if user not found', async () => {
        const incomingToken = 'validToken';
        const hashedToken = 'hashedValidToken';
        const tokenRecord = {
            id: '123',
            hashedToken,
            userId: 'user1',
            familyId: 'family1',
            revoked: false,
            expiresAt: new Date(Date.now() + 100000),
            createdAt: new Date()
        };

        (JwtService.verifyRefreshToken as jest.Mock).mockReturnValue({ userId: 'user1', familyId: 'family1' });
        (JwtService.hashToken as jest.Mock).mockReturnValue(hashedToken);
        refreshTokenRepository.findByTokenHash.mockResolvedValue(tokenRecord);
        userRepository.findById.mockResolvedValue(null);

        await expect(refreshTokenUseCase.execute(incomingToken)).rejects.toThrow('User not found');
    });
});

