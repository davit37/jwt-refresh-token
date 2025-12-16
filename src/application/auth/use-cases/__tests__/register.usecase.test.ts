import { RegisterUseCase } from '../register.usecase';
import { UserRepository } from '../../../../infrastructure/database/prisma/repositories/user.repository';
import { PasswordService } from '../../../../infrastructure/security/password.service';
import { Role } from '../../../../domain/enums/role.enum';

jest.mock('../../../../infrastructure/database/prisma/repositories/user.repository');
jest.mock('../../../../infrastructure/security/password.service');

describe('RegisterUseCase', () => {
    let registerUseCase: RegisterUseCase;
    let userRepository: jest.Mocked<UserRepository>;

    beforeEach(() => {
        userRepository = new UserRepository() as jest.Mocked<UserRepository>;
        registerUseCase = new RegisterUseCase(userRepository);
        jest.clearAllMocks();
    });

    it('should register a new user successfully', async () => {
        userRepository.findByEmail.mockResolvedValue(null);
        (PasswordService.hash as jest.Mock).mockResolvedValue('hashedPassword');
        userRepository.create.mockResolvedValue({
            id: '123',
            email: 'test@example.com',
            role: Role.USER,
            createdAt: new Date()
        });

        const result = await registerUseCase.execute({
            email: 'test@example.com',
            password: 'password123',
            role: Role.USER
        });

        expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
        expect(PasswordService.hash).toHaveBeenCalledWith('password123');
        expect(userRepository.create).toHaveBeenCalled();
        expect(result.id).toBe('123');
    });

    it('should throw error if user already exists', async () => {
        userRepository.findByEmail.mockResolvedValue({
            id: '123',
            email: 'test@example.com',
            role: Role.USER,
            createdAt: new Date()
        });

        await expect(registerUseCase.execute({
            email: 'test@example.com',
            password: 'password123',
            role: Role.USER
        })).rejects.toThrow('User already exists');

        expect(userRepository.create).not.toHaveBeenCalled();
    });
});
